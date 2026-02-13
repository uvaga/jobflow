import { Injectable } from '@nestjs/common';
import { HhApiService } from '../vacancies/hh-api.service';

@Injectable()
export class EmployersService {
  constructor(private readonly hhApiService: HhApiService) {}

  async getEmployerById(id: string) {
    return this.hhApiService.getEmployerById(id);
  }
}
