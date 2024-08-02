const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  packagename: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  cost: {
    type: String,
    required:true
  },
  image:{
    type:String,
  },
  catogory: {
    type: String,
    required:true
  },
  maxdays:{
    type:Number,
    required:true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});




const PackageModel = mongoose.model("Package", packageSchema); 
module.exports = PackageModel;