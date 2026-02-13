import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { testUsers } from '../fixtures/test-data';
import { AuthHelper } from '../helpers/auth-helper';
import { CleanupHelper } from '../helpers/cleanup-helper';
import { HhApiService } from '../../src/vacancies/hh-api.service';
import { MockHhApiService } from '../mocks/hh-api.mock';
import { Vacancy } from '../../src/vacancies/schemas/vacancy.schema';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let authHelper: AuthHelper;
  let cleanupHelper: CleanupHelper;
  let authToken: string;
  let userId: string;
  let vacancyModel: Model<Vacancy>;

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
    vacancyModel = app.get<Model<Vacancy>>(getModelToken(Vacancy.name));
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

    it('should reject unknown fields (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Updated', password: 'ShouldBeRejected1' })
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

  describe('PATCH /api/v1/users/me/password', () => {
    it('should change password successfully', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUsers.validUser.password,
          newPassword: 'NewPassword123',
        })
        .expect(200);

      expect(response.body.data.message).toBe('Password changed successfully');

      // Verify can login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: 'NewPassword123',
        })
        .expect(200);

      expect(loginResponse.body.data).toHaveProperty('accessToken');
    });

    it('should reject incorrect current password (401)', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword123',
        })
        .expect(401);
    });

    it('should reject weak new password (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUsers.validUser.password,
          newPassword: 'weak',
        })
        .expect(400);
    });

    it('should reject new password without uppercase (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUsers.validUser.password,
          newPassword: 'alllowercase1',
        })
        .expect(400);
    });

    it('should fail without auth token (401)', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .send({
          currentPassword: testUsers.validUser.password,
          newPassword: 'NewPassword123',
        })
        .expect(401);
    });

    it('should not allow login with old password after change', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUsers.validUser.password,
          newPassword: 'NewPassword123',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        })
        .expect(401);
    });
  });

  describe('Saved Vacancies Management', () => {
    const hhId = '100000001'; // Mock vacancy hh.ru ID

    describe('POST /api/v1/users/me/vacancies/:hhId', () => {
      it('should save vacancy (fetches from hh.ru and adds to user)', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.savedVacancies).toHaveLength(1);
        expect(response.body.data.savedVacancies[0]).toHaveProperty('vacancy');
        expect(response.body.data.savedVacancies[0]).toHaveProperty('progress');
        expect(response.body.data.savedVacancies[0].progress).toHaveLength(1);
        expect(response.body.data.savedVacancies[0].progress[0].status).toBe('saved');
      });

      it('should not duplicate if already saved', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.savedVacancies).toHaveLength(1);
      });

      it('should return updated user with savedVacancies', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data).toHaveProperty('savedVacancies');
        expect(response.body.data).toHaveProperty('updatedAt');
      });

      it('should fail without auth token (401)', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .expect(401);
      });
    });

    describe('GET /api/v1/users/me/vacancies', () => {
      it('should return empty list initially', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me/vacancies')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('items');
        expect(response.body.data.items).toHaveLength(0);
        expect(response.body.data.total).toBe(0);
      });

      it('should return saved vacancies with pagination', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app.getHttpServer())
          .get('/api/v1/users/me/vacancies')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.items).toHaveLength(1);
        expect(response.body.data.total).toBe(1);
        expect(response.body.data).toHaveProperty('page');
        expect(response.body.data).toHaveProperty('limit');
        expect(response.body.data).toHaveProperty('totalPages');
        // Check populated vacancy data
        const item = response.body.data.items[0];
        expect(item.vacancy).toHaveProperty('name');
        expect(item.vacancy).toHaveProperty('hhId');
        expect(item.progress).toHaveLength(1);
      });

      it('should fail without auth token (401)', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/users/me/vacancies')
          .expect(401);
      });
    });

    describe('GET /api/v1/users/me/vacancies/:hhId', () => {
      it('should return saved vacancy detail', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app.getHttpServer())
          .get(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('vacancy');
        expect(response.body.data).toHaveProperty('progress');
        expect(response.body.data.vacancy.hhId).toBe(hhId);
      });

      it('should return 404 for unsaved vacancy', async () => {
        await request(app.getHttpServer())
          .get(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('PATCH /api/v1/users/me/vacancies/:hhId/progress', () => {
      it('should update progress status', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/progress`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'applied' })
          .expect(200);

        expect(response.body.data.progress).toHaveLength(2);
        expect(response.body.data.progress[1].status).toBe('applied');
      });

      it('should fail with invalid status', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/progress`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'invalid_status' })
          .expect(400);
      });
    });

    describe('POST /api/v1/users/me/vacancies/:hhId/refresh', () => {
      it('should refresh vacancy from hh.ru', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}/refresh`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('hhId');
        expect(response.body.data.hhId).toBe(hhId);
        expect(response.body.data).toHaveProperty('updatedAt');
      });
    });

    describe('DELETE /api/v1/users/me/vacancies/:hhId', () => {
      beforeEach(async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      });

      it('should remove vacancy from saved list', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.savedVacancies).toHaveLength(0);
      });

      it('should return updated user', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data).toHaveProperty('updatedAt');
      });

      it('should be idempotent (no error if already removed)', async () => {
        await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Second delete: vacancy snapshot already deleted, user has no entry — no-op
        await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      });

      it('should delete vacancy document from vacancies collection', async () => {
        // Get the vacancy ObjectId from saved vacancies
        const detailResponse = await request(app.getHttpServer())
          .get(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const vacancyId = detailResponse.body.data.vacancy._id;

        // Delete from saved list
        await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify vacancy document is removed from collection
        const vacancy = await vacancyModel.findById(vacancyId).exec();
        expect(vacancy).toBeNull();
      });

      it('should fail without auth token (401)', async () => {
        await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${hhId}`)
          .expect(401);
      });
    });

    describe('PATCH /api/v1/users/me/vacancies/:hhId/notes', () => {
      it('should update notes for a saved vacancy', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/notes`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ notes: 'My personal notes about this vacancy' })
          .expect(200);

        expect(response.body.data.notes).toBe('My personal notes about this vacancy');
      });

      it('should allow empty notes', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/notes`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ notes: '' })
          .expect(200);

        expect(response.body.data.notes).toBe('');
      });

      it('should reject notes exceeding 2000 characters', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/notes`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ notes: 'a'.repeat(2001) })
          .expect(400);
      });

      it('should return 404 for unsaved vacancy', async () => {
        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/notes`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ notes: 'test' })
          .expect(404);
      });

      it('should fail without auth token (401)', async () => {
        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/notes`)
          .send({ notes: 'test' })
          .expect(401);
      });
    });

    describe('PATCH /api/v1/users/me/vacancies/:hhId/checklist', () => {
      it('should update checklist for a saved vacancy', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/checklist`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            checklist: [
              { text: 'Prepare resume', checked: false },
              { text: 'Write cover letter', checked: true },
            ],
          })
          .expect(200);

        expect(response.body.data.checklist).toHaveLength(2);
        expect(response.body.data.checklist[0].text).toBe('Prepare resume');
        expect(response.body.data.checklist[0].checked).toBe(false);
        expect(response.body.data.checklist[1].text).toBe('Write cover letter');
        expect(response.body.data.checklist[1].checked).toBe(true);
      });

      it('should allow empty checklist', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/checklist`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ checklist: [] })
          .expect(200);

        expect(response.body.data.checklist).toHaveLength(0);
      });

      it('should replace entire checklist array', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Set initial checklist
        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/checklist`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ checklist: [{ text: 'Item 1', checked: false }] })
          .expect(200);

        // Replace with new checklist
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/checklist`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ checklist: [{ text: 'New item', checked: true }] })
          .expect(200);

        expect(response.body.data.checklist).toHaveLength(1);
        expect(response.body.data.checklist[0].text).toBe('New item');
        expect(response.body.data.checklist[0].checked).toBe(true);
      });

      it('should reject checklist item with empty text', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/checklist`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ checklist: [{ text: '', checked: false }] })
          .expect(400);
      });

      it('should reject more than 50 checklist items', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const items = Array.from({ length: 51 }, (_, i) => ({
          text: `Item ${i + 1}`,
          checked: false,
        }));

        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/checklist`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ checklist: items })
          .expect(400);
      });

      it('should reject checklist item text exceeding 200 characters', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/checklist`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ checklist: [{ text: 'a'.repeat(201), checked: false }] })
          .expect(400);
      });

      it('should return 404 for unsaved vacancy', async () => {
        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/checklist`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ checklist: [{ text: 'test', checked: false }] })
          .expect(404);
      });

      it('should fail without auth token (401)', async () => {
        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/checklist`)
          .send({ checklist: [{ text: 'test', checked: false }] })
          .expect(401);
      });
    });

    describe('Notes and checklist in detail response', () => {
      it('should return default notes and checklist for newly saved vacancy', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app.getHttpServer())
          .get(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.notes).toBe('');
        expect(response.body.data.checklist).toEqual([]);
      });

      it('should persist notes and checklist across detail fetches', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/notes`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ notes: 'Persisted note' })
          .expect(200);

        await request(app.getHttpServer())
          .patch(`/api/v1/users/me/vacancies/${hhId}/checklist`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ checklist: [{ text: 'Persisted item', checked: true }] })
          .expect(200);

        const response = await request(app.getHttpServer())
          .get(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.notes).toBe('Persisted note');
        expect(response.body.data.checklist).toHaveLength(1);
        expect(response.body.data.checklist[0].text).toBe('Persisted item');
        expect(response.body.data.checklist[0].checked).toBe(true);
      });
    });

    describe('Per-user vacancy snapshots', () => {
      it('should create separate vacancy documents for different users', async () => {
        // User 1 saves vacancy
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // User 2 saves same vacancy
        const { token: token2 } = await authHelper.registerAndLogin(
          testUsers.anotherUser,
        );
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${token2}`)
          .expect(200);

        // Each user should have their own vacancy document
        const detail1 = await request(app.getHttpServer())
          .get(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const detail2 = await request(app.getHttpServer())
          .get(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${token2}`)
          .expect(200);

        expect(detail1.body.data.vacancy._id).not.toBe(
          detail2.body.data.vacancy._id,
        );
      });

      it('should not affect other users when removing a saved vacancy', async () => {
        // User 1 saves vacancy
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // User 2 saves same vacancy
        const { token: token2 } = await authHelper.registerAndLogin(
          testUsers.anotherUser,
        );
        await request(app.getHttpServer())
          .post(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${token2}`)
          .expect(200);

        // User 1 removes vacancy
        await request(app.getHttpServer())
          .delete(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // User 2 should still have their saved vacancy
        const detail2 = await request(app.getHttpServer())
          .get(`/api/v1/users/me/vacancies/${hhId}`)
          .set('Authorization', `Bearer ${token2}`)
          .expect(200);

        expect(detail2.body.data.vacancy.hhId).toBe(hhId);
      });
    });
  });

  describe('User Isolation', () => {
    it('should not allow user to access another user\'s profile', async () => {
      const { token: token2 } = await authHelper.registerAndLogin(
        testUsers.anotherUser,
      );

      const response1 = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response1.body.data._id).not.toBe(response2.body.data._id);
      expect(response1.body.data.email).not.toBe(response2.body.data.email);
    });
  });
});
