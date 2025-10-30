# Streetwise Coach App - Product Requirements Document

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** In Development

---

## Executive Summary

Streetwise Coach is a Next.js-based coaching platform designed for martial arts instruction, specifically focused on Gracie Combatives 2.0 and Bulletproof Belt System 1 curricula. The application enables coaches to browse structured curriculum content, conduct live coaching sessions with student assessments, track progress over time, and manage student rosters.

### Product Vision

To provide martial arts coaches with a streamlined digital tool that transforms curriculum delivery, assessment tracking, and student progress management, enabling more effective and organized coaching sessions.

### Target Audience

- **Primary Users**: Martial arts coaches teaching Gracie Combatives 2.0 and BBS1 curricula
- **User Personas**:
  - **Active Coach**: Conducts 10+ sessions per week, needs fast assessment tools
  - **Part-time Coach**: Conducts 2-5 sessions per week, needs structured guidance
  - **New Coach**: Recently certified, needs curriculum reference and assessment templates

---

## Product Goals and Objectives

### Primary Goals

1. **Streamline Session Management**: Enable coaches to efficiently record assessments during live sessions without interrupting the flow
2. **Curriculum Accessibility**: Provide easy-to-browse, searchable curriculum content with structured lesson/slice/step hierarchy
3. **Progress Tracking**: Track student progress over time through session history and assessment records
4. **Student Management**: Maintain student rosters with quick access to progress and notes

### Success Metrics

- **Session Completion Rate**: 90%+ of started sessions are completed with assessments
- **Assessment Speed**: Average assessment recording time < 15 seconds per slice
- **Curriculum Usage**: 80%+ of sessions reference curriculum content
- **Data Retention**: 100% of sessions persist and are recoverable from localStorage

---

## Current Feature Set

### ✅ Implemented Features

#### 1. Curriculum Browser
- **Description**: Browse hierarchical curriculum structure (Curriculum → Lessons → Slices → Steps)
- **Pages**: `/curriculum`
- **Components**: `CurriculumBrowser`, `LessonCard`, `SliceAccordion`
- **User Stories**:
  - As a coach, I want to browse all lessons in GC2/BBS1 curriculum so I can plan sessions
  - As a coach, I want to view detailed slice instructions so I can reference techniques during coaching
  - As a coach, I want to see step-by-step instructions so I can ensure proper technique execution

#### 2. Coaching Session Interface
- **Description**: Live session interface for recording student assessments
- **Pages**: `/coach`
- **Components**: `CoachSessionView`, `SliceAssessmentCard`
- **User Stories**:
  - As a coach, I want to select a lesson and record slice assessments during live sessions
  - As a coach, I want to record confidence levels (1-3 scale) for each slice assessment
  - As a coach, I want to add notes and next-action recommendations for future sessions
  - As a coach, I want timer functionality to track drill durations

#### 3. Session History
- **Description**: Review past coaching sessions and observations
- **Pages**: `/history`
- **Components**: `SessionList`
- **User Stories**:
  - As a coach, I want to view all past sessions so I can track student progress
  - As a coach, I want to see chronological observation records from sessions
  - As a coach, I want to review confidence trends over time

#### 4. Student Management (Partial Implementation)
- **Description**: Manage student roster with profiles and notes
- **Pages**: `/students`, `/students/[id]`
- **Components**: `StudentList`, `StudentCard`, `StudentDetail`, `useStudents`
- **User Stories**:
  - As a coach, I want to maintain a student roster with contact information
  - As a coach, I want to view individual student profiles with progress history
  - As a coach, I want to add notes about students for future reference

#### 5. Dashboard
- **Description**: Quick access to major features with action cards
- **Pages**: `/dashboard`, `/` (redirects to dashboard)
- **Components**: Dashboard with Quick Actions cards
- **User Stories**:
  - As a coach, I want quick access to curriculum, coaching, and students from a central dashboard

---

## Technical Requirements

### Architecture Requirements

#### Technology Stack
- **Framework**: Next.js 13.4+ with App Router
- **Language**: TypeScript 5.1+ (strict mode)
- **UI Library**: PrimeReact 10.2+ with Sakai template
- **Styling**: PrimeFlex 3.3+ for responsive grid, SCSS for custom styles
- **State Management**: Client-side localStorage via `core/services/storageService.ts`
- **No External State**: No Redux, Zustand, or similar - pure React hooks + localStorage

