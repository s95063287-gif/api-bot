require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const colors = require('colors');
const app = express();

app.set('trust proxy', 1);

app.use(bodyParser.json());

app.use((req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`IP do cliente: ${clientIp}`);
    next();
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

app.get('/', (req, res) => {
    res.json({ status: 'online', api: '/api' });
});

const AddLogin = require('./routes/add-login'); 
const authRoute = require('./routes/auth');
const GenerateKey = require('./routes/generate-key');
const Register = require('./routes/register');
const RemoveLogin = require('./routes/remove-login');
const resethwidRoute = require('./routes/resethwid');
const userInfoRoute = require('./routes/userinfo');
const listUsersRoute = require('./routes/listusers');
const extendLoginRoute = require('./routes/extendlogin');
const configRoute = require('./routes/config');

app.use('/api/add-login', AddLogin);
app.use('/api/auth', authRoute);
app.use('/api/generate-key', GenerateKey);
app.use('/api/register', Register);
app.use('/api/remove-login', RemoveLogin);
app.use('/api/resethwid', resethwidRoute);
app.use('/api/userinfo', userInfoRoute);
app.use('/api/listusers', listUsersRoute);
app.use('/api/extendlogin', extendLoginRoute);
app.use('/api/config', configRoute);


app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint nicht gefunden' });
});

const PORT = process.env.PORT || 10000;
const connectToDatabase = require('./Database');

connectToDatabase().then(() => {
    app.listen(PORT, () => 
        console.log('Sucesso '.green + `Servidor rodando na porta`, `${PORT}`.cyan)
    );
});

module.exports = app;