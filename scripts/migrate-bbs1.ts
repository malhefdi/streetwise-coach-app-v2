/* eslint-disable no-console */
// Usage:
//   npx tsx scripts/migrate-bbs1.ts <in.ts> <out.ts> [exportVarName]
//
// Example:
//   npx tsx scripts/migrate-bbs1.ts data/legacy/bbs1.curriculum.ts data/bbs1.curriculum.v1.ts bbs1Curriculum
//
// What it does (BBS1-specific):
// 1) For each slice with `drillOrders` (string), creates a lesson-level drill:
//      { id: "<lessonId>-dN", title: "Auto: <slice.title?>", description: <drillOrders>, targets: [{ sliceId }] }
//    and removes the slice.drillOrders field.
// 2) Removes per-step fields: importance, confidence, notes.
// 3) Moves lesson extras (mindsetMinute, chapterId, chapterTitle, chapter, course, rapidMasteryDrill, focusSparring)
//    into lesson.metadata.{...} and deletes them from the lesson root.
// 4) Adds root version + metadata.createdAt if missing.
// 5) Verifies that lesson/slice/step IDs and counts are unchanged (drill count may increase).

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';

type Any = Record<string, any>;

type Step = {
  id: string;
  stepNumber: number;
  description?: string;
  // legacy (to strip):
  importance?: any;
  confidence?: any;
  notes?: any;
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
  // legacy (to strip/transform):
  drillOrders?: string | null;
};

type Drill = {
  id: string;
  title?: string;
  description?: string;
  targets: { sliceId: string }[];
};

type Lesson = {
  id: string;
  lessonNumber: number;
  technique?: string;
  position?: string;
  overview?: string;
  slices?: Slice[];
  drills?: Drill[];
  // extras we’ll lift:
  mindsetMinute?: string;
  chapterId?: string;
  chapterTitle?: string;
  chapter?: string;
  course?: string;
  rapidMasteryDrill?: string;
  focusSparring?: string;
  metadata?: Any;
};

type Curriculum = {
  id: string;
  name: string;
  description?: string;
  totalLessons?: number; // we’ll leave this alone
  version?: string;
  metadata?: Any;
  lessons: Lesson[];
  [k: string]: any; // allow taxonomy/principles/etc
};

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function snapshot(curr: Curriculum) {
  const lessons = curr.lessons?.length ?? 0;
  let slices = 0, steps = 0, drills = 0;
  const lessonIds: string[] = [];
  const sliceIds: string[] = [];
  const stepIds: string[] = [];

  for (const L of curr.lessons ?? []) {
    lessonIds.push(L.id);
    drills += L.drills?.length ?? 0;
    for (const S of L.slices ?? []) {
      slices += 1;
      sliceIds.push(S.id);
      for (const T of S.steps ?? []) {
        steps += 1;
        stepIds.push(T.id);
      }
    }
  }
  return { counts: { lessons, slices, steps, drills }, ids: { lessonIds, sliceIds, stepIds } };
}

async function loadModule(absPath: string): Promise<any> {
  const url = pathToFileURL(absPath).href;
  return import(url);
}

