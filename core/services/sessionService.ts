'use client';

import { getSupabaseClient } from './supabase/client';
import type { CoachingSession, Observation } from '@/core/domain/session.types';
import type { Database } from '@/types/supabase';

type DbSession = Database['public']['Tables']['coaching_sessions']['Row'];
type DbObservation = Database['public']['Tables']['observations']['Row'];

// Map observation from database
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

// Map database rows to domain model
async function toDomain(session: DbSession): Promise<CoachingSession> {
    const supabase = getSupabaseClient();

    // Fetch observations
    const { data: obsData } = await supabase.from('observations').select('*').eq('session_id', session.id).order('created_at', { ascending: true });

    const events: Observation[] = (obsData || []).map(mapObservation);

    // Fetch student IDs
    const { data: studentData } = await supabase.from('session_students').select('student_id').eq('session_id', session.id);

    const studentIds = (studentData || []).map((s) => s.student_id);

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

export async function startSession(seed?: Partial<CoachingSession>): Promise<CoachingSession> {
    const supabase = getSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
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
        await supabase.from('session_students').insert(
            seed.studentIds.map((sid) => ({
                session_id: data.id,
                student_id: sid,
            }))
        );
    }

    return toDomain(data);
}

export async function appendObservation(sessionId: string, obs: Observation): Promise<void> {
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

    const { error } = await supabase.from('observations').insert(insert);

    if (error) throw error;
}

export async function listSessions(): Promise<CoachingSession[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.from('coaching_sessions').select('*').order('session_date', { ascending: false });

    if (error) throw error;

    return Promise.all((data || []).map(toDomain));
}

export async function getSession(id: string): Promise<CoachingSession | undefined> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.from('coaching_sessions').select('*').eq('id', id).single();

    if (error) {
        if (error.code === 'PGRST116') return undefined;
        throw error;
    }

    return toDomain(data);
}
