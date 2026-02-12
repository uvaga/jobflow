import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { testUsers } from '../fixtures/test-data';
import { AuthHelper } from '../helpers/auth-helper';
import { CleanupHelper } from '../helpers/cleanup-helper';
import { HhApiService } from '../../src/vacancies/hh-api.service';
import { MockHhApiService } from '../mocks/hh-api.mock';

describe('Integration - Full User Journey (e2e)', () => {
  let app: INestApplication;
  let authHelper: AuthHelper;
  let cleanupHelper: CleanupHelper;

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

  beforeEach(async () => {
    await cleanupHelper.cleanDatabase();
  });

  afterAll(async () => {
    await cleanupHelper.cleanDatabase();
    await app.close();
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
      const hhId = firstVacancy.id;

      // 5. Save vacancy (fetches from hh.ru and stores permanently)
      const saveResponse = await request(app.getHttpServer())
        .post(`/api/v1/users/me/vacancies/${hhId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(saveResponse.body.data.savedVacancies).toHaveLength(1);
      expect(saveResponse.body.data.savedVacancies[0]).toHaveProperty('vacancy');
      expect(saveResponse.body.data.savedVacancies[0]).toHaveProperty('progress');
      expect(saveResponse.body.data.savedVacancies[0].progress[0].status).toBe('saved');

      // 6. Verify saved vacancies list (paginated)
      const savedVacanciesResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me/vacancies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(savedVacanciesResponse.body.data.items).toHaveLength(1);
      expect(savedVacanciesResponse.body.data.total).toBe(1);

      // 7. Update progress status to 'applied'
      const updateProgressResponse = await request(app.getHttpServer())
        .patch(`/api/v1/users/me/vacancies/${hhId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'applied' })
        .expect(200);

      expect(updateProgressResponse.body.data.progress).toHaveLength(2);
      expect(updateProgressResponse.body.data.progress[1].status).toBe('applied');

      // 8. Update progress status to 'interview_scheduled'
      const updateInterviewResponse = await request(app.getHttpServer())
        .patch(`/api/v1/users/me/vacancies/${hhId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'interview_scheduled' })
        .expect(200);

      expect(updateInterviewResponse.body.data.progress).toHaveLength(3);
      expect(updateInterviewResponse.body.data.progress[2].status).toBe('interview_scheduled');

      // 9. Get saved vacancy detail
      const detailResponse = await request(app.getHttpServer())
        .get(`/api/v1/users/me/vacancies/${hhId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(detailResponse.body.data).toHaveProperty('vacancy');
      expect(detailResponse.body.data).toHaveProperty('progress');
      expect(detailResponse.body.data.vacancy.hhId).toBe(hhId);

      // 10. Refresh vacancy from hh.ru
      const refreshResponse = await request(app.getHttpServer())
        .post(`/api/v1/users/me/vacancies/${hhId}/refresh`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(refreshResponse.body.data).toHaveProperty('hhId');
      expect(refreshResponse.body.data.hhId).toBe(hhId);

      // 11. Filter saved vacancies by status
      const filteredResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me/vacancies?status=interview_scheduled')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(filteredResponse.body.data.items).toHaveLength(1);

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
      expect(finalProfileResponse.body.data.savedVacancies[0]).toHaveProperty('vacancy');
      expect(finalProfileResponse.body.data.savedVacancies[0]).toHaveProperty('progress');
      expect(finalProfileResponse.body.data.firstName).toBe('UpdatedName');
    });
  });

  describe('Multiple Users - Data Isolation', () => {
    it('should handle concurrent users independently', async () => {
      // Create User 1
      const user1 = await authHelper.registerAndLogin(testUsers.validUser);

      // Create User 2
      const user2 = await authHelper.registerAndLogin(testUsers.anotherUser);

      // Get vacancies for testing
      const searchResponse = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=2')
        .expect(200);

      const hhId1 = searchResponse.body.data.items[0].id;
      const hhId2 = searchResponse.body.data.items[1].id;

      // User 1 saves vacancy 1 (fetches from hh.ru and stores)
      await request(app.getHttpServer())
        .post(`/api/v1/users/me/vacancies/${hhId1}`)
        .set('Authorization', `Bearer ${user1.token}`)
        .expect(200);

      // User 2 saves vacancy 2
      await request(app.getHttpServer())
        .post(`/api/v1/users/me/vacancies/${hhId2}`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(200);

      // User 1 updates progress to 'applied'
      await request(app.getHttpServer())
        .patch(`/api/v1/users/me/vacancies/${hhId1}/progress`)
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ status: 'applied' })
        .expect(200);

      // Verify User 1's data
      const user1Saved = await request(app.getHttpServer())
        .get('/api/v1/users/me/vacancies')
        .set('Authorization', `Bearer ${user1.token}`)
        .expect(200);

      expect(user1Saved.body.data.items).toHaveLength(1);
      // User 1 should have 2 progress entries (saved + applied)
      expect(user1Saved.body.data.items[0].progress).toHaveLength(2);
      expect(user1Saved.body.data.items[0].progress[1].status).toBe('applied');

      // Verify User 2's data
      const user2Saved = await request(app.getHttpServer())
        .get('/api/v1/users/me/vacancies')
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(200);

      expect(user2Saved.body.data.items).toHaveLength(1);
      // User 2 should only have 1 progress entry (saved)
      expect(user2Saved.body.data.items[0].progress).toHaveLength(1);
      expect(user2Saved.body.data.items[0].progress[0].status).toBe('saved');

      // Verify data isolation - different vacancies
      const user1VacancyHhId = user1Saved.body.data.items[0].vacancy.hhId;
      const user2VacancyHhId = user2Saved.body.data.items[0].vacancy.hhId;
      expect(user1VacancyHhId).not.toBe(user2VacancyHhId);
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

      // Create some data - save a vacancy
      const searchResponse = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=1')
        .expect(200);

      const hhId = searchResponse.body.data.items[0].id;

      await request(app.getHttpServer())
        .post(`/api/v1/users/me/vacancies/${hhId}`)
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

      expect(savedVacanciesResponse.body.data.items).toHaveLength(1);
      expect(savedVacanciesResponse.body.data.items[0]).toHaveProperty('vacancy');
      expect(savedVacanciesResponse.body.data.items[0]).toHaveProperty('progress');
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
