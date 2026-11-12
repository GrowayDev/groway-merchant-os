/**
 * Email Service for Merchant OS
 * Provides email notifications using Nodemailer with multiple provider support
 */

import nodemailer from 'nodemailer';

// Email configuration
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Default configuration from environment
const getEmailConfig = (): EmailConfig | null => {
  if (!process.env.SMTP_HOST) {
    console.log('[Email] SMTP not configured, emails will be logged only');
    return null;
  }

  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  };
};

// Create transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) return transporter;

  const config = getEmailConfig();
  if (!config) return null;

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth.user ? config.auth : undefined,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  return transporter;
};

// ============================================
// Email Templates
// ============================================

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate transaction receipt email
 */
export function generateReceiptEmail(params: {
  merchantName: string;
  customerName: string;
  transactionId: string;
  amount: number;
  currency: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  date: string;
  paymentMethod: string;
}): EmailTemplate {
  const { 
    merchantName, 
    customerName, 
    transactionId, 
    amount, 
    currency,
    items,
    date,
    paymentMethod 
  } = params;

  const itemsList = items
    .map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${currency} ${item.price.toFixed(2)}</td></tr>`)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00897B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
        .total { font-size: 1.2em; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${merchantName}</h1>
          <p>Transaction Receipt</p>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          <p>Thank you for your purchase. Here are your transaction details:</p>
          
          <table>
            <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
            ${itemsList}
          </table>
          
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          <p class="total">Total: ${currency} ${amount.toFixed(2)}</p>
        </div>
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>${merchantName}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${merchantName} - Transaction Receipt

Dear ${customerName},

Thank you for your purchase. Here are your transaction details:

Transaction ID: ${transactionId}
Date: ${date}
Payment Method: ${paymentMethod}

Items:
${items.map(i => `- ${i.name} x${i.quantity}: ${currency} ${i.price.toFixed(2)}`).join('\n')}

Total: ${currency} ${amount.toFixed(2)}

Thank you for your business!
${merchantName}
  `;

  return { subject: `Receipt from ${merchantName} - ${transactionId}`, html, text };
}

/**
 * Generate appointment reminder email
 */
