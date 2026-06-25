/**
 * Sends an email using the Brevo (Sendinblue) HTTP API.
 * This completely bypasses Railway SMTP blocks and allows sending to anyone.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is missing from environment variables');
    throw new Error('BREVO_API_KEY is missing');
  }

  const payload = {
    sender: {
      name: "AutoHub",
      email: process.env.EMAIL_USER || "bosinamarwan58@gmail.com"
    },
    to: [
      {
        email: to
      }
    ],
    subject: subject,
    textContent: text,
  };

  // Add HTML only if provided
  if (html) {
    payload.htmlContent = html;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Failed to send email to ${to}:`, errorData);
      throw new Error(errorData.message || 'Brevo API Error');
    }

    const data = await response.json();
    console.log(`✅ Email sent via Brevo to ${to}: ${data.messageId}`);
    return data;

  } catch (error) {
    console.error(`❌ Network error while sending email to ${to}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
