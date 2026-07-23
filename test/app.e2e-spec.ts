import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/common/services/prisma.service';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserRole, OrderStatus } from '@prisma/client';

describe('Full Order Cycle E2E (auth -> order -> kitchen -> receipt)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
  const testUser = {
    email: `e2e_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    firstName: 'E2E',
    lastName: 'Tester',
  };

  let authTokens: { accessToken: string; refreshToken: string };
  let testTable: any;
  let testMenuItem: any;
  let testOrderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Setup: Create test table and menu item
    testTable = await prisma.table.create({
      data: {
        tableNumber: 999,
        capacity: 4,
        status: 'EMPTY',
      },
    });

    const testCategory = await prisma.category.create({
      data: {
        name: 'E2E Test Category',
        description: 'For E2E testing',
      },
    });

    testMenuItem = await prisma.menuItem.create({
      data: {
        name: 'E2E Test Item',
        description: 'For E2E testing',
        price: 10.99,
        categoryId: testCategory.id,
        isAvailable: true,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testTable) {
      await prisma.table.delete({ where: { id: testTable.id } });
    }
    await app.close();
  });

  describe('1. Authentication', () => {
    it('(POST /auth/register) - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('tokens');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
          authTokens = res.body.tokens;
        });
    });

    it('(POST /auth/login) - should login with registered user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tokens');
          expect(res.body).toHaveProperty('user');
          authTokens = res.body.tokens;
        });
    });

    it('(POST /auth/refresh) - should refresh access token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: authTokens.refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tokens');
          expect(res.body.tokens).toHaveProperty('accessToken');
          expect(res.body.tokens).toHaveProperty('refreshToken');
          authTokens = res.body.tokens;
        });
    });
  });

  describe('2. Order Creation', () => {
    const getAuthHeader = () => ({ Authorization: `Bearer ${authTokens.accessToken}` });

    it('(POST /orders) - should create a new order', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set(getAuthHeader())
        .send({
          tableId: testTable.id,
          items: [
            {
              menuItemId: testMenuItem.id,
              quantity: 2,
              notes: 'E2E test order',
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('status', 'PENDING');
          expect(res.body).toHaveProperty('items');
          expect(res.body.items.length).toBeGreaterThan(0);
          testOrderId = res.body.id;
        });
    });

    it('(GET /orders/:id) - should retrieve the created order', () => {
      return request(app.getHttpServer())
        .get(`/orders/${testOrderId}`)
        .set(getAuthHeader())
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testOrderId);
          expect(res.body.status).toBe('PENDING');
        });
    });
  });

  describe('3. Kitchen Status Updates', () => {
    const getAuthHeader = () => ({ Authorization: `Bearer ${authTokens.accessToken}` });

    it('(PATCH /orders/:id/status) - should update status to CONFIRMED', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${testOrderId}/status`)
        .set(getAuthHeader())
        .send({ status: 'CONFIRMED' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('CONFIRMED');
        });
    });

    it('(PATCH /orders/:id/status) - should update status to PREPARING', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${testOrderId}/status`)
        .set(getAuthHeader())
        .send({ status: 'PREPARING' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('PREPARING');
        });
    });

    it('(PATCH /orders/:id/status) - should update status to READY', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${testOrderId}/status`)
        .set(getAuthHeader())
        .send({ status: 'READY' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('READY');
        });
    });

    it('(PATCH /orders/:id/status) - should update status to SERVED', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${testOrderId}/status`)
        .set(getAuthHeader())
        .send({ status: 'SERVED' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('SERVED');
        });
    });
  });

  describe('4. Receipt Generation', () => {
    const getAuthHeader = () => ({ Authorization: `Bearer ${authTokens.accessToken}` });

    it('(POST /receipts) - should create receipt for served order', () => {
      return request(app.getHttpServer())
        .post('/receipts')
        .set(getAuthHeader())
        .send({
          orderId: testOrderId,
          paymentMethod: 'CASH',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('receiptNumber');
          expect(res.body.receiptNumber).toMatch(/^NP-\d{4}-\d{8}$/);
          expect(res.body).toHaveProperty('totalAmount');
        });
    });

    it('(GET /receipts/:id) - should retrieve the receipt', () => {
      return request(app.getHttpServer())
        .get(`/receipts`)
        .set(getAuthHeader())
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const receipt = res.body.find((r: any) => r.orderId === testOrderId);
          expect(receipt).toBeDefined();
          expect(receipt.receiptNumber).toMatch(/^NP-\d{4}-\d{8}$/);
        });
    });
  });

  describe('5. Token Revocation (Logout)', () => {
    const getAuthHeader = () => ({ Authorization: `Bearer ${authTokens.accessToken}` });

    it('(POST /auth/logout) - should invalidate tokens', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set(getAuthHeader())
        .expect(204);
    });

    it('(POST /auth/refresh) - should reject old refresh token after logout', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: authTokens.refreshToken })
        .expect(401);
    });
  });
});
