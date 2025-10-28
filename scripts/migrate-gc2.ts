/* eslint-disable no-console */
// Usage (with tsx):
//   npx tsx scripts/migrate-gc2.ts data/legacy/gc2.curriculum.ts data/gc2.curriculum.v1.ts gc2Curriculum
//
// What it does:
// 1) Removes slice.drillOrders → creates structured lesson.drills[] with targets -> sliceId
// 2) Lifts isBonusSlice slices into lesson.bonusSlices[] and removes the flag
// 3) Removes any 'importance' fields
// 4) Adds root version/metadata (if missing)
// 5) Verifies: no id/numbering changes

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type AnyObj = Record<string, any>;

type Step = {
  id: string;
  stepNumber: number;
  description?: string;
  importance?: any; // legacy -> removed
  [k: string]: any;
};

type Slice = {
  id: string;
  sliceNumber: number;
  title?: string;
  indicator?: string;
  essentialDetail?: string;
  mostCommonMistake?: string;
  badGuyReminder?: string;
  steps?: Step[];
  corePrinciples?: string[];
  drillOrders?: string;   // legacy -> moved to drills[]
  isBonusSlice?: boolean; // legacy -> becomes bonusSlices[]
  importance?: any;       // legacy -> removed
  [k: string]: any;
};

type Lesson = {
  id: string;
  lessonNumber: number;
  technique: string;
  position?: string;
  overview?: string;
  mindsetMinute?: string;
  streetTip?: string;
  slices: Slice[];
  bonusSlices?: Slice[];
  drills?: AnyObj[];
  [k: string]: any;
};

type Curriculum = {
  id: string;
  name: string;
  version?: string;
  metadata?: AnyObj;
  lessons: Lesson[];
  [k: string]: any;
};

function mkDrillId(lessonId: string, idx: number) {
  return `${lessonId}-drill-${idx + 1}`;
}

// Loose loader: supports "export default" or "export const X = ..."
async function loadModule(absPath: string): Promise<Curriculum> {
  const mod = await import(pathToFileURL(absPath).href);
  const obj =
    (mod as any).default ??
    // prefer the first exported object that has "lessons"
    Object.values(mod as AnyObj).find((v: any) => v && typeof v === 'object' && Array.isArray(v.lessons));
  if (!obj) throw new Error(`Could not load curriculum from: ${absPath}`);
  return obj as Curriculum;
}

type Snapshot = {
  lessons: Array<{
    id: string;
    lessonNumber: number;
    sliceNumbersById: Record<string, number>;
    stepNumbersById: Record<string, number>;
    sliceIds: string[];
    stepIds: string[];
    hadDrillOrdersForSliceIds: string[];
  }>;
  lessonIds: string[];
  sliceIds: string[];
  stepIds: string[];
};

function snapshot(curr: Curriculum, captureDrillOrders = false): Snapshot {
  const lessonIds: string[] = [];
  const sliceIds: string[] = [];
  const stepIds: string[] = [];
  const lessons = curr.lessons.map((L) => {
    lessonIds.push(L.id);
    const combinedSlices: Slice[] = [...(L.slices ?? []), ...(L.bonusSlices ?? [])];
    const sliceNumbersById: Record<string, number> = {};
    const stepNumbersById: Record<string, number> = {};
    const hadDrillOrdersForSliceIds: string[] = [];

    for (const s of combinedSlices) {
      sliceIds.push(s.id);
      sliceNumbersById[s.id] = s.sliceNumber;
      if (captureDrillOrders && s.drillOrders && s.drillOrders.trim()) hadDrillOrdersForSliceIds.push(s.id);
      for (const st of s.steps ?? []) {
        stepIds.push(st.id);
        stepNumbersById[st.id] = st.stepNumber;
      }
    }
    return {
      id: L.id,
      lessonNumber: L.lessonNumber,
      sliceNumbersById,
      stepNumbersById,
      sliceIds: Object.keys(sliceNumbersById),
      stepIds: Object.keys(stepNumbersById),
      hadDrillOrdersForSliceIds,
    };
  });
  return { lessons, lessonIds, sliceIds, stepIds };
}

