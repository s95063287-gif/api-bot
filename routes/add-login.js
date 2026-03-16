const express = require('express');
const router = express.Router();

const User = require('../models/user');
const moment = require('moment');

const rateLimiter = require('../middleware/rateLimiter');

router.post('/add-login', rateLimiter, async (req, res) => {
    console.log('Requisição recebida em /add-login:', req.body);
    const { hwid, username, duration, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ error: 'Usuário já existe.' });
    }

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
        case '3month':
            expirationDate = new Date();
            expirationDate.setMonth(expirationDate.getMonth() + 3);
            break;
        case 'permanent':
            expirationDate = new Date();
            expirationDate.setFullYear(expirationDate.getFullYear() + 100);
            break;
        case 'teste':
            expirationDate = new Date();
            expirationDate = moment().add(3, 'minute').toDate();
            break;
        default:
            console.error('Duração inválida:', duration);
            return res.status(400).json({ error: 'Invalid duration' });
    }

    const user = new User({ hwid, username, expirationDate, password });
    console.log('Criando novo User:', user);

    await user.save();
    console.log('User salvo no banco de dados:', user);

    res.json({ message: 'Login adicionado com sucesso', expirationDate });
});

module.exports = router;