const express = require('express');
const router = express.Router();
const User = require('../models/user');
const connectToDatabase = require('../Database');
const rateLimiter = require('../middleware/rateLimiter');

router.get('/', rateLimiter, async (req, res) => {
    await connectToDatabase();

    try {
        const users = await User.find({}, 'username expirationDate hwid');
        res.json({ users, total: users.length });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users.' });
    }
});

module.exports = router;