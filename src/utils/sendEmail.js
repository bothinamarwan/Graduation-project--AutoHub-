const { Resend } = require('resend');

/**
 * Sends an email using the Resend API (HTTP-based, works on Railway).
 * Since no custom domain is verified, we send FROM Resend's sandbox address.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: 'AutoHub <onboarding@resend.dev>',
    to,
    subject,
    text,
    html,
  });

  if (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw new Error(error.message);
  }

  console.log(`✅ Email sent to ${to}: ${data.id}`);
  return data;
};

module.exports = sendEmail;
