'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import type { Lesson } from '@/core/domain/curriculum.types';
import SliceAccordion from './SliceAccordion';

export default function LessonCard({ lesson }: { lesson: Lesson }) {
  const [open, setOpen] = useState(false);
  const sliceCount = (lesson.slices?.length ?? 0) + (lesson.bonusSlices?.length ?? 0);

  return (
    <div className="surface-section p-4 border-round shadow-1 h-full">
      <div className="flex align-items-center justify-content-between">
        <div>
          <div className="text-sm text-600">Lesson {lesson.lessonNumber}</div>
          <div className="text-xl font-semibold text-900">{lesson.technique}</div>
          {lesson.position && <div className="text-600 mt-1">{lesson.position}</div>}
        </div>
        <Tag value={`${sliceCount} slices`} />
      </div>

      {lesson.overview && <p className="mt-3 text-700">{lesson.overview}</p>}

      <div className="mt-3">
        <Button label={open ? 'Hide' : 'View'} size="small" onClick={() => setOpen(!open)} />
      </div>

      {open && <div className="mt-3"><SliceAccordion lesson={lesson} /></div>}
    </div>
  );
}
