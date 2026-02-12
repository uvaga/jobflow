import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VacancyProgressStatus } from '../../vacancy-progress/enums/vacancy-progress-status.enum';

export class UpdateProgressDto {
  @ApiProperty({ enum: VacancyProgressStatus })
  @IsString()
  @IsEnum(VacancyProgressStatus)
  status: string;
}
