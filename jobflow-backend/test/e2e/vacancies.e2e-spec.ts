import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { testVacancies } from '../fixtures/test-data';
import { CleanupHelper } from '../helpers/cleanup-helper';

describe('Vacancies (e2e)', () => {
  let app: INestApplication;
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
    cleanupHelper = new CleanupHelper(connection);
  });

  afterAll(async () => {
    await cleanupHelper.cleanDatabase();
    await app.close();
  });

  afterEach(async () => {
    await cleanupHelper.cleanCollection('vacancies');
  });

  describe('GET /api/v1/vacancies/search', () => {
    it('should return vacancies from hh.ru API', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=2')
        .expect(200);

      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data).toHaveProperty('found');
      expect(response.body.data).toHaveProperty('pages');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('per_page');
    });

    it('should support text search parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=JavaScript&per_page=1')
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&page=0&per_page=5')
        .expect(200);

      expect(response.body.data.per_page).toBe(5);
      expect(response.body.data.page).toBe(0);
      expect(response.body.data.items.length).toBeLessThanOrEqual(5);
    });

    it('should support area filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&area=1&per_page=1')
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
    });

    it('should return items with required fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=1')
        .expect(200);

      const item = response.body.data.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('area');
      expect(item).toHaveProperty('employer');
      expect(item).toHaveProperty('url');
    });

    it('should filter out undefined parameters', async () => {
      // Should not fail even with missing optional parameters
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer')
        .expect(200);

      expect(response.body.data).toHaveProperty('items');
    });

    it('should be publicly accessible (no auth required)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=1')
        .expect(200);
    });

    it('should handle per_page validation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=150')
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should handle page validation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&page=-1')
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/v1/vacancies/dictionaries', () => {
    it('should return hh.ru dictionaries', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/dictionaries')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data).toBe('object');
    });

    it('should be publicly accessible', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/vacancies/dictionaries')
        .expect(200);
    });

    it('should be fast (cached by hh.ru)', async () => {
      const start = Date.now();
      await request(app.getHttpServer())
        .get('/api/v1/vacancies/dictionaries')
        .expect(200);
      const duration = Date.now() - start;

      // Should be fast (under 5 seconds for network request)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('GET /api/v1/vacancies/:id', () => {
    it('should return vacancy by hhId from hh.ru API', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('hhId');
      expect(response.body.data.hhId).toBe(testVacancies.validVacancyId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('description');
    });

    it('should cache vacancy in MongoDB', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);

      // Should have MongoDB fields
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
      expect(response.body.data).toHaveProperty('cacheExpiresAt');
    });

    it('should set cacheExpiresAt to 7 days from now', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);

      const cacheExpires = new Date(response.body.data.cacheExpiresAt);
      const now = new Date();
      const diffDays = (cacheExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      // Should be approximately 7 days (allow small variance)
      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });

    it('should return cached data on second request', async () => {
      // First request - creates cache
      const response1 = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);

      const mongoId1 = response1.body.data._id;

      // Second request - should return cached data
      const response2 = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);

      const mongoId2 = response2.body.data._id;

      // Should be same MongoDB document (cached)
      expect(mongoId1).toBe(mongoId2);
    });

    it('should include full description', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('description');
      expect(typeof response.body.data.description).toBe('string');
    });

    it('should include employer details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('employer');
      expect(response.body.data.employer).toHaveProperty('name');
    });

    it('should be publicly accessible', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);
    });
  });

  describe('Caching Behavior', () => {
    it('should create MongoDB document with hhId', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);

      // Verify in database (through API)
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('hhId');
      expect(response.body.data.hhId).toBe(testVacancies.validVacancyId);
    });

    it('should use cached data when available and not expired', async () => {
      // First request
      const start1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      // Second request (should be from cache, faster)
      const start2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.validVacancyId}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      // Cached request should be significantly faster
      expect(duration2).toBeLessThan(duration1);

      // Should return same data
      expect(response1.body.data.hhId).toBe(response2.body.data.hhId);
    });
  });

  describe('hh.ru API Integration', () => {
    it('should handle hh.ru API with correct User-Agent', async () => {
      // If this passes, User-Agent is configured correctly
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=1')
        .expect(200);

      expect(response.body.data.items).toBeDefined();
    });

    it('should return proper error for invalid vacancy ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vacancies/${testVacancies.invalidVacancyId}`)
        .expect(404);

      expect(response.body.statusCode).toBe(404);
    });

    it('should handle network requests gracefully', async () => {
      // Should not timeout within reasonable time
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&per_page=1')
        .timeout(10000)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('Search Query Parameters', () => {
    it('should support experience filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&experience=noExperience&per_page=1')
        .expect(200);

      expect(response.body.data.items).toBeDefined();
    });

    it('should support employment filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&employment=full&per_page=1')
        .expect(200);

      expect(response.body.data.items).toBeDefined();
    });

    it('should support schedule filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&schedule=remote&per_page=1')
        .expect(200);

      expect(response.body.data.items).toBeDefined();
    });

    it('should support salary filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&salary=50000&per_page=1')
        .expect(200);

      expect(response.body.data.items).toBeDefined();
    });

    it('should support only_with_salary filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&only_with_salary=true&per_page=1')
        .expect(200);

      expect(response.body.data.items).toBeDefined();
    });

    it('should support order_by parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vacancies/search?text=developer&order_by=salary_desc&per_page=1')
        .expect(200);

      expect(response.body.data.items).toBeDefined();
    });
  });
});
