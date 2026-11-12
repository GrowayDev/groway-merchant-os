/**
 * Integration Tests for Appointments API
 */

import { NextRequest } from 'next/server';
import {
  GET as getAppointments,
  POST as createAppointment,
} from '@/app/merchant-os/api/booking/appointments/route';
import * as dbModule from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    appointment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    staff: {
      findFirst: jest.fn(),
    },
    bookingService: {
      findFirst: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Appointments API', () => {
  const db = (dbModule as { db: { 
    appointment: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock };
    staff: { findFirst: jest.Mock };
    bookingService: { findFirst: jest.Mock };
    customer: { findFirst: jest.Mock; create: jest.Mock };
  } }).db;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/booking/appointments', () => {
    it('should return appointments for a date', async () => {
      db.appointment.findMany.mockResolvedValue([
        {
          id: '1',
          customerName: 'John Doe',
          date: '2024-01-20',
          time: '10:00',
          status: 'scheduled',
        },
      ]);

      const request = new NextRequest(
        'http://localhost:3000/api/booking/appointments?date=2024-01-20'
      );
      const response = await getAppointments(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should filter by staff member', async () => {
      db.appointment.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/booking/appointments?staffId=staff-123'
      );
      await getAppointments(request);

      expect(db.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ staffId: 'staff-123' }),
        })
      );
    });
  });

  describe('POST /api/booking/appointments', () => {
    it('should create a new appointment', async () => {
      db.staff.findFirst.mockResolvedValue({ id: 'staff-1', name: 'Stylist' });
      db.bookingService.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Haircut',
        duration: 30,
        price: 100,
      });
      db.customer.findFirst.mockResolvedValue(null);
      db.appointment.findFirst.mockResolvedValue(null);
      db.appointment.create.mockResolvedValue({
        id: 'apt-1',
        customerName: 'Jane Doe',
        date: '2024-01-20',
        time: '10:00',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/booking/appointments',
        {
          method: 'POST',
          body: JSON.stringify({
            customerName: 'Jane Doe',
            customerPhone: '+27123456789',
            staffId: 'staff-1',
            serviceId: 'service-1',
            date: '2024-01-20',
            time: '10:00',
          }),
        }
      );

      const response = await createAppointment(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should reject overlapping appointments', async () => {
      db.staff.findFirst.mockResolvedValue({ id: 'staff-1' });
      db.bookingService.findFirst.mockResolvedValue({ duration: 30 });
      db.appointment.findFirst.mockResolvedValue({
        id: 'existing',
        time: '10:00',
        duration: 30,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/booking/appointments',
        {
          method: 'POST',
          body: JSON.stringify({
            customerName: 'Jane Doe',
            staffId: 'staff-1',
            serviceId: 'service-1',
            date: '2024-01-20',
            time: '10:00',
          }),
        }
      );

      const response = await createAppointment(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
    });
  });
});
