const mongoose = require('mongoose');
require('dotenv').config();
const Attendance = require('./models/Attendance');

const getISTTime = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + (istOffset + now.getTimezoneOffset() * 60 * 1000));
    return ist;
};

const today = getISTTime().toISOString().split('T')[0];

const clearToday = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await Attendance.deleteMany({ date: today });
        console.log(`SUCCESS: Deleted ${result.deletedCount} attendance records for ${today}`);
        mongoose.connection.close();
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
};

clearToday();
