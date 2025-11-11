import { getSupabaseClient } from '../core/services/supabase/client';
import { storage } from '../core/services/storageService';

export async function migrateLocalStorageToSupabase() {
    const supabase = getSupabaseClient();

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('Starting migration for user:', user.id);

    // 1. Migrate Students
    const students = storage.get<any[]>('sw_students', []);
    console.log(`Found ${students.length} students to migrate`);

    for (const student of students) {
        const { error } = await supabase.from('students').upsert(
            {
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
            },
            { onConflict: 'id' }
        );

        if (error) console.error('Error migrating student:', student.id, error);
        else console.log('✓ Migrated student:', student.fullName || student.name);
    }

    // 2. Migrate Sessions
    const sessions = storage.get<any[]>('sw_sessions_v2', []);
    console.log(`Found ${sessions.length} sessions to migrate`);

    for (const session of sessions) {
        // Insert session
        const { data: newSession, error: sessionError } = await supabase
            .from('coaching_sessions')
            .upsert(
                {
                    id: session.id,
                    coach_id: user.id,
                    session_date: session.when,
                    kind: session.kind,
                    duration_sec: session.durationSec,
                    coach_notes: session.coachNotes,
                    plan_id: session.planId,
                },
                { onConflict: 'id' }
            )
            .select()
            .single();

        if (sessionError) {
            console.error('Error migrating session:', session.id, sessionError);
            continue;
        }

        console.log('✓ Migrated session:', session.id);

        // Insert student associations
        if (session.studentIds && session.studentIds.length > 0) {
            // Delete existing associations
            await supabase.from('session_students').delete().eq('session_id', newSession.id);

            // Insert new associations
            const studentLinks = session.studentIds.map((sid: string) => ({
                session_id: newSession.id,
                student_id: sid,
            }));

            const { error: linkError } = await supabase.from('session_students').insert(studentLinks);
            if (linkError) console.error('Error linking students:', linkError);
        }

        // Insert observations
        if (session.events && session.events.length > 0) {
            // Delete existing observations
            await supabase.from('observations').delete().eq('session_id', newSession.id);

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
                    const targetId = event.type === 'step-assessed' ? event.stepId : event.sliceId;

                    obsInsert.target_id = targetId;
                    obsInsert.confidence = event.confidence;
                    obsInsert.next_action = event.nextAction;
                    obsInsert.notes = event.notes;
                }

                const { error: obsError } = await supabase.from('observations').insert(obsInsert);
                if (obsError) console.error('Error inserting observation:', obsError);
            }

            console.log(`  ✓ Migrated ${session.events.length} observations`);
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

    return {
        studentsCount: students.length,
        sessionsCount: sessions.length,
    };
}
