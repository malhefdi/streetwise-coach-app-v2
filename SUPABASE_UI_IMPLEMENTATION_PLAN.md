# Supabase Integration & UI Enhancement Plan

**Project:** Streetwise Coach App v2
**Version:** 2.0.0
**Date:** November 7, 2025
**Status:** Implementation Planning

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Supabase Integration Strategy](#supabase-integration-strategy)
3. [UI Enhancement Strategy](#ui-enhancement-strategy)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Technical Specifications](#technical-specifications)
6. [Migration Strategy](#migration-strategy)
7. [Code Examples](#code-examples)

---

## Executive Summary

This document outlines the comprehensive plan to:
1. **Migrate from localStorage to Supabase** - Full backend integration with PostgreSQL, authentication, and real-time features
2. **Enhance UI with PrimeReact components** - Professional design system while maintaining Sakai template aesthetics
3. **Maintain backward compatibility** - Graceful migration path for existing users

### Key Benefits

| Feature | Current State | With Supabase + Enhanced UI |
|---------|--------------|----------------------------|
| **Data Persistence** | localStorage (5-10 MB) | PostgreSQL (unlimited) |
| **Multi-User** | ❌ Single user only | ✅ Multi-user with auth |
| **Real-Time** | ❌ No sync | ✅ Real-time updates |
| **Security** | ⚠️ Client-side only | ✅ Server-side validation |
| **UI Polish** | 🟡 Basic components | ✅ Professional design system |
| **Offline Support** | ✅ Full (localStorage) | ✅ Maintained (Supabase cache) |

---

## Supabase Integration Strategy

### 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Components │→ │  Services  │→ │ Supabase   │        │
│  │   (UI)     │  │  (Logic)   │  │   Client   │        │
│  └────────────┘  └────────────┘  └──────┬─────┘        │
└──────────────────────────────────────────┼──────────────┘
                                            ↓
┌──────────────────────────────────────────────────────────┐
│                     Supabase Backend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │     Auth     │  │   Storage    │  │
│  │   Database   │  │   (NextAuth) │  │  (Files/PDF) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Row Level   │  │   Realtime   │  │  Edge Fns    │  │
│  │   Security   │  │  (WebSocket) │  │  (Serverless)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 2. Supabase Setup

#### 2.1 Installation

```bash
# Install Supabase client
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Install authentication
npm install @supabase/auth-ui-react @supabase/auth-ui-shared

# Install additional utilities
npm install date-fns uuid
```

#### 2.2 Environment Configuration

```bash
# .env.local (DO NOT COMMIT)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Builder.io (existing)
NEXT_PUBLIC_BUILDER_API_KEY=your-builder-key
```

**Security Note:** Update `.gitignore`:
```
.env
.env.local
.env*.local
.env.production
```

#### 2.3 Supabase Client Setup

**File:** `core/services/supabase/client.ts`

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// Client-side Supabase client (for use client components)
export const createClient = () =>
    createClientComponentClient<Database>();

// Singleton instance
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
    if (!supabaseClient) {
        supabaseClient = createClient();
    }
    return supabaseClient;
}
```

**File:** `core/services/supabase/server.ts`

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// Server-side Supabase client (for server components & API routes)
export const createServerClient = () =>
    createServerComponentClient<Database>({ cookies });
```

### 3. Database Schema

#### 3.1 Core Tables

**Schema File:** `supabase/migrations/001_initial_schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('coach', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    nickname TEXT,
    phone TEXT,
    email TEXT,
    rank TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coaching sessions table
CREATE TABLE coaching_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_date TIMESTAMPTZ NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('private', 'group')),
    duration_sec INTEGER,
    coach_notes TEXT,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session students (many-to-many)
CREATE TABLE session_students (
    session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, student_id)
);

-- Observations table (event sourcing)
CREATE TABLE observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
    observation_type TEXT NOT NULL CHECK (observation_type IN ('step-assessed', 'slice-assessed', 'timer')),

    -- Assessment fields (nullable for timer events)
    target_id TEXT,  -- stepId or sliceId
    confidence SMALLINT CHECK (confidence IN (1, 2, 3)),
    next_action TEXT CHECK (next_action IN ('Teach', 'Review', 'Reteach')),
    notes TEXT,

    -- Timer fields (nullable for assessment events)
    timer_label TEXT,
    timer_start BIGINT,
    timer_stop BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plan items table
CREATE TABLE plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('curriculum', 'custom')),

    -- Curriculum reference (nullable for custom items)
    lesson_id TEXT,
    slice_id TEXT,
    step_id TEXT,

    -- Custom item (nullable for curriculum items)
    custom_text TEXT,

    -- Metadata
    priority SMALLINT CHECK (priority IN (1, 2, 3)),
    est_mins INTEGER,
    tags TEXT[],
    order_index INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_students_coach ON students(coach_id);
CREATE INDEX idx_sessions_coach ON coaching_sessions(coach_id);
CREATE INDEX idx_sessions_date ON coaching_sessions(session_date DESC);
CREATE INDEX idx_observations_session ON observations(session_id);
CREATE INDEX idx_plans_coach ON plans(coach_id);
CREATE INDEX idx_plan_items_plan ON plan_items(plan_id, order_index);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_sessions_updated_at BEFORE UPDATE ON coaching_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3.2 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Students: Coaches can only access their own students
CREATE POLICY "Coaches can view own students" ON students
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create own students" ON students
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own students" ON students
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own students" ON students
    FOR DELETE USING (auth.uid() = coach_id);

-- Coaching Sessions: Coaches can only access their own sessions
CREATE POLICY "Coaches can view own sessions" ON coaching_sessions
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create own sessions" ON coaching_sessions
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own sessions" ON coaching_sessions
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own sessions" ON coaching_sessions
    FOR DELETE USING (auth.uid() = coach_id);

-- Session Students: Coaches can manage through session ownership
CREATE POLICY "Session students viewable by coach" ON session_students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM coaching_sessions
            WHERE id = session_students.session_id
            AND coach_id = auth.uid()
        )
    );

CREATE POLICY "Session students manageable by coach" ON session_students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM coaching_sessions
            WHERE id = session_students.session_id
            AND coach_id = auth.uid()
        )
    );

-- Observations: Coaches can manage through session ownership
CREATE POLICY "Observations viewable by coach" ON observations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM coaching_sessions
            WHERE id = observations.session_id
            AND coach_id = auth.uid()
        )
    );

CREATE POLICY "Observations manageable by coach" ON observations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM coaching_sessions
            WHERE id = observations.session_id
            AND coach_id = auth.uid()
        )
    );

-- Plans: Coaches can only access their own plans
CREATE POLICY "Coaches can view own plans" ON plans
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create own plans" ON plans
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own plans" ON plans
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own plans" ON plans
    FOR DELETE USING (auth.uid() = coach_id);

-- Plan Items: Coaches can manage through plan ownership
CREATE POLICY "Plan items viewable by coach" ON plan_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM plans
            WHERE id = plan_items.plan_id
            AND coach_id = auth.uid()
        )
    );

CREATE POLICY "Plan items manageable by coach" ON plan_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM plans
            WHERE id = plan_items.plan_id
            AND coach_id = auth.uid()
        )
    );
```

#### 3.3 Type Generation

```bash
# Generate TypeScript types from database schema
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

### 4. Authentication Strategy

#### 4.1 Auth Configuration

**File:** `app/(auth)/login/page.tsx`

```typescript
'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { getSupabaseClient } from '@/core/services/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const supabase = getSupabaseClient();
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                router.push('/dashboard');
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, router]);

    return (
        <div className="flex align-items-center justify-content-center min-h-screen">
            <div className="surface-card p-4 shadow-2 border-round w-full lg:w-6">
                <div className="text-center mb-5">
                    <div className="text-900 text-3xl font-medium mb-3">
                        Streetwise Coach
                    </div>
                    <span className="text-600 font-medium line-height-3">
                        Sign in to your account
                    </span>
                </div>

                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#6366f1',
                                    brandAccent: '#4f46e5',
                                }
                            }
                        }
                    }}
                    providers={['google', 'github']}
                    redirectTo={`${window.location.origin}/auth/callback`}
                />
            </div>
        </div>
    );
}
```

#### 4.2 Auth Callback Handler

**File:** `app/auth/callback/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const supabase = createRouteHandlerClient({ cookies });
        await supabase.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(requestUrl.origin);
}
```

#### 4.3 Middleware for Protected Routes

**File:** `middleware.ts`

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Redirect to login if not authenticated
    if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Redirect to dashboard if authenticated and on login page
    if (session && req.nextUrl.pathname.startsWith('/auth/login')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return res;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 5. Service Layer Refactoring

#### 5.1 Students Service with Supabase

**File:** `core/services/studentsService.ts` (UPDATED)

```typescript
import { getSupabaseClient } from './supabase/client';
import type { Student, StudentId } from '@/core/domain/students.types';
import type { Database } from '@/types/supabase';

