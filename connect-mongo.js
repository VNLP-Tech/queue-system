const mongoose = require('mongoose');

exports.connectMongo = (mongoURI) => {
    return mongoose.connect(mongoURI);
};

exports.getMongoClient = () => {
    return mongoose;
};
