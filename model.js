const mongoose = require('mongoose');

const SystemConcurrentSchema = new mongoose.Schema({
    model: {
        type: String,
        required: true,
    },
    currentCCU: {
        type: Number,
        required: true,
    },
    maxCCU: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});

const SystemConcurrent = mongoose.model('SystemConcurrent', SystemConcurrentSchema);
module.exports = SystemConcurrent;
