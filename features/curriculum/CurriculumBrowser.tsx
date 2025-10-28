'use client';
import { Lesson } from '@/core/domain/curriculum.types';
import LessonCard from './LessonCard';

export default function CurriculumBrowser({ lessons }: { lessons: Lesson[] }) {
  return (
    <div className="grid">
      {lessons.map((l) => (
        <div key={l.id} className="col-12 md:col-6 xl:col-4">
          <LessonCard lesson={l} />
        </div>
      ))}
    </div>
  );
}
