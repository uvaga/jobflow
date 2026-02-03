import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VacancyProgressController } from './vacancy-progress.controller';
import { VacancyProgressService } from './vacancy-progress.service';
import {
  VacancyProgress,
  VacancyProgressSchema,
} from './schemas/vacancy-progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VacancyProgress.name, schema: VacancyProgressSchema },
    ]),
  ],
  controllers: [VacancyProgressController],
  providers: [VacancyProgressService],
  exports: [VacancyProgressService],
})
export class VacancyProgressModule {}
