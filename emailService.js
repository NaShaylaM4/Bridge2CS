const sgMail = require('@sendgrid/mail');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not set. Email sending will fail until it is configured.');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

async function sendEmail(to, subject, text, html) {
  try {
    if (!SENDGRID_API_KEY) {
      throw new Error('Missing SENDGRID_API_KEY in environment variables');
    }

    const msg = {
      to,
      from: process.env.EMAIL_FROM,
      subject,
      text,
      html
    };

    console.log('API KEY exists:', !!SENDGRID_API_KEY);
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('Sending to:', to);
    console.log('Subject:', subject);

    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending email with SendGrid:', error.message);
    if (error.code) {
      console.error('SendGrid error code:', error.code);
    }
    if (error.response?.body) {
      console.error('SendGrid response body:', error.response.body);
    }
    console.error('SendGrid full error:', error.response?.body || error);
    throw error;
  }
}

module.exports = {
  sendEmail
};
