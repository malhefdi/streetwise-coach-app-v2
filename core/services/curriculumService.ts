import type { Curriculum } from '@/core/domain/curriculum.types';
import { gc2Curriculum } from '@/data/gc2.curriculum.v1';

const REGISTRY: Record<string, Curriculum> = {
  [gc2Curriculum.id]: gc2Curriculum,
};

export const getCurriculum = (id: string) => {
  const c = REGISTRY[id];
  if (!c) throw new Error('Curriculum not found: ' + id);
  return c;
};
export const listLessons = (id: string) => getCurriculum(id).lessons;
