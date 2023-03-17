const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email:String,
    firstname: String,
    lastname: String,
    password: String,
    token: String,
    phoneNumber: String,
    profilImg:String,
    role: String,
});

const User = mongoose.model('users', userSchema);

module.exports = User;