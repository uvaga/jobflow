import { PartialType } from '@nestjs/swagger';
import { CreateVacancyProgressDto } from './create-vacancy-progress.dto';

export class UpdateVacancyProgressDto extends PartialType(
  CreateVacancyProgressDto,
) {}
