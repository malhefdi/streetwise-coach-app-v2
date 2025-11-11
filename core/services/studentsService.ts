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

    const { data, error } = await supabase.from('students').select('*').order('full_name', { ascending: true });

    if (error) throw error;
    return (data || []).map(toDomain);
}

export async function getStudent(id: StudentId): Promise<Student | undefined> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.from('students').select('*').eq('id', id).single();

    if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found
        throw error;
    }

    return toDomain(data);
}

export async function createStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
    const supabase = getSupabaseClient();

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('students').insert(toInsert(student, user.id)).select().single();

    if (error) throw error;
    return toDomain(data);
}

export async function updateStudent(id: StudentId, patch: Partial<Student>): Promise<Student> {
    const supabase = getSupabaseClient();

    const updates: Partial<DbStudentInsert> = {};
    if (patch.fullName) updates.full_name = patch.fullName;
    if (patch.nickname !== undefined) updates.nickname = patch.nickname;
    if (patch.phone !== undefined) updates.phone = patch.phone;
    if (patch.email !== undefined) updates.email = patch.email;
    if (patch.rank !== undefined) updates.rank = patch.rank;
    if (patch.notes !== undefined) updates.notes = patch.notes;

    const { data, error } = await supabase.from('students').update(updates).eq('id', id).select().single();

    if (error) throw error;
    return toDomain(data);
}

export async function deleteStudent(id: StudentId): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from('students').delete().eq('id', id);

    if (error) throw error;
}
