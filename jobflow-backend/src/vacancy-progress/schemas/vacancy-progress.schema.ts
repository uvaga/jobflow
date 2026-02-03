import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VacancyProgressStatus } from '../enums/vacancy-progress-status.enum';

export type VacancyProgressDocument = VacancyProgress & Document;

@Schema({ timestamps: true })
export class VacancyProgress extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Vacancy',
    required: true,
  })
  vacancyId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(VacancyProgressStatus),
    default: VacancyProgressStatus.SAVED,
  })
  status: VacancyProgressStatus;

  @Prop({ maxlength: 2000 })
  notes: string;

  @Prop({ type: Date })
  appliedAt?: Date;

  @Prop({ type: Date })
  interviewDate?: Date;

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  })
  priority: number;

  createdAt: Date;

  updatedAt: Date;
}

export const VacancyProgressSchema =
  SchemaFactory.createForClass(VacancyProgress);

// Create compound indexes for efficient queries
VacancyProgressSchema.index({ userId: 1, status: 1 });
VacancyProgressSchema.index({ userId: 1, createdAt: -1 });
