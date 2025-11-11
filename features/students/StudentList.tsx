'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { Avatar } from 'primereact/avatar';
import { useStudents } from './useStudents';
import type { Student } from '@/core/domain/students.types';

export default function StudentList() {
    const router = useRouter();
    const { students, loading } = useStudents();
    const [globalFilter, setGlobalFilter] = useState('');

    const leftToolbarTemplate = () => (
        <div className="flex flex-wrap gap-2">
            <Button label="New Student" icon="pi pi-plus" severity="success" onClick={() => router.push('/students/new')} />
        </div>
    );

    const rightToolbarTemplate = () => (
        <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText type="search" placeholder="Search students..." onInput={(e) => setGlobalFilter(e.currentTarget.value)} />
        </span>
    );

    const nameBodyTemplate = (rowData: Student) => (
        <div className="flex align-items-center gap-2">
            <Avatar label={rowData.fullName.charAt(0)} size="large" shape="circle" style={{ backgroundColor: '#6366f1', color: '#ffffff' }} />
            <div>
                <div className="font-bold">{rowData.fullName}</div>
                {rowData.nickname && <div className="text-sm text-600">"{rowData.nickname}"</div>}
            </div>
        </div>
    );

    const rankBodyTemplate = (rowData: Student) => {
        if (!rowData.rank) return <Tag value="Unranked" severity="info" />;

        const color = rowData.rank.includes('Blue') ? 'primary' : rowData.rank.includes('White') ? 'secondary' : 'success';

        return <Tag value={rowData.rank} severity={color} />;
    };

    const actionBodyTemplate = (rowData: Student) => (
        <div className="flex gap-2">
            <Button icon="pi pi-eye" rounded outlined className="p-button-sm" onClick={() => router.push(`/students/${rowData.id}`)} />
        </div>
    );

    return (
        <div className="card">
            <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

            <DataTable
                value={students}
                loading={loading}
                globalFilter={globalFilter}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                emptyMessage="No students found"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} students"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            >
                <Column field="fullName" header="Name" body={nameBodyTemplate} sortable />
                <Column field="email" header="Email" sortable />
                <Column field="phone" header="Phone" />
                <Column field="rank" header="Rank" body={rankBodyTemplate} sortable />
                <Column body={actionBodyTemplate} exportable={false} style={{ width: '8rem' }} />
            </DataTable>
        </div>
    );
}
