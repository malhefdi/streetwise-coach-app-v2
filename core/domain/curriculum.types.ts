export type Id = string;
export type CurriculumId = 'gc2' | 'bbs1';

export interface Curriculum {
  id: CurriculumId;
  name: string;
  version: string;
  metadata?: { createdAt?: string; updatedAt?: string };
  lessons: Lesson[];
  taxonomy?: { positions?: string[]; categories?: string[]; skills?: string[] };
  principles?: Record<string, { id: string; label: string; description?: string }>;
}

export interface Lesson {
  id: Id;                // keep your existing ids (e.g. 'gc2-l1')
  lessonNumber: number;  // 1-based
  technique: string;
  position?: string;
  overview?: string;
  mindsetMinute?: string;
  streetTip?: string;
  slices: Slice[];
  bonusSlices?: Slice[];
  drills?: Drill[];
  aliases?: string[];
  revision?: number;
}

export interface Slice {
  id: Id;                // keep existing ids ('gc2-l1-s1')
  sliceNumber: number;   // 1-based within lesson
  title?: string;
  indicator?: string;
  essentialDetail?: string;
  mostCommonMistake?: string;
  badGuyReminder?: string;
  steps?: Step[];
  corePrinciples?: string[]; // reference ids from PRINCIPLES
  // intentionally NO 'importance' here per your decision
}

export interface Step {
  id: Id;                // 'gc2-l1-s1-st1'
  stepNumber: number;    // 1-based
  description: string;
  // no progress fields in curriculum
}

export interface Drill {
  id: Id;                // 'gc2-l01-drill-1'
  type: 'reflex' | 'fight-simulation';
  title?: string;
  objective?: string;    // carry old drillOrders text here when migrating
  protocol?: { rounds: number; workSec: number; restSec: number };
  targets?: Array<{ sliceId?: Id; stepId?: Id }>;
}
