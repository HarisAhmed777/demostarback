const mongoose = require('mongoose');

const BookingsSchema = new mongoose.Schema({
  name: String,
  age: String,
  email: String,
  persons: Number,
  city: String,
  startdate: Date,
  enddate: Date,
  mobile: Number,
  totalamount: Number,
  promocode: String, 
});

const BookingModel = mongoose.model('bookings', BookingsSchema);
module.exports = BookingModel;
