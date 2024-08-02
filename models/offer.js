// addOffers.js
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  code: String,
  discount: Number,
});

const Offer = mongoose.model('Offer', offerSchema);
  module.exports = Offer;
