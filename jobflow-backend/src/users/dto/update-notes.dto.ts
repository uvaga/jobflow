import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotesDto {
  @ApiProperty({ description: 'Notes text', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  notes: string;
}
