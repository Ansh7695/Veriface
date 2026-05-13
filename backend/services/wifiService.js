const { exec } = require('child_process');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

const normalizeMac = (mac) => {
    if (!mac) return '';
    return mac.replace(/[-:.]/g, '').toLowerCase();
}

const parseArpOutput = (stdout) => {
    const lines = stdout.split('\n');
    const macs = new Set();
    for (const line of lines) {
        // Windows: IP address       Physical Address     Type
        // Example line:  192.168.1.5          00-11-22-33-44-55     dynamic
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
            const possibleMac = parts[1];
            const n = normalizeMac(possibleMac);
            if (n && n.length >= 12) macs.add(n);
        }
    }
    return Array.from(macs);
}

const scanArp = () => {
    return new Promise((resolve, reject) => {
        exec('arp -a', { timeout: 20_000 }, (err, stdout, stderr) => {
            if (err) return reject(err);
            try {
                const macs = parseArpOutput(stdout || '');
                resolve(macs);
            } catch (e) {
                reject(e);
            }
        });
    });
}

const todayDateString = () => {
    const d = new Date();
    return d.toISOString().slice(0,10);
}

const nowTimeString = () => {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
}

const checkPresenceAndMarkAttendance = async () => {
    try {
        const macs = await scanArp();
        if (!macs || macs.length === 0) return;

        // Load users with registered devices
        const users = await User.find({ 'devices.0': { $exists: true } });
        const macSet = new Set(macs.map(m => normalizeMac(m)));

        for (const user of users) {
            const userDeviceMacs = (user.devices || []).map(d => normalizeMac(d.mac));
            const found = userDeviceMacs.find(m => macSet.has(m));
            if (found) {
                // mark attendance for today if not exists
                const dateStr = todayDateString();
                const existing = await Attendance.findOne({ userId: user._id, date: dateStr });
                if (!existing) {
                    const status = 'ON_TIME';
                    await Attendance.create({
                        userId: user._id,
                        date: dateStr,
                        time: nowTimeString(),
                        method: 'WIFI',
                        status,
                        deviceInfo: found,
                    });
                    console.log(`Marked WIFI attendance for user ${user.email} (${user._id}) via device ${found}`);
                }
            }
        }
    } catch (error) {
        console.error('Error in WiFi presence check:', error);
    }
}

module.exports = {
    checkPresenceAndMarkAttendance,
    scanArp,
};
