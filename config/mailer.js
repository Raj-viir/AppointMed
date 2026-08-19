import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send an email. Fire-and-forget — logs errors but doesn't throw.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
const sendMail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Appointment App" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`Email sent: ${info.messageId} → ${to}`);
    } catch (error) {
        console.error(`Email failed to ${to}: ${error.message}`);
    }
};

export default sendMail;
