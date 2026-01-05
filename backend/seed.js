const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123', // In real app, this should be hashed
            role: 'admin',
            faceEncoding: [],
            isFaceRegistered: false
        });

        console.log('Admin created:', admin.email);
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
