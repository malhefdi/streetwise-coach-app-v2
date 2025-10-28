'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import type { Confidence } from '@/core/domain/session.types';

type Props = {
  title: string;
  targetId: string;               // sliceId or stepId
  mode: 'slice' | 'step';
  onAssess: (c: Confidence, notes?: string) => void;
};

export default function SliceAssessmentCard({ title, targetId, mode, onAssess }: Props) {
  const [notes, setNotes] = useState('');

  return (
    <div className="surface-section p-3 border-round mb-3">
      <div className="text-lg font-semibold text-900">{title}</div>
      <div className="text-600 text-sm mb-2">{mode === 'slice' ? 'Slice' : 'Step'} ID: {targetId}</div>

      <div className="flex gap-2 mt-2">
        <Button label="1" onClick={() => onAssess(1, notes)} />
        <Button label="2" onClick={() => onAssess(2, notes)} />
        <Button label="3" onClick={() => onAssess(3, notes)} />
      </div>

      <div className="mt-3">
        <label className="text-sm text-600 block mb-1">Notes</label>
        <InputTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full" />
      </div>
    </div>
  );
}
