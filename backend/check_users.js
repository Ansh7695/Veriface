const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const users = await User.find({});
        console.log('--- REGISTERED USERS ---');
        users.forEach(u => {
            console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Face Registered: ${u.isFaceRegistered}, Encoding Length: ${u.faceEncoding ? u.faceEncoding.length : 0}`);
        });
        console.log('------------------------');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
