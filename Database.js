require('colors');
const mongoose = require('mongoose');
require('dotenv').config({ path: "./.env" });

async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) return;
    
    return mongoose.connect(process.env.MONGODB_URL, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
    }).then(() => {
        console.log("Sucesso ".green + 'Conectado ao MongoDB');
    }).catch(err => {
        console.error("Falha ".red + 'Erro ao conectar:', err.message);
        throw err;
    });
}

module.exports = connectToDatabase;