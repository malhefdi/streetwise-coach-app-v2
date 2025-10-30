import { getStudent } from '@/core/services/studentsService';

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const s = getStudent(params.id);
  if (!s) return <div style={{ padding: 16 }}>Student not found.</div>;
  return (
    <div style={{ padding: 16 }}>
      <h1>{s.fullName}</h1>
      <div>Rank: {s.rank || '—'}</div>
      <div>Created: {new Date(s.createdAt).toLocaleString()}</div>
    </div>
  );
}
