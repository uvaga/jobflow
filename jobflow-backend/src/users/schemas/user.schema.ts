import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VacancyProgressStatus } from '../../vacancy-progress/enums/vacancy-progress-status.enum';

export type UserDocument = User & Document;

@Schema({ _id: false })
export class ProgressEntry {
  @Prop({
    type: String,
    enum: Object.values(VacancyProgressStatus),
    required: true,
  })
  status: string;

  @Prop({ type: Date, required: true })
  statusSetDate: Date;
}

export const ProgressEntrySchema =
  SchemaFactory.createForClass(ProgressEntry);

@Schema({ _id: false })
export class ChecklistItem {
  @Prop({ type: String, required: true })
  text: string;

  @Prop({ type: Boolean, default: false })
  checked: boolean;
}

export const ChecklistItemSchema =
  SchemaFactory.createForClass(ChecklistItem);

@Schema({ _id: false })
export class SavedVacancyEntry {
  @Prop({ type: Types.ObjectId, ref: 'Vacancy', required: true })
  vacancy: Types.ObjectId;

  @Prop({ type: [ProgressEntrySchema], default: [] })
  progress: ProgressEntry[];

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: [ChecklistItemSchema], default: [] })
  checklist: ChecklistItem[];
}

export const SavedVacancyEntrySchema =
  SchemaFactory.createForClass(SavedVacancyEntry);

@Schema({ timestamps: true })
export class User extends Document {
  declare _id: Types.ObjectId;
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false,
  })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({
    type: [SavedVacancyEntrySchema],
    default: [],
  })
  savedVacancies: SavedVacancyEntry[];

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
