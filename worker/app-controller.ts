import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo, Patient } from './types';
import type { Env } from './core-utils';
export class AppController extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  async checkConnection(): Promise<{ connected: boolean; pingMs: number }> {
    const start = Date.now();
    try {
      if (this.env.DB) {
        await this.env.DB.prepare('SELECT 1').run();
      } else {
        await this.ctx.storage.get('health_check');
      }
      return { connected: true, pingMs: Date.now() - start };
    } catch (e) {
      console.error('[DB CHECK FAILED]', e);
      return { connected: false, pingMs: Date.now() - start };
    }
  }
  async clearPatients(): Promise<void> {
    if (this.env.DB) {
      await this.env.DB.prepare('DELETE FROM patients').run();
    } else {
      await this.ctx.storage.delete('patients');
    }
  }
  async addSession(sessionId: string, title?: string): Promise<void> {
    const now = Date.now();
    if (this.env.DB) {
      await this.env.DB.prepare(
        'INSERT OR IGNORE INTO sessions (id, title, createdAt, lastActive) VALUES (?, ?, ?, ?)'
      ).bind(sessionId, title || `Chat ${new Date(now).toLocaleDateString()}`, now, now).run();
    } else {
      const sessionsRaw = await this.ctx.storage.get<string>('sessions') || '[]';
      const sessions = JSON.parse(sessionsRaw) as any[];
      if (!sessions.find(s => s.id === sessionId)) {
        sessions.push({
          id: sessionId,
          title: title || `Chat ${new Date(now).toLocaleDateString()}`,
          createdAt: now,
          lastActive: now
        });
        await this.ctx.storage.put('sessions', JSON.stringify(sessions));
      }
    }
  }
  async listSessions(): Promise<SessionInfo[]> {
    if (this.env.DB) {
      const { results } = await this.env.DB.prepare('SELECT * FROM sessions ORDER BY lastActive DESC').all<SessionInfo>();
      return results || [];
    }
    const sessionsRaw = await this.ctx.storage.get<string>('sessions') || '[]';
    const sessions = JSON.parse(sessionsRaw) as SessionInfo[];
    return sessions.sort((a, b) => b.lastActive - a.lastActive);
  }
  async removeSession(sessionId: string): Promise<boolean> {
    if (this.env.DB) {
      const result = await this.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
      return result.success;
    }
    const sessionsRaw = await this.ctx.storage.get<string>('sessions') || '[]';
    const sessions = JSON.parse(sessionsRaw) as any[];
    const newSessions = sessions.filter(s => s.id !== sessionId);
    await this.ctx.storage.put('sessions', JSON.stringify(newSessions));
    return newSessions.length < sessions.length;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    if (this.env.DB) {
      await this.env.DB.prepare('UPDATE sessions SET lastActive = ? WHERE id = ?').bind(Date.now(), sessionId).run();
    } else {
      const sessionsRaw = await this.ctx.storage.get<string>('sessions') || '[]';
      const sessions = JSON.parse(sessionsRaw) as any[];
      const index = sessions.findIndex(s => s.id === sessionId);
      if (index !== -1) {
        sessions[index].lastActive = Date.now();
        await this.ctx.storage.put('sessions', JSON.stringify(sessions));
      }
    }
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    if (this.env.DB) {
      const result = await this.env.DB.prepare('UPDATE sessions SET title = ? WHERE id = ?').bind(title, sessionId).run();
      return result.success;
    }
    const sessionsRaw = await this.ctx.storage.get<string>('sessions') || '[]';
    const sessions = JSON.parse(sessionsRaw) as any[];
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index].title = title;
      await this.ctx.storage.put('sessions', JSON.stringify(sessions));
      return true;
    }
    return false;
  }
  async seedPatients(patients: Patient[]): Promise<void> {
    if (this.env.DB) {
      const statements = patients.map(p =>
        this.env.DB.prepare(`
          INSERT OR IGNORE INTO patients
          (id, mrn, ssn, firstName, lastName, dob, gender, bloodType, email, phone, address, diagnoses, medications, vitals, history, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          p.id, p.mrn, p.ssn, p.firstName, p.lastName, p.dob, p.gender, p.bloodType, p.email, p.phone, p.address,
          JSON.stringify(p.diagnoses), JSON.stringify(p.medications), JSON.stringify(p.vitals), p.history, Date.now()
        )
      );
      await this.env.DB.batch(statements);
    } else {
      const patientsRaw = await this.ctx.storage.get<string>('patients') || '[]';
      const existing = JSON.parse(patientsRaw) as any[];
      const existingMrns = new Set(existing.map((p: any) => p.mrn));
      const newEntries = patients.filter(p => !existingMrns.has(p.mrn)).map(p => ({
        ...p,
        diagnoses: JSON.stringify(p.diagnoses),
        medications: JSON.stringify(p.medications),
        vitals: JSON.stringify(p.vitals),
        createdAt: Date.now()
      }));
      if (newEntries.length > 0) {
        await this.ctx.storage.put('patients', JSON.stringify([...existing, ...newEntries]));
      }
    }
  }
  async getPatientCount(): Promise<number> {
    if (this.env.DB) {
      const result = await this.env.DB.prepare('SELECT COUNT(*) as count FROM patients').first<{ count: number }>();
      return result?.count || 0;
    }
    const patientsRaw = await this.ctx.storage.get<string>('patients') || '[]';
    return JSON.parse(patientsRaw).length;
  }
  async getPatients(search?: string): Promise<any[]> {
    if (this.env.DB) {
      const query = search
        ? 'SELECT * FROM patients WHERE firstName LIKE ? OR lastName LIKE ? OR mrn LIKE ?'
        : 'SELECT * FROM patients';
      const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
      const { results } = await this.env.DB.prepare(query).bind(...params).all<any>();
      return results || [];
    }
    const patientsRaw = await this.ctx.storage.get<string>('patients') || '[]';
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
    if (this.env.DB) {
      return await this.env.DB.prepare('SELECT * FROM patients WHERE id = ?').bind(id).first<any>() || null;
    }
    const patientsRaw = await this.ctx.storage.get<string>('patients') || '[]';
    const patients = JSON.parse(patientsRaw);
    return patients.find((p: any) => p.id === id) || null;
  }
  async getSessionCount(): Promise<number> {
    if (this.env.DB) {
      const result = await this.env.DB.prepare('SELECT COUNT(*) as count FROM sessions').first<{ count: number }>();
      return result?.count || 0;
    }
    const sessionsRaw = await this.ctx.storage.get<string>('sessions') || '[]';
    return JSON.parse(sessionsRaw).length;
  }

  generatePatients(count: number = 50): Patient[] {
    const FIRST_NAMES = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','William','Elizabeth'];
    const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez'];
    const DIAGNOSES_TEMPLATES = [
      {code:'E11.9',description:'Type 2 diabetes mellitus without complications'},
      {code:'I10',description:'Essential (primary) hypertension'},
      {code:'E78.5',description:'Hyperlipidemia, unspecified'},
      {code:'M54.5',description:'Low back pain'},
      {code:'F41.1',description:'Generalized anxiety disorder'},
      {code:'J45.909',description:'Unspecified asthma, uncomplicated'},
      {code:'K21.9',description:'Gastro-esophageal reflux disease without esophagitis'}
    ];
    const BLOOD_TYPES = ['A+','O+','B+','AB+','A-','O-','B-','AB-'];

    const pseudoEncrypt = (text: string) => btoa(text);

    const patients: Patient[] = [];
    for (let i = 0; i < count; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const id = (i + 1).toString();
      const mrn = `AURA-${100000 + i}`;
      const ssnRaw = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const ssn = pseudoEncrypt(ssnRaw);
      const dobYear = 1950 + Math.floor(Math.random() * 50);
      const dobMonth = (1 + Math.floor(Math.random() * 12)).toString();
      const dobDay = (1 + Math.floor(Math.random() * 28)).toString();
      const dob = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      const bloodType = BLOOD_TYPES[Math.floor(Math.random() * BLOOD_TYPES.length)];
      const emailRaw = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
      const email = pseudoEncrypt(emailRaw);
      const rand = Math.floor(100 + Math.random() * 900).toString();
      const phone = `555-${rand}-${rand}`;
      const diagnosisTemplate = DIAGNOSES_TEMPLATES[Math.floor(Math.random() * DIAGNOSES_TEMPLATES.length)];
      const randMonth = Math.floor(Math.random() * 12);
      const diagnosisDate = new Date(2023, randMonth, 1).toISOString().split('T')[0];
      const diagnoses = [{
        ...diagnosisTemplate,
        date: diagnosisDate
      }];
      const medications = [
        {name:'Metformin',dosage:'500mg',frequency:'Twice daily',status:'Active' as const},
        {name:'Lisinopril',dosage:'10mg',frequency:'Once daily',status:'Active' as const}
      ];
      const vitals = {
        height: "5'9\"",
        weight: "175 lbs",
        bmi: "25.8",
        bp: "120/80",
        hr: "72",
        temp: "98.6 F"
      };
      const history = "Patient has a chronic history of managed hypertension. Routine screening suggested. No known drug allergies.";

      patients.push({
        id,
        mrn,
        ssn,
        firstName,
        lastName,
        dob,
        gender,
        bloodType,
        email,
        phone,
        address: `123 ${lastName} St, Medical City, MC 12345`,
        diagnoses,
        medications,
        vitals,
        history
      });
    }
    return patients;
  }
}