#### Project Structure
```
app/              # Next.js App Router pages
  (main)/         # Authenticated routes
  (full-page)/    # Standalone pages (auth, landing)
core/             # Business logic and domain
  domain/         # TypeScript types/interfaces
  services/       # Business logic (functional, no classes)
features/         # Reusable UI components
layout/           # Sakai template components
data/             # Static curriculum data
```

#### Code Quality Requirements
- **TypeScript**: Strict mode enabled, all types in `core/domain/*.types.ts`
- **Formatting**: Prettier with 4-space indent, single quotes, semicolons, 250 char width
- **Linting**: ESLint extending `next/core-web-vitals`
- **Imports**: Use `@/` path alias for absolute imports
- **Components**: `'use client'` directive for client components, default export for pages
- **Services**: Functional exports only, no classes

#### Data Persistence
- **Current**: localStorage via `core/services/storageService.ts`
- **Error Handling**: Try-catch with fallbacks for all storage operations
- **Data Format**: JSON serialization with type-safe get/set methods
- **Future**: Database integration with API layer (maintain localStorage fallback)

#### Performance Requirements
- **Page Load**: < 2 seconds initial load
- **Navigation**: < 500ms route transitions
- **Assessment Recording**: < 100ms persistence latency
- **Offline Support**: Full functionality with cached curriculum data

---

## Domain Model Requirements

### Curriculum Domain

#### Entities
- **Curriculum**: Top-level container (e.g., 'gc2', 'bbs1')
  - ID format: `'gc2' | 'bbs1'`
  - Contains ordered lessons
  - May include taxonomy (positions, categories, skills)
  - May reference core principles

- **Lesson**: Individual technique lesson
  - ID format: `{curriculumId}-l{number}` (e.g., 'gc2-l1')
  - 1-based sequential numbering
  - Contains technique name, position, overview, mindset minute, street tip
  - Contains slices and optional bonus slices
  - May include drills

- **Slice**: Technique variation or scenario
  - ID format: `{lessonId}-s{number}` (e.g., 'gc2-l1-s1')
  - 1-based sequential numbering within lesson
  - Contains title, indicator, essential detail, common mistakes, safety reminders
  - Contains ordered steps

- **Step**: Detailed execution instruction
  - ID format: `{sliceId}-st{number}` (e.g., 'gc2-l1-s1-st1')
  - 1-based sequential numbering within slice
  - Contains detailed description

- **Drill**: Practice protocol
  - ID format: `{lessonId}-drill-{number}`
  - Types: 'reflex' | 'fight-simulation'
  - May include protocol (rounds, work/rest timing)

#### Business Rules
- All IDs follow hierarchical naming patterns
- Lesson/slice/step numbers are 1-based and sequential
- Curriculum data is read-only (loaded from static TypeScript files)
- No runtime modifications to curriculum structure

### Session Domain

#### Entities
- **CoachingSession**: Immutable session record
  - ID: UUID (generated with `crypto.randomUUID()`)
  - Fields: when (ISO timestamp), kind ('private' | 'group'), studentIds, planId
  - Events: Append-only array of observations
  - Optional: durationSec, coachNotes

- **Observation**: Union type for session events
  - `step-assessed`: Student assessment of individual step
  - `slice-assessed`: Student assessment of slice (technique variation)
  - `timer`: Drill timing event
  - Common fields: confidence (1-3 scale), notes, nextAction

#### Business Rules
- Sessions are immutable once created (append-only events)
- Observations maintain chronological order
- Confidence uses 3-point scale: 1=low, 2=medium, 3=high
- Next actions: 'Teach' | 'Review' | 'Reteach'

### Student Domain

#### Entities
- **Student**: Student profile
  - ID: `StudentId` (string)
  - Fields: fullName, nickname, phone, email, rank, notes
  - Timestamps: createdAt, updatedAt (ISO)

#### Business Rules
- Student IDs must be unique
- All timestamps in ISO format
- Contact information optional

---

## User Experience Requirements

### Navigation
- **Sidebar Navigation**: Sakai template with collapsible menu sections
- **Breadcrumbs**: Context-aware breadcrumb navigation for deep pages
- **Quick Actions**: Dashboard cards for major features
- **Responsive**: Mobile-first design with breakpoints

### Forms and Inputs
- **Assessment Forms**: Single-page interface with real-time validation
- **Dropdown Selections**: Searchable lesson dropdowns with clear labeling
- **Confidence Selection**: 3-button interface (1, 2, 3) for quick assessment
- **Notes Fields**: Optional textareas with character count

