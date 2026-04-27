// Simulates exactly what the Express server does:
// dotenv.config() with NO path argument (reads from CWD)
require('dotenv').config();

const sendEmail = require('../src/utils/sendEmail');


console.log('--- ENV CHECK ---');
console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET');
console.log('-----------------\n');

const testTo = 'bothinamarwan88@gmail.com'; // the email from your request

sendEmail({
  to: testTo,
  subject: 'AutoHub - Confirm Your Dealer Email',
  text: `Please confirm your email: http://localhost:3000/api/auth/confirm-email/testtoken123`,
  html: `<h2>Test Confirmation</h2><p>Click <a href="http://localhost:3000/api/auth/confirm-email/testtoken123">here</a> to confirm.</p>`,
})
  .then(() => console.log('\n✅ Email sent successfully!'))
  .catch(err => {
    console.error('\n❌ FAILED:', err.message);
    console.error('Full error:', err);
  });
