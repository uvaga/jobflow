import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VacancyDocument = Vacancy & Document;

@Schema({ timestamps: true })
export class Vacancy extends Document {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  hhId: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: Object,
    required: true,
  })
  employer: {
    id: string;
    name: string;
    url?: string;
    logoUrls?: Record<string, string>;
    trusted: boolean;
  };

  @Prop({
    type: Object,
    required: false,
  })
  salary?: {
    from?: number;
    to?: number;
    currency: string;
    gross?: boolean;
  };

  @Prop({
    type: Object,
    required: true,
  })
  area: {
    id: string;
    name: string;
    url: string;
  };

  @Prop({ required: true })
  url: string;

  @Prop()
  description: string;

  @Prop({ type: Object })
  schedule?: {
    id: string;
    name: string;
  };

  @Prop({ type: Object })
  experience?: {
    id: string;
    name: string;
  };

  @Prop({ type: Object })
  employment?: {
    id: string;
    name: string;
  };

  @Prop({ type: Date })
  publishedAt: Date;

  @Prop({
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  })
  cacheExpiresAt: Date;

  createdAt: Date;

  updatedAt: Date;
}

export const VacancySchema = SchemaFactory.createForClass(Vacancy);

// Create indexes
VacancySchema.index({ hhId: 1 }, { unique: true });
VacancySchema.index({ 'area.id': 1, 'salary.from': 1 });

// TTL index for automatic cache expiration
VacancySchema.index({ cacheExpiresAt: 1 }, { expireAfterSeconds: 0 });
