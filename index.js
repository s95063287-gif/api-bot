require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const colors = require('colors');
const app = express();

app.use(bodyParser.json());

// Middleware für IP-Logging
app.use((req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`IP do cliente: ${clientIp}`);
    next();
});

// Debug-Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Root-Endpunkt (wichtig!)
app.get('/', (req, res) => {
    res.json({ status: 'online', api: '/api' });
});

// API-Routen MOUNTEN
const AddLogin = require('./routes/add-login'); 
const authRoute = require('./routes/auth');
const GenerateKey = require('./routes/generate-key');
const Register = require('./routes/register');
const RemoveLogin = require('./routes/remove-login');
const resethwidRoute = require('./routes/resethwid');

// Alle unter /api
app.use('/api/add-login', AddLogin);
app.use('/api/auth', authRoute);
app.use('/api/generate-key', GenerateKey);
app.use('/api/register', Register);
app.use('/api/remove-login', RemoveLogin);
app.use('/api/resethwid', resethwidRoute);

// 404-Handler für unbekannte Routen
app.use((req, res) => {
    console.log(`404 Error: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Endpoint nicht gefunden' });
});

const PORT = process.env.PORT || 10000;
const connectToDatabase = require('./Database');

connectToDatabase().then(() => {
    app.listen(PORT, () => 
        console.log('Sucesso '.green + `Servidor rodando na porta`, `${PORT}`.cyan)
    );
});

