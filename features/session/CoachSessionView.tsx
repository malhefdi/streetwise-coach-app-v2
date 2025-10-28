'use client';

import { useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import SliceAssessmentCard from './SliceAssessmentCard';
import { listLessons } from '@/core/services/curriculumService';
import { startSession, appendObservation } from '@/core/services/sessionService';
import type { Confidence } from '@/core/domain/session.types';
import type { Lesson } from '@/core/domain/curriculum.types';

export default function CoachSessionView() {
  const lessons = listLessons('gc2'); // later: load by plan or curriculum selector
  const [lessonId, setLessonId] = useState(lessons[0]?.id);
  const lesson: Lesson | undefined = useMemo(() => lessons.find(l => l.id === lessonId), [lessons, lessonId]);

  const [sessionId] = useState(() => startSession({ kind: 'private' }).id);

  const items = useMemo(() => {
    if (!lesson) return [];
    return [...(lesson.slices ?? []), ...(lesson.bonusSlices ?? [])];
  }, [lesson]);

  const handleAssess = (sliceId: string) => (c: Confidence, notes?: string) => {
    appendObservation(sessionId, { type: 'slice-assessed', sliceId, confidence: c, notes });
  };

  return (
    <div className="grid">
      <div className="col-12">
        <div className="surface-card p-4 shadow-1 border-round">
          <div className="flex align-items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-900 font-medium mb-2">Lesson</label>
              <Dropdown
                value={lessonId}
                onChange={(e) => setLessonId(e.value)}
                options={lessons.map(l => ({ label: `L${l.lessonNumber} — ${l.technique}`, value: l.id }))}
                className="w-full"
              />
            </div>
            <Button label="End Session" severity="secondary" disabled />
          </div>

          {lesson && <div className="text-900 text-xl font-semibold mb-2">{lesson.technique}</div>}
          {lesson?.overview && <p className="text-700 mb-4">{lesson.overview}</p>}

          {items.map((s) => (
            <SliceAssessmentCard
              key={s.id}
              title={`Slice ${s.sliceNumber}${s.title ? `: ${s.title}` : ''}`}
              targetId={s.id}
              mode="slice"
              onAssess={handleAssess(s.id)}
            />
          ))}

          {(!lesson || items.length === 0) && (
            <div className="text-600">Pick a lesson to begin.</div>
          )}
        </div>
      </div>
    </div>
  );
}
