'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { listStudents, createStudent } from '@/core/services/studentsService';

function seedIfEmpty() {
  const rows = listStudents();
  if (rows.length === 0) {
    createStudent({ fullName: 'Jane Doe' });
    createStudent({ fullName: 'Ali Al-Student' });
    createStudent({ fullName: 'Mina Grappler' });
  }
}

export default function StudentList() {
  const [tick, setTick] = useState(0);
  useEffect(() => { seedIfEmpty(); setTick(t => t + 1); }, []);
  const students = useMemo(() => listStudents(), [tick]);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ margin: '8px 0 16px' }}>Students</h1>

      {students.length === 0 ? (
        <div>No students yet.</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12
        }}>
          {students.map(s => (
            <Link key={s.id} href={`/students/${s.id}`} style={{
              display: 'block',
              border: '1px solid var(--surface-border, #e5e7eb)',
              borderRadius: 8,
              padding: 12,
              textDecoration: 'none'
            }}>
              <div style={{ fontWeight: 600 }}>{s.fullName}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {s.rank ?? 'Unranked'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
