const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    expirationDate: { type: Date, required: true },
    used: { type: Boolean, default: false },
    hwidBanned: { type: Boolean, default: false },
});

module.exports = mongoose.model('Key', keySchema);