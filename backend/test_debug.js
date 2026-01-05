const axios = require('axios');

async function testBackend() {
    console.log("Testing Backend Health...");
    try {
        const res = await axios.get('http://localhost:5000/');
        console.log("Root Endpoint:", res.data);
    } catch (error) {
        console.error("Root Endpoint Error:", error.message);
    }

    console.log("\nTesting Registration (Expect Error or Success)...");
    try {
        // Send dummy data to trigger validation or db error
        await axios.post('http://localhost:5000/api/auth/register-employee', {
            name: 'TestUser',
            email: 'test@example.com',
            password: 'password123',
            role: 'employee'
        });
        console.log("Registration Success");
    } catch (error) {
        console.error("Registration Error:", error.response ? error.response.data : error.message);
    }
}

testBackend();
