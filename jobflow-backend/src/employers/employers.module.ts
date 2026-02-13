import { Module } from '@nestjs/common';
import { EmployersController } from './employers.controller';
import { EmployersService } from './employers.service';
import { VacanciesModule } from '../vacancies/vacancies.module';

@Module({
  imports: [VacanciesModule],
  controllers: [EmployersController],
  providers: [EmployersService],
})
export class EmployersModule {}
