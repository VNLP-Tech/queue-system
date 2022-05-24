require('dotenv').config();

const express = require('express');
const { connectMongo, getMongoClient } = require('./connect-mongo');
const { connectRedis, getRedisClient } = require('./connect-redis');
const { callCampaign } = require('./consumer');
const Queue = require('./queue');

const app = express();
app.use(express.json());

async function main() {
    const port = process.env.PORT || 3000;
    const redisURI = process.env.REDIS_URI || 'redis://localhost:6379';
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27018/queue';

    await connectMongo(mongoURI);
    await connectRedis(redisURI);

    const redisClient = getRedisClient();
    const mongoClient = getMongoClient();

    const queue = new Queue(redisClient, mongoClient);

    app.post('/jobs', async (req, res) => {
        const data = req.body;
        await queue.add(Queue.createJob(data));

        res.send('OK');
    });

    queue.addConsumer(callCampaign);
    queue.init().catch(err => {
        console.error('crash queue', err);
        process.exit(1);
    });

    app.listen(port, () => {
        console.log(`🍣Server started at port ${port}🍣`);
    });
}

main().catch(err => {
    console.error('cannot bootstrap system', err);
    process.exit(1);
});