type DbStudent = Database['public']['Tables']['students']['Row'];
type DbStudentInsert = Database['public']['Tables']['students']['Insert'];

// Map database row to domain model
function toDomain(row: DbStudent): Student {
    return {
        id: row.id,
        fullName: row.full_name,
        nickname: row.nickname ?? undefined,
        phone: row.phone ?? undefined,
        email: row.email ?? undefined,
        rank: row.rank ?? undefined,
        notes: row.notes ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// Map domain model to database insert
function toInsert(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>, coachId: string): DbStudentInsert {
    return {
        coach_id: coachId,
        full_name: student.fullName,
        nickname: student.nickname,
        phone: student.phone,
        email: student.email,
        rank: student.rank,
        notes: student.notes,
    };
}

export async function listStudents(): Promise<Student[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

    if (error) throw error;
    return data.map(toDomain);
}

export async function getStudent(id: StudentId): Promise<Student | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }

    return toDomain(data);
}

export async function createStudent(
    student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Student> {
    const supabase = getSupabaseClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('students')
        .insert(toInsert(student, user.id))
        .select()
        .single();

    if (error) throw error;
    return toDomain(data);
}

export async function updateStudent(
    id: StudentId,
    patch: Partial<Student>
): Promise<Student> {
    const supabase = getSupabaseClient();

    const updates: Partial<DbStudentInsert> = {};
    if (patch.fullName) updates.full_name = patch.fullName;
    if (patch.nickname !== undefined) updates.nickname = patch.nickname;
    if (patch.phone !== undefined) updates.phone = patch.phone;
    if (patch.email !== undefined) updates.email = patch.email;
    if (patch.rank !== undefined) updates.rank = patch.rank;
    if (patch.notes !== undefined) updates.notes = patch.notes;

    const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return toDomain(data);
}

export async function deleteStudent(id: StudentId): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
```

#### 5.2 Session Service with Supabase

**File:** `core/services/sessionService.ts` (UPDATED)

```typescript
import { getSupabaseClient } from './supabase/client';
import type { CoachingSession, Observation } from '@/core/domain/session.types';
import type { Database } from '@/types/supabase';

type DbSession = Database['public']['Tables']['coaching_sessions']['Row'];
type DbObservation = Database['public']['Tables']['observations']['Row'];

// Map database rows to domain model
async function toDomain(session: DbSession): Promise<CoachingSession> {
    const supabase = getSupabaseClient();

    // Fetch observations
    const { data: obsData } = await supabase
        .from('observations')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

    const events: Observation[] = (obsData || []).map(mapObservation);

    // Fetch student IDs
    const { data: studentData } = await supabase
        .from('session_students')
        .select('student_id')
        .eq('session_id', session.id);

    const studentIds = (studentData || []).map(s => s.student_id);

    return {
        id: session.id,
        when: session.session_date,
        kind: session.kind as 'private' | 'group',
        studentIds,
        planId: session.plan_id ?? undefined,
        events,
        durationSec: session.duration_sec ?? undefined,
        coachNotes: session.coach_notes ?? '',
    };
}

function mapObservation(obs: DbObservation): Observation {
    if (obs.observation_type === 'timer') {
        return {
            type: 'timer',
            label: obs.timer_label!,
            start: obs.timer_start!,
            stop: obs.timer_stop!,
        };
    } else if (obs.observation_type === 'step-assessed') {
        return {
            type: 'step-assessed',
            stepId: obs.target_id!,
            confidence: obs.confidence as 1 | 2 | 3,
            nextAction: obs.next_action as 'Teach' | 'Review' | 'Reteach' | undefined,
            notes: obs.notes ?? undefined,
        };
    } else {
        return {
            type: 'slice-assessed',
            sliceId: obs.target_id!,
            confidence: obs.confidence as 1 | 2 | 3,
            nextAction: obs.next_action as 'Teach' | 'Review' | 'Reteach' | undefined,
            notes: obs.notes ?? undefined,
        };
    }
}

export async function startSession(seed?: Partial<CoachingSession>): Promise<CoachingSession> {
    const supabase = getSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('coaching_sessions')
        .insert({
            coach_id: user.id,
            session_date: seed?.when ?? new Date().toISOString(),
            kind: seed?.kind ?? 'private',
            plan_id: seed?.planId,
            coach_notes: seed?.coachNotes ?? '',
        })
        .select()
        .single();

    if (error) throw error;

    // Insert student associations
    if (seed?.studentIds && seed.studentIds.length > 0) {
        await supabase
            .from('session_students')
            .insert(seed.studentIds.map(sid => ({
                session_id: data.id,
                student_id: sid,
            })));
    }

    return toDomain(data);
}

export async function appendObservation(
    sessionId: string,
    obs: Observation
): Promise<void> {
    const supabase = getSupabaseClient();

    let insert: any = {
        session_id: sessionId,
        observation_type: obs.type,
    };

    if (obs.type === 'timer') {
        insert.timer_label = obs.label;
        insert.timer_start = obs.start;
        insert.timer_stop = obs.stop;
    } else if (obs.type === 'step-assessed') {
        insert.target_id = obs.stepId;
        insert.confidence = obs.confidence;
        insert.next_action = obs.nextAction;
        insert.notes = obs.notes;
    } else {
        insert.target_id = obs.sliceId;
        insert.confidence = obs.confidence;
        insert.next_action = obs.nextAction;
        insert.notes = obs.notes;
    }

    const { error } = await supabase
        .from('observations')
        .insert(insert);

    if (error) throw error;
}

export async function listSessions(): Promise<CoachingSession[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .order('session_date', { ascending: false });

    if (error) throw error;

    return Promise.all(data.map(toDomain));
}

export async function getSession(id: string): Promise<CoachingSession | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return toDomain(data);
}
```

### 6. Real-Time Features

#### 6.1 Real-Time Observations

```typescript
// features/session/useRealtimeObservations.ts
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/core/services/supabase/client';
import type { Observation } from '@/core/domain/session.types';

