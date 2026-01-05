const cron = require('node-cron');
const Attendance = require('../models/Attendance');

const initCleanupJob = () => {
    // Run every day at midnight: '0 0 * * *'
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily attendance cleanup job...');
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await Attendance.deleteMany({
                createdAt: { $lt: thirtyDaysAgo }
            });

            console.log(`Cleanup complete. Deleted ${result.deletedCount} records older than 30 days.`);
        } catch (error) {
            console.error('Error during attendance cleanup:', error);
        }
    });
    console.log('Attendance cleanup job scheduled (Daily at Midnight).');
};

module.exports = initCleanupJob;
