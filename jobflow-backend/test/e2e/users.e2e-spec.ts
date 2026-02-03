import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { testUsers } from '../fixtures/test-data';
import { AuthHelper } from '../helpers/auth-helper';
import { CleanupHelper } from '../helpers/cleanup-helper';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let authHelper: AuthHelper;
  let cleanupHelper: CleanupHelper;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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
    authHelper = new AuthHelper(app);
    cleanupHelper = new CleanupHelper(connection);
  });

  afterAll(async () => {
    await cleanupHelper.cleanDatabase();
    await app.close();
  });

  beforeEach(async () => {
    await cleanupHelper.cleanDatabase();
    // Create a test user and get token for each test
    const { token, user } = await authHelper.registerAndLogin(
      testUsers.validUser,
    );
    authToken = token;
    userId = user.id;
  });

  describe('GET /api/v1/users/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.email).toBe(testUsers.validUser.email);
      expect(response.body.data.firstName).toBe(testUsers.validUser.firstName);
      expect(response.body.data.lastName).toBe(testUsers.validUser.lastName);
    });

    it('should exclude password field from response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should include savedVacancies array', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('savedVacancies');
      expect(Array.isArray(response.body.data.savedVacancies)).toBe(true);
    });

    it('should include timestamps', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should fail without auth token (401)', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('should fail with invalid token (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('PUT /api/v1/users/me', () => {
    it('should update user firstName', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe(testUsers.validUser.lastName);
    });

    it('should update user lastName', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ lastName: 'NewLastName' })
        .expect(200);

      expect(response.body.data.lastName).toBe('NewLastName');
      expect(response.body.data.firstName).toBe(testUsers.validUser.firstName);
    });

    it('should update both firstName and lastName', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'New', lastName: 'Name' })
        .expect(200);

      expect(response.body.data.firstName).toBe('New');
      expect(response.body.data.lastName).toBe('Name');
    });

    it('should update password and hash it', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'NewPassword123' })
        .expect(200);

      // Try to login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: 'NewPassword123',
        })
        .expect(200);

      expect(loginResponse.body.data).toHaveProperty('accessToken');
    });

    it('should fail with weak password (400)', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'weak' })
        .expect(400);
    });

    it('should fail without auth token (401)', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .send({ firstName: 'Updated' })
        .expect(401);
    });

    it('should not update email (if email is not in DTO)', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(response.body.data.email).toBe(testUsers.validUser.email);
    });
  });

  describe('Saved Vacancies Management', () => {
    let vacancyId: string;

    beforeEach(async () => {
      // Get a real vacancy from hh.ru to use for testing
      const searchResponse = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=1')
        .expect(200);

      const hhId = searchResponse.body.data.items[0].id;

      // Get the vacancy details which creates it in our DB
      const vacancyResponse = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${hhId}`)
        .expect(200);

      vacancyId = vacancyResponse.body.data._id;
    });

    describe('POST /api/v1/users/me/vacancies/:vacancyId', () => {
      it('should add vacancy to saved list', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${vacancyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.savedVacancies).toContain(vacancyId);
      });

      it('should not duplicate if already saved', async () => {
        // Add first time
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${vacancyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Add second time
        const response = await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${vacancyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const count = response.body.data.savedVacancies.filter(
          (id) => id === vacancyId,
        ).length;
        expect(count).toBe(1);
      });

      it('should return updated user with savedVacancies', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${vacancyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data).toHaveProperty('savedVacancies');
        expect(response.body.data).toHaveProperty('updatedAt');
      });

      it('should fail without auth token (401)', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${vacancyId}`)
          .expect(401);
      });
    });

    describe('GET /api/v1/users/me/vacancies', () => {
      it('should return empty array initially', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me/vacancies')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toEqual([]);
      });

      it('should return saved vacancies', async () => {
        // Save a vacancy first
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${vacancyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Get saved vacancies
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me/vacancies')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should fail without auth token (401)', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/users/me/vacancies')
          .expect(401);
      });
    });

    describe('DELETE /api/v1/users/me/vacancies/:vacancyId', () => {
      beforeEach(async () => {
        // Save a vacancy before deletion tests
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${vacancyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      });

      it('should remove vacancy from saved list', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${vacancyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.savedVacancies).not.toContain(vacancyId);
      });

      it('should return updated user', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${vacancyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data).toHaveProperty('updatedAt');
      });

      it('should be idempotent (no error if already removed)', async () => {
        // Remove first time
        await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${vacancyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Remove second time
        await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${vacancyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      });

      it('should fail without auth token (401)', async () => {
        await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${vacancyId}`)
          .expect(401);
      });
    });
  });

  describe('User Isolation', () => {
    it('should not allow user to access another user\'s profile', async () => {
      // Create second user
      const { token: token2 } = await authHelper.registerAndLogin(
        testUsers.anotherUser,
      );

      // First user's profile
      const response1 = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Second user's profile
      const response2 = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // Should be different users
      expect(response1.body.data._id).not.toBe(response2.body.data._id);
      expect(response1.body.data.email).not.toBe(response2.body.data.email);
    });
  });
});
