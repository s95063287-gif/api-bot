const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Key = require('../models/key');
const connectToDatabase = require('../Database');
const mongoose = require('mongoose');

// Blacklist Schema
const blacklistSchema = new mongoose.Schema({
    type: { type: String, enum: ['hwid', 'discord', 'username', 'key'], required: true },
    value: { type: String, required: true },
    reason: { type: String, default: '' },
    bannedBy: { type: String, default: '' },
    linkedBans: [{ type: String }], // Alle verbundenen Ban-Werte
    createdAt: { type: Date, default: Date.now }
}, { collection: 'blacklist' });

const Blacklist = mongoose.models.Blacklist || mongoose.model('Blacklist', blacklistSchema);

// ── Helper: Alles verlinkte bannen ───────────────────────────────
async function cascadeBan(reason, bannedBy, initialType, initialValue) {
    const banned = [];
    
    // User finden
    let user = null;
    if (initialType === 'username') user = await User.findOne({ username: initialValue });
    else if (initialType === 'hwid') user = await User.findOne({ hwid: initialValue });
    else if (initialType === 'discord') user = await User.findOne({ discordId: initialValue });

    // Key finden
    let key = null;
    if (initialType === 'key') key = await Key.findOne({ key: initialValue });

    // Alle verlinkten Werte sammeln
    const toBan = [{ type: initialType, value: initialValue }];

    if (user) {
        if (user.username) toBan.push({ type: 'username', value: user.username });
        if (user.hwid) toBan.push({ type: 'hwid', value: user.hwid });
        if (user.discordId) toBan.push({ type: 'discord', value: user.discordId });

        // User bannen
        user.hwidBanned = true;
        user.banReason = reason;
        await user.save();
    }

    if (key) {
        toBan.push({ type: 'key', value: key.key });
        key.banned = true;
        key.banReason = reason;
        await key.save();
    }

    // Alle verlinkten Keys bannen die mit diesem User verbunden sind
    if (user) {
        // Keys die mit dieser Discord ID verbunden sind
        if (user.discordId) {
            const linkedKeys = await Key.find({ lockedDiscordId: user.discordId });
            for (const k of linkedKeys) {
                k.banned = true;
                k.banReason = reason;
                await k.save();
                toBan.push({ type: 'key', value: k.key });
            }
        }
    }

    // Blacklist Einträge erstellen
    const linkedValues = toBan.map(b => `${b.type}:${b.value}`);

    for (const item of toBan) {
        const exists = await Blacklist.findOne({ type: item.type, value: item.value });
        if (!exists) {
            await Blacklist.create({
                type: item.type,
                value: item.value,
                reason,
                bannedBy,
                linkedBans: linkedValues.filter(v => v !== `${item.type}:${item.value}`)
            });
            banned.push(`${item.type}: ${item.value}`);
        }
    }

    return banned;
}

// ── Helper: Alles verlinkte entbannen ────────────────────────────
async function cascadeUnban(type, value) {
    const unbanned = [];

    // Blacklist Eintrag finden
    const entry = await Blacklist.findOne({ type, value });
    if (!entry) return unbanned;

    // Alle verlinkten Einträge auch entbannen
    const toUnban = [{ type, value }, ...entry.linkedBans.map(b => {
        const [t, ...v] = b.split(':');
        return { type: t, value: v.join(':') };
    })];

    for (const item of toUnban) {
        // Blacklist Eintrag löschen
        await Blacklist.deleteOne({ type: item.type, value: item.value });
        unbanned.push(`${item.type}: ${item.value}`);

        // User/Key entbannen
        if (item.type === 'username') {
            await User.updateOne({ username: item.value }, { hwidBanned: false, banReason: '' });
        } else if (item.type === 'hwid') {
            await User.updateOne({ hwid: item.value }, { hwidBanned: false, banReason: '' });
        } else if (item.type === 'discord') {
            await User.updateOne({ discordId: item.value }, { hwidBanned: false, banReason: '' });
        } else if (item.type === 'key') {
            await Key.updateOne({ key: item.value }, { banned: false, banReason: '' });
        }
    }

    return unbanned;
}

// ── BAN ───────────────────────────────────────────────────────────
router.post('/ban', async (req, res) => {
    await connectToDatabase();
    const { secret, type, value, reason, bannedBy } = req.body;

    if (secret !== process.env.CONFIG_SECRET) {
        return res.status(403).json({ error: 'Unauthorized.' });
    }

    if (!['hwid', 'discord', 'username', 'key'].includes(type)) {
        return res.status(400).json({ error: 'Invalid ban type.' });
    }

    try {
        const banned = await cascadeBan(reason || 'No reason provided', bannedBy || 'Admin', type, value);
        res.json({ message: 'Banned successfully.', banned });
    } catch (error) {
        console.error('Ban error:', error);
        res.status(500).json({ error: 'Error banning.' });
    }
});

// ── UNBAN ─────────────────────────────────────────────────────────
router.post('/unban', async (req, res) => {
    await connectToDatabase();
    const { secret, type, value } = req.body;

    if (secret !== process.env.CONFIG_SECRET) {
        return res.status(403).json({ error: 'Unauthorized.' });
    }

    try {
        const unbanned = await cascadeUnban(type, value);
        if (unbanned.length === 0) {
            return res.status(404).json({ error: 'No ban found.' });
        }
        res.json({ message: 'Unbanned successfully.', unbanned });
    } catch (error) {
        res.status(500).json({ error: 'Error unbanning.' });
    }
});

// ── CHECK ─────────────────────────────────────────────────────────
router.post('/check', async (req, res) => {
    await connectToDatabase();
    const { type, value } = req.body;

    try {
        const entry = await Blacklist.findOne({ type, value });
        res.json({
            banned: !!entry,
            reason: entry?.reason || '',
            linkedBans: entry?.linkedBans || []
        });
    } catch (error) {
        res.status(500).json({ error: 'Error checking ban.' });
    }
});

// ── LIST ──────────────────────────────────────────────────────────
router.get('/list', async (req, res) => {
    await connectToDatabase();
    const secret = req.headers['x-secret'];

    if (secret !== process.env.CONFIG_SECRET) {
        return res.status(403).json({ error: 'Unauthorized.' });
    }

    try {
        const bans = await Blacklist.find().sort({ createdAt: -1 }).limit(50);
        res.json({ bans, total: bans.length });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching bans.' });
    }
});

module.exports = router;