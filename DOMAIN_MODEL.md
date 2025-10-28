# Streetwise Coach App - Domain Model Documentation

## Overview

The Streetwise Coach application implements a domain-driven design approach focused on martial arts coaching, specifically Gracie Combatives 2.0 curriculum. The domain model captures the essential business concepts, rules, and relationships that govern how coaching sessions, curriculum content, and student progress are managed.

## Core Domain Entities

### Curriculum Domain (`core/domain/curriculum.types.ts`)

The curriculum domain represents the structured knowledge base of martial arts techniques, organized hierarchically for effective teaching and learning.

#### Curriculum
```typescript
interface Curriculum {
  id: CurriculumId;                    // 'gc2' | 'bbs1'
  name: string;                        // "Gracie Combatives 2.0"
  version: string;                     // Semantic versioning
  metadata?: { 
    createdAt?: string; 
    updatedAt?: string 
  };
  lessons: Lesson[];                   // Ordered collection of lessons
  taxonomy?: { 
    positions?: string[];              // Mount, Guard, Side Control, etc.
    categories?: string[];            // Escapes, Submissions, etc.
    skills?: string[];                // Beginner, Intermediate, Advanced
  };
  principles?: Record<string, {        // Core principles reference
    id: string; 
    label: string; 
    description?: string 
  }>;
}
```

**Business Rules:**
- Each curriculum has a unique identifier
- Version follows semantic versioning (major.minor.patch)
- Lessons are ordered by lesson number
- Taxonomy provides categorization for filtering and organization
- Principles are referenced by ID throughout the curriculum

#### Lesson
```typescript
interface Lesson {
  id: Id;                             // 'gc2-l1', 'gc2-l2', etc.
  lessonNumber: number;               // 1-based sequential numbering
  technique: string;                  // "Trap & Roll Escape"
  position?: string;                  // "Mount", "Guard", etc.
  overview?: string;                  // High-level description
  mindsetMinute?: string;             // Mental/philosophical aspect
  streetTip?: string;                 // Practical application advice
  slices: Slice[];                    // Main technique variations
  bonusSlices?: Slice[];              // Additional variations
  drills?: Drill[];                   // Practice protocols
  aliases?: string[];                 // Alternative names
  revision?: number;                  // Version tracking
}
```

**Business Rules:**
- Lesson IDs follow pattern: `{curriculumId}-l{number}`
- Lesson numbers are 1-based and sequential
- Slices represent different variations of the same technique
- Bonus slices are optional advanced variations
- Drills provide structured practice protocols
- Aliases support multiple naming conventions

#### Slice
```typescript
interface Slice {
  id: Id;                             // 'gc2-l1-s1', 'gc2-l1-s2', etc.
  sliceNumber: number;                // 1-based within lesson
  title?: string;                     // "Standard Variation"
  indicator?: string;                 // Recognition cues
  essentialDetail?: string;           // Key technical points
  mostCommonMistake?: string;         // Common errors to avoid
  badGuyReminder?: string;           // Safety considerations
  steps?: Step[];                    // Sequential instructions
  corePrinciples?: string[];          // Referenced principle IDs
}
```

**Business Rules:**
- Slice IDs follow pattern: `{lessonId}-s{number}`
- Slice numbers are 1-based within each lesson
- Steps provide detailed execution instructions
- Core principles are referenced by ID from curriculum principles
- No importance field (removed per design decision)

#### Step
```typescript
interface Step {
  id: Id;                             // 'gc2-l1-s1-st1', etc.
  stepNumber: number;                 // 1-based within slice
  description: string;                // Detailed instruction
}
```

**Business Rules:**
- Step IDs follow pattern: `{sliceId}-st{number}`
- Step numbers are 1-based within each slice
- Descriptions are detailed, actionable instructions
- No progress tracking fields (handled in session domain)

#### Drill
```typescript
interface Drill {
  id: Id;                             // 'gc2-l01-drill-1'
  type: 'reflex' | 'fight-simulation';
  title?: string;                     // Drill name
  objective?: string;                 // Learning goal
  protocol?: { 
    rounds: number; 
    workSec: number; 
    restSec: number 
  };
  targets?: Array<{ 
    sliceId?: Id; 
    stepId?: Id 
  }>;
}
```

**Business Rules:**
- Drill IDs follow pattern: `{lessonId}-drill-{number}`
- Two drill types: reflex training and fight simulation
- Protocol defines timing structure
- Targets specify which slices/steps the drill addresses
- Multiple targets allow complex drill scenarios

