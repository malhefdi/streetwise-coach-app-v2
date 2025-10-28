'use client';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { listSessions } from '@/core/services/sessionService';

export default function SessionList() {
  const sessions = listSessions();
  return (
    <div className="surface-card p-4 shadow-1 border-round">
      <div className="text-900 text-xl font-semibold mb-3">Session History</div>
      <DataTable value={sessions} paginator rows={10} size="small" stripedRows>
        <Column field="when" header="Date" body={(r) => new Date(r.when).toLocaleString()} sortable />
        <Column field="kind" header="Type" sortable />
        <Column header="Students" body={(r) => r.studentIds?.length ?? 0} />
        <Column header="Events" body={(r) => r.events?.length ?? 0} />
        <Column field="planId" header="Plan" />
      </DataTable>
    </div>
  );
}
