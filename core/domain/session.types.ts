export type Id = string;
export type Confidence = 1 | 2 | 3;

export type Observation =
  | {
      type: 'step-assessed';
      studentId?: Id;
      stepId: Id;
      confidence: Confidence;
      notes?: string;
      nextAction?: 'Teach' | 'Review' | 'Reteach';
    }
  | {
      type: 'slice-assessed';
      studentId?: Id;
      sliceId: Id;
      confidence: Confidence;
      notes?: string;
      nextAction?: 'Teach' | 'Review' | 'Reteach';
    }
  | { type: 'timer'; label: string; start: number; stop: number };

export interface CoachingSession {
  id: Id;
  when: string;                 // ISO
  kind: 'private' | 'group';
  studentIds: Id[];
  planId?: Id;
  events: Observation[];
  durationSec?: number;
  coachNotes?: string;
}
