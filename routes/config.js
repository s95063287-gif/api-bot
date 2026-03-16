const express = require('express');
const router = express.Router();
const connectToDatabase = require('../Database');
const mongoose = require('mongoose');

// Config Schema in MongoDB speichern
const configSchema = new mongoose.Schema({
    maintenanceMode: { type: Boolean, default: false },
    offlineMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'The application is currently under maintenance.' },
    version: { type: String, default: '1.0.0' },
    motd: { type: String, default: '' }, // Message of the Day
    maxUsers: { type: Number, default: 0 }, // 0 = unlimited
    allowNewRegistrations: { type: Boolean, default: true },
    requiredVersion: { type: String, default: '1.0.0' }, // Force update if version mismatch
    discordUrl: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'config' });

const Config = mongoose.models.Config || mongoose.model('Config', configSchema);

// GET config
router.get('/', async (req, res) => {
    await connectToDatabase();
    try {
        let config = await Config.findOne();
        if (!config) {
            config = await Config.create({});
        }
        res.json({
            maintenanceMode: config.maintenanceMode,
            offlineMode: config.offlineMode,
            maintenanceMessage: config.maintenanceMessage,
            version: config.version,
            motd: config.motd,
            maxUsers: config.maxUsers,
            allowNewRegistrations: config.allowNewRegistrations,
            requiredVersion: config.requiredVersion,
            discordUrl: config.discordUrl,
            updatedAt: config.updatedAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching config.' });
    }
});

// POST update config (nur mit secret key)
router.post('/update', async (req, res) => {
    await connectToDatabase();

    const { secret, ...updates } = req.body;

    if (secret !== process.env.CONFIG_SECRET) {
        return res.status(403).json({ error: 'Unauthorized.' });
    }

    try {
        let config = await Config.findOne();
        if (!config) config = new Config();

        const allowed = [
            'maintenanceMode', 'offlineMode', 'maintenanceMessage',
            'version', 'motd', 'maxUsers', 'allowNewRegistrations',
            'requiredVersion', 'discordUrl'
        ];

        for (const key of allowed) {
            if (updates[key] !== undefined) {
                config[key] = updates[key];
            }
        }

        config.updatedAt = new Date();
        await config.save();

        res.json({ message: 'Config updated successfully.', config });
    } catch (error) {
        res.status(500).json({ error: 'Error updating config.' });
    }
});

module.exports = router;
