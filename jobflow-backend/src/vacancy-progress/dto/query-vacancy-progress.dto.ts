import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VacancyProgressStatus } from '../enums/vacancy-progress-status.enum';

export class QueryVacancyProgressDto {
  @ApiPropertyOptional({ enum: VacancyProgressStatus })
  @IsOptional()
  @IsString()
  status?: VacancyProgressStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
