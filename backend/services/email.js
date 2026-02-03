const nodemailer = require('nodemailer');

// Create transporter - uses environment variables for configuration
// Supports: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// Or falls back to a test account in development
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Production: Use configured SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development: Use Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('Using Ethereal test email account:', testAccount.user);
  }

  return transporter;
};

const sendPasswordResetEmail = async (email, resetToken, baseUrl) => {
  const transport = await getTransporter();
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Amplify Youth Voices" <noreply@amplify.com>',
    to: email,
    subject: 'Reset Your Password - Amplify Youth Voices',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 28px; font-weight: bold;">A</span>
          </div>
          <h1 style="color: #1a1a2e; margin: 20px 0 10px;">Reset Your Password</h1>
        </div>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
        </p>
      </div>
    `
  };

  const info = await transport.sendMail(mailOptions);

  // In development, log the preview URL
  if (!process.env.SMTP_HOST) {
    console.log('Password reset email preview URL:', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

module.exports = {
  sendPasswordResetEmail
};
