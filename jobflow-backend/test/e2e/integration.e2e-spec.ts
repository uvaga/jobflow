import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { testUsers } from '../fixtures/test-data';
import { AuthHelper } from '../helpers/auth-helper';
import { CleanupHelper } from '../helpers/cleanup-helper';

describe('Integration - Full User Journey (e2e)', () => {
  let app: INestApplication;
  let authHelper: AuthHelper;
  let cleanupHelper: CleanupHelper;

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

  afterEach(async () => {
    await cleanupHelper.cleanDatabase();
  });

  describe('Complete Job Search Workflow', () => {
    it('should complete full job search and application tracking workflow', async () => {
      // 1. Register new user
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser)
        .expect(201);

      expect(registerResponse.body.data).toHaveProperty('accessToken');
      expect(registerResponse.body.data).toHaveProperty('user');

      const { accessToken, user } = registerResponse.body.data;

      // 2. Verify user can access protected route
      const profileResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.data.email).toBe(testUsers.validUser.email);

      // 3. Search for vacancies from hh.ru
      const searchResponse = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=JavaScript&per_page=3')
        .expect(200);

      expect(searchResponse.body.data.items).toHaveLength(3);
      const firstVacancy = searchResponse.body.data.items[0];

      // 4. Get details of a specific vacancy
      const vacancyResponse = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${firstVacancy.id}`)
        .expect(200);

      expect(vacancyResponse.body.data).toHaveProperty('_id');
      expect(vacancyResponse.body.data).toHaveProperty('description');
      const vacancyMongoId = vacancyResponse.body.data._id;

      // 5. Save vacancy to favorites
      const saveResponse = await request(app.getHttpServer())
        .post(`/api/v1/users/me/vacancies/${vacancyMongoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(saveResponse.body.data.savedVacancies).toContain(vacancyMongoId);

      // 6. Verify saved vacancies list
      const savedVacanciesResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me/vacancies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(savedVacanciesResponse.body.data.length).toBe(1);

      // 7. Create application tracking
      const createProgressResponse = await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          vacancyId: vacancyMongoId,
          status: 'saved',
          notes: 'Interesting position, need to prepare resume',
          priority: 4,
          tags: ['frontend', 'urgent'],
        })
        .expect(201);

      expect(createProgressResponse.body.data).toHaveProperty('_id');
      expect(createProgressResponse.body.data.status).toBe('saved');
      const progressId = createProgressResponse.body.data._id;

      // 8. Update application status to 'applied'
      const updateToAppliedResponse = await request(app.getHttpServer())
        .patch(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'applied',
          appliedAt: new Date().toISOString(),
          notes: 'Submitted application via hh.ru',
        })
        .expect(200);

      expect(updateToAppliedResponse.body.data.status).toBe('applied');
      expect(updateToAppliedResponse.body.data.appliedAt).toBeDefined();

      // 9. Add interview notes
      const updateWithInterviewResponse = await request(app.getHttpServer())
        .patch(`/api/v1/vacancy-progress/${progressId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'interview_scheduled',
          interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          notes: 'Interview scheduled for next week. Prepare for technical questions.',
        })
        .expect(200);

      expect(updateWithInterviewResponse.body.data.status).toBe('interview_scheduled');
      expect(updateWithInterviewResponse.body.data.interviewDate).toBeDefined();

      // 10. Get statistics showing progress
      const statsResponse = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress/statistics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(statsResponse.body.data.interview_scheduled).toBe(1);

      // 11. Get all applications
      const allProgressResponse = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(allProgressResponse.body.data.length).toBeGreaterThan(0);

      // 12. Update profile information
      const updateProfileResponse = await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'UpdatedName',
        })
        .expect(200);

      expect(updateProfileResponse.body.data.firstName).toBe('UpdatedName');

      // 13. Verify complete state
      const finalProfileResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(finalProfileResponse.body.data.savedVacancies).toHaveLength(1);
      expect(finalProfileResponse.body.data.firstName).toBe('UpdatedName');
    });
  });

  describe('Multiple Users - Data Isolation', () => {
    it('should handle concurrent users independently', async () => {
      // Create User 1
      const user1 = await authHelper.registerAndLogin(testUsers.validUser);

      // Create User 2
      const user2 = await authHelper.registerAndLogin(testUsers.anotherUser);

      // Get a vacancy for testing
      const searchResponse = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=2')
        .expect(200);

      const vacancy1Id = searchResponse.body.data.items[0].id;
      const vacancy2Id = searchResponse.body.data.items[1].id;

      // Get vacancy details (creates in DB)
      const v1Response = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${vacancy1Id}`)
        .expect(200);
      const v1MongoId = v1Response.body.data._id;

      const v2Response = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${vacancy2Id}`)
        .expect(200);
      const v2MongoId = v2Response.body.data._id;

      // User 1 saves vacancy 1
      await request(app.getHttpServer())
        .post(`/api/v1/users/me/vacancies/${v1MongoId}`)
        .set('Authorization', `Bearer ${user1.token}`)
        .expect(200);

      // User 2 saves vacancy 2
      await request(app.getHttpServer())
        .post(`/api/v1/users/me/vacancies/${v2MongoId}`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(200);

      // User 1 creates application
      await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          vacancyId: v1MongoId,
          status: 'applied',
        })
        .expect(201);

      // User 2 creates different application
      await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${user2.token}`)
        .send({
          vacancyId: v2MongoId,
          status: 'saved',
        })
        .expect(201);

      // Verify User 1's data
      const user1Saved = await request(app.getHttpServer())
        .get('/api/v1/users/me/vacancies')
        .set('Authorization', `Bearer ${user1.token}`)
        .expect(200);

      expect(user1Saved.body.data.length).toBe(1);

      const user1Progress = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${user1.token}`)
        .expect(200);

      expect(user1Progress.body.data.length).toBe(1);
      expect(user1Progress.body.data[0].status).toBe('applied');

      // Verify User 2's data
      const user2Saved = await request(app.getHttpServer())
        .get('/api/v1/users/me/vacancies')
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(200);

      expect(user2Saved.body.data.length).toBe(1);

      const user2Progress = await request(app.getHttpServer())
        .get('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(200);

      expect(user2Progress.body.data.length).toBe(1);
      expect(user2Progress.body.data[0].status).toBe('saved');

      // Verify no data leakage
      expect(user1Saved.body.data[0]._id).not.toBe(user2Saved.body.data[0]._id);
    });
  });

  describe('Login and Resume Session', () => {
    it('should allow user to logout and login again', async () => {
      // Register
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUsers.validUser)
        .expect(201);

      // Login first time
      const login1Response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        })
        .expect(200);

      const token1 = login1Response.body.data.accessToken;

      // Create some data
      const searchResponse = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=1')
        .expect(200);

      const hhId = searchResponse.body.data.items[0].id;

      const vacancyResponse = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${hhId}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/users/me/vacancies/${vacancyResponse.body.data._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      // "Logout" by discarding token

      // Login again
      const login2Response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        })
        .expect(200);

      const token2 = login2Response.body.data.accessToken;

      // Verify data persists
      const savedVacanciesResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me/vacancies')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(savedVacanciesResponse.body.data.length).toBe(1);
    });
  });

  describe('Error Recovery', () => {
    it('should handle errors gracefully and allow recovery', async () => {
      const { token } = await authHelper.registerAndLogin(testUsers.validUser);

      // Try to create progress with invalid data
      await request(app.getHttpServer())
        .post('/api/v1/vacancy-progress')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vacancyId: 'invalid-id',
        })
        .expect(500); // Mongoose validation error

      // User should still be able to continue
      const profileResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.data).toBeDefined();
    });
  });

  describe('Performance - Caching', () => {
    it('should benefit from vacancy caching on repeated access', async () => {
      const { token } = await authHelper.registerAndLogin(testUsers.validUser);

      const searchResponse = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=1')
        .expect(200);

      const hhId = searchResponse.body.data.items[0].id;

      // First access - fetches from hh.ru and caches
      const start1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${hhId}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      const mongoId = response1.body.data._id;

      // Second access - should be from cache
      const start2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${hhId}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      // Cached request should be faster
      expect(duration2).toBeLessThan(duration1);

      // Should return same MongoDB document
      expect(response2.body.data._id).toBe(mongoId);
    });
  });
});
