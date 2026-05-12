const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create transporter — falls back to Ethereal (catch-all) in dev if SMTP not configured
let transporter;
const initTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS &&
      !process.env.SMTP_USER.includes('your_email') &&
      !process.env.SMTP_PASS.includes('your_app')) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    logger.info('SMTP Email transporter initialized.');
  } else {
    // Dev fallback: use Ethereal for testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info('Ethereal Test Email transporter initialized (Demo Mode).');
  }
};
initTransporter();

const templates = {
  bookingConfirmation: (data) => ({
    subject: `Booking Confirmed - ${data.event?.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: 'Inter', Arial, sans-serif; background: #0f0f1a; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .body { padding: 32px; }
        .ticket { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin: 20px 0; }
        .ticket-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; }
        .label { color: #94a3b8; font-size: 14px; }
        .value { color: #f1f5f9; font-weight: 600; }
        .badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        .footer { background: #0f0f1a; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎟️ EventSphere AI</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Your booking is confirmed!</p>
          </div>
          <div class="body">
            <p>Hi <strong>${data.user?.name}</strong>,</p>
            <p>Your booking has been confirmed. Here are the details:</p>
            <div class="ticket">
              <div class="ticket-row"><span class="label">Event</span><span class="value">${data.event?.title}</span></div>
              <div class="ticket-row"><span class="label">Booking ID</span><span class="value">${data.booking?.bookingId}</span></div>
              <div class="ticket-row"><span class="label">Date</span><span class="value">${new Date(data.event?.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
              <div class="ticket-row"><span class="label">Venue</span><span class="value">${data.event?.venue?.name}, ${data.event?.venue?.city}</span></div>
              <div class="ticket-row"><span class="label">Tickets</span><span class="value">${data.booking?.quantity} × ${data.booking?.ticketTier?.name}</span></div>
              <div class="ticket-row"><span class="label">Total Paid</span><span class="value">₹${data.booking?.totalAmount?.toLocaleString('en-IN')}</span></div>
              <div class="ticket-row"><span class="label">Status</span><span class="badge">Confirmed ✓</span></div>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">Your QR tickets are available in your EventSphere dashboard. Present them at the venue for entry.</p>
            <center><a href="${process.env.CLIENT_URL}/dashboard/bookings" class="btn">View My Tickets</a></center>
          </div>
          <div class="footer">
            <p>© 2025 EventSphere AI. All rights reserved.</p>
            <p>If you didn't make this booking, contact support immediately.</p>
          </div>
        </div>
      </body></html>
    `,
  }),
  resetPassword: (data) => ({
    subject: 'Password Reset - EventSphere AI',
    html: `
      <!DOCTYPE html><html><head><style>
        body { font-family: Arial, sans-serif; background: #0f0f1a; color: #e2e8f0; }
        .container { max-width: 500px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 32px; text-align: center; }
        .body { padding: 32px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; }
      </style></head><body>
        <div class="container">
          <div class="header"><h1 style="color:white;margin:0;">🔐 Password Reset</h1></div>
          <div class="body">
            <p>Hi ${data.name},</p>
            <p>You requested a password reset. Click the button below:</p>
            <center><a href="${data.resetUrl}" class="btn">Reset Password</a></center>
            <p style="color:#64748b;font-size:12px;">This link expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </div>
        </div>
      </body></html>
    `,
  }),
};

const sendEmail = async ({ email, subject, template, data }) => {
  try {
    const tmpl = templates[template]?.(data);
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'EventSphere AI'}" <${process.env.FROM_EMAIL || 'noreply@eventsphere.ai'}>`,
      to: email,
      subject: tmpl?.subject || subject,
      html: tmpl?.html || '<p>No template</p>',
    });
    logger.info(`Email sent to ${email}`);
    if (info.messageId && transporter.options.host === 'smtp.ethereal.email') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error(`Email failed to ${email}: ${error.message}`);
    // Don't throw — email failure should not break booking flow
  }
};

module.exports = sendEmail;

