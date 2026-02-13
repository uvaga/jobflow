import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { VacanciesController } from './vacancies.controller';
import { VacanciesService } from './vacancies.service';
import { HhApiService } from './hh-api.service';
import { Vacancy, VacancySchema } from './schemas/vacancy.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vacancy.name, schema: VacancySchema }]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [VacanciesController],
  providers: [VacanciesService, HhApiService],
  exports: [VacanciesService, HhApiService],
})
export class VacanciesModule {}
