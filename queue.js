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
        this.mongoClient = mongoClient;
        this.handler = () => {};
    }

    addConsumer(handler) {
        if (typeof handler != 'function') {
            throw new Error('handler must be a function');
        }
        this.handler = handler;
    }

    async add(job) {
        if (!job || !job.key) {
            return null;
        }

        const key = job.key;
        await this.redisClient.zAdd(this.jobKey, key);

        delete job.key;
        await this.redisClient.set(key, JSON.stringify(job, null, 0));
    }

    async pullJob() {
        const jobKey = await this.redisClient.zPopMin(this.jobKey);
        if (!jobKey) {
            return null;
        }
        try {
            const jobData = await this.redisClient.get(jobKey);
            const structureJobData = JSON.parse(jobData);

            if (!structuredJobData || typeof structureJobData != 'object') {
                return null;
            }

            return {
                ...structureJobData,
                key: jobKey,
            };
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    init() {
        return new Promise(async (_, reject) => {
            while (true) {
                let job;
                try {
                    job = await this.pullJob();
                    if (!job) {
                        await this.sleep(500);
                        continue;
                    }

                    if (job.RunAt > Date.now()) {
                        await this.add(job);
                        await this.sleep(500);
                        continue;
                    }

                    console.log('consuming job');
                    await this.handler(job);
                } catch (err) {
                    if (job) {
                        job.retries += 1;
                        await this.add(job);
                    }
                    console.error('cannot consume job', err);
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
