const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    secondname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phonenumber: {
        type: Number,
        required: true
    },
    feedback: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const FeedbackModel = mongoose.model('Feedback', feedbackSchema);
module.exports = FeedbackModel;