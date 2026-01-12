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
  }, 120000);

  afterAll(async () => {
    try {
      if (dataSource && dataSource.isInitialized) {
        await dataSource.query('TRUNCATE TABLE reservations CASCADE');
        await dataSource.query('TRUNCATE TABLE products CASCADE');
        await dataSource.query('TRUNCATE TABLE users CASCADE');
      }

      if (app) {
        await app.close();
      }

      if (dataSource && dataSource.isInitialized) {
        await dataSource.destroy();
      }
    } catch (error) {
      console.error('Error in afterAll cleanup:', error);
    }
  }, 120000);

  beforeEach(async () => {
    try {
      await dataSource
        .createQueryBuilder()
        .delete()
        .from(Reservation)
        .execute();
      await dataSource.createQueryBuilder().delete().from(Product).execute();
      await dataSource.createQueryBuilder().delete().from(User).execute();

      const hashedPassword = await bcrypt.hash('password123', 10);

      testUser = await dataSource.manager.save(User, {
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        password: hashedPassword,
        name: 'Test User',
        role: UserRole.USER,
      });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'password123',
        });

      authToken = loginRes.body.access_token;
    } catch (error) {
      console.error('Error in beforeEach setup:', error);
      throw error;
    }
  }, 60000);

  describe('Test Case 1: No Oversell with Concurrent Requests', () => {
    it('should not oversell when 10 users reserve 1 item each from stock of 5', async () => {
      testProduct = await dataSource.manager.save(Product, {
        name: 'Limited Stock Product',
        description: 'Product with limited stock',
        price: 99.99,
        available_stock: 5,
        reserved_stock: 0,
        sold_stock: 0,
      });

      const productId = testProduct.id;

      const promises = Array.from({ length: 10 }, (_, index) => {
        return request(app.getHttpServer())
          .post('/reservations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            items: [{ productId, quantity: 1 }],
            idempotency_key: `key-${Date.now()}-${Math.random()}-${index}`,
          })
          .timeout(10000);
      });

      const results = await Promise.all(
        promises.map((p) =>
          p.catch((err) => ({ status: 'error', error: err })),
        ),
      );

      const successful = results.filter(
        (r) => r.status === 201 || r.status === 200,
      ).length;
      const failed = results.filter(
        (r) => r.status === 400 || r.status === 409,
      ).length;

      console.log(`✓ Successful reservations: ${successful}`);
      console.log(`✗ Failed reservations: ${failed}`);

      // Verify: Exactly 5 should succeed (stock = 5)
      expect(successful).toBe(5);
      expect(failed).toBe(5);

      const updatedProduct = await dataSource.manager.findOne(Product, {
        where: { id: productId },
      });

      expect(updatedProduct?.available_stock).toBe(0);
      expect(updatedProduct?.reserved_stock).toBe(5);

      console.log('✓ Database state verified: No oversell detected');
    }, 60000);
  });

  describe('Test Case 2: Idempotency Key Handling', () => {
    it('should return same reservation when using duplicate idempotency key', async () => {
      testProduct = await dataSource.manager.save(Product, {
        name: 'Idempotency Test Product',
        description: 'For testing idempotency keys',
        price: 99.99,
        available_stock: 100,
        reserved_stock: 0,
        sold_stock: 0,
      });

      const idempotencyKey = `unique-idempotency-key-${Date.now()}`;
      const reservationPayload = {
        items: [{ productId: testProduct.id, quantity: 5 }],
        idempotency_key: idempotencyKey,
      };

      // First request
      const res1 = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reservationPayload)
        .timeout(10000);

      expect(res1.status).toBe(201);
      const reservationId1 = res1.body.id;

      // Second request with same idempotency key
      const res2 = await request(app.getHttpServer())
        .post('/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reservationPayload)
        .timeout(10000);

      const reservationId2 = res2.body.id;

      // Should return same reservation
      expect(reservationId1).toBe(reservationId2);
      expect([200, 201]).toContain(res2.status);

      // Verify only one reservation was created
      const reservations = await dataSource.manager.find(Reservation, {
        where: { idempotency_key: idempotencyKey },
      });

      expect(reservations.length).toBe(1);

      console.log('✓ Idempotency key handling verified');
    }, 60000);
  });
});
