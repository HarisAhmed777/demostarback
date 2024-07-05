const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstname:String,
    lastname:String,
    mobilenumber:Number,
    email:String,
    password :String,
    role:{
        type:String,
        default:"user"
    }
    
})

const UserModel = mongoose.model("users",UserSchema)
module.exports = UserModel;