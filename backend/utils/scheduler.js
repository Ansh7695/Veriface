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

// Also schedule WiFi presence checks every 5 minutes (if service available)
try {
    const { checkPresenceAndMarkAttendance } = require('../services/wifiService');
    const cron = require('node-cron');
    cron.schedule('*/5 * * * *', async () => {
        console.log('Running WiFi presence check...');
        try {
            await checkPresenceAndMarkAttendance();
        } catch (err) {
            console.error('WiFi presence check failed:', err);
        }
    });
    console.log('WiFi presence check scheduled every 5 minutes.');
} catch (e) {
    console.warn('WiFi service not available; skipping WiFi presence scheduler.');
}
