const axios = require('axios');

const BASIC_URL = 'http://localhost:5000/api';
const ADMIN_URL = 'http://localhost:5174';

async function runSystemCheck() {
    console.log("=== Starting Full System Health Check ===");

    // 1. Check Services
    try {
        await axios.get('http://localhost:5000/');
        console.log("✅ Backend API: Online");
    } catch { console.error("❌ Backend API: Offline"); }

    try {
        await axios.get('http://localhost:8000/health');
        console.log("✅ AI Service: Online");
    } catch { console.error("❌ AI Service: Offline/Unreachable"); }

    // 2. Simulate OTP Flow (Public)
    console.log("\n=== Testing OTP Flow (Simulation) ===");
    try {
        // Need a valid user first. Since we cleaned DB, we might fail here if no user exists.
        // But the admin exists. Let's try sending OTP to a non-existent user to check error handling.
        await axios.post(`${BASIC_URL}/attendance/send-otp-public`, { name: 'NonExistentUser' });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log("✅ OTP User Not Found Check: Passed (Correctly returned 404)");
        } else {
            console.error("❌ OTP Flow Error:", error.message);
        }
    }

    // 3. Check "Today's Attendance" Endpoint
    console.log("\n=== Testing Today's Attendance Endpoint ===");
    try {
        const res = await axios.get(`${BASIC_URL}/attendance/today`);
        if (Array.isArray(res.data)) {
            console.log(`✅ Endpoint Working: Returned ${res.data.length} records.`);
        } else {
            console.error("❌ Endpoint Failed: Did not return array");
        }
    } catch (error) {
        console.error("❌ Endpoint Error:", error.message);
    }

    console.log("\n=== System Check Complete ===");
}

runSystemCheck();
