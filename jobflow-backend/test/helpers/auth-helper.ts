import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export class AuthHelper {
  constructor(private app: INestApplication) {}

  async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    return response.body.data;
  }

  async loginUser(credentials: { email: string; password: string }) {
    const response = await request(this.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(credentials)
      .expect(200);

    return response.body.data;
  }

  async registerAndLogin(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    await this.registerUser(userData);
    const loginResponse = await this.loginUser({
      email: userData.email,
      password: userData.password,
    });

    return {
      token: loginResponse.accessToken,
      user: loginResponse.user,
    };
  }

  getAuthHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async createTestUser() {
    const timestamp = Date.now();
    const userData = {
      email: `test${timestamp}@example.com`,
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'User',
    };

    return this.registerAndLogin(userData);
  }
}
