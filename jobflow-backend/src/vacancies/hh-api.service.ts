import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { SearchVacanciesDto } from './dto/search-vacancies.dto';

@Injectable()
export class HhApiService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(HhApiService.name);
  private readonly userAgent: string;
  private readonly locale: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = 'https://api.hh.ru';
    this.userAgent = this.configService.get<string>(
      'HH_USER_AGENT',
      'JobFlow/1.0 (contact@example.com)',
    );
    this.locale = this.configService.get<string>('HH_API_LOCALE', 'EN');
  }

  async searchVacancies(params: SearchVacanciesDto): Promise<any> {
    return this.makeRequest('/vacancies', params);
  }

  async getVacancyById(id: string): Promise<any> {
    return this.makeRequest(`/vacancies/${id}`);
  }

  async getDictionaries(): Promise<any> {
    return this.makeRequest('/dictionaries');
  }

  async getAreas(): Promise<any> {
    return this.makeRequest('/areas');
  }

  private async makeRequest<T>(endpoint: string, params?: any): Promise<T> {
    try {
      // Filter out undefined/null values to avoid hh.ru API errors
      const cleanParams = params
        ? Object.fromEntries(
            Object.entries(params).filter(
              ([_, value]) => value !== undefined && value !== null,
            ),
          )
        : undefined;

      const paramsWithLocale = {
        ...(cleanParams || {}),
        locale: this.locale,
      };

      this.logger.debug(`Request to ${this.baseUrl}${endpoint} with params:`, paramsWithLocale);

      const response = await firstValueFrom(
        this.httpService
          .get(`${this.baseUrl}${endpoint}`, {
            params: paramsWithLocale,
            headers: {
              'User-Agent': this.userAgent,
              'HH-User-Agent': this.userAgent,
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(`HH API Error: ${error.message}`);
              this.logger.error(`Response data:`, error.response?.data);
              this.logger.error(`Response status:`, error.response?.status);
              throw new HttpException(
                error.response?.data || 'Failed to fetch data from hh.ru',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Request to ${endpoint} failed`, error);
      throw error;
    }
  }
}
