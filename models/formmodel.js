const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    budget: {
        type: String,
        required: true
    },
    travelDate: {
        type: String,
        required: true
    },
    numberOfPeople: {
        type: String,
        required: true
    },
    interest: {
        type: String,
        required: true
    },
    desiredLocations: {
        type: [String],
        required: true
    }
});

const Form = mongoose.model('Form', formSchema);

module.exports = Form;
