const nodemailer = require('nodemailer');

/**
 * Creates a fresh transporter using env vars at call time.
 * IMPORTANT: Do NOT move this outside the function.
 * The transporter must be created inside sendEmail() so it reads
 * process.env.EMAIL_USER and process.env.EMAIL_PASS AFTER dotenv
 * has loaded them. Creating it at module load time results in
 * undefined credentials because this file is require()'d before
 * dotenv.config() runs in index.js.
 *
 * family: 4  → forces IPv4 to fix ENETUNREACH on Railway (IPv6 not supported for SMTP)
 */
const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    family: 4,     // Force IPv4 — fixes Railway ENETUNREACH error
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
        ? process.env.EMAIL_PASS.replace(/\s+/g, '')
        : '',
      // pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '',
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"AutoHub" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
