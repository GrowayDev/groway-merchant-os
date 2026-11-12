/**
 * Unit Tests for Email Service
 */

import {
  generateReceiptEmail,
  generateAppointmentReminderEmail,
  generateWelcomeEmail,
  generatePasswordResetEmail,
  generateOrderConfirmationEmail,
} from '@/lib/email-service';

describe('Email Service', () => {
  describe('generateReceiptEmail', () => {
    it('should generate a receipt email with correct content', () => {
      const result = generateReceiptEmail({
        merchantName: 'Test Store',
        customerName: 'John Doe',
        transactionId: 'TXN-12345',
        amount: 150.00,
        currency: 'ZAR',
        items: [
          { name: 'Product 1', quantity: 2, price: 50.00 },
          { name: 'Product 2', quantity: 1, price: 50.00 },
        ],
        date: '2024-01-15 14:30',
        paymentMethod: 'Card',
      });

      expect(result.subject).toBe('Receipt from Test Store - TXN-12345');
      expect(result.html).toContain('Test Store');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('TXN-12345');
      expect(result.html).toContain('150.00');
      expect(result.text).toContain('Test Store');
      expect(result.text).toContain('TXN-12345');
    });

    it('should format currency correctly', () => {
      const result = generateReceiptEmail({
        merchantName: 'Test Store',
        customerName: 'Jane Doe',
        transactionId: 'TXN-001',
        amount: 99.99,
        currency: 'USD',
        items: [{ name: 'Item', quantity: 1, price: 99.99 }],
        date: '2024-01-15',
        paymentMethod: 'Cash',
      });

      expect(result.html).toContain('USD');
      expect(result.html).toContain('99.99');
    });
  });

  describe('generateAppointmentReminderEmail', () => {
    it('should generate an appointment reminder email', () => {
      const result = generateAppointmentReminderEmail({
        merchantName: 'Salon Studio',
        customerName: 'Jane Smith',
        serviceName: 'Haircut',
        staffName: 'Stylist Sarah',
        date: '2024-01-20',
        time: '14:00',
        duration: 30,
        address: '123 Main Street, Johannesburg',
      });

      expect(result.subject).toContain('Appointment Reminder');
      expect(result.subject).toContain('Haircut');
      expect(result.html).toContain('Jane Smith');
      expect(result.html).toContain('Haircut');
      expect(result.html).toContain('Stylist Sarah');
      expect(result.html).toContain('2024-01-20');
      expect(result.html).toContain('14:00');
      expect(result.html).toContain('30 minutes');
      expect(result.html).toContain('123 Main Street');
    });

    it('should include cancellation URL if provided', () => {
      const result = generateAppointmentReminderEmail({
        merchantName: 'Spa Wellness',
        customerName: 'Customer',
        serviceName: 'Massage',
        staffName: 'Therapist',
        date: '2024-01-20',
        time: '10:00',
        duration: 60,
        cancellationUrl: 'https://example.com/cancel/123',
      });

      expect(result.html).toContain('https://example.com/cancel/123');
      expect(result.html).toContain('Manage Booking');
    });
  });

  describe('generateWelcomeEmail', () => {
    it('should generate a welcome email', () => {
      const result = generateWelcomeEmail({
        merchantName: 'Groway',
        userName: 'New User',
        loginUrl: 'https://app.groway.co.za/login',
        supportEmail: 'support@groway.co.za',
      });

      expect(result.subject).toBe('Welcome to Groway!');
      expect(result.html).toContain('New User');
      expect(result.html).toContain('https://app.groway.co.za/login');
      expect(result.html).toContain('support@groway.co.za');
      expect(result.text).toContain('Welcome to Groway!');
    });
  });

  describe('generatePasswordResetEmail', () => {
    it('should generate a password reset email', () => {
      const result = generatePasswordResetEmail({
        merchantName: 'Groway',
        userName: 'User',
        resetUrl: 'https://app.groway.co.za/reset?token=abc123',
        expiryHours: 24,
      });

      expect(result.subject).toBe('Password Reset - Groway');
      expect(result.html).toContain('reset your password');
      expect(result.html).toContain('https://app.groway.co.za/reset?token=abc123');
      expect(result.html).toContain('24 hours');
      expect(result.text).toContain('Password Reset');
    });
  });

  describe('generateOrderConfirmationEmail', () => {
    it('should generate an order confirmation email', () => {
      const result = generateOrderConfirmationEmail({
        merchantName: 'Online Store',
        customerName: 'Buyer',
        orderId: 'ORD-2024-001',
        items: [
          { name: 'Product A', quantity: 2, price: 100 },
          { name: 'Product B', quantity: 1, price: 50 },
        ],
        total: 250,
        currency: 'ZAR',
        estimatedDelivery: '2024-01-20',
        trackingUrl: 'https://track.example.com/123',
      });

      expect(result.subject).toBe('Order Confirmed - ORD-2024-001');
      expect(result.html).toContain('ORD-2024-001');
      expect(result.html).toContain('250');
      expect(result.html).toContain('2024-01-20');
      expect(result.html).toContain('https://track.example.com/123');
    });
  });
});
