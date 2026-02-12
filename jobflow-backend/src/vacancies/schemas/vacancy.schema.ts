import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VacancyDocument = Vacancy & Document;

@Schema({ timestamps: true })
export class Vacancy extends Document {
  @Prop({
    required: true,
    unique: true,
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
    alternateUrl?: string;
    trusted: boolean;
    accreditedItEmployer?: boolean;
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
  alternateUrl: string;

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

  @Prop({ type: [Object] })
  keySkills?: { name: string }[];

  @Prop({ type: [Object] })
  professionalRoles?: { id: string; name: string }[];

  @Prop({ type: Object })
  address?: {
    city?: string;
    street?: string;
    building?: string;
    raw?: string;
    lat?: number;
    lng?: number;
  };

  @Prop({ type: Object })
  contacts?: {
    name?: string;
    email?: string;
    phones?: { city?: string; number?: string; comment?: string }[];
  };

  @Prop({ type: [Object] })
  workFormat?: { id: string; name: string }[];

  @Prop({ type: [Object] })
  workingHours?: { id: string; name: string }[];

  @Prop({ type: [Object] })
  workScheduleByDays?: { id: string; name: string }[];

  @Prop()
  acceptHandicapped?: boolean;

  @Prop()
  acceptKids?: boolean;

  @Prop()
  acceptTemporary?: boolean;

  @Prop()
  acceptIncompleteResumes?: boolean;

  @Prop({ type: Date })
  publishedAt: Date;

  @Prop({ type: Date })
  cacheExpiresAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

export const VacancySchema = SchemaFactory.createForClass(Vacancy);

// Create indexes (hhId unique index is created automatically by unique: true in @Prop)
VacancySchema.index({ 'area.id': 1, 'salary.from': 1 });

// TTL index for automatic cache expiration
// Documents without cacheExpiresAt field are permanent (not deleted by TTL)
VacancySchema.index({ cacheExpiresAt: 1 }, { expireAfterSeconds: 0 });
