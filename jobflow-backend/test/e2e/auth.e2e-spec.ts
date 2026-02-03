import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { testUsers } from '../fixtures/test-data';
import { CleanupHelper } from '../helpers/cleanup-helper';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let cleanupHelper: CleanupHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1');

    await app.init();

    const connection = app.get<Connection>(getConnectionToken());
    cleanupHelper = new CleanupHelper(connection);
  });

  afterAll(async () => {
    await cleanupHelper.cleanDatabase();
    await app.close();
  });

  afterEach(async () => {
    await cleanupHelper.cleanCollection('users');
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register new user with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser)
        .expect(201);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(testUsers.validUser.email);
      expect(response.body.data.user.firstName).toBe(
        testUsers.validUser.firstName,
      );
      expect(response.body.data.user.lastName).toBe(
        testUsers.validUser.lastName,
      );
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return JWT token in correct format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser)
        .expect(201);

      const { accessToken } = response.body.data;
      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      // JWT format: header.payload.signature
      expect(accessToken.split('.')).toHaveLength(3);
    });

    it('should fail with duplicate email (409)', async () => {
      // Register first user
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser)
        .expect(201);

      // Try to register with same email
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser)
        .expect(409);

      expect(response.body.message).toContain('Email already exists');
    });

    it('should fail with weak password (400)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.weakPasswordUser)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should fail with invalid email format (400)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.invalidEmailUser)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should fail with missing required fields (400)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should not expose password in response', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser)
        .expect(201);

      expect(response.body.data.user).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toContain(
        testUsers.validUser.password,
      );
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);
    });

    it('should login with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUsers.validUser.email);
    });

    it('should return valid JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        })
        .expect(200);

      const { accessToken } = response.body.data;
      expect(accessToken).toBeDefined();
      expect(accessToken.split('.')).toHaveLength(3);
    });

    it('should fail with wrong password (401)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail with non-existent email (401)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUsers.validUser.password,
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail with missing email (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          password: testUsers.validUser.password,
        })
        .expect(400);
    });

    it('should fail with missing password (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
        })
        .expect(400);
    });
  });

  describe('JWT Token Validation', () => {
    let validToken: string;

    beforeEach(async () => {
      // Register and login to get a valid token
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      validToken = response.body.data.accessToken;
    });

    it('should accept valid JWT token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('should reject request without token (401)', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('should reject malformed token (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject token with wrong format (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'InvalidFormat ' + validToken)
        .expect(401);
    });

    it('should reject empty Bearer token (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer ')
        .expect(401);
    });
  });

  describe('Public Routes', () => {
    it('should allow access to /vacancies/search without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=1')
        .expect(200);
    });

    it('should allow access to /vacancies/dictionaries without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/vacancies/dictionaries')
        .expect(200);
    });

    it('should allow access to /auth/register without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser)
        .expect(201);
    });

    it('should allow access to /auth/login without token', async () => {
      // First register
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      // Then login without token
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        })
        .expect(200);
    });
  });
});
