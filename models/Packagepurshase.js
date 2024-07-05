const mongoose = require('mongoose');

const purchasePackageSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    numberOfAdults: {
        type: Number,
        required: true
    },
    numberOfChildren: {
        type: Number,
        required: true
    },
    packageType: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const PurchasePackageModel = mongoose.model('PurchasePackage', purchasePackageSchema);
module.exports = PurchasePackageModel;
