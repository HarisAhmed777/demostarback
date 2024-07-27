// addOffers.js
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  code: String,
  discount: Number,
});

const Offer = mongoose.model('Offer', offerSchema);

const offers = [
];

Offer.insertMany(offers)
  .then(() => {
  })
  .catch((err) => {
    console.error(err);
  });

  module.exports = Offer;
