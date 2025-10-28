'use client';

import { Accordion, AccordionTab } from 'primereact/accordion';
import type { Lesson, Slice } from '@/core/domain/curriculum.types';

function SliceView({ s }: { s: Slice }) {
  return (
    <div className="p-2">
      {s.indicator && <div className="mb-2"><strong>Indicator:</strong> {s.indicator}</div>}
      {s.essentialDetail && <div className="mb-2"><strong>Essential Detail:</strong> {s.essentialDetail}</div>}
      {s.mostCommonMistake && <div className="mb-2"><strong>Most Common Mistake:</strong> {s.mostCommonMistake}</div>}
      {s.badGuyReminder && <div className="mb-2"><strong>Bad Guy Reminder:</strong> {s.badGuyReminder}</div>}
      {Array.isArray(s.steps) && s.steps.length > 0 && (
        <ol className="mt-2 ml-3">
          {s.steps.map((st) => <li key={st.id} className="mb-1">{st.stepNumber}. {st.description}</li>)}
        </ol>
      )}
      {Array.isArray(s.corePrinciples) && s.corePrinciples.length > 0 && (
        <div className="mt-2 text-600 text-sm"><strong>Principles:</strong> {s.corePrinciples.join(', ')}</div>
      )}
    </div>
  );
}

export default function SliceAccordion({ lesson }: { lesson: Lesson }) {
  const main = lesson.slices ?? [];
  const bonus = lesson.bonusSlices ?? [];

  return (
    <Accordion multiple>
      {main.map((s) => (
        <AccordionTab key={s.id} header={`Slice ${s.sliceNumber}: ${s.title ?? ''}`.trim()}>
          <SliceView s={s} />
        </AccordionTab>
      ))}
      {bonus.length > 0 && (
        <AccordionTab header={`Bonus (${bonus.length})`}>
          <Accordion multiple>
            {bonus.map((s) => (
              <AccordionTab key={s.id} header={`Slice ${s.sliceNumber}: ${s.title ?? ''}`.trim()}>
                <SliceView s={s} />
              </AccordionTab>
            ))}
          </Accordion>
        </AccordionTab>
      )}
    </Accordion>
  );
}