function migrate(curr: Curriculum) {
  const out: Curriculum = structuredClone(curr);

  // Root metadata
  out.version = out.version ?? '1.0.0';
  out.metadata = { ...(out.metadata ?? {}), updatedAt: new Date().toISOString() };

  const perLessonDrillMap: Record<string, string[]> = {};

  out.lessons = out.lessons.map((L) => {
    const lesson: Lesson = structuredClone(L);

    const main: Slice[] = [];
    const bonus: Slice[] = [];
    const drills: AnyObj[] = Array.isArray(lesson.drills) ? [...lesson.drills] : [];

    for (const s0 of lesson.slices ?? []) {
      const s: Slice = structuredClone(s0);

      // Convert drillOrders -> drills[]
      if (s.drillOrders && s.drillOrders.trim()) {
        const listing = (perLessonDrillMap[lesson.id] ||= []);
        const newDrillId = mkDrillId(lesson.id, drills.length);
        drills.push({
          id: newDrillId,
          type: 'reflex',
          objective: s.drillOrders.trim(),
          targets: [{ sliceId: s.id }],
        });
        listing.push(s.id);
        delete s.drillOrders;
      }

      // Remove legacy "importance" on slice/steps
      if ('importance' in s) delete (s as any).importance;
      for (const st of s.steps ?? []) if ('importance' in st) delete (st as any).importance;

      // Route bonus vs main
      if (s.isBonusSlice) {
        delete s.isBonusSlice;
        bonus.push(s);
      } else {
        if ('isBonusSlice' in s) delete s.isBonusSlice;
        main.push(s);
      }
    }

    lesson.slices = main;
    if (bonus.length) lesson.bonusSlices = bonus;
    if (drills.length) lesson.drills = drills;
    return lesson;
  });

  return { out, perLessonDrillMap };
}

function deepEqualSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const A = new Set(a);
  for (const x of b) if (!A.has(x)) return false;
  return true;
}

function verify(before: Snapshot, after: Snapshot) {
  if (!deepEqualSet(before.lessonIds, after.lessonIds)) throw new Error('Verification failed: lesson ids changed.');
  if (!deepEqualSet(before.sliceIds, after.sliceIds)) throw new Error('Verification failed: slice ids changed.');
  if (!deepEqualSet(before.stepIds, after.stepIds)) throw new Error('Verification failed: step ids changed.');

  const B = Object.fromEntries(before.lessons.map((l) => [l.id, l]));
  const A = Object.fromEntries(after.lessons.map((l) => [l.id, l]));

  for (const lessonId of Object.keys(B)) {
    const bL = B[lessonId];
    const aL = A[lessonId];
    for (const sliceId of Object.keys(bL.sliceNumbersById)) {
      if (bL.sliceNumbersById[sliceId] !== aL.sliceNumbersById[sliceId]) {
        throw new Error(`sliceNumber changed for ${sliceId}`);
      }
    }
    for (const stepId of Object.keys(bL.stepNumbersById)) {
      if (bL.stepNumbersById[stepId] !== aL.stepNumbersById[stepId]) {
        throw new Error(`stepNumber changed for ${stepId}`);
      }
    }
  }
}

function counts(curr: Curriculum) {
  let sliceCount = 0, bonusCount = 0, stepCount = 0, drillCount = 0;
  for (const L of curr.lessons) {
    sliceCount += L.slices?.length ?? 0;
    bonusCount += L.bonusSlices?.length ?? 0;
    stepCount += [...(L.slices ?? []), ...(L.bonusSlices ?? [])]
      .reduce((acc, s) => acc + (s.steps?.length ?? 0), 0);
    drillCount += L.drills?.length ?? 0;
  }
  return { lessons: curr.lessons.length, slices: sliceCount, bonusSlices: bonusCount, steps: stepCount, drills: drillCount };
}

function emitTsModule(outPath: string, varName: string, obj: object) {
  const header = `// AUTO-GENERATED by scripts/migrate-gc2.ts\n// Date: ${new Date().toISOString()}\n\n`;
  const body = `export const ${varName} = ${JSON.stringify(obj, null, 2)} as const;\n`;
  writeFileSync(outPath, header + body, 'utf-8');
  console.log(`Wrote ${outPath}`);
}

async function main() {
  const srcRel = process.argv[2] ?? 'data/legacy/gc2.curriculum.ts';
  const outRel = process.argv[3] ?? 'data/gc2.curriculum.v1.ts';
  const varName = process.argv[4] ?? 'gc2Curriculum';

  const abs = path.resolve(srcRel);
  const beforeCurr = await loadModule(abs);
  const beforeSnap = snapshot(beforeCurr, true);

  const { out: migrated, perLessonDrillMap } = migrate(beforeCurr);
  const afterSnap = snapshot(migrated, false);

  verify(beforeSnap, afterSnap);

  const outAbs = path.resolve(outRel);
  emitTsModule(outAbs, varName, migrated);

  const b = counts(beforeCurr), a = counts(migrated);
  console.log('=== GC2 Migration Report ===');
  console.log(`Before: lessons=${b.lessons}, slices=${b.slices}, steps=${b.steps}, drills=${b.drills}, bonusSlices=${b.bonusSlices}`);
  console.log(`After : lessons=${a.lessons}, slices=${a.slices}, steps=${a.steps}, drills=${a.drills}, bonusSlices=${a.bonusSlices}`);
  console.log('\nPer-lesson drill creation (from removed drillOrders):');
  for (const [lessonId, sliceIds] of Object.entries(perLessonDrillMap)) {
    console.log(`- ${lessonId}: ${sliceIds.length} drill(s) from slices: ${sliceIds.join(', ')}`);
  }
}

main().catch((e) => {
  console.error('\n[ERROR] Migration failed:');
  console.error(e);
  process.exit(1);
});
