'use client';

import CurriculumBrowser from '@/features/curriculum/CurriculumBrowser';
import { gc2Curriculum } from '@/data/gc2.curriculum.v1';

export default function CurriculumPage() {
  return (
    <div className="grid">
      <div className="col-12">
        <div className="surface-card p-4 shadow-1 border-round">
          <div className="text-900 text-xl font-semibold mb-3">Gracie Combatives 2.0</div>
          <CurriculumBrowser lessons={gc2Curriculum.lessons} />
        </div>
      </div>
    </div>
  );
}
