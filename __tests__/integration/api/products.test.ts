/**
 * Integration Tests for Products API
 */

import { NextRequest } from 'next/server';
import { GET as getProducts, POST as createProduct } from '@/app/api/products/route';
import * as dbModule from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Products API', () => {
  const db = (dbModule as { db: { 
    product: { 
      findMany: jest.Mock; 
      findFirst: jest.Mock; 
      create: jest.Mock;
      count: jest.Mock;
    } 
  } }).db;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return a list of products', async () => {
      db.product.findMany.mockResolvedValue([
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ]);
      db.product.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/products');
      const response = await getProducts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it('should filter products by category', async () => {
      db.product.findMany.mockResolvedValue([
        { id: '1', name: 'Product 1', category: 'food' },
      ]);

      const request = new NextRequest(
        'http://localhost:3000/api/products?category=food'
      );
      const response = await getProducts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'food' }),
        })
      );
    });

    it('should paginate results', async () => {
      db.product.findMany.mockResolvedValue([]);
      db.product.count.mockResolvedValue(100);

      const request = new NextRequest(
        'http://localhost:3000/api/products?limit=10&offset=20'
      );
      const response = await getProducts(request);

      expect(response.status).toBe(200);
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        sku: 'SKU-001',
        price: 150,
        category: 'food',
      };

      db.product.findFirst.mockResolvedValue(null);
      db.product.create.mockResolvedValue({
        id: 'new-id',
        ...newProduct,
      });

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
      });

      const response = await createProduct(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should reject duplicate SKU', async () => {
      db.product.findFirst.mockResolvedValue({ id: 'existing', sku: 'SKU-001' });

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Product',
          sku: 'SKU-001',
          price: 100,
        }),
      });

      const response = await createProduct(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
    });
  });
});
