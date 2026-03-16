require('colors');
const mongoose = require('mongoose');
require('dotenv').config({ path: "./.env" });

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectToDatabase() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
        }).then(mongoose => {
            console.log("Sucesso ".green + 'Conectado ao MongoDB');
            return mongoose;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = connectToDatabase;