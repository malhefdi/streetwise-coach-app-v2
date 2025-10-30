'use client';

import { Card } from 'primereact/card';
import type { Student } from '@/core/domain/students.types';

interface StudentCardProps {
  student: Student;
}

export default function StudentCard({ student }: StudentCardProps) {
  return (
    <Card className="mb-3 cursor-pointer hover:shadow-2 transition-shadow">
      <div className="flex align-items-center justify-content-between">
        <div>
          <div className="text-900 font-semibold">{student.fullName}</div>
          {student.nickname && (
            <div className="text-600 text-sm">"{student.nickname}"</div>
          )}
          {student.rank && (
            <div className="text-700 text-sm">{student.rank}</div>
          )}
        </div>
        <div className="text-500 text-sm">
          {new Date(student.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Card>
  );
}
