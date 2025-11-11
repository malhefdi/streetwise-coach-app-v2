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
    plan_id UUID,
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
    target_id TEXT,
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
CREATE INDEX idx_students_full_name ON students(full_name);
CREATE INDEX idx_sessions_coach ON coaching_sessions(coach_id);
CREATE INDEX idx_sessions_date ON coaching_sessions(session_date DESC);
CREATE INDEX idx_observations_session ON observations(session_id);
CREATE INDEX idx_observations_created ON observations(created_at DESC);
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for Students
CREATE POLICY "Coaches can view own students" ON students
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create own students" ON students
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own students" ON students
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own students" ON students
    FOR DELETE USING (auth.uid() = coach_id);

-- RLS Policies for Coaching Sessions
CREATE POLICY "Coaches can view own sessions" ON coaching_sessions
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create own sessions" ON coaching_sessions
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own sessions" ON coaching_sessions
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own sessions" ON coaching_sessions
    FOR DELETE USING (auth.uid() = coach_id);

-- RLS Policies for Session Students
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

-- RLS Policies for Observations
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

-- RLS Policies for Plans
CREATE POLICY "Coaches can view own plans" ON plans
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create own plans" ON plans
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own plans" ON plans
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own plans" ON plans
    FOR DELETE USING (auth.uid() = coach_id);

-- RLS Policies for Plan Items
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
