import type { Student, StudentId } from '@/core/domain/students.types';

const KEY = 'sw_students';

const genId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `s_${Math.random().toString(36).slice(2)}`;

function loadRaw(): any[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}
function save(rows: Student[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

function normaliseRow(r: any): Student | null {
  if (!r) return null;

  // accept legacy { name } and map to fullName
  const fullName = (r.fullName ?? r.name ?? '').toString().trim();
  if (!fullName) return null;

  const now = new Date().toISOString();
  return {
    id: (r.id as string) ?? genId(),
    fullName,
    nickname: r.nickname ?? undefined,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    rank: r.rank ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: (r.createdAt as string) ?? now,
    updatedAt: (r.updatedAt as string) ?? now,
  };
}

function migrateIfNeeded(): Student[] {
  const raw = loadRaw();
  let changed = false;

  const normalised = raw.map(normaliseRow).filter(Boolean) as Student[];

  // If the normalised length differs or any row changed shape, persist the cleaned copy.
  if (normalised.length !== raw.length) changed = true;
  if (changed) save(normalised);

  return normalised;
}

function safeName(x: Partial<Student>) {
  return (x.fullName ?? '').toString();
}

export function listStudents(): Student[] {
  const rows = migrateIfNeeded();
  return rows.sort((a, b) => safeName(a).localeCompare(safeName(b)));
}

export function getStudent(id: StudentId): Student | undefined {
  return migrateIfNeeded().find(s => s.id === id);
}

export function createStudent(p: Omit<Student,'id'|'createdAt'|'updatedAt'>): Student {
  const now = new Date().toISOString();
  const s: Student = { id: genId(), createdAt: now, updatedAt: now, ...p };
  const all = migrateIfNeeded(); all.push(s); save(all); return s;
}

export function updateStudent(id: StudentId, patch: Partial<Student>): Student {
  const all = migrateIfNeeded();
  const i = all.findIndex(s => s.id === id);
  if (i < 0) throw new Error('Student not found');
  const updated = { ...all[i], ...patch, id, updatedAt: new Date().toISOString() };
  all[i] = updated; save(all); return updated;
}

export function deleteStudent(id: StudentId) {
  save(migrateIfNeeded().filter(s => s.id !== id));
}
