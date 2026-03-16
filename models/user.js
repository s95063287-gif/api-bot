const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: false },
    hwid: { type: String, default: null },
    expirationDate: { type: Date, required: true },
    hwidBanned: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);
