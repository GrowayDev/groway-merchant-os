/**
 * OpenAPI/Swagger Documentation Configuration
 * Provides comprehensive API documentation for the Merchant OS
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Groway Merchant OS API',
      version: '1.0.0',
      description: `
        Comprehensive API documentation for the Groway Merchant Operating System.
        
        ## Authentication
        Most endpoints require authentication via Bearer token or session cookie.
        
        ## Rate Limiting
        API requests are rate limited to 100 requests per minute per IP address.
        
        ## Pagination
        List endpoints support cursor-based pagination with \`limit\` and \`cursor\` parameters.
        
        ## Error Handling
        All errors follow a consistent format with \`success: false\`, \`error\`, and \`code\` fields.
      `,
      contact: {
        name: 'Groway API Support',
        email: 'api@groway.co.za',
        url: 'https://groway.co.za/support',
      },
      license: {
        name: 'Proprietary',
        url: 'https://groway.co.za/terms',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Current server',
      },
      {
        url: 'https://api.groway.co.za',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session_token',
          description: 'Session token stored in HTTP-only cookie',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'ERROR_CODE' },
          },
          required: ['success', 'error', 'code'],
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
          },
          required: ['success'],
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                limit: { type: 'integer' },
                cursor: { type: 'string', nullable: true },
                hasMore: { type: 'boolean' },
              },
            },
          },
        },
        // Auth schemas
        LoginRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' },
            pin: { type: 'string', pattern: '^\\d{4,6}$', example: '1234', description: 'Quick PIN login' },
          },
          required: ['email'],
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
              },
            },
            token: { type: 'string' },
          },
        },
        // Merchant schemas
        Merchant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            tradingName: { type: 'string' },
            registrationNumber: { type: 'string' },
            vatNumber: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            province: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string', default: 'South Africa' },
            industry: { type: 'string' },
            subVertical: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Branch schemas
        Branch: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            merchantId: { type: 'string' },
            name: { type: 'string' },
            code: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            province: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            isActive: { type: 'boolean' },
            isDefault: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Product schemas
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sku: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            price: { type: 'number' },
            costPrice: { type: 'number' },
            stock: { type: 'integer' },
            minStock: { type: 'integer' },
            maxStock: { type: 'integer' },
            unit: { type: 'string' },
            barcode: { type: 'string' },
            isActive: { type: 'boolean' },
            images: { type: 'array', items: { type: 'string' } },
          },
        },
        // Transaction schemas
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            transactionId: { type: 'string' },
            type: { type: 'string', enum: ['sale', 'refund', 'void', 'adjustment'] },
            amount: { type: 'number' },
            currency: { type: 'string', default: 'ZAR' },
            paymentMethod: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
            branchId: { type: 'string' },
            terminalId: { type: 'string' },
            userId: { type: 'string' },
            customerId: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/TransactionItem' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TransactionItem: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            productName: { type: 'string' },
            quantity: { type: 'number' },
            unitPrice: { type: 'number' },
            totalPrice: { type: 'number' },
            discount: { type: 'number' },
          },
        },
        // Appointment schemas
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            customerName: { type: 'string' },
            customerPhone: { type: 'string' },
            customerEmail: { type: 'string' },
            staffId: { type: 'string' },
            staffName: { type: 'string' },
            serviceId: { type: 'string' },
            serviceName: { type: 'string' },
            date: { type: 'string', format: 'date' },
            time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
            duration: { type: 'integer', description: 'Duration in minutes' },
            status: { type: 'string', enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'] },
            total: { type: 'number' },
            notes: { type: 'string' },
            source: { type: 'string', enum: ['online', 'phone', 'walk-in', 'in-store'] },
          },
        },
        // Customer schemas
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            notes: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            totalSpent: { type: 'number' },
            visitCount: { type: 'integer' },
            lastVisit: { type: 'string', format: 'date-time' },
            loyaltyPoints: { type: 'integer' },
            loyaltyTier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum'] },
          },
        },
        // Order schemas
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            type: { type: 'string', enum: ['dine-in', 'takeaway', 'delivery', 'drive-through'] },
            status: { type: 'string', enum: ['pending', 'in-progress', 'ready', 'completed', 'cancelled'] },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            subtotal: { type: 'number' },
            tax: { type: 'number' },
            discount: { type: 'number' },
            total: { type: 'number' },
            paymentStatus: { type: 'string', enum: ['pending', 'paid', 'refunded'] },
            paymentMethod: { type: 'string' },
            tableId: { type: 'string' },
            tableNumber: { type: 'string' },
            customerId: { type: 'string' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            name: { type: 'string' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'number' },
            totalPrice: { type: 'number' },
            notes: { type: 'string' },
            modifiers: { type: 'array', items: { type: 'object' } },
          },
        },
        // Hotel schemas
        HotelRoom: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            number: { type: 'string' },
            type: { type: 'string', enum: ['single', 'double', 'twin', 'suite', 'family', 'deluxe'] },
            floor: { type: 'integer' },
            status: { type: 'string', enum: ['available', 'occupied', 'reserved', 'maintenance', 'cleaning', 'checkout'] },
            price: { type: 'number' },
            capacity: { type: 'integer' },
            amenities: { type: 'array', items: { type: 'string' } },
          },
        },
        HotelReservation: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            confirmationCode: { type: 'string' },
            guestName: { type: 'string' },
            guestEmail: { type: 'string' },
            guestPhone: { type: 'string' },
            roomId: { type: 'string' },
            roomType: { type: 'string' },
            checkIn: { type: 'string', format: 'date' },
            checkOut: { type: 'string', format: 'date' },
            adults: { type: 'integer' },
            children: { type: 'integer' },
            status: { type: 'string', enum: ['confirmed', 'pending', 'cancelled', 'checked_in', 'checked_out', 'no_show'] },
            totalAmount: { type: 'number' },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request - Invalid input',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Not found - Resource does not exist',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        RateLimited: {
          description: 'Too many requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Merchants', description: 'Merchant management' },
      { name: 'Branches', description: 'Branch/location management' },
      { name: 'Products', description: 'Product catalog management' },
      { name: 'Transactions', description: 'Sales and payment transactions' },
      { name: 'Appointments', description: 'Booking and appointment management' },
      { name: 'Customers', description: 'Customer relationship management' },
      { name: 'Orders', description: 'Restaurant order management' },
      { name: 'Inventory', description: 'Inventory and stock management' },
      { name: 'Reports', description: 'Reporting and analytics' },
      { name: 'Hotel', description: 'Hotel management endpoints' },
      { name: 'Kitchen', description: 'Kitchen display system' },
      { name: 'Compliance', description: 'Licensing and compliance management' },
      { name: 'GroSupply', description: 'B2B procurement marketplace' },
    ],
  },
  apis: [
    // API documentation is defined inline in the components/schemas section
    // Route-specific JSDoc comments can be added to route files as needed
  ],
};

// Generate OpenAPI specification
export const openApiSpec = swaggerJsdoc(options);

// Export for use in API route
export default openApiSpec;
