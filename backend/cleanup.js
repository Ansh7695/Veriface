const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Attendance = require('./models/Attendance'); // Checking model name assumption

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    .then(async () => {
        console.log('MongoDB Connected for Cleanup');

        try {
            // 1. Delete all Attendance records
            const attendanceResult = await Attendance.deleteMany({});
            console.log(`Deleted ${attendanceResult.deletedCount} attendance records.`);

            // 2. Delete all Users EXPECT Admin
            const userResult = await User.deleteMany({ role: { $ne: 'admin' } });
            console.log(`Deleted ${userResult.deletedCount} users (kept Admin).`);

            // Verify Admin still exists
            const admins = await User.find({ role: 'admin' });
            console.log(`Remaining Admins: ${admins.length}`);
            admins.forEach(a => console.log(` - ${a.name} (${a.email})`));

        } catch (error) {
            console.error('Cleanup Error:', error);
        }

        process.exit();
    })
    .catch(err => {
        console.error('DB Connection Failed:', err);
        process.exit(1);
    });
