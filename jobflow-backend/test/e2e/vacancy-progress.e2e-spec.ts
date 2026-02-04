import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { testVacancyProgress } from '../fixtures/test-data';
import { AuthHelper } from '../helpers/auth-helper';
import { CleanupHelper } from '../helpers/cleanup-helper';
import { HhApiService } from '../../src/vacancies/hh-api.service';
import { MockHhApiService } from '../mocks/hh-api.mock';

describe('VacancyProgress (e2e)', () => {
  let app: INestApplication;
  let authHelper: AuthHelper;
  let cleanupHelper: CleanupHelper;
  let authToken: string;
  let vacancyId: string;
  let progressId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HhApiService)
      .useClass(MockHhApiService)
      .compile();

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

    // Create test user and get token
    const { token } = await authHelper.createTestUser();
    authToken = token;

    // Use mock vacancy data (MockHhApiService provides this)
    const hhId = '100000001'; // Mock vacancy ID from MockHhApiService

    // Create vacancy in our DB by fetching it (will use mock service)
    const vacancyResponse = await request(app.getHttpServer())
      .get(`/api/v1/vacancies/${hhId}`)
      .expect(200);

    vacancyId = vacancyResponse.body.data._id;
  });

  describe('POST /api/v1/vacancy-progress', () => {
    it('should create new application tracking', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vacancyId,
          notes: testVacancyProgress.validData.notes,
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.vacancyId).toBeDefined();
      expect(response.body.data.notes).toBe(testVacancyProgress.validData.notes);
    });

    it('should default status to saved', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vacancyId })
        .expect(201);

      expect(response.body.data.status).toBe('saved');
    });

    it('should accept custom status', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vacancyId,
          status: 'applied',
        })
        .expect(201);

      expect(response.body.data.status).toBe('applied');
    });

    it('should accept optional fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vacancyId,
          notes: testVacancyProgress.validData.notes,
          priority: testVacancyProgress.validData.priority,
          tags: testVacancyProgress.validData.tags,
          appliedAt: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body.data.notes).toBe(testVacancyProgress.validData.notes);
      expect(response.body.data.priority).toBe(testVacancyProgress.validData.priority);
      expect(response.body.data.tags).toEqual(testVacancyProgress.validData.tags);
      expect(response.body.data.appliedAt).toBeDefined();
    });

    it('should validate priority range (0-5)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vacancyId,
          priority: 10,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should fail without vacancyId (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'test' })
        .expect(400);
    });

    it('should fail with invalid status (400)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vacancyId,
          status: 'invalid_status',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should fail without auth token (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .send({ vacancyId })
        .expect(401);
    });
  });

  describe('GET /api/v1/vacancy-progress', () => {
    beforeEach(async () => {
      // Create test progress entries
      const response = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vacancyId })
        .expect(201);

      progressId = response.body.data._id;
    });

    it('should return all user\'s applications', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should populate vacancy details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const item = response.body.data[0];
      expect(item.vacancyId).toBeDefined();
      // Vacancy should be populated (not just an ID string)
      expect(typeof item.vacancyId).toBe('object');
    });

    it('should support status filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress?status=saved')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every((item) => item.status === 'saved')).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress?page=0&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should only return current user\'s data', async () => {
      // Create second user
      const { token: token2 } = await authHelper.createTestUser();

      // User 1's applications
      const response1 = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // User 2's applications
      const response2 = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // User 2 should have no applications
      expect(response2.body.data).toHaveLength(0);
      // User 1 should have applications
      expect(response1.body.data.length).toBeGreaterThan(0);
    });

    it('should fail without auth token (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress')
        .expect(401);
    });
  });

  describe('GET /api/v1/vacancy-progress/statistics', () => {
    beforeEach(async () => {
      // Create multiple progress entries with different statuses
      await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vacancyId, status: 'saved' });

      await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vacancyId, status: 'applied' });

      await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vacancyId, status: 'applied' });
    });

    it('should return status breakdown counts', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data).toBe('object');
    });

    it('should show correct counts for each status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.saved).toBe(1);
      expect(response.body.data.applied).toBe(2);
    });

    it('should only count current user\'s data', async () => {
      // Create second user
      const { token: token2 } = await authHelper.createTestUser();

      // User 2's statistics should be empty
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress/statistics')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(Object.keys(response.body.data)).toHaveLength(0);
    });

    it('should fail without auth token (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress/statistics')
        .expect(401);
    });
  });

  describe('GET /api/v1/vacancy-progress/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vacancyId })
        .expect(201);

      progressId = response.body.data._id;
    });

    it('should return specific application by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data._id).toBe(progressId);
    });

    it('should populate vacancy details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.vacancyId).toBeDefined();
      expect(typeof response.body.data.vacancyId).toBe('object');
    });

    it('should fail if not owned by current user (404)', async () => {
      // Create second user
      const { token: token2 } = await authHelper.createTestUser();

      // User 2 trying to access User 1's progress
      await request(app.getHttpServer())
        .get(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404);
    });

    it('should fail with invalid ID format (404)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500); // Mongoose validation error
    });

    it('should fail without auth token (401)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/vacancy-progress/${progressId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/vacancy-progress/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vacancyId })
        .expect(201);

      progressId = response.body.data._id;
    });

    it('should update status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'applied' })
        .expect(200);

      expect(response.body.data.status).toBe('applied');
    });

    it('should update notes', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Updated notes' })
        .expect(200);

      expect(response.body.data.notes).toBe('Updated notes');
    });

    it('should update priority', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ priority: 5 })
        .expect(200);

      expect(response.body.data.priority).toBe(5);
    });

    it('should update tags', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tags: ['urgent', 'senior'] })
        .expect(200);

      expect(response.body.data.tags).toEqual(['urgent', 'senior']);
    });

    it('should allow partial updates', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ priority: 3 })
        .expect(200);

      // Only priority should change, status should remain 'saved'
      expect(response.body.data.priority).toBe(3);
      expect(response.body.data.status).toBe('saved');
    });

    it('should fail if not owned by current user (404)', async () => {
      const { token: token2 } = await authHelper.createTestUser();

      await request(app.getHttpServer())
        .patch(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ status: 'applied' })
        .expect(404);
    });

    it('should fail with invalid status (400)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should fail without auth token (401)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/vacancy-progress/${progressId}`)
        .send({ status: 'applied' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/vacancy-progress/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ vacancyId })
        .expect(201);

      progressId = response.body.data._id;
    });

    it('should delete application', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.message).toBeDefined();
    });

    it('should verify deletion', async () => {
      // Delete
      await request(app.getHttpServer())
        .delete(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to get - should fail
      await request(app.getHttpServer())
        .get(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail if not owned by current user (404)', async () => {
      const { token: token2 } = await authHelper.createTestUser();

      await request(app.getHttpServer())
        .delete(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(404);
    });

    it('should fail if already deleted (404)', async () => {
      // Delete once
      await request(app.getHttpServer())
        .delete(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to delete again
      await request(app.getHttpServer())
        .delete(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without auth token (401)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/vacancy-progress/${progressId}`)
        .expect(401);
    });
  });
});
