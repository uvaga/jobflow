export type Status = 'active' | 'inactive' | 'pending';

export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
