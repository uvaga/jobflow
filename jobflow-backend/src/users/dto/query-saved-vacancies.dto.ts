import {
  IsOptional,
  IsString,
  IsEnum,
  IsIn,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VacancyProgressStatus } from '../../vacancy-progress/enums/vacancy-progress-status.enum';

export class QuerySavedVacanciesDto {
  @ApiPropertyOptional({ enum: VacancyProgressStatus })
  @IsOptional()
  @IsString()
  @IsEnum(VacancyProgressStatus)
  status?: string;

  @ApiPropertyOptional({ enum: ['savedDate', 'name'] })
  @IsOptional()
  @IsString()
  @IsIn(['savedDate', 'name'])
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;

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
  @Max(100)
  limit?: number;
}
