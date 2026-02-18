import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo, Patient } from './types';
import type { Env } from './core-utils';

export class AppController extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async addSession(sessionId: string, title?: string): Promise<void> {
    const sessionsRaw = await this.state.storage.get('sessions') || '[]';
    const sessions = JSON.parse(sessionsRaw) as any[];
    const now = Date.now();
    const exists = sessions.find(s => s.id === sessionId);
    if (!exists) {
      sessions.push({
        id: sessionId,
        title: title || `Chat ${new Date(now).toLocaleDateString()}`,
        createdAt: now,
        lastActive: now
      });
      await this.state.storage.put('sessions', JSON.stringify(sessions));
    }
  }

  async listSessions(): Promise<SessionInfo[]> {
    const sessionsRaw = await this.state.storage.get('sessions') || '[]';
    const sessions = JSON.parse(sessionsRaw) as SessionInfo[];
    return sessions.sort((a, b) => b.lastActive - a.lastActive);
  }

  async removeSession(sessionId: string): Promise<boolean> {
    const sessionsRaw = await this.state.storage.get('sessions') || '[]';
    const sessions = JSON.parse(sessionsRaw) as any[];
    const initialLength = sessions.length;
    const newSessions = sessions.filter(s => s.id !== sessionId);
    await this.state.storage.put('sessions', JSON.stringify(newSessions));
    return newSessions.length < initialLength;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const sessionsRaw = await this.state.storage.get('sessions') || '[]';
    const sessions = JSON.parse(sessionsRaw) as any[];
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index].lastActive = Date.now();
      await this.state.storage.put('sessions', JSON.stringify(sessions));
    }
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    const sessionsRaw = await this.state.storage.get('sessions') || '[]';
    const sessions = JSON.parse(sessionsRaw) as any[];
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index].title = title;
      await this.state.storage.put('sessions', JSON.stringify(sessions));
      return true;
    }
    return false;
  }

  async seedPatients(patients: Patient[]): Promise<void> {
    const patientsRaw = await this.state.storage.get('patients') || '[]';
    const existing = JSON.parse(patientsRaw) as any[];
    const existingMrns = new Set(existing.map((p: any) => p.mrn));
    const existingIds = new Set(existing.map((p: any) => p.id));

    const newPatients = patients
      .filter(p => !existingMrns.has(p.mrn) && !existingIds.has(p.id))
      .map(p => ({
        id: p.id,
        mrn: p.mrn,
        ssn: p.ssn,
        firstName: p.firstName,
        lastName: p.lastName,
        dob: p.dob,
        gender: p.gender,
        bloodType: p.bloodType,
        email: p.email,
        phone: p.phone,
        address: p.address,
        diagnoses: JSON.stringify(p.diagnoses),
        medications: JSON.stringify(p.medications),
        vitals: JSON.stringify(p.vitals),
        history: p.history,
        createdAt: Date.now()
      }));

    if (newPatients.length > 0) {
      await this.state.storage.put('patients', JSON.stringify([...existing, ...newPatients]));
    }
  }

  async getPatientCount(): Promise<number> {
    const patientsRaw = await this.state.storage.get('patients') || '[]';
    return JSON.parse(patientsRaw).length;
  }

  async getPatients(search?: string): Promise<any[]> {
    const patientsRaw = await this.state.storage.get('patients') || '[]';
    const patients = JSON.parse(patientsRaw);
    if (!search) return patients;
    const term = search.toLowerCase();
    return patients.filter((p: any) =>
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.mrn.toLowerCase().includes(term)
    );
  }

  async getPatient(id: string): Promise<any | null> {
    const patientsRaw = await this.state.storage.get('patients') || '[]';
    const patients = JSON.parse(patientsRaw);
    return patients.find((p: any) => p.id === id) || null;
  }

  async getSessionCount(): Promise<number> {
    const sessionsRaw = await this.state.storage.get('sessions') || '[]';
    return JSON.parse(sessionsRaw).length;
  }
}
//