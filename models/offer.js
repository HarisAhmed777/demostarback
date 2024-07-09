// addOffers.js
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  code: String,
  discount: Number,
});

const Offer = mongoose.model('Offer', offerSchema);

const offers = [
  { code: 'WAH10', discount: 10 },
  { code: 'Starsch20', discount: 20 },
  { code: 'Starclg30', discount: 30 },

];

Offer.insertMany(offers)
  .then(() => {
    console.log('Offers added');
  })
  .catch((err) => {
    console.error(err);
  });

  module.exports = Offer;
