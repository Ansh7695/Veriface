const nodemailer = require('nodemailer');

const sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Or use SMTP settings from env
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Attendance OTP',
            text: `Your OTP for marking attendance is: ${otp}. It is valid for 60 seconds.`,
        };

        await transporter.sendMail(mailOptions);
        console.log('OTP sent to:', email);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendOTP };
