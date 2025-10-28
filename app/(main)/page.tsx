'use client';

import Link from 'next/link';
import { Button } from 'primereact/button';

export default function MainDashboardPage() {
  return (
    <div className="grid">
      <div className="col-12">
        <div className="surface-card p-4 shadow-1 border-round">
          <div className="text-900 text-xl font-semibold mb-3">Quick Actions</div>
          <div className="grid">
            <div className="col-12 md:col-6 lg:col-4">
              <div className="surface-section p-4 border-round">
                <div className="text-900 text-lg font-medium mb-2">Curriculum</div>
                <p className="text-600 mb-3">Browse lessons & slices.</p>
                <Link href="/curriculum"><Button label="Open" icon="pi pi-book" /></Link>
              </div>
            </div>
            <div className="col-12 md:col-6 lg:col-4">
              <div className="surface-section p-4 border-round">
                <div className="text-900 text-lg font-medium mb-2">Coach Mode</div>
                <p className="text-600 mb-3">Log observations fast.</p>
                <Link href="/coach"><Button label="Start" icon="pi pi-bolt" /></Link>
              </div>
            </div>
            <div className="col-12 md:col-6 lg:col-4">
              <div className="surface-section p-4 border-round">
                <div className="text-900 text-lg font-medium mb-2">History</div>
                <p className="text-600 mb-3">Past sessions & counts.</p>
                <Link href="/history"><Button label="Open" icon="pi pi-clock" /></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
