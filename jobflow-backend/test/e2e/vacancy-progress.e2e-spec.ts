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
});
