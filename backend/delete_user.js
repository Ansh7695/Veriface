const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const deleteUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const name = process.argv[2];
        if (!name) {
            console.log('Please provide a name');
            process.exit(1);
        }

        const result = await User.deleteOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        console.log(`Deleted count: ${result.deletedCount}`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

deleteUser();
