'use client';
import { useEffect, useState } from 'react';
import * as svc from '@/core/services/studentsService';
import type { Student } from '@/core/domain/students.types';

export function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = async () => {
        try {
            setLoading(true);
            const data = await svc.listStudents();
            setStudents(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const create = async (p: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
        const s = await svc.createStudent(p);
        await refresh();
        return s;
    };

    const update = async (id: string, patch: Partial<Student>) => {
        const s = await svc.updateStudent(id, patch);
        await refresh();
        return s;
    };

    const remove = async (id: string) => {
        await svc.deleteStudent(id);
        await refresh();
    };

    return { students, loading, error, create, update, remove, refresh };
}