### Session Domain (`core/domain/session.types.ts`)

The session domain manages coaching interactions, student assessments, and progress tracking during live coaching sessions.

#### CoachingSession
```typescript
interface CoachingSession {
  id: Id;                             // UUID for session tracking
  when: string;                       // ISO timestamp
  kind: 'private' | 'group';          // Session type
  studentIds: Id[];                   // Participating students
  planId?: Id;                        // Optional lesson plan reference
  events: Observation[];              // Append-only event log
  durationSec?: number;               // Total session duration
  coachNotes?: string;                // General session notes
}
```

**Business Rules:**
- Sessions are immutable once created (append-only events)
- Each session has a unique UUID identifier
- Events array maintains chronological order
- Duration calculated from first to last event
- Coach notes provide high-level session context

#### Observation (Union Type)
```typescript
type Observation =
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
  | { 
      type: 'timer';
      label: string;
      start: number;
      stop: number;
    };
```

**Business Rules:**
- Observations are immutable once recorded
- Confidence uses 3-point scale (1=low, 2=medium, 3=high)
- Next action guides future instruction planning
- Timer events track drill durations
- Student ID optional for group sessions

#### Confidence Scale
```typescript
type Confidence = 1 | 2 | 3;
```

**Business Rules:**
- 1: Low confidence - needs significant work
- 2: Medium confidence - progressing well
- 3: High confidence - mastered or near mastery
- Scale is intentionally simple for quick assessment

### Planning Domain (`core/domain/plan.types.ts`)

The planning domain supports structured lesson planning for individual students or groups.

#### Plan
```typescript
interface Plan {
  id: Id;                             // Unique plan identifier
  studentId?: Id;                     // Optional student association
  title: string;                      // Plan name/description
  createdAt: string;                  // ISO timestamp
  items: PlanItem[];                  // Ordered plan items
}
```

**Business Rules:**
- Plans can be student-specific or general templates
- Items are ordered for sequential execution
- Creation timestamp tracks plan versioning
- Plans reference curriculum content or custom content

#### PlanItem
```typescript
interface PlanItem {
  id: Id;                             // Unique item identifier
  source: 'curriculum' | 'custom';    // Content source
  target?: PlanTarget;                 // Curriculum reference
  customText?: string;                // Custom instruction
  priority?: 1 | 2 | 3;               // Local priority (1=high)
  estMins?: number;                    // Estimated duration
  tags?: string[];                    // Categorization tags
}
```

**Business Rules:**
- Items can reference curriculum content or be custom
- Priority scale: 1=high, 2=medium, 3=low
- Estimated minutes help with session planning
- Tags support filtering and organization

#### PlanTarget
```typescript
interface PlanTarget {
  lessonId?: Id;                      // Reference to lesson
  sliceId?: Id;                       // Reference to slice
  stepId?: Id;                        // Reference to step
}
```

**Business Rules:**
- Targets provide hierarchical curriculum references
- Can target lesson, slice, or specific step level
- Multiple targets allow complex plan items

## Domain Relationships

### Curriculum Hierarchy
```
Curriculum
├── Lessons (ordered by lessonNumber)
│   ├── Slices (ordered by sliceNumber)
│   │   └── Steps (ordered by stepNumber)
│   ├── BonusSlices (optional)
│   └── Drills (practice protocols)
└── Principles (referenced by slices)
```

### Session Flow
```
CoachingSession
├── Events (chronological order)
│   ├── Step Assessments
│   ├── Slice Assessments
│   └── Timer Events
└── Optional Plan Reference
```

### Planning Structure
```
Plan
├── Items (ordered execution)
│   ├── Curriculum Targets
│   └── Custom Content
└── Optional Student Association
```

## Business Rules and Constraints

### Identity Management
- All entities use string-based IDs
- Curriculum IDs are predefined constants ('gc2', 'bbs1')
- Session IDs are UUIDs for uniqueness
- Lesson/Slice/Step IDs follow hierarchical patterns

### Numbering Conventions
- Lesson numbers: 1-based, sequential within curriculum
- Slice numbers: 1-based, sequential within lesson
- Step numbers: 1-based, sequential within slice
- Drill numbers: 1-based, sequential within lesson

