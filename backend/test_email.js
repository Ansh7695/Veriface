const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendTestEmail = async () => {
    console.log(`Attempting to send email from ${process.env.EMAIL_USER}...`);
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from Attendance System',
            text: 'If you see this, email configuration is working!'
        });
        console.log('Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Email failed:', error);
    }
};

sendTestEmail();
