import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDate,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VacancyProgressStatus } from '../enums/vacancy-progress-status.enum';

export class CreateVacancyProgressDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vacancyId: string;

  @ApiPropertyOptional({ enum: VacancyProgressStatus })
  @IsOptional()
  @IsString()
  status?: VacancyProgressStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  appliedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  interviewDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  priority?: number;
}
