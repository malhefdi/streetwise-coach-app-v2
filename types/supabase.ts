export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string;
                    role: string;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    full_name: string;
                    role?: string;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    full_name?: string;
                    role?: string;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            students: {
                Row: {
                    id: string;
                    coach_id: string;
                    full_name: string;
                    nickname: string | null;
                    phone: string | null;
                    email: string | null;
                    rank: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    coach_id: string;
                    full_name: string;
                    nickname?: string | null;
                    phone?: string | null;
                    email?: string | null;
                    rank?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    coach_id?: string;
                    full_name?: string;
                    nickname?: string | null;
                    phone?: string | null;
                    email?: string | null;
                    rank?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            coaching_sessions: {
                Row: {
                    id: string;
                    coach_id: string;
                    session_date: string;
                    kind: string;
                    duration_sec: number | null;
                    coach_notes: string | null;
                    plan_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    coach_id: string;
                    session_date: string;
                    kind: string;
                    duration_sec?: number | null;
                    coach_notes?: string | null;
                    plan_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    coach_id?: string;
                    session_date?: string;
                    kind?: string;
                    duration_sec?: number | null;
                    coach_notes?: string | null;
                    plan_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            session_students: {
                Row: {
                    session_id: string;
                    student_id: string;
                };
                Insert: {
                    session_id: string;
                    student_id: string;
                };
                Update: {
                    session_id?: string;
                    student_id?: string;
                };
            };
            observations: {
                Row: {
                    id: string;
                    session_id: string;
                    observation_type: string;
                    target_id: string | null;
                    confidence: number | null;
                    next_action: string | null;
                    notes: string | null;
                    timer_label: string | null;
                    timer_start: number | null;
                    timer_stop: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    session_id: string;
                    observation_type: string;
                    target_id?: string | null;
                    confidence?: number | null;
                    next_action?: string | null;
                    notes?: string | null;
                    timer_label?: string | null;
                    timer_start?: number | null;
                    timer_stop?: number | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    session_id?: string;
                    observation_type?: string;
                    target_id?: string | null;
                    confidence?: number | null;
                    next_action?: string | null;
                    notes?: string | null;
                    timer_label?: string | null;
                    timer_start?: number | null;
                    timer_stop?: number | null;
                    created_at?: string;
                };
            };
            plans: {
                Row: {
                    id: string;
                    coach_id: string;
                    student_id: string | null;
                    title: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    coach_id: string;
                    student_id?: string | null;
                    title: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    coach_id?: string;
                    student_id?: string | null;
                    title?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            plan_items: {
                Row: {
                    id: string;
                    plan_id: string;
                    source: string;
                    lesson_id: string | null;
                    slice_id: string | null;
                    step_id: string | null;
                    custom_text: string | null;
                    priority: number | null;
                    est_mins: number | null;
                    tags: string[] | null;
                    order_index: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    plan_id: string;
                    source: string;
                    lesson_id?: string | null;
                    slice_id?: string | null;
                    step_id?: string | null;
                    custom_text?: string | null;
                    priority?: number | null;
                    est_mins?: number | null;
                    tags?: string[] | null;
                    order_index: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    plan_id?: string;
                    source?: string;
                    lesson_id?: string | null;
                    slice_id?: string | null;
                    step_id?: string | null;
                    custom_text?: string | null;
                    priority?: number | null;
                    est_mins?: number | null;
                    tags?: string[] | null;
                    order_index?: number;
                    created_at?: string;
                };
            };
        };
    };
}
