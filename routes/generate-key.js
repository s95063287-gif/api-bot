const express = require('express');
const router = express.Router();

const Key = require('../models/key')

const rateLimiter = require('../middleware/rateLimiter');

router.post('/generate-key', rateLimiter, async (req, res) => {
    const { key, duration } = req.body; // A chave agora é passada no corpo da requisição

    try {
        let expirationDate;

        switch (duration) {
            case '1week':
                expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 7);
                break;
            case '1month':
                expirationDate = new Date();
                expirationDate.setMonth(expirationDate.getMonth() + 1);
                break;
            case '10year':
                expirationDate = new Date();
                expirationDate.setFullYear(expirationDate.getFullYear() + 10);
                break;
            case '2min':
                expirationDate = new Date();
                expirationDate.setMinutes(expirationDate.getMinutes() + 2);
                break;
            default:
                console.error('Duração inválida:', duration);
                return res.status(400).json({ error: 'Invalid duration' });
        }

        const newKey = new Key({ key, expirationDate });
        await newKey.save();

        console.log('Chave gerada:', key);
        console.log('Chave armazenada:', newKey.key);

        res.json({ key: newKey.key });
    } catch (error) {
        console.error('Erro ao salvar key:', error);
        res.status(500).json({ error: 'Erro ao salvar key' });
    }
});

module.exports = router;