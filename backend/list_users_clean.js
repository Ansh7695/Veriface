const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const fs = require('fs');
        const users = await User.find({});
        let output = '--- START LIST ---\n';
        users.forEach(u => {
            const encLen = u.faceEncoding ? u.faceEncoding.length : 0;
            output += `User: "${u.name}" | Role: ${u.role} | FaceReg: ${u.isFaceRegistered} | EncLen: ${encLen}\n`;
        });
        output += '--- END LIST ---';
        fs.writeFileSync('users_dump.txt', output);
        console.log('Dumped to users_dump.txt');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
