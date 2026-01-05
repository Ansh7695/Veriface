const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

console.log("Attempting to connect to MongoDB...");
console.log("URI Length:", process.env.MONGO_URI ? process.env.MONGO_URI.length : "Undefined");

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log("SUCCESS: MongoDB Connected!");
        process.exit(0);
    })
    .catch(err => {
        console.error("FAILURE: MongoDB Connection Check Failed");
        console.error("Error Name:", err.name);
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);
        process.exit(1);
    });
