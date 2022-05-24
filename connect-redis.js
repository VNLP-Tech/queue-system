const redis = require('redis');

let client;

exports.connectRedis = (redisURI) => {
    client = redis.createClient({
        url: redisURI,
    });

    client.on('error', (err) => console.log('redis Client Error', err));

    return client.connect();
};

exports.getRedisClient = () => {
    return client;
};
