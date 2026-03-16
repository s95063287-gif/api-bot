const User = require('../models/user');

async function checkAndDeleteExpired(req, res, next) {
    const now = new Date();
    const result = await User.deleteMany({ expirationDate: { $lt: now } });
    if (result.deletedCount > 0) {
        return res.status(403).json({ error: 'Login expirado. Por favor, renove seu login.' });
    }
    next();
}

module.exports = checkAndDeleteExpired;