export function useRealtimeObservations(sessionId: string) {
    const [observations, setObservations] = useState<Observation[]>([]);
    const supabase = getSupabaseClient();

    useEffect(() => {
        // Subscribe to new observations
        const channel = supabase
            .channel(`session:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'observations',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    const obs = mapObservation(payload.new);
                    setObservations((prev) => [...prev, obs]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, supabase]);

    return observations;
}
```

---

## UI Enhancement Strategy

### 1. Design System Principles

Following **Sakai Template** design language:
- **Clean, minimal aesthetic** - Ample whitespace, subtle shadows
- **Indigo accent color** (`#6366f1`) - Primary brand color
- **Surface cards** - Elevated panels with shadow
- **Consistent typography** - Defined text hierarchy
- **Responsive grid** - PrimeFlex utilities

### 2. Component Enhancement Plan

#### 2.1 Dashboard Enhancements

**Current Issue:** Basic dashboard with simple cards

**Enhancement:**

**File:** `app/(main)/dashboard/page.tsx` (ENHANCED)

```typescript
'use client';

import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listSessions } from '@/core/services/sessionService';
import { listStudents } from '@/core/services/studentsService';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalSessions: 0,
        thisWeekSessions: 0,
    });
    const [recentSessions, setRecentSessions] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        const [sessions, students] = await Promise.all([
            listSessions(),
            listStudents(),
        ]);

        const thisWeek = sessions.filter(s =>
            new Date(s.when) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );

        setStats({
            totalStudents: students.length,
            totalSessions: sessions.length,
            thisWeekSessions: thisWeek.length,
        });

        setRecentSessions(sessions.slice(0, 5));
    }

    return (
        <div className="grid">
            {/* Stats Cards */}
            <div className="col-12 lg:col-6 xl:col-4">
                <div className="surface-card shadow-2 p-3 border-round">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">
                                Total Students
                            </span>
                            <div className="text-900 font-medium text-xl">
                                {stats.totalStudents}
                            </div>
                        </div>
                        <div
                            className="flex align-items-center justify-content-center bg-blue-100 border-round"
                            style={{ width: '2.5rem', height: '2.5rem' }}
                        >
                            <i className="pi pi-users text-blue-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">
                        <i className="pi pi-arrow-up text-xs" /> Active roster
                    </span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-4">
                <div className="surface-card shadow-2 p-3 border-round">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">
                                Total Sessions
                            </span>
                            <div className="text-900 font-medium text-xl">
                                {stats.totalSessions}
                            </div>
                        </div>
                        <div
                            className="flex align-items-center justify-content-center bg-orange-100 border-round"
                            style={{ width: '2.5rem', height: '2.5rem' }}
                        >
                            <i className="pi pi-calendar text-orange-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-500 font-medium">All time</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-4">
                <div className="surface-card shadow-2 p-3 border-round">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">
                                This Week
                            </span>
                            <div className="text-900 font-medium text-xl">
                                {stats.thisWeekSessions}
                            </div>
                        </div>
                        <div
                            className="flex align-items-center justify-content-center bg-cyan-100 border-round"
                            style={{ width: '2.5rem', height: '2.5rem' }}
                        >
                            <i className="pi pi-chart-line text-cyan-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">
                        {stats.thisWeekSessions > 0 ? '+' : ''}{stats.thisWeekSessions} sessions
                    </span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="col-12 xl:col-6">
                <Card title="Quick Actions" className="shadow-2">
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <Button
                                label="Start Session"
                                icon="pi pi-play"
                                className="w-full p-button-lg"
                                onClick={() => router.push('/coach')}
                            />
                        </div>
                        <div className="col-12 md:col-6">
                            <Button
                                label="View Curriculum"
                                icon="pi pi-book"
                                className="w-full p-button-lg p-button-outlined"
                                onClick={() => router.push('/curriculum')}
                            />
                        </div>
                        <div className="col-12 md:col-6">
                            <Button
                                label="Add Student"
                                icon="pi pi-user-plus"
                                className="w-full p-button-lg p-button-outlined"
                                onClick={() => router.push('/students')}
                            />
                        </div>
                        <div className="col-12 md:col-6">
                            <Button
                                label="View History"
                                icon="pi pi-history"
                                className="w-full p-button-lg p-button-outlined"
                                onClick={() => router.push('/history')}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Sessions */}
            <div className="col-12 xl:col-6">
                <Card title="Recent Sessions" className="shadow-2">
                    <DataTable
                        value={recentSessions}
                        rows={5}
                        emptyMessage="No sessions yet"
                    >
                        <Column field="when" header="Date" body={(row) =>
                            new Date(row.when).toLocaleDateString()
                        } />
                        <Column field="kind" header="Type" />
                        <Column field="events.length" header="Observations" />
                    </DataTable>
                </Card>
            </div>
        </div>
    );
}
```

#### 2.2 Enhanced Student List

**File:** `features/students/StudentList.tsx` (ENHANCED)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { Avatar } from 'primereact/avatar';
import { useRouter } from 'next/navigation';
import { listStudents, createStudent, deleteStudent } from '@/core/services/studentsService';
import type { Student } from '@/core/domain/students.types';

export default function StudentList() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    useEffect(() => {
        loadStudents();
    }, []);

    async function loadStudents() {
        setLoading(true);
        try {
            const data = await listStudents();
            setStudents(data);
        } finally {
            setLoading(false);
        }
    }

    const leftToolbarTemplate = () => (
        <div className="flex flex-wrap gap-2">
            <Button
                label="New Student"
                icon="pi pi-plus"
                severity="success"
                onClick={() => setShowDialog(true)}
            />
        </div>
    );

    const rightToolbarTemplate = () => (
        <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
                type="search"
                placeholder="Search students..."
                onInput={(e) => setGlobalFilter(e.currentTarget.value)}
            />
        </span>
    );

    const nameBodyTemplate = (rowData: Student) => (
        <div className="flex align-items-center gap-2">
            <Avatar
                label={rowData.fullName.charAt(0)}
                size="large"
                shape="circle"
                style={{ backgroundColor: '#6366f1', color: '#ffffff' }}
            />
            <div>
                <div className="font-bold">{rowData.fullName}</div>
                {rowData.nickname && (
                    <div className="text-sm text-600">"{rowData.nickname}"</div>
                )}
            </div>
        </div>
    );

    const rankBodyTemplate = (rowData: Student) => {
        if (!rowData.rank) return <Tag value="Unranked" severity="info" />;

        const color = rowData.rank.includes('Blue') ? 'primary' :
                     rowData.rank.includes('White') ? 'secondary' : 'success';

        return <Tag value={rowData.rank} severity={color} />;
    };

    const actionBodyTemplate = (rowData: Student) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-eye"
                rounded
                outlined
                className="p-button-sm"
                onClick={() => router.push(`/students/${rowData.id}`)}
            />
            <Button
                icon="pi pi-trash"
                rounded
                outlined
                severity="danger"
                className="p-button-sm"
                onClick={() => handleDelete(rowData)}
            />
        </div>
    );

    async function handleDelete(student: Student) {
        if (confirm(`Delete ${student.fullName}?`)) {
            await deleteStudent(student.id);
            loadStudents();
        }
    }

    return (
        <div className="card">
            <Toolbar
                className="mb-4"
                left={leftToolbarTemplate}
                right={rightToolbarTemplate}
            />

            <DataTable
                value={students}
                loading={loading}
                globalFilter={globalFilter}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                emptyMessage="No students found"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} students"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            >
                <Column field="fullName" header="Name" body={nameBodyTemplate} sortable />
                <Column field="email" header="Email" sortable />
                <Column field="phone" header="Phone" />
                <Column field="rank" header="Rank" body={rankBodyTemplate} sortable />
                <Column body={actionBodyTemplate} exportable={false} style={{ width: '8rem' }} />
            </DataTable>

            {/* Add Student Dialog */}
            <Dialog
                visible={showDialog}
                style={{ width: '450px' }}
                header="Add New Student"
                modal
                className="p-fluid"
                onHide={() => setShowDialog(false)}
            >
                {/* Form fields here */}
            </Dialog>
        </div>
    );
}
```

#### 2.3 Enhanced Coaching Session UI

**File:** `features/session/CoachSessionView.tsx` (ENHANCED)

```typescript
'use client';

import { useState, useMemo } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Chip } from 'primereact/chip';
import { Panel } from 'primereact/panel';
import { ProgressBar } from 'primereact/progressbar';
import { Badge } from 'primereact/badge';
import SliceAssessmentCard from './SliceAssessmentCard';
import { getCurriculum } from '@/core/services/curriculumService';
import { startSession, appendObservation } from '@/core/services/sessionService';
import type { Confidence } from '@/core/domain/session.types';
import type { Lesson } from '@/core/domain/curriculum.types';

