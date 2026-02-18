import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo, Patient } from './types';
import type { Env } from './core-utils';
export class AppController extends DurableObject<Env> {
  private schemaChecked = false;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  async ensureSchema(): Promise<void> {
    if (this.schemaChecked) return;
    // Initialize D1 Tables for HIPAA-compliant storage
    await this.env.DB.batch([
      this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY,
          mrn TEXT UNIQUE,
          ssn TEXT, -- Encrypted
          firstName TEXT,
          lastName TEXT,
          dob TEXT,
          gender TEXT,
          bloodType TEXT,
          email TEXT, -- Encrypted
          phone TEXT,
          address TEXT,
          diagnoses TEXT, -- JSON
          medications TEXT, -- JSON
          vitals TEXT, -- JSON
          history TEXT,
          createdAt INTEGER
        )
      `),
      this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          title TEXT,
          createdAt INTEGER,
          lastActive INTEGER
        )
      `),
      this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn)`),
      this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(lastActive)`)
    ]);
    this.schemaChecked = true;
  }
  async addSession(sessionId: string, title?: string): Promise<void> {
    await this.ensureSchema();
    const now = Date.now();
    await this.env.DB.prepare(
      'INSERT OR REPLACE INTO sessions (id, title, createdAt, lastActive) VALUES (?, ?, ?, ?)'
    ).bind(
      sessionId, 
      title || `Chat ${new Date(now).toLocaleDateString()}`, 
      now, 
      now
    ).run();
  }
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureSchema();
    const { results } = await this.env.DB.prepare(
      'SELECT * FROM sessions ORDER BY lastActive DESC'
    ).all<SessionInfo>();
    return results;
  }
  async removeSession(sessionId: string): Promise<boolean> {
    await this.ensureSchema();
    const result = await this.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    return result.success;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.ensureSchema();
    await this.env.DB.prepare('UPDATE sessions SET lastActive = ? WHERE id = ?')
      .bind(Date.now(), sessionId)
      .run();
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    await this.ensureSchema();
    const result = await this.env.DB.prepare('UPDATE sessions SET title = ? WHERE id = ?')
      .bind(title, sessionId)
      .run();
    return result.success;
  }
  async seedPatients(patients: Patient[]): Promise<void> {
    await this.ensureSchema();
    const statements = patients.map(p => 
      this.env.DB.prepare(`
        INSERT OR IGNORE INTO patients 
        (id, mrn, ssn, firstName, lastName, dob, gender, bloodType, email, phone, address, diagnoses, medications, vitals, history, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        p.id, p.mrn, p.ssn, p.firstName, p.lastName, p.dob, p.gender, 
        p.bloodType, p.email, p.phone, p.address, 
        JSON.stringify(p.diagnoses), JSON.stringify(p.medications), 
        JSON.stringify(p.vitals), p.history, Date.now()
      )
    );
    await this.env.DB.batch(statements);
  }
  async getPatientCount(): Promise<number> {
    await this.ensureSchema();
    const result = await this.env.DB.prepare('SELECT COUNT(*) as count FROM patients').first<{ count: number }>();
    return result?.count || 0;
  }
  // Compatibility methods for existing types/calls
  async getPatients(): Promise<Patient[]> {
    // This is now handled directly in userRoutes for better performance
    return []; 
  }
  async getPatient(id: string): Promise<Patient | null> {
    return null; // Handled in userRoutes
  }
}