### Data Integrity
- Observations are append-only (immutable once recorded)
- Sessions maintain chronological event order
- Curriculum data is read-only (loaded from static files)
- Plan items maintain execution order

### Assessment Rules
- Confidence assessments use 3-point scale
- Next actions guide instructional decisions
- Student IDs optional for group sessions
- Timer events track drill durations

### Content Organization
- Slices represent technique variations
- Bonus slices are advanced variations
- Drills provide structured practice
- Principles are referenced by ID

## Data Flow Patterns

### Curriculum Loading
1. Static curriculum data loaded from TypeScript constants
2. Service layer provides filtered access to lessons/slices/steps
3. UI components consume curriculum data reactively
4. No runtime modifications to curriculum structure

### Session Management
1. New session created with UUID and timestamp
2. Observations appended to events array
3. Session data persisted to localStorage
4. Duration calculated from event timestamps

### Assessment Recording
1. Coach selects lesson and slice/step
2. Confidence level assessed (1-3 scale)
3. Optional notes and next action recorded
4. Observation appended to session events

### Plan Execution
1. Plan items reference curriculum targets
2. Custom items provide flexible instruction
3. Priority and duration guide session flow
4. Tags support filtering and organization

## Domain Services

### Curriculum Service
```typescript
// core/services/curriculumService.ts
export const getCurriculum = (id: string) => {
  const c = REGISTRY[id];
  if (!c) throw new Error('Curriculum not found: ' + id);
  return c;
};

export const listLessons = (id: string) => getCurriculum(id).lessons;
```

**Responsibilities:**
- Curriculum data retrieval and validation
- Lesson filtering and organization
- Error handling for missing curricula

### Session Service
```typescript
// core/services/sessionService.ts
export function startSession(seed?: Partial<CoachingSession>): CoachingSession {
  const session: CoachingSession = {
    id: crypto.randomUUID(),
    when: new Date().toISOString(),
    kind: seed?.kind ?? 'private',
    studentIds: seed?.studentIds ?? [],
    planId: seed?.planId,
    events: [],
    coachNotes: '',
  };
  // Persist to storage
  return session;
}

export function appendObservation(sessionId: string, obs: Observation) {
  // Append observation to session events
  // Persist updated session
}
```

**Responsibilities:**
- Session lifecycle management
- Observation recording and validation
- Data persistence and retrieval
- Event ordering and integrity

### Storage Service
```typescript
// core/services/storageService.ts
export const storage = {
    get<T>(key: string, fallback: T): T {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : fallback;
        } catch {
            return fallback;
        }
    },
    set<T>(key: string, value: T) {
        localStorage.setItem(key, JSON.stringify(value));
    },
};
```

**Responsibilities:**
- localStorage abstraction
- Error handling for storage failures
- Type-safe data serialization
- Fallback handling for missing data

## Domain Events

### Session Events
- `SessionStarted`: New coaching session created
- `ObservationRecorded`: Assessment or timer event added
- `SessionEnded`: Session completed with duration

### Assessment Events
- `StepAssessed`: Individual step confidence recorded
- `SliceAssessed`: Slice-level confidence recorded
- `TimerStarted`: Drill timing initiated
- `TimerStopped`: Drill timing completed

### Planning Events
- `PlanCreated`: New lesson plan established
- `PlanItemAdded`: Item added to plan
- `PlanExecuted`: Plan used in coaching session

## Validation Rules

### Curriculum Validation
- Lesson numbers must be sequential and 1-based
- Slice numbers must be sequential within each lesson
- Step numbers must be sequential within each slice
- All IDs must follow naming conventions

### Session Validation
- Session ID must be valid UUID
- Observations must have valid confidence values
- Timer events must have valid start/stop times
- Student IDs must reference valid students (future)

### Plan Validation
- Plan items must have valid source type
- Curriculum targets must reference existing content
- Priority values must be 1, 2, or 3
- Estimated minutes must be positive numbers

## Future Domain Extensions

### Student Management
- Student profiles with progress tracking
- Skill level assessments and progression
- Attendance tracking and history
- Parent/guardian communication

### Analytics Domain
- Progress tracking across sessions
- Skill development trends
- Curriculum effectiveness metrics
- Coach performance insights

### Collaboration Domain
- Multi-coach session support
- Real-time observation sharing
- Collaborative lesson planning
- Team teaching coordination

This domain model provides a solid foundation for the current application while establishing clear patterns for future growth and feature expansion.
