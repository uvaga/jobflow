import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ChecklistItemDto {
  @ApiProperty({ description: 'Checklist item text', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  text: string;

  @ApiProperty({ description: 'Whether the item is checked' })
  @IsBoolean()
  checked: boolean;
}

export class UpdateChecklistDto {
  @ApiProperty({ type: [ChecklistItemDto], maxItems: 50 })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist: ChecklistItemDto[];
}
