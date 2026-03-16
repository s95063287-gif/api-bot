const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    expirationDate: { type: Date, required: true },
    used: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    lockedDiscordId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Key', keySchema);