'use client';
import { useMemo } from 'react';
import { getStudent } from '@/core/services/studentsService';

export default function StudentDetail({ studentId }: { studentId: string }) {
  const student = useMemo(() => getStudent(studentId), [studentId]);
  if (!student) return <div>Student not found.</div>;

  return (
    <>
      {/* profile block */}
      {/* attached plans + AssignPlanDialog */}
      {/* recent sessions (read via sessionService by studentId) */}
    </>
  );
}
