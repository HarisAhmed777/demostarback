const mongoose = require('mongoose');

const BookingsSchema = new mongoose.Schema({
  booking_id:String,
  name: String,
  age: String,
  email: {
    type:String,
    required:true
  },
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