function migrateBbs1(input: Curriculum) {
  const out: Curriculum = deepClone(input);

  // Root version/metadata
  out.version = out.version ?? '1.0.0';
  out.metadata = out.metadata ?? {};
  if (!out.metadata.createdAt) out.metadata.createdAt = new Date().toISOString();

  for (const L of out.lessons ?? []) {
    // Lift lesson extras into L.metadata
    const extras = [
      'mindsetMinute',
      'chapterId',
      'chapterTitle',
      'chapter',
      'course',
      'rapidMasteryDrill',
      'focusSparring'
    ] as const;

    for (const key of extras) {
      const val = (L as Any)[key];
      if (val !== undefined) {
        L.metadata = L.metadata ?? {};
        (L.metadata as Any)[key] = val;
        delete (L as Any)[key];
      }
    }

    // Build drills from slice.drillOrders (if present)
    let dcount = L.drills?.length ?? 0;
    for (const S of L.slices ?? []) {
      if (typeof S.drillOrders === 'string' && S.drillOrders.trim().length > 0) {
        L.drills = L.drills ?? [];
        dcount += 1;
        L.drills.push({
          id: `${L.id}-d${dcount}`,
          title: S.title ? `Auto: ${S.title}` : 'Auto Drill',
          description: S.drillOrders.trim(),
          targets: [{ sliceId: S.id }]
        });
        delete S.drillOrders;
      } else if (S && 'drillOrders' in S) {
        // Remove empty/null drillOrders if field exists
        delete (S as Any).drillOrders;
      }
    }

    // Strip per-step placeholders (importance/confidence/notes)
    for (const S of L.slices ?? []) {
      for (const T of S.steps ?? []) {
        delete (T as Any).importance;
        delete (T as Any).confidence;
        delete (T as Any).notes;
      }
    }
  }

  return out;
}

function verifyBeforeAfter(before: ReturnType<typeof snapshot>, after: ReturnType<typeof snapshot>) {
  const b = before.counts, a = after.counts;
  if (b.lessons !== a.lessons) throw new Error(`Lesson count changed: ${b.lessons} -> ${a.lessons}`);
  if (b.slices  !== a.slices ) throw new Error(`Slice count changed: ${b.slices} -> ${a.slices}`);
  if (b.steps   !== a.steps  ) throw new Error(`Step count changed: ${b.steps}  -> ${a.steps}`);
  // drills may legitimately increase
  const same = (xs: string[], ys: string[]) => xs.join('|') === ys.join('|');
  if (!same(before.ids.lessonIds, after.ids.lessonIds)) throw new Error('Lesson IDs changed');
  if (!same(before.ids.sliceIds,  after.ids.sliceIds )) throw new Error('Slice IDs changed');
  if (!same(before.ids.stepIds,   after.ids.stepIds  )) throw new Error('Step IDs changed');
}

function emitTs(outPath: string, exportVar: string, curr: Curriculum) {
  const banner = `// Generated by migrate-bbs1.ts on ${new Date().toISOString()}\n`;
  const importLine = `import type { Curriculum } from '@/core/domain/curriculum.types';\n\n`;
  const body = `export const ${exportVar}: Curriculum = ${JSON.stringify(curr, null, 2)};\n`;
  writeFileSync(outPath, banner + importLine + body, 'utf8');
}

async function main() {
  const srcRel = process.argv[2];
  const outRel = process.argv[3];
  const exportVar = process.argv[4] ?? 'bbs1Curriculum';

  if (!srcRel || !outRel) {
    console.log('Usage: npx tsx scripts/migrate-bbs1.ts <in.ts> <out.ts> [exportVarName]');
    process.exit(1);
  }

  const abs = path.resolve(srcRel);
  const mod = await loadModule(abs);
  const input: Curriculum = mod[exportVar];

  if (!input?.lessons) {
    throw new Error(`Export "${exportVar}" not found or invalid in ${srcRel}`);
  }

  const before = snapshot(input);
  const migrated = migrateBbs1(input);
  const after = snapshot(migrated);
  verifyBeforeAfter(before, after);

  const outAbs = path.resolve(outRel);
  emitTs(outAbs, exportVar, migrated);

  console.log(`\n=== BBS1 Migration Report (${input.id}) ===`);
  console.log(`Lessons: ${before.counts.lessons}`);
  console.log(`Slices : ${before.counts.slices}`);
  console.log(`Steps  : ${before.counts.steps}`);
  console.log(`Drills : ${before.counts.drills} -> ${after.counts.drills}`);
  console.log(`\nWrote: ${outAbs}`);
}

main().catch((e) => {
  console.error('\n[ERROR] migrate-bbs1 failed:');
  console.error(e);
  process.exit(1);
});
