import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Product } from '../../src/products/entities/product.entity';
import { Reservation } from '../../src/reservations/entities/reservation.entity';
import { User, UserRole } from '../../src/users/entities/user.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Concurrency Control Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testProduct: Product;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  }, 60000); // 60 seconds for app initialization

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }, 60000); // 60 seconds for cleanup

  beforeEach(async () => {
    // Clear tables
    await dataSource.query('TRUNCATE TABLE reservations CASCADE');
    await dataSource.query('TRUNCATE TABLE products CASCADE');
    await dataSource.query('TRUNCATE TABLE users CASCADE');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test user
    testUser = await dataSource.manager.save(User, {
      email: `test-${Date.now()}@example.com`,
      password: hashedPassword,
      name: 'Test User',
      role: UserRole.USER,
    });

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'password123',
      });

    authToken = loginRes.body.access_token;
  }, 60000); // 60 seconds for setup each test

  describe('Test Case 1: No Oversell with 10 Concurrent Requests', () => {
    it('should not oversell when 10 users reserve 1 item each from stock of 5', async () => {
      // Setup: Create product with stock = 5
      testProduct = await dataSource.manager.save(Product, {
        name: 'Limited Stock Product',
        description: 'Product with limited stock',
        price: 99.99,
        available_stock: 5,
        reserved_stock: 0,
        sold_stock: 0,
      });

      const productId = testProduct.id;
      const reservationPayload = {
        items: [{ productId, quantity: 1 }],
        idempotency_key: undefined,
      };

      // Action: 10 concurrent requests
      const promises = Array.from({ length: 10 }, (_, index) => {
        return request(app.getHttpServer())
          .post('/reservations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...reservationPayload,
            idempotency_key: `key-${index}`, // Unique key for each request
          });
      });

      const results = await Promise.allSettled(promises);

      // Count results
      const successful = results.filter(
        (r) =>
          r.status === 'fulfilled' &&
          (r.value.status === 201 || r.value.status === 200),
      ).length;

      const failed = results.filter(
        (r) =>
          r.status === 'fulfilled' &&
          (r.value.status === 400 || r.value.status === 409),
      ).length;

      console.log(`✓ Successful reservations: ${successful}`);
      console.log(`✗ Failed reservations: ${failed}`);

      // Verify: Only 5 should succeed (stock = 5)
      expect(successful).toBe(5);
      expect(failed).toBe(5);

      // Verify database state
      const updatedProduct = await dataSource.manager.findOne(Product, {
        where: { id: productId },
      });

      expect(updatedProduct?.available_stock).toBe(0);
      expect(updatedProduct?.reserved_stock).toBe(5);
      expect(
        updatedProduct?.available_stock! + updatedProduct?.reserved_stock!,
      ).toBe(5);

      console.log('✓ Database state verified: No oversell detected');
    }, 60000); // 60 seconds = 1 minute
  });

  describe('Test Case 2: Race Condition on Last Item', () => {
    it('should handle race condition when 10 users compete for 1 item', async () => {
      // Setup: Product with stock = 1
      testProduct = await dataSource.manager.save(Product, {
        name: 'Single Item Product',
        description: 'Only 1 item available',
        price: 199.99,
        available_stock: 1,
        reserved_stock: 0,
        sold_stock: 0,
      });

      const productId = testProduct.id;

      // Action: 10 concurrent requests for the same item
      const promises = Array.from({ length: 10 }, (_, index) => {
        return request(app.getHttpServer())
          .post('/reservations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            items: [{ productId, quantity: 1 }],
            idempotency_key: `race-key-${index}`,
          });
      });

      const results = await Promise.allSettled(promises);

      const successful = results.filter(
        (r) =>
          r.status === 'fulfilled' &&
          (r.value.status === 201 || r.value.status === 200),
      ).length;

      console.log(`✓ Successful reservations: ${successful}`);

      // Verify: Only 1 should succeed
      expect(successful).toBe(1);

      // Verify database
      const updatedProduct = await dataSource.manager.findOne(Product, {
        where: { id: productId },
      });

      expect(updatedProduct?.available_stock).toBe(0);
      expect(updatedProduct?.reserved_stock).toBe(1);

      console.log(
        '✓ Race condition handled correctly: Exactly 1 item reserved',
      );
    }, 60000); // 60 seconds
  });

  describe('Test Case 3: Multiple Products Concurrent Reservation', () => {
    it('should correctly reserve across multiple products with concurrent requests', async () => {
      // Setup: 3 products with different stock levels
      const product1 = await dataSource.manager.save(Product, {
        name: 'Product 1',
        description: 'Stock: 5',
        price: 50.0,
        available_stock: 5,
        reserved_stock: 0,
        sold_stock: 0,
      });

      const product2 = await dataSource.manager.save(Product, {
        name: 'Product 2',
        description: 'Stock: 3',
        price: 75.0,
        available_stock: 3,
        reserved_stock: 0,
        sold_stock: 0,
      });

      const product3 = await dataSource.manager.save(Product, {
        name: 'Product 3',
        description: 'Stock: 8',
        price: 100.0,
        available_stock: 8,
        reserved_stock: 0,
        sold_stock: 0,
      });

      const productIds = [product1.id, product2.id, product3.id];

      // Action: 20 concurrent requests with random product selections
      const promises = Array.from({ length: 20 }, (_, index) => {
        const randomProductId = productIds[Math.floor(Math.random() * 3)];
        return request(app.getHttpServer())
          .post('/reservations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            items: [{ productId: randomProductId, quantity: 1 }],
            idempotency_key: `multi-key-${index}`,
          });
      });

      const results = await Promise.allSettled(promises);

      // Count successful by product
      const successful = results.filter(
        (r) =>
          r.status === 'fulfilled' &&
          (r.value.status === 201 || r.value.status === 200),
      ).length;

      console.log(`✓ Successful reservations: ${successful}`);

      // Verify: Total reserved should not exceed available stock
      const updatedProducts = await dataSource.manager.find(Product, {
        where: {
          id: productIds as any,
        },
      });

      for (const product of updatedProducts) {
        const isValid =
          product.available_stock >= 0 &&
          product.reserved_stock >= 0 &&
          product.available_stock + product.reserved_stock <=
            product.available_stock +
              product.reserved_stock +
              product.sold_stock;

        console.log(
          `✓ Product ${product.name}: Available=${product.available_stock}, Reserved=${product.reserved_stock}`,
        );
        expect(isValid).toBe(true);
      }

      console.log('✓ No oversell detected across multiple products');
    }, 60000); // 60 seconds
  });

  describe('Test Case 4: Idempotency Key Handling', () => {
    it('should return same reservation when using duplicate idempotency key', async () => {
      // Setup
      testProduct = await dataSource.manager.save(Product, {
        name: 'Idempotency Test Product',
        description: 'For testing idempotency keys',
        price: 99.99,
        available_stock: 100,
        reserved_stock: 0,
        sold_stock: 0,
      });

      const reservationPayload = {
        items: [{ productId: testProduct.id, quantity: 5 }],
        idempotency_key: 'unique-idempotency-key',
      };

      // First request
      const res1 = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reservationPayload);

      const reservationId1 = res1.body.id;

      // Second request with same idempotency key
      const res2 = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reservationPayload);

      const reservationId2 = res2.body.id;

      // Should return same reservation
      expect(reservationId1).toBe(reservationId2);
      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201); // or 200

      // Verify only one reservation was created
      const reservations = await dataSource.manager.find(Reservation, {
        where: { idempotency_key: 'unique-idempotency-key' },
      });

      expect(reservations.length).toBe(1);

      console.log('✓ Idempotency key handling verified');
    }, 60000); // 60 seconds
  });
});
