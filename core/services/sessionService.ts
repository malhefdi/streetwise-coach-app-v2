'use client';

import { storage } from './storageService';
import type { CoachingSession, Observation } from '@/core/domain/session.types';

const KEY = 'sw_sessions_v2';

function loadAll(): CoachingSession[] {
  return storage.get<CoachingSession[]>(KEY, []);
}

function saveAll(sessions: CoachingSession[]) {
  storage.set(KEY, sessions);
}

export function startSession(seed?: Partial<CoachingSession>): CoachingSession {
  const session: CoachingSession = {
    id: crypto.randomUUID(),
    when: new Date().toISOString(),
    kind: seed?.kind ?? 'private',
    studentIds: seed?.studentIds ?? [],
    planId: seed?.planId,
    events: [],
    coachNotes: '',
  };
  const all = loadAll();
  all.unshift(session);
  saveAll(all);
  return session;
}

export function appendObservation(sessionId: string, obs: Observation) {
  const all = loadAll();
  const s = all.find((x) => x.id === sessionId);
  if (!s) return;
  s.events.push(obs);
  saveAll(all);
}

export function listSessions(): CoachingSession[] {
  return loadAll();
}

export function getSession(id: string) {
  return loadAll().find((s) => s.id === id);
}
