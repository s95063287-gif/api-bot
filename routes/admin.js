const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Key = require('../models/key');
const connectToDatabase = require('../Database');

// Auth Middleware
const adminAuth = (req, res, next) => {
    const secret = req.body.secret || req.headers['x-secret'];
    if (secret !== process.env.CONFIG_SECRET) {
        return res.status(403).json({ error: 'Unauthorized.' });
    }
    next();
};

// ── Reset alle HWIDs ──────────────────────────────────────────────
router.post('/reset-all-hwids', adminAuth, async (req, res) => {
    await connectToDatabase();
    try {
        const result = await User.updateMany({}, { hwid: null });
        res.json({ message: `Reset ${result.modifiedCount} HWIDs successfully.` });
    } catch (error) {
        res.status(500).json({ error: 'Error resetting HWIDs.' });
    }
});

// ── Alle Bans entfernen ───────────────────────────────────────────
router.post('/unban-all', adminAuth, async (req, res) => {
    await connectToDatabase();
    try {
        const users = await User.updateMany({}, { hwidBanned: false, banReason: '' });
        const keys = await Key.updateMany({}, { banned: false, banReason: '' });

        // Blacklist leeren
        try {
            const mongoose = require('mongoose');
            await mongoose.connection.collection('blacklist').deleteMany({});
        } catch {}

        res.json({ 
            message: 'All bans removed.',
            usersUnbanned: users.modifiedCount,
            keysUnbanned: keys.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ error: 'Error removing bans.' });
    }
});

// ── Days zu allen Licenses hinzufügen ────────────────────────────
router.post('/add-days-all', adminAuth, async (req, res) => {
    await connectToDatabase();
    const { days } = req.body;

    if (!days || days <= 0) {
        return res.status(400).json({ error: 'Invalid days value.' });
    }

    try {
        const users = await User.find({});
        let updated = 0;

        for (const user of users) {
            const base = user.expirationDate > new Date() ? user.expirationDate : new Date();
            user.expirationDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
            await user.save();
            updated++;
        }

        res.json({ message: `Added ${days} days to ${updated} users.` });
    } catch (error) {
        res.status(500).json({ error: 'Error adding days.' });
    }
});

// ── Days zu einer License hinzufügen ─────────────────────────────
router.post('/add-days-user', adminAuth, async (req, res) => {
    await connectToDatabase();
    const { username, days } = req.body;

    if (!days || days <= 0) {
        return res.status(400).json({ error: 'Invalid days value.' });
    }

    try {
        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const base = user.expirationDate > new Date() ? user.expirationDate : new Date();
        user.expirationDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
        await user.save();

        res.json({ 
            message: `Added ${days} days to ${username}.`,
            newExpiration: user.expirationDate
        });
    } catch (error) {
        res.status(500).json({ error: 'Error adding days.' });
    }
});

// ── Alle Keys resetten (unused machen) ───────────────────────────
router.post('/reset-all-keys', adminAuth, async (req, res) => {
    await connectToDatabase();
    try {
        const result = await Key.updateMany({}, { used: false });
        res.json({ message: `Reset ${result.modifiedCount} keys successfully.` });
    } catch (error) {
        res.status(500).json({ error: 'Error resetting keys.' });
    }
});

// ── Alle expired User löschen ─────────────────────────────────────
router.post('/delete-expired', adminAuth, async (req, res) => {
    await connectToDatabase();
    try {
        const result = await User.deleteMany({ expirationDate: { $lt: new Date() } });
        res.json({ message: `Deleted ${result.deletedCount} expired users.` });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting expired users.' });
    }
});

// ── Stats ─────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    await connectToDatabase();
    const secret = req.headers['x-secret'];
    if (secret !== process.env.CONFIG_SECRET) {
        return res.status(403).json({ error: 'Unauthorized.' });
    }

    try {
        const now = new Date();
        const totalUsers    = await User.countDocuments();
        const activeUsers   = await User.countDocuments({ expirationDate: { $gte: now }, hwidBanned: false });
        const expiredUsers  = await User.countDocuments({ expirationDate: { $lt: now } });
        const bannedUsers   = await User.countDocuments({ hwidBanned: true });
        const totalKeys     = await Key.countDocuments();
        const usedKeys      = await Key.countDocuments({ used: true });
        const unusedKeys    = await Key.countDocuments({ used: false });
        const bannedKeys    = await Key.countDocuments({ banned: true });

        res.json({
            users: { total: totalUsers, active: activeUsers, expired: expiredUsers, banned: bannedUsers },
            keys:  { total: totalKeys, used: usedKeys, unused: unusedKeys, banned: bannedKeys }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stats.' });
    }
});

module.exports = router;