export default function CoachSessionView() {
    const [selectedCurriculum, setSelectedCurriculum] = useState('gc2');
    const curriculum = getCurriculum(selectedCurriculum);
    const lessons = curriculum.lessons;

    const [lessonId, setLessonId] = useState(lessons[0]?.id);
    const lesson: Lesson | undefined = useMemo(
        () => lessons.find(l => l.id === lessonId),
        [lessons, lessonId]
    );

    const [sessionId] = useState(() => startSession({ kind: 'private' }).id);
    const [assessedSlices, setAssessedSlices] = useState<Set<string>>(new Set());

    const slices = useMemo(() => {
        if (!lesson) return [];
        return [...(lesson.slices ?? []), ...(lesson.bonusSlices ?? [])];
    }, [lesson]);

    const progress = slices.length > 0
        ? (assessedSlices.size / slices.length) * 100
        : 0;

    const handleAssess = (sliceId: string) => (c: Confidence, notes?: string) => {
        appendObservation(sessionId, {
            type: 'slice-assessed',
            sliceId,
            confidence: c,
            notes,
        });
        setAssessedSlices(prev => new Set([...prev, sliceId]));
    };

    const curriculumOptions = [
        { label: 'Gracie Combatives 2.0', value: 'gc2', icon: 'pi pi-shield' },
        { label: 'Blue Belt Stripe 1', value: 'bbs1', icon: 'pi pi-star' }
    ];

    const handleCurriculumChange = (e: any) => {
        setSelectedCurriculum(e.value);
        const newCurriculum = getCurriculum(e.value);
        setLessonId(newCurriculum.lessons[0]?.id);
        setAssessedSlices(new Set());
    };

    return (
        <div className="grid">
            <div className="col-12">
                <Card className="shadow-2">
                    {/* Header */}
                    <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-play-circle text-4xl text-primary" />
                            <div>
                                <h2 className="m-0 text-2xl">Coaching Session</h2>
                                <p className="text-600 m-0">
                                    {new Date().toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                        <Button
                            label="End Session"
                            icon="pi pi-stop-circle"
                            severity="danger"
                            outlined
                        />
                    </div>

                    <Divider />

                    {/* Curriculum & Lesson Selection */}
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <label className="block text-900 font-medium mb-2">
                                Curriculum
                            </label>
                            <Dropdown
                                value={selectedCurriculum}
                                onChange={handleCurriculumChange}
                                options={curriculumOptions}
                                optionLabel="label"
                                className="w-full"
                            />
                        </div>

                        <div className="col-12 md:col-6">
                            <label className="block text-900 font-medium mb-2">
                                Lesson
                            </label>
                            <Dropdown
                                value={lessonId}
                                onChange={(e) => {
                                    setLessonId(e.value);
                                    setAssessedSlices(new Set());
                                }}
                                options={lessons.map(l => ({
                                    label: `L${l.lessonNumber} — ${l.technique}`,
                                    value: l.id
                                }))}
                                className="w-full"
                                filter
                                filterBy="label"
                                placeholder="Select a lesson"
                            />
                        </div>
                    </div>

                    {/* Progress */}
                    {lesson && slices.length > 0 && (
                        <div className="mt-4">
                            <div className="flex justify-content-between mb-2">
                                <span className="text-600">
                                    Assessment Progress
                                </span>
                                <span className="text-900 font-semibold">
                                    {assessedSlices.size} / {slices.length}
                                </span>
                            </div>
                            <ProgressBar value={progress} />
                        </div>
                    )}

                    <Divider />

                    {/* Lesson Info */}
                    {lesson && (
                        <Panel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <Chip label={`Lesson ${lesson.lessonNumber}`} />
                                    <span className="text-xl font-bold">
                                        {lesson.technique}
                                    </span>
                                </div>
                            }
                            toggleable
                            collapsed={false}
                            className="mb-4"
                        >
                            {lesson.overview && (
                                <p className="text-700 line-height-3">
                                    {lesson.overview}
                                </p>
                            )}

                            {lesson.position && (
                                <div className="flex align-items-center gap-2 mt-3">
                                    <Badge value="Position" severity="info" />
                                    <span className="text-600">{lesson.position}</span>
                                </div>
                            )}
                        </Panel>
                    )}

                    {/* Assessment Cards */}
                    {slices.map((s) => (
                        <SliceAssessmentCard
                            key={s.id}
                            title={`Slice ${s.sliceNumber}${s.title ? `: ${s.title}` : ''}`}
                            targetId={s.id}
                            mode="slice"
                            onAssess={handleAssess(s.id)}
                            assessed={assessedSlices.has(s.id)}
                        />
                    ))}

                    {(!lesson || slices.length === 0) && (
                        <div className="text-center p-5">
                            <i className="pi pi-info-circle text-5xl text-400 mb-3" />
                            <p className="text-600 text-xl">
                                Select a lesson to begin assessment
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
```

#### 2.4 Enhanced Assessment Card

**File:** `features/session/SliceAssessmentCard.tsx` (ENHANCED)

```typescript
'use client';

import { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';
import type { Confidence } from '@/core/domain/session.types';

type Props = {
    title: string;
    targetId: string;
    mode: 'slice' | 'step';
    onAssess: (c: Confidence, notes?: string) => void;
    assessed?: boolean;
};

const confidenceOptions = [
    { label: '1 - Struggling', value: 1, icon: 'pi pi-times-circle', color: 'danger' },
    { label: '2 - Progressing', value: 2, icon: 'pi pi-minus-circle', color: 'warning' },
    { label: '3 - Mastered', value: 3, icon: 'pi pi-check-circle', color: 'success' },
];

export default function SliceAssessmentCard({ title, targetId, mode, onAssess, assessed }: Props) {
    const [confidence, setConfidence] = useState<Confidence | null>(null);
    const [notes, setNotes] = useState('');
    const [expanded, setExpanded] = useState(true);

    const handleSubmit = () => {
        if (confidence) {
            onAssess(confidence, notes || undefined);
            setNotes('');
            setConfidence(null);
            setExpanded(false);
        }
    };

    const cardHeader = (
        <div className="flex align-items-center justify-content-between">
            <div className="flex align-items-center gap-2">
                <i className={`pi ${mode === 'slice' ? 'pi-th-large' : 'pi-list'} text-primary`} />
                <span className="font-semibold">{title}</span>
            </div>
            {assessed && (
                <Badge value="Assessed" severity="success" />
            )}
        </div>
    );

    return (
        <Card
            title={cardHeader}
            className="mb-3 shadow-1"
            style={{
                borderLeft: assessed ? '4px solid var(--green-500)' : '4px solid var(--surface-border)'
            }}
        >
            {expanded ? (
                <>
                    <div className="text-sm text-600 mb-3">
                        <span className="font-medium">ID:</span> {targetId}
                    </div>

                    <Divider align="left">
                        <span className="text-sm">Confidence Level</span>
                    </Divider>

                    <div className="grid mb-4">
                        {confidenceOptions.map((opt) => (
                            <div key={opt.value} className="col-12 md:col-4">
                                <Button
                                    label={opt.label}
                                    icon={opt.icon}
                                    severity={opt.color as any}
                                    outlined={confidence !== opt.value}
                                    className="w-full"
                                    onClick={() => setConfidence(opt.value as Confidence)}
                                />
                            </div>
                        ))}
                    </div>

                    <Divider align="left">
                        <span className="text-sm">Notes (Optional)</span>
                    </Divider>

                    <InputTextarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full"
                        placeholder="Add observations, corrections needed, or next steps..."
                    />

                    <div className="flex justify-content-end gap-2 mt-3">
                        <Button
                            label="Cancel"
                            icon="pi pi-times"
                            text
                            onClick={() => {
                                setConfidence(null);
                                setNotes('');
                            }}
                        />
                        <Button
                            label="Record Assessment"
                            icon="pi pi-check"
                            disabled={!confidence}
                            onClick={handleSubmit}
                        />
                    </div>
                </>
            ) : (
                <div className="text-center">
                    <Button
                        label="Re-assess"
                        icon="pi pi-replay"
                        text
                        onClick={() => setExpanded(true)}
                    />
                </div>
            )}
        </Card>
    );
}
```

### 3. Theme Customization

#### 3.1 Custom Theme Variables

**File:** `styles/theme/custom-theme.scss`

```scss
/* Streetwise Coach Custom Theme */
/* Extends Sakai Lara Light Indigo */

:root {
    /* Primary Colors - Indigo */
    --primary-50: #eef2ff;
    --primary-100: #e0e7ff;
    --primary-200: #c7d2fe;
    --primary-300: #a5b4fc;
    --primary-400: #818cf8;
    --primary-500: #6366f1;
    --primary-600: #4f46e5;
    --primary-700: #4338ca;
    --primary-800: #3730a3;
    --primary-900: #312e81;

    /* Surface Colors */
    --surface-0: #ffffff;
    --surface-50: #fafafa;
    --surface-100: #f5f5f5;
    --surface-200: #eeeeee;
    --surface-300: #e0e0e0;
    --surface-400: #bdbdbd;
    --surface-500: #9e9e9e;
    --surface-600: #757575;
    --surface-700: #616161;
    --surface-800: #424242;
    --surface-900: #212121;

    /* Text Colors */
    --text-color: rgba(0, 0, 0, 0.87);
    --text-color-secondary: rgba(0, 0, 0, 0.6);

    /* Border Radius */
    --border-radius: 6px;
    --border-radius-lg: 10px;

    /* Shadows */
    --shadow-1: 0 2px 4px -1px rgba(0,0,0,.06), 0 4px 6px -1px rgba(0,0,0,.1);
    --shadow-2: 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05);
    --shadow-3: 0 20px 25px -5px rgba(0,0,0,.1), 0 10px 10px -5px rgba(0,0,0,.04);
}

/* Custom Component Styles */
.card {
    border-radius: var(--border-radius-lg);
    transition: box-shadow 0.3s ease;

    &:hover {
        box-shadow: var(--shadow-3);
    }
}

.p-button {
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-2);
    }
}

.p-datatable {
    .p-datatable-thead > tr > th {
        background: var(--surface-50);
        border-bottom: 2px solid var(--primary-500);
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.875rem;
        letter-spacing: 0.5px;
    }

    .p-datatable-tbody > tr {
        transition: background-color 0.3s ease;

        &:hover {
            background-color: var(--primary-50);
        }
    }
}

/* Dashboard Stats Cards */
.stat-card {
    border-radius: var(--border-radius-lg);
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-3);
    }
}

