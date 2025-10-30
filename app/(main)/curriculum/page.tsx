'use client';

import { useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import CurriculumBrowser from '@/features/curriculum/CurriculumBrowser';
import { getCurriculum } from '@/core/services/curriculumService';

const curriculumOptions = [
  { label: 'Gracie Combatives 2.0', value: 'gc2' },
  { label: 'Master Cycle — Blue Belt Stripe 1', value: 'bbs1' }
];

export default function CurriculumPage() {
  const [selectedCurriculum, setSelectedCurriculum] = useState('gc2');
  const curriculum = getCurriculum(selectedCurriculum);

  return (
    <div className="grid">
      <div className="col-12">
        <div className="surface-card p-4 shadow-1 border-round">
          <div className="flex align-items-center justify-content-between mb-3">
            <div className="text-900 text-xl font-semibold">{curriculum.name}</div>
            <Dropdown
              value={selectedCurriculum}
              onChange={(e) => setSelectedCurriculum(e.value)}
              options={curriculumOptions}
              className="w-20rem"
            />
          </div>
          {curriculum.description && (
            <p className="text-600 mb-4">{curriculum.description}</p>
          )}
          <CurriculumBrowser lessons={curriculum.lessons} />
        </div>
      </div>
    </div>
  );
}
