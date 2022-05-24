require('./model');

class Queue {
    static createJob({
        key,
        data,
        runAt,
    }) {
        if (!runAt) {
            runAt = Date.now();
        }

        return {
            key,
            data,
            runAt,
            retries: 0,
        };
    }

    constructor(redisClient, mongoClient) {
        this.jobKey = `vnlp-queue`;
        this.redisClient = redisClient;

        this.systemCollection = `SystemConcurrent`;
        this.systemCCUController = mongoClient.model('SystemConcurrent');
        this.systemID = null;

        /**
         * define handler for queue
         * @param {Job} data
         */
        this.handler = (data) => { };
    }

    async rateLimitQueue() {
        if (!this.systemID) {
            throw new Error('queue is not initialized');
        }

        const system = await this.systemCCUController.findOne({
            _id: this.systemID,
        }).lean();

        if (!system) {
            throw new Error('queue is not initialized');
        }

        const increaseCCU = await this.systemCCUController.updateOne({
            _id: this.systemID,
            currentCCU: {
                $lt: system.maxCCU,
            },
        }, {
            $inc: {
                currentCCU: 1,
            },
        });

        if (increaseCCU.modifiedCount == 0) {
            return false;
        }

        return true;
    }

    async releaseJob() {
        if (!this.systemID) {
            throw new Error('queue is not initialized');
        }

        return this.systemCCUController.updateOne({
            _id: this.systemID,
            currentCCU: {
                $gt: 0,
            },
        }, {
            $inc: {
                currentCCU: -1,
            },
        });
    }

    addConsumer(handler) {
        if (typeof handler != 'function') {
            throw new Error('handler must be a function');
        }
        this.handler = handler;
    }

    async add(job) {
        if (!job || !job.key || !job.runAt) {
            return null;
        }

        const key = job.key;
        const runAt = job.runAt;
        await this.redisClient.zAdd(this.jobKey, [{
            score: runAt,
            value: key,
        }]);

        delete job.key;
        await this.redisClient.set(key, JSON.stringify(job, null, 0));
    }

    async pullJob() {
        const job = await this.redisClient.zPopMin(this.jobKey);
        if (!job) {
            return null;
        }
        try {
            const { value } = job;
            const jobData = await this.redisClient.get(value);
            const structuredJobData = JSON.parse(jobData);

            if (!structuredJobData || typeof structuredJobData != 'object') {
                return null;
            }

            return {
                ...structuredJobData,
                key: value,
            };
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    async init() {
        let systemCCU = await this.systemCCUController.findOne({
            model: 'general',
        }).lean();
        if (!systemCCU) {
            systemCCU = await this.systemCCUController.create({
                model: 'general',
                currentCCU: 0,
                maxCCU: 3,
            });
            systemCCU = systemCCU.toObject();
        }

        this.systemID = systemCCU._id.toString();

        return new Promise(async (_, reject) => {
            while (true) {
                let job;
                try {
                    job = await this.pullJob();
                    if (!job) {
                        await this.sleep(500);
                        continue;
                    }

                    if (job.runAt > Date.now()) {
                        await this.add(job);
                        await this.sleep(500);
                        continue;
                    }

                    const canRun = await this.rateLimitQueue();
                    if (!canRun) {
                        await this.add(job);
                        await this.sleep(500);
                        continue;
                    }

                    console.log('consuming job');
                    this.handler(job).then(() => {
                        this.releaseJob();
                    }).catch(err => {
                        job.retries += 1;
                        job.runAt += 60 * 1000;
                        this.add(job);
                        this.releaseJob();
                        console.error('cannot consume job', err);
                    });
                } catch (err) {
                    console.log(err);
                }
                await this.sleep(500);
            }
        });
    }

    sleep(time) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), time);
        });
    }
}

module.exports = Queue;