/* Session Progress */
.session-progress {
    .p-progressbar {
        height: 12px;
        border-radius: 6px;

        .p-progressbar-value {
            background: linear-gradient(90deg, var(--primary-500), var(--primary-300));
        }
    }
}
```

#### 3.2 Update Layout to Use Custom Theme

**File:** `app/layout.tsx` (UPDATE)

```typescript
'use client';
import { LayoutProvider } from '../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';
import '../styles/theme/custom-theme.scss'; // ADD THIS LINE

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    id="theme-css"
                    href={`/themes/lara-light-indigo/theme.css`}
                    rel="stylesheet"
                />
            </head>
            <body>
                <PrimeReactProvider>
                    <LayoutProvider>{children}</LayoutProvider>
                </PrimeReactProvider>
            </body>
        </html>
    );
}
```

### 4. Navigation Menu Cleanup

**File:** `layout/AppMenu.tsx` (CLEANED UP)

```typescript
'use client';

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'Coaching',
            items: [
                { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
                { label: 'Start Session', icon: 'pi pi-play-circle', to: '/coach' },
                { label: 'Session History', icon: 'pi pi-clock', to: '/history' },
            ]
        },
        {
            label: 'Resources',
            items: [
                { label: 'Curriculum', icon: 'pi pi-book', to: '/curriculum' },
                { label: 'Students', icon: 'pi pi-users', to: '/students' },
                { label: 'Lesson Plans', icon: 'pi pi-list', to: '/plans' },
            ]
        },
        {
            label: 'Account',
            items: [
                { label: 'Profile', icon: 'pi pi-user', to: '/profile' },
                { label: 'Settings', icon: 'pi pi-cog', to: '/settings' },
                { label: 'Sign Out', icon: 'pi pi-sign-out', to: '/auth/signout' },
            ]
        },
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => (
                    <AppMenuitem item={item} root={true} index={i} key={item.label} />
                ))}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goals:** Set up Supabase, authentication, basic schema