### Feedback Patterns
- **Success**: Visual confirmation of saved assessments
- **Errors**: Inline validation with clear resolution steps
- **Loading**: Skeleton screens and progress indicators
- **Offline**: Warning message with offline status indicator

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Semantic HTML with ARIA labels
- **Visual**: High contrast, scalable text, clear focus indicators
- **Touch**: Large click targets for mobile interfaces

---

## Future Features (Roadmap)

### Phase 1: Backend Integration (Q2 2024)
- [ ] Next.js API routes for CRUD operations
- [ ] PostgreSQL database with Prisma ORM
- [ ] NextAuth.js authentication
- [ ] User roles and permissions
- [ ] Data migration from localStorage to database

### Phase 2: Enhanced Features (Q3 2024)
- [ ] Lesson planning interface (Plan domain implementation)
- [ ] Progress analytics and visualization
- [ ] Student progress tracking over time
- [ ] Export session data (CSV, PDF)
- [ ] Multi-curriculum support (expand beyond GC2/BBS1)

### Phase 3: Collaboration (Q4 2024)
- [ ] Multi-coach session support
- [ ] Real-time observation sharing (WebSocket)
- [ ] Collaborative lesson planning
- [ ] Team teaching coordination

### Phase 4: Mobile & PWA (2025)
- [ ] Progressive Web App (PWA) capabilities
- [ ] Offline-first architecture
- [ ] Mobile-optimized UI
- [ ] Push notifications for session reminders

### Phase 5: Advanced Analytics (2025)
- [ ] Skill development trends
- [ ] Curriculum effectiveness metrics
- [ ] Coach performance insights
- [ ] Predictive recommendations based on progress

---

## Constraints and Assumptions

### Technical Constraints
- **Client-Side Only**: Currently no backend API (localStorage only)
- **Browser Storage**: Limited by localStorage quota (typically 5-10MB)
- **No Database**: All data persistence via localStorage
- **Static Curriculum**: Curriculum data loaded from TypeScript constants

### Business Constraints
- **Single User**: No multi-user support yet
- **No Authentication**: All data stored locally without user accounts
- **No Cloud Sync**: Data only on local device

### Assumptions
- Coaches have modern browsers with localStorage support
- Coaches primarily use desktop/laptop during sessions
- Internet connection not required for core functionality
- Single coach per device (no concurrent multi-coach sessions)

---

## Open Questions and Decisions Needed

### Technical Decisions
- [ ] Database schema finalization for future migration
- [ ] Authentication provider selection (Google OAuth, email/password, etc.)
- [ ] Real-time collaboration architecture (WebSocket vs. Server-Sent Events)
- [ ] Mobile app strategy (PWA vs. native vs. hybrid)

### Product Decisions
- [ ] Assessment granularity: step-level vs. slice-level default
- [ ] Progress visualization: charts, graphs, or narrative reports
- [ ] Student communication: in-app messaging or external integration
- [ ] Curriculum updates: manual migration vs. automated sync

---

## Acceptance Criteria

### Curriculum Browser
- ✅ Displays all lessons in responsive grid
- ✅ Lesson cards expand to show slices
- ✅ Slice accordions show step-by-step instructions
- ✅ Bonus slices clearly distinguished
- ✅ Handles missing or incomplete data gracefully

### Coaching Session
- ✅ Auto-creates new session on page load
- ✅ Lesson dropdown populates with all lessons
- ✅ Assessment cards allow confidence selection (1-3)
- ✅ Observations persist to localStorage immediately
- ✅ Session persists across page refreshes

### Session History
- ✅ Lists all past sessions chronologically
- ✅ Displays session metadata (date, duration, type)
- ✅ Shows observation count per session
- ✅ Handles corrupted or missing session data

### Student Management
- ✅ Lists all students in roster
- ✅ Allows creating new students
- ✅ Displays student detail view
- ✅ Persists student data to localStorage

---

## Appendix

### Related Documentation
- `ARCHITECTURE.md`: Technical architecture and system design
- `DOMAIN_MODEL.md`: Detailed domain model and business rules
- `UX_FLOWS.md`: User experience flow documentation
- `AGENTS.md`: AI agent instructions for development

### Key Files Reference
- Domain Types: `core/domain/*.types.ts`
- Services: `core/services/*.ts`
- UI Components: `features/*/*.tsx`
- Pages: `app/(main)/*/page.tsx`
- Curriculum Data: `data/*.curriculum.v1.ts`

---

**Document Owner**: Product Team  
**Review Cycle**: Monthly  
**Next Review**: [Date]


