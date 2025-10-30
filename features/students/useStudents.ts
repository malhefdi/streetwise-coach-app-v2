'use client';
import { useMemo, useState } from 'react';
import * as svc from '@/core/services/studentsService';
import type { Student } from '@/core/domain/students.types';

export function useStudents() {
  const [tick, setTick] = useState(0);
  const students = useMemo(() => svc.listStudents(), [tick]);

  const refresh = () => setTick(t => t + 1);
  const create  = (p: Omit<Student,'id'|'createdAt'|'updatedAt'>) => { const s = svc.createStudent(p); refresh(); return s; };
  const update  = (id: string, patch: Partial<Student>) => { const s = svc.updateStudent(id, patch); refresh(); return s; };
  const remove  = (id: string) => { svc.deleteStudent(id); refresh(); };

  return { students, create, update, remove, refresh };
}