#### Tasks:
1. ✅ Create Supabase project
2. ✅ Configure environment variables
3. ✅ Run database migrations
4. ✅ Set up authentication (Google OAuth)
5. ✅ Implement middleware for route protection
6. ✅ Create Supabase client utilities

**Deliverables:**
- Working authentication flow
- Database tables with RLS policies
- Protected routes

**Estimated Time:** 20-30 hours

---

### Phase 2: Service Migration (Week 3-4)

**Goals:** Migrate services from localStorage to Supabase

#### Tasks:
1. ✅ Refactor `studentsService.ts` to use Supabase
2. ✅ Refactor `sessionService.ts` to use Supabase
3. ✅ Implement data migration script (localStorage → Supabase)
4. ✅ Add optimistic updates for better UX
5. ✅ Implement error boundaries
6. ✅ Add loading states

**Deliverables:**
- All services using Supabase
- Migration script for existing users
- Error handling and loading states

**Estimated Time:** 30-40 hours

---

### Phase 3: UI Enhancement (Week 5-6)

**Goals:** Implement professional UI with PrimeReact components

#### Tasks:
1. ✅ Enhanced Dashboard with stats cards
2. ✅ DataTable for student list with search/filter
3. ✅ Improved coaching session interface
4. ✅ Enhanced assessment cards with visual feedback
5. ✅ Custom theme styling
6. ✅ Responsive design improvements
7. ✅ Loading skeletons and animations