export function generateAppointmentReminderEmail(params: {
  merchantName: string;
  customerName: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  duration: number;
  address?: string;
  cancellationUrl?: string;
}): EmailTemplate {
  const {
    merchantName,
    customerName,
    serviceName,
    staffName,
    date,
    time,
    duration,
    address,
    cancellationUrl,
  } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00897B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        .button { display: inline-block; padding: 10px 20px; background: #00897B; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Reminder</h1>
          <p>${merchantName}</p>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          <p>This is a friendly reminder about your upcoming appointment:</p>
          
          <div class="details">
            <p><strong>Service:</strong> ${serviceName}</p>
            <p><strong>With:</strong> ${staffName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
            ${address ? `<p><strong>Address:</strong> ${address}</p>` : ''}
          </div>
          
          <p>Please arrive 5 minutes early. If you need to reschedule or cancel, please contact us.</p>
          
          ${cancellationUrl ? `<a href="${cancellationUrl}" class="button">Manage Booking</a>` : ''}
        </div>
        <div class="footer">
          <p>${merchantName}</p>
          <p>We look forward to seeing you!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Appointment Reminder - ${merchantName}

Dear ${customerName},

This is a friendly reminder about your upcoming appointment:

Service: ${serviceName}
With: ${staffName}
Date: ${date}
Time: ${time}
Duration: ${duration} minutes
${address ? `Address: ${address}` : ''}

Please arrive 5 minutes early. If you need to reschedule or cancel, please contact us.

${merchantName}
We look forward to seeing you!
  `;

  return { subject: `Appointment Reminder - ${serviceName} on ${date}`, html, text };
}

/**
 * Generate welcome email for new users
 */
export function generateWelcomeEmail(params: {
  merchantName: string;
  userName: string;
  loginUrl: string;
  supportEmail?: string;
}): EmailTemplate {
  const { merchantName, userName, loginUrl, supportEmail } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00897B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 15px 30px; background: #00897B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${merchantName}!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Welcome to ${merchantName}! Your account has been created successfully.</p>
          <p>You can now access all our features and services.</p>
          
          <a href="${loginUrl}" class="button">Get Started</a>
          
          <p>If you have any questions, don't hesitate to reach out to our support team.</p>
          ${supportEmail ? `<p>Support: ${supportEmail}</p>` : ''}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${merchantName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to ${merchantName}!

Hi ${userName},

Welcome to ${merchantName}! Your account has been created successfully.

You can now access all our features and services.

Get started here: ${loginUrl}

If you have any questions, don't hesitate to reach out to our support team.
${supportEmail ? `Support: ${supportEmail}` : ''}

© ${new Date().getFullYear()} ${merchantName}. All rights reserved.
  `;

  return { subject: `Welcome to ${merchantName}!`, html, text };
}

/**
 * Generate password reset email
 */
export function generatePasswordResetEmail(params: {
  merchantName: string;
  userName: string;
  resetUrl: string;
  expiryHours: number;
}): EmailTemplate {
  const { merchantName, userName, resetUrl, expiryHours } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #E53935; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 15px 30px; background: #E53935; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password for your ${merchantName} account.</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <div class="warning">
            <p><strong>Important:</strong> This link will expire in ${expiryHours} hours. If you did not request this reset, please ignore this email.</p>
          </div>
          
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${merchantName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset - ${merchantName}

Hi ${userName},

We received a request to reset your password for your ${merchantName} account.

Reset your password here: ${resetUrl}

Important: This link will expire in ${expiryHours} hours. If you did not request this reset, please ignore this email.

© ${new Date().getFullYear()} ${merchantName}. All rights reserved.
  `;

  return { subject: `Password Reset - ${merchantName}`, html, text };
}

/**
 * Generate order confirmation email
 */
export function generateOrderConfirmationEmail(params: {
  merchantName: string;
  customerName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  currency: string;
  estimatedDelivery?: string;
  trackingUrl?: string;
}): EmailTemplate {
  const { merchantName, customerName, orderId, items, total, currency, estimatedDelivery, trackingUrl } = params;

  const itemsList = items
    .map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${currency} ${item.price.toFixed(2)}</td></tr>`)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00897B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
        .total { font-size: 1.2em; font-weight: bold; }
        .button { display: inline-block; padding: 10px 20px; background: #00897B; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
          <p>${merchantName}</p>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Thank you for your order! We've received your order and it's being processed.</p>
          
          <p><strong>Order ID:</strong> ${orderId}</p>
          
          <table>
            <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
            ${itemsList}
          </table>
          
          <p class="total">Total: ${currency} ${total.toFixed(2)}</p>
          
          ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
          
          ${trackingUrl ? `<a href="${trackingUrl}" class="button">Track Order</a>` : ''}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${merchantName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Order Confirmed! - ${merchantName}

Hi ${customerName},

Thank you for your order! We've received your order and it's being processed.

Order ID: ${orderId}

Items:
${items.map(i => `- ${i.name} x${i.quantity}: ${currency} ${i.price.toFixed(2)}`).join('\n')}

Total: ${currency} ${total.toFixed(2)}

${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery}` : ''}

© ${new Date().getFullYear()} ${merchantName}. All rights reserved.
  `;

  return { subject: `Order Confirmed - ${orderId}`, html, text };
}

// ============================================
// Email Sending Functions
// ============================================

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send email
 */
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, html, text, from, replyTo, attachments } = params;

  const transporter = getTransporter();
  const senderEmail = from || process.env.SMTP_FROM || 'noreply@groway.co.za';

  // If no transporter, log the email (development mode)
  if (!transporter) {
    console.log('[Email] Development mode - Email not sent');
    console.log('[Email] To:', to);
    console.log('[Email] Subject:', subject);
    console.log('[Email] Body:', text);
    return { success: true, messageId: `dev-${Date.now()}` };
  }

  try {
    const result = await transporter.sendMail({
      from: senderEmail,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
      replyTo,
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email] No transporter configured');
    return false;
  }

  try {
    await transporter.verify();
    console.log('[Email] SMTP configuration verified');
    return true;
  } catch (error) {
    console.error('[Email] SMTP verification failed:', error);
    return false;
  }
}

/**
 * Send template email
 */
export async function sendTemplateEmail(
  to: string | string[],
  template: EmailTemplate,
  options?: { from?: string; replyTo?: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    ...options,
  });
}

// Export all functions and types
const emailService = {
  sendEmail,
  sendTemplateEmail,
  verifyEmailConfig,
  generateReceiptEmail,
  generateAppointmentReminderEmail,
  generateWelcomeEmail,
  generatePasswordResetEmail,
  generateOrderConfirmationEmail,
};

export default emailService;
