'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { listSessions } from '@/core/services/sessionService';
import { listStudents } from '@/core/services/studentsService';
import type { CoachingSession } from '@/core/domain/session.types';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalSessions: 0,
        thisWeekSessions: 0,
    });
    const [recentSessions, setRecentSessions] = useState<CoachingSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            const [sessions, students] = await Promise.all([listSessions(), listStudents()]);

            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const thisWeek = sessions.filter((s) => new Date(s.when) > oneWeekAgo);

            setStats({
                totalStudents: students.length,
                totalSessions: sessions.length,
                thisWeekSessions: thisWeek.length,
            });

            setRecentSessions(sessions.slice(0, 5));
        } finally {
            setLoading(false);
        }
    }

    const dateBodyTemplate = (rowData: CoachingSession) => {
        return new Date(rowData.when).toLocaleDateString();
    };

    return (
        <div className="grid">
            {/* Stats Cards */}
            <div className="col-12 lg:col-6 xl:col-4">
                <div className="surface-card shadow-2 p-3 border-round stat-card">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Total Students</span>
                            <div className="text-900 font-medium text-xl">{stats.totalStudents}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-users text-blue-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">
                        <i className="pi pi-arrow-up text-xs" /> Active roster
                    </span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-4">
                <div className="surface-card shadow-2 p-3 border-round stat-card">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Total Sessions</span>
                            <div className="text-900 font-medium text-xl">{stats.totalSessions}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-calendar text-orange-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-500 font-medium">All time</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-4">
                <div className="surface-card shadow-2 p-3 border-round stat-card">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">This Week</span>
                            <div className="text-900 font-medium text-xl">{stats.thisWeekSessions}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-chart-line text-cyan-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">{stats.thisWeekSessions > 0 ? '+' : ''}{stats.thisWeekSessions} sessions</span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="col-12 xl:col-6">
                <Card title="Quick Actions" className="shadow-2">
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <Button label="Start Session" icon="pi pi-play" className="w-full p-button-lg" onClick={() => router.push('/coach')} />
                        </div>
                        <div className="col-12 md:col-6">
                            <Button label="View Curriculum" icon="pi pi-book" className="w-full p-button-lg p-button-outlined" onClick={() => router.push('/curriculum')} />
                        </div>
                        <div className="col-12 md:col-6">
                            <Button label="Add Student" icon="pi pi-user-plus" className="w-full p-button-lg p-button-outlined" onClick={() => router.push('/students')} />
                        </div>
                        <div className="col-12 md:col-6">
                            <Button label="View History" icon="pi pi-history" className="w-full p-button-lg p-button-outlined" onClick={() => router.push('/history')} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Sessions */}
            <div className="col-12 xl:col-6">
                <Card title="Recent Sessions" className="shadow-2">
                    <DataTable value={recentSessions} loading={loading} rows={5} emptyMessage="No sessions yet">
                        <Column field="when" header="Date" body={dateBodyTemplate} />
                        <Column field="kind" header="Type" />
                        <Column field="events.length" header="Observations" />
                    </DataTable>
                </Card>
            </div>
        </div>
    );
}