**Deliverables:**
- Professional dashboard
- Enhanced data tables
- Improved forms and inputs
- Custom theme

**Estimated Time:** 40-50 hours

---

### Phase 4: Real-Time Features (Week 7)

**Goals:** Add real-time collaboration features

#### Tasks:
1. ✅ Real-time session observations
2. ✅ Real-time student updates
3. ✅ Presence indicators (who's online)
4. ✅ Live session sharing (optional)

**Deliverables:**
- Real-time updates across clients
- Presence system

**Estimated Time:** 20-30 hours

---

### Phase 5: Testing & Deployment (Week 8)

**Goals:** Comprehensive testing and production deployment

#### Tasks:
1. ✅ Unit tests for services
2. ✅ Integration tests for Supabase queries
3. ✅ E2E tests for critical flows
4. ✅ Performance optimization
5. ✅ Security audit
6. ✅ Deploy to Vercel
7. ✅ Configure custom domain

**Deliverables:**
- 80%+ test coverage
- Production deployment
- Performance benchmarks

**Estimated Time:** 30-40 hours

---

## Migration Strategy

### Data Migration from localStorage to Supabase

**File:** `scripts/migrate-to-supabase.ts`

```typescript
import { getSupabaseClient } from '@/core/services/supabase/client';
import { storage } from '@/core/services/storageService';

export async function migrateLocalStorageToSupabase() {
    const supabase = getSupabaseClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('Starting migration...');

    // 1. Migrate Students
    const students = storage.get<any[]>('sw_students', []);
    console.log(`Found ${students.length} students to migrate`);

    for (const student of students) {
        const { error } = await supabase.from('students').insert({
            id: student.id,
            coach_id: user.id,
            full_name: student.fullName || student.name,
            nickname: student.nickname,
            phone: student.phone,
            email: student.email,
            rank: student.rank,
            notes: student.notes,
            created_at: student.createdAt,
            updated_at: student.updatedAt,
        });

        if (error) console.error('Error migrating student:', error);
    }

    // 2. Migrate Sessions
    const sessions = storage.get<any[]>('sw_sessions_v2', []);
    console.log(`Found ${sessions.length} sessions to migrate`);

    for (const session of sessions) {
        // Insert session
        const { data: newSession, error: sessionError } = await supabase
            .from('coaching_sessions')
            .insert({
                id: session.id,
                coach_id: user.id,
                session_date: session.when,
                kind: session.kind,
                duration_sec: session.durationSec,
                coach_notes: session.coachNotes,
                plan_id: session.planId,
            })
            .select()
            .single();

        if (sessionError) {
            console.error('Error migrating session:', sessionError);
            continue;
        }

        // Insert student associations
        if (session.studentIds && session.studentIds.length > 0) {
            const studentLinks = session.studentIds.map((sid: string) => ({
                session_id: newSession.id,
                student_id: sid,
            }));

            await supabase.from('session_students').insert(studentLinks);
        }

        // Insert observations
        if (session.events && session.events.length > 0) {
            for (const event of session.events) {
                let obsInsert: any = {
                    session_id: newSession.id,
                    observation_type: event.type,
                };

                if (event.type === 'timer') {
                    obsInsert.timer_label = event.label;
                    obsInsert.timer_start = event.start;
                    obsInsert.timer_stop = event.stop;
                } else {
                    const targetId = event.type === 'step-assessed'
                        ? event.stepId
                        : event.sliceId;

                    obsInsert.target_id = targetId;
                    obsInsert.confidence = event.confidence;
                    obsInsert.next_action = event.nextAction;
                    obsInsert.notes = event.notes;
                }

                await supabase.from('observations').insert(obsInsert);
            }
        }
    }

    console.log('Migration complete!');

    // Archive old localStorage data
    storage.set('sw_migrated_at', new Date().toISOString());
    storage.set('sw_backup_students', students);
    storage.set('sw_backup_sessions', sessions);

    console.log('Backup created in localStorage with keys:');
    console.log('- sw_backup_students');
    console.log('- sw_backup_sessions');
}
```

**Usage:**
```typescript
// Run migration from browser console or migration page
import { migrateLocalStorageToSupabase } from '@/scripts/migrate-to-supabase';
await migrateLocalStorageToSupabase();
```

---

## Technical Specifications

### Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| **First Contentful Paint** | < 1.5s | Code splitting, lazy loading |
| **Time to Interactive** | < 3s | SSR with Next.js |
| **Largest Contentful Paint** | < 2.5s | Image optimization, CDN |
| **Database Query Time** | < 100ms | Indexes, query optimization |
| **Real-Time Latency** | < 50ms | Supabase WebSocket |

### Security Requirements

1. **Authentication:** Google OAuth via Supabase Auth
2. **Authorization:** Row Level Security (RLS) policies
3. **Data Encryption:** At rest (Supabase) and in transit (HTTPS)
4. **Input Validation:** Zod schemas for all user inputs
5. **CSRF Protection:** Next.js built-in protection
6. **XSS Protection:** React JSX automatic escaping

### Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari/Chrome (last 2 versions)

---

## Conclusion

This implementation plan provides:

1. **Complete Supabase integration** - Full backend with PostgreSQL, auth, and real-time
2. **Professional UI enhancements** - PrimeReact components with Sakai design language
3. **Phased implementation** - 8-week timeline with clear deliverables
4. **Migration strategy** - Seamless transition from localStorage
5. **Security-first approach** - RLS policies, authentication, input validation

### Next Steps

1. Review and approve this plan
2. Set up Supabase project
3. Begin Phase 1: Foundation (authentication & database setup)
4. Weekly check-ins to track progress

**Estimated Total Time:** 140-190 hours (~4-5 weeks full-time or 8-10 weeks part-time)

---

**Document Version:** 1.0
**Last Updated:** November 7, 2025
**Status:** Ready for Implementation
