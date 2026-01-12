import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
} from '../../src/reservations/entities/reservation.entity';
import { Product } from '../../src/products/entities/product.entity';
import { User, UserRole } from '../../src/users/entities/user.entity';
import { ReservationExpirationService } from '../../src/reservations/reservation-expiration.service';
import * as bcrypt from 'bcrypt';

describe('Reservation Expiration (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let expirationService: ReservationExpirationService;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    expirationService = moduleFixture.get<ReservationExpirationService>(
      ReservationExpirationService,
    );
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clear tables
    await dataSource.query('TRUNCATE TABLE reservations CASCADE');
    await dataSource.query('TRUNCATE TABLE products CASCADE');
    await dataSource.query('TRUNCATE TABLE users CASCADE');

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await dataSource.manager.save(User, {
      email: `test-${Date.now()}@example.com`,
      password: hashedPassword,
      name: 'Test User',
      role: UserRole.USER,
    });

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'password123',
      });

    authToken = loginRes.body.access_token;
  }, 60000);

  describe('Test Case 1: Reservation Expiration', () => {
    it('should expire reservation after TTL expires', async () => {
      // Create product
      const product = await dataSource.manager.save(Product, {
        name: 'Test Product',
        price: 99.99,
        available_stock: 10,
        reserved_stock: 0,
        sold_stock: 0,
      });

      console.log(`✓ Product created: ${product.id}`);

      // Create reservation with very short TTL (1 second from now)
      const expiresAt = new Date(Date.now() + 1000); // 1 second

      const reservation = await dataSource.manager.save(Reservation, {
        user_id: testUser.id,
        status: ReservationStatus.ACTIVE,
        expires_at: expiresAt,
      });

      console.log(`✓ Reservation created: ${reservation.id}, expires: ${expiresAt}`);

      // Create reservation item using TypeORM save
      const ReservationItemRepo = dataSource.getRepository('ReservationItem');
      await ReservationItemRepo.save({
        reservation_id: reservation.id,
        product_id: product.id,
        quantity: 5,
        price_snapshot: 99.99,
      });

      console.log('✓ ReservationItem created');

      // Update product stock
      await dataSource.manager.update(
        Product,
        { id: product.id },
        {
          available_stock: 5,
          reserved_stock: 5,
        },
      );

      console.log('✓ Stock updated: available=5, reserved=5');

      // Verify before expiration
      let res = await dataSource.manager.findOne(Reservation, {
        where: { id: reservation.id },
      });
      expect(res?.status).toBe(ReservationStatus.ACTIVE);

      let prod = await dataSource.manager.findOne(Product, {
        where: { id: product.id },
      });
      expect(prod?.reserved_stock).toBe(5);
      expect(prod?.available_stock).toBe(5);

      console.log('✓ Before expiration: Reservation is ACTIVE');

      // Wait for expiration time to pass
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Manually trigger expiration job (for testing)
      const result = await expirationService.manuallyExpireReservations();
      console.log(`✓ Expiration job triggered: ${result.expired} expired, ${result.failed} failed`);

      // Verify after expiration
      res = await dataSource.manager.findOne(Reservation, {
        where: { id: reservation.id },
      });
      console.log(`  Reservation status: ${res?.status}`);
      expect(res?.status).toBe(ReservationStatus.EXPIRED);

      // Verify stock restored
      prod = await dataSource.manager.findOne(Product, {
        where: { id: product.id },
      });
      console.log(`  Product stock: available=${prod?.available_stock}, reserved=${prod?.reserved_stock}`);
      expect(prod?.reserved_stock).toBe(0);
      expect(prod?.available_stock).toBe(10);

      console.log('✓ After expiration: Status = EXPIRED, Stock restored');
    }, 60000);
  });

  describe('Test Case 2: Manual Expiration Endpoint', () => {
    it('should manually expire reservation via POST /reservations/:id/expire', async () => {
      // Create admin user
      const adminPassword = await bcrypt.hash('admin123', 10);
      const adminUser = await dataSource.manager.save(User, {
        email: `admin-${Date.now()}@example.com`,
        password: adminPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
      });

      // Login as admin
      const adminLoginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminUser.email,
          password: 'admin123',
        });

      const adminToken = adminLoginRes.body.access_token;

      // Create product and reservation
      const product = await dataSource.manager.save(Product, {
        name: 'Test Product',
        price: 99.99,
        available_stock: 10,
        reserved_stock: 0,
        sold_stock: 0,
      });

      const reservation = await dataSource.manager.save(Reservation, {
        user_id: testUser.id,
        status: ReservationStatus.ACTIVE,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      const reservationItem = await dataSource.manager.save(
        dataSource.getRepository('ReservationItem').create({
          reservation_id: reservation.id,
          product_id: product.id,
          quantity: 3,
          price_snapshot: 99.99,
        }),
      );

      // Update product stock
      await dataSource.manager.update(
        Product,
        { id: product.id },
        {
          available_stock: 7,
          reserved_stock: 3,
        },
      );

      // Call manual expire endpoint
      const expireRes = await request(app.getHttpServer())
        .post(`/reservations/${reservation.id}/expire`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(expireRes.status).toBe(200);

      // Verify reservation status (can be EXPIRED or CANCELLED)
      const updatedRes = await dataSource.manager.findOne(Reservation, {
        where: { id: reservation.id },
      });
      expect([ReservationStatus.EXPIRED, ReservationStatus.CANCELLED]).toContain(updatedRes?.status);

      // Verify stock restored
      const updatedProd = await dataSource.manager.findOne(Product, {
        where: { id: product.id },
      });
      expect(updatedProd?.reserved_stock).toBe(0);
      expect(updatedProd?.available_stock).toBe(10);

      console.log('✓ Manual expiration via endpoint successful');
    }, 60000);
  });
});
