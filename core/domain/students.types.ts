export type StudentId = string;

export interface Student {
  id: StudentId;
  fullName: string;
  nickname?: string;
  phone?: string;
  email?: string;
  rank?: string;
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
