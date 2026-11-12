/**
 * Reminder Service Background Service
 * Handles appointment reminders, payment reminders, and scheduled notifications
 * Port: 3006
 */

import { PrismaClient } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'file:../../dev.db' }
  }
});

const PORT = 3006;

interface AppointmentReminder {
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  type: 'confirmation' | 'reminder_24h' | 'reminder_2h';
}

interface PaymentReminder {
  repaymentId: string;
  merchantId: string;
  merchantName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

/**
 * Process appointment reminders
 */
async function processAppointmentReminders(): Promise<{
  processed: number;
  sent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let sent = 0;

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Get booking settings for merchants
    const bookingSettings = await prisma.bookingSettings.findMany({
      where: {
        onlineBookingEnabled: true,
      },
    });

    for (const settings of bookingSettings) {
      // 24-hour reminders
      if (settings.sendReminder24h) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const appointments24h = await prisma.appointment.findMany({
          where: {
            date: tomorrowStr,
            status: { in: ['scheduled', 'confirmed'] },
            reminder24hSent: false,
          },
          include: {
            customer: true,
            service: true,
            staff: true,
          },
        });

        for (const apt of appointments24h) {
          processed++;
          
          try {
            await sendAppointmentReminder(settings.merchantId, {
              appointmentId: apt.id,
              customerId: apt.customerId || '',
              customerName: apt.customerName,
              customerPhone: apt.customerPhone || apt.customer?.phone || '',
              customerEmail: apt.customerEmail || apt.customer?.email,
              serviceName: apt.service.name,
              staffName: apt.staff.name,
              date: apt.date,
              time: apt.time,
              type: 'reminder_24h',
            });

            await prisma.appointment.update({
              where: { id: apt.id },
              data: { reminder24hSent: true },
            });

            // Log reminder
            await prisma.appointmentReminder.create({
              data: {
                appointmentId: apt.id,
                type: 'reminder_24h',
                channel: settings.sendWhatsApp ? 'whatsapp' : 'sms',
                sentAt: new Date(),
                status: 'sent',
              },
            });

            sent++;
            console.log(`[Reminder] 24h reminder sent for appointment ${apt.id}`);
          } catch (error) {
            errors.push(`Appointment ${apt.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // 2-hour reminders
      if (settings.sendReminder2h) {
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const twoHoursTime = twoHoursFromNow.toTimeString().slice(0, 5);

        const appointments2h = await prisma.appointment.findMany({
          where: {
            date: today,
            time: { gte: twoHoursTime, lte: twoHoursTime },
            status: { in: ['scheduled', 'confirmed'] },
            reminder2hSent: false,
          },
          include: {
            customer: true,
            service: true,
            staff: true,
          },
        });

        for (const apt of appointments2h) {
          processed++;
          
          try {
            await sendAppointmentReminder(settings.merchantId, {
              appointmentId: apt.id,
              customerId: apt.customerId || '',
              customerName: apt.customerName,
              customerPhone: apt.customerPhone || apt.customer?.phone || '',
              customerEmail: apt.customerEmail || apt.customer?.email,
              serviceName: apt.service.name,
              staffName: apt.staff.name,
              date: apt.date,
              time: apt.time,
              type: 'reminder_2h',
            });

            await prisma.appointment.update({
              where: { id: apt.id },
              data: { reminder2hSent: true },
            });

            // Log reminder
            await prisma.appointmentReminder.create({
              data: {
                appointmentId: apt.id,
                type: 'reminder_2h',
                channel: settings.sendWhatsApp ? 'whatsapp' : 'sms',
                sentAt: new Date(),
                status: 'sent',
              },
            });

            sent++;
            console.log(`[Reminder] 2h reminder sent for appointment ${apt.id}`);
          } catch (error) {
            errors.push(`Appointment ${apt.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    }
  } catch (error) {
    errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { processed, sent, errors };
}

/**
 * Process payment reminders (GroCredit)
 */
async function processPaymentReminders(): Promise<{
  processed: number;
  sent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let sent = 0;

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get notification settings for merchants
    const notificationSettings = await prisma.notificationSettings.findMany({
      where: {
        paymentDueReminder: true,
      },
    });

    for (const settings of notificationSettings) {
      const reminderDays = settings.paymentDueDays;

      // Calculate reminder date
      const reminderDate = new Date(now);
      reminderDate.setDate(reminderDate.getDate() + reminderDays);
      const reminderDateStr = reminderDate.toISOString().split('T')[0];

      // Find repayments due
      const repayments = await prisma.creditRepayment.findMany({
        where: {
          dueDate: reminderDateStr,
          status: 'pending',
          reminder7dSent: reminderDays >= 7 ? false : true,
          reminder3dSent: reminderDays >= 3 && reminderDays < 7 ? false : true,
        },
        include: {
          facility: {
            include: {
              merchantCredit: true,
            },
          },
        },
      });

      for (const repayment of repayments) {
        processed++;

        try {
          // Send payment reminder
          await sendPaymentReminder({
            repaymentId: repayment.id,
            merchantId: repayment.facility.merchantCredit.merchantId,
            merchantName: 'Groway',
            customerId: '',
            customerName: '',
            customerPhone: '',
            amount: repayment.amount,
            dueDate: repayment.dueDate,
            daysUntilDue: reminderDays,
          });

          // Mark reminder sent
          const updateData: any = {};
          if (reminderDays >= 7) updateData.reminder7dSent = true;
          if (reminderDays >= 3 && reminderDays < 7) updateData.reminder3dSent = true;

          await prisma.creditRepayment.update({
            where: { id: repayment.id },
            data: updateData,
          });

          sent++;
          console.log(`[Reminder] Payment reminder sent for repayment ${repayment.id}`);
        } catch (error) {
          errors.push(`Repayment ${repayment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Overdue payment reminders
    if (notificationSettings.some(s => s.paymentOverdueEnabled)) {
      const overdueRepayments = await prisma.creditRepayment.findMany({
        where: {
          dueDate: { lt: today },
          status: 'pending',
        },
        take: 50,
      });

      for (const repayment of overdueRepayments) {
        processed++;

        try {
          // Mark as overdue
          await prisma.creditRepayment.update({
            where: { id: repayment.id },
            data: { status: 'overdue' },
          });

          sent++;
        } catch (error) {
          errors.push(`Overdue ${repayment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  } catch (error) {
    errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { processed, sent, errors };
}

/**
 * Send appointment reminder
 */
async function sendAppointmentReminder(
  merchantId: string,
  reminder: AppointmentReminder
): Promise<void> {
  // Get merchant notification settings
  const settings = await prisma.notificationSettings.findUnique({
    where: { merchantId },
  });

  const channel = settings?.reminderChannel || 'whatsapp';
  
  const timeMessages = {
    confirmation: 'Your appointment is confirmed!',
    reminder_24h: 'Reminder: Your appointment is tomorrow!',
    reminder_2h: 'Reminder: Your appointment is in 2 hours!',
  };

  const message = `📅 ${timeMessages[reminder.type]}

*${reminder.serviceName}*
👨‍💼 ${reminder.staffName}
📅 ${formatDate(reminder.date)}
⏰ ${reminder.time}

Please arrive 5 minutes early. Reply CANCEL to cancel (cancellation policy applies).

Thank you for choosing us! 🙏`;

  // Queue notification
  await prisma.notificationQueue.create({
    data: {
      merchantId,
      recipientType: 'customer',
      recipientId: reminder.customerId,
      recipientPhone: formatPhone(reminder.customerPhone),
      recipientEmail: reminder.customerEmail,
      recipientName: reminder.customerName,
      channel,
      body: message,
      referenceType: 'appointment',
      referenceId: reminder.appointmentId,
      status: 'queued',
      priority: 8,
      cost: channel === 'whatsapp' ? 0.35 : channel === 'sms' ? 0.50 : 0,
    },
  });
}

/**
 * Send payment reminder
 */
async function sendPaymentReminder(reminder: PaymentReminder): Promise<void> {
  const message = `💳 Payment Reminder

Hi ${reminder.customerName},

Your GroCredit payment of R${reminder.amount.toFixed(2)} is due on ${formatDate(reminder.dueDate)}.

Days remaining: ${reminder.daysUntilDue}

Please ensure sufficient funds in your account or make a payment to avoid late fees.

Log in to your dashboard to make a payment or view your account details.

Thank you,
${reminder.merchantName}`;

  // Queue notification
  await prisma.notificationQueue.create({
    data: {
      merchantId: reminder.merchantId,
      recipientType: 'customer',
      recipientId: reminder.customerId,
      recipientPhone: formatPhone(reminder.customerPhone),
      recipientName: reminder.customerName,
      channel: 'whatsapp',
      body: message,
      referenceType: 'credit_repayment',
      referenceId: reminder.repaymentId,
      status: 'queued',
      priority: 7,
      cost: 0.35,
    },
  });
}

/**
 * Process expired booking windows
 */
async function processExpiredBookings(): Promise<{
  cancelled: number;
  notified: number;
}> {
  let cancelled = 0;
  let notified = 0;

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Find past appointments that weren't completed
    const pastAppointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { date: { lt: today }, status: { in: ['scheduled', 'confirmed'] } },
          {
            date: today,
            time: { lt: currentTime },
            status: { in: ['scheduled', 'confirmed'] },
          },
        ],
      },
    });

    for (const apt of pastAppointments) {
      // Auto-complete or mark as no-show based on business rules
      await prisma.appointment.update({
        where: { id: apt.id },
        data: {
          status: 'no-show',
          cancelledAt: new Date(),
          cancelledReason: 'Automatic: No show',
        },
      });

      cancelled++;
    }
  } catch (error) {
    console.error('[Reminder] Error processing expired bookings:', error);
  }

  return { cancelled, notified };
}

/**
 * Get reminder statistics
 */
async function getReminderStats() {
  const today = new Date().toISOString().split('T')[0];

  const [appointments24h, appointments2h, paymentsDue, paymentsOverdue] = await Promise.all([
    prisma.appointment.count({
      where: {
        reminder24hSent: true,
        createdAt: { gte: today },
      },
    }),
    prisma.appointment.count({
      where: {
        reminder2hSent: true,
        createdAt: { gte: today },
      },
    }),
    prisma.creditRepayment.count({
      where: {
        status: 'pending',
        dueDate: { gte: today },
      },
    }),
    prisma.creditRepayment.count({
      where: { status: 'overdue' },
    }),
  ]);

  return {
    appointments24h,
    appointments2h,
    paymentsDue,
    paymentsOverdue,
  };
}

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+27' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+27' + cleaned;
  }
  return cleaned;
}

// HTTP Server for health checks and manual triggers
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'reminder-service',
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    if (url.pathname === '/stats') {
      const stats = await getReminderStats();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
      return;
    }

    if (url.pathname === '/appointments' && req.method === 'POST') {
      const result = await processAppointmentReminders();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    if (url.pathname === '/payments' && req.method === 'POST') {
      const result = await processPaymentReminders();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    if (url.pathname === '/expired' && req.method === 'POST') {
      const result = await processExpiredBookings();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error) {
    console.error('[Reminder] Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`[Reminder] Service started on port ${PORT}`);

  // Run periodic tasks
  setInterval(async () => {
    console.log('[Reminder] Running scheduled processing...');
    await processAppointmentReminders();
    await processPaymentReminders();
  }, 60000); // Every minute

  // Process expired bookings every 5 minutes
  setInterval(async () => {
    await processExpiredBookings();
  }, 5 * 60 * 1000);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Reminder] Shutting down...');
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});
