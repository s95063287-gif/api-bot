require('colors');
const mongoose = require('mongoose');
require('dotenv').config({ path: "./.env" });

let isConnected = false;

async function connectToDatabase() {
    if (isConnected) return;
    
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            bufferCommands: false,  // ← wichtig für Serverless!
        });
        isConnected = true;
        console.log("Sucesso ".green + 'Conectado ao MongoDB');
    } catch (err) {
        console.error("Falha ".red + 'Erro ao conectar ao MongoDB', err);
        throw err;
    }
}

module.exports = connectToDatabase;