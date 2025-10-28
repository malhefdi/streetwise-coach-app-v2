export type Id = string;

export interface PlanTarget {
  lessonId?: Id;
  sliceId?: Id;
  stepId?: Id;
}

export interface PlanItem {
  id: Id;
  source: 'curriculum' | 'custom';
  target?: PlanTarget;     // used when source === 'curriculum'
  customText?: string;     // used when source === 'custom'
  priority?: 1 | 2 | 3;    // local priority for this plan
  estMins?: number;
  tags?: string[];
}

export interface Plan {
  id: Id;
  studentId?: Id;
  title: string;
  createdAt: string;
  items: PlanItem[];
}
