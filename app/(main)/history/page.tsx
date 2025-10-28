'use client';
import SessionList from '@/features/history/SessionList';

export default function HistoryPage() {
  return (
    <div className="grid">
      <div className="col-12">
        <SessionList />
      </div>
    </div>
  );
}
