import { DurableObject } from 'cloudflare:workers';
import type { Env } from './core-utils';
import type { Patient, Message, DbStatus } from './types';
/**
 * AppController Durable Object - Acts as a database replacement using DO storage.
 * Handles CRUD operations for patients and chat messages.
 */
export class AppController extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  /**
   * Main fetch handler for routing requests to internal methods.
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname.replace('/api/', '');
    try {
      switch (path) {
        case 'patients':
          if (method === 'GET') {
            const q = url.searchParams.get('q') || '';
            return this.getPatients(q);
          } else if (method === 'POST') {
            const body: any = await request.json();
            return this.createPatient(body);
          }
          break;
        case 'patients/seed':
          if (method === 'POST') {
            const force = url.searchParams.get('force') === 'true';
            return this.seedPatients(force);
          }
          break;
        case 'db-status':
          return this.getDbStatus();
          break;
        default:
          if (path.startsWith('chat/')) {
            const sessionId = path.split('/')[1];
            const subPath = path.split('/').slice(2).join('/');
            return this.handleChatRequest(sessionId, subPath, request);
          }
          break;
      }
      return new Response(JSON.stringify({ success: false, error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('AppController error:', error);
      return new Response(JSON.stringify({ success: false, error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  /**
   * No-op for compatibility with D1-based code.
   */
  async ensureTables(): Promise<void> {
    // No tables needed in DO storage
  }
  /**
   * Seeds initial patient data into DO storage.
   */
  async seedPatients(force = false): Promise<Response> {
    const existing = await this.ctx.storage.get('patients');
    if (existing && !force) {
      return new Response(JSON.stringify({ success: true, message: 'Already seeded' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const patients: Patient[] = [];
    const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[(i + 3) % lastNames.length];
      const mrn = `AURA-${200000 + i}`;
      const dobYear = 1950 + (i % 50);
      const patient: Patient = {
        id: crypto.randomUUID(),
        mrn,
        ssn: btoa(`000-00-${1000 + i}`),
        firstName,
        lastName,
        dob: `${dobYear}-01-01`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        bloodType: ['A+', 'O+', 'B+', 'AB+'][i % 4],
        email: btoa(`${firstName.toLowerCase()}.${lastName.toLowerCase()}@aura.clinic`),
        phone: `555-01${i.toString().padStart(2, '0')}`,
        address: `${100 + i} Medical Plaza Dr, Aura City`,
        diagnoses: [{ code: 'E11.9', description: 'Type 2 diabetes mellitus', date: '2023-01-01' }],
        medications: [{ name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', status: 'Active' }],
        vitals: { height: "5'10\"", weight: "165 lbs", bmi: "23.7", bp: "120/80", hr: "72", temp: "98.6 F" },
        history: 'Routine wellness check.',
        avatarUrl: `https://i.pravatar.cc/150?u=${mrn}`,
      };
      patients.push(patient);
    }
    await this.ctx.storage.put('patients', patients);
    return new Response(JSON.stringify({ success: true, count: patients.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  /**
   * Retrieves patients, optionally filtered by query.
   */
  async getPatients(q = ''): Promise<Response> {
    const patients: Patient[] = (await this.ctx.storage.get('patients')) || [];
    let filtered = patients;
    if (q) {
      const lowerQ = q.toLowerCase();
      filtered = patients.filter(p =>
        p.firstName.toLowerCase().includes(lowerQ) ||
        p.lastName.toLowerCase().includes(lowerQ) ||
        p.mrn.toLowerCase().includes(lowerQ)
      );
    }
    return new Response(JSON.stringify({ success: true, data: filtered }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  /**
   * Retrieves a single patient by ID.
   */
  async getPatientById(id: string): Promise<Patient | null> {
    const patients: Patient[] = (await this.ctx.storage.get('patients')) || [];
    return patients.find(p => p.id === id) || null;
  }
  /**
   * Creates a new patient.
   */
  async createPatient(data: any): Promise<Response> {
    const patients: Patient[] = (await this.ctx.storage.get('patients')) || [];
    const id = crypto.randomUUID();
    const mrn = `AURA-${Math.floor(200000 + Math.random() * 900000)}`;
    const newPatient: Patient = {
      id,
      mrn,
      ssn: btoa(data.ssn),
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      gender: data.gender,
      bloodType: data.bloodType,
      email: btoa(data.email),
      phone: data.phone,
      address: data.address,
      diagnoses: [],
      medications: [],
      vitals: { height: "5'10\"", weight: "160 lbs", bmi: "23.0", bp: "120/80", hr: "72", temp: "98.6 F" },
      history: data.history || '',
      avatarUrl: `https://i.pravatar.cc/150?u=${mrn}`,
    };
    patients.push(newPatient);
    await this.ctx.storage.put('patients', patients);
    return new Response(JSON.stringify({ success: true, data: newPatient }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  /**
   * Handles chat-related requests.
   */
  async handleChatRequest(sessionId: string, subPath: string, request: Request): Promise<Response> {
    const method = request.method;
    switch (subPath) {
      case 'messages':
        if (method === 'GET') {
          return this.getMessages(sessionId);
        }
        break;
      case 'chat':
        if (method === 'POST') {
          const body: any = await request.json();
          return this.addMessage(sessionId, body);
        }
        break;
      case 'clear':
        if (method === 'DELETE') {
          return this.clearMessages(sessionId);
        }
        break;
      case 'init-context':
        if (method === 'POST') {
          const body: any = await request.json();
          return this.initContext(sessionId, body.patientId);
        }
        break;
    }
    return new Response(JSON.stringify({ success: false, error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  /**
   * Retrieves messages for a session.
   */
  async getMessages(sessionId: string): Promise<Response> {
    const messages: Message[] = (await this.ctx.storage.get(`messages_${sessionId}`)) || [];
    return new Response(JSON.stringify({ success: true, data: { messages } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  /**
   * Adds a message to a session.
   */
  async addMessage(sessionId: string, body: Message): Promise<Response> {
    const messages: Message[] = (await this.ctx.storage.get(`messages_${sessionId}`)) || [];
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: body.role || 'user',
      content: body.content,
      timestamp: Date.now(),
    };
    messages.push(newMessage);
    await this.ctx.storage.put(`messages_${sessionId}`, messages);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  /**
   * Clears messages for a session.
   */
  async clearMessages(sessionId: string): Promise<Response> {
    await this.ctx.storage.delete(`messages_${sessionId}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  /**
   * Initializes context for a session with patient data.
   */
  async initContext(sessionId: string, patientId: string): Promise<Response> {
    const patient = await this.getPatientById(patientId);
    if (!patient) {
      return new Response(JSON.stringify({ success: false, error: 'Patient not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const systemMessage: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content: `Persona: Dr. Aura. Context: Patient ${patient.firstName} ${patient.lastName} (${patient.mrn}). Profile: ${JSON.stringify(patient.diagnoses)}. Meds: ${JSON.stringify(patient.medications)}. History: ${patient.history}. Be professional.`,
      timestamp: Date.now(),
    };
    const messages: Message[] = [systemMessage];
    await this.ctx.storage.put(`messages_${sessionId}`, messages);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  /**
   * Returns database status.
   */
  async getDbStatus(): Promise<Response> {
    const patients: Patient[] = (await this.ctx.storage.get('patients')) || [];
    const sessionKeys = await this.ctx.storage.list({ prefix: 'messages_' });
    const sessionCount = sessionKeys.size;
    const status: DbStatus = {
      engine: 'DURABLE_OBJECT',
      binding: 'APP_CONTROLLER',
      connected: true,
      pingMs: 1,
      patientCount: patients.length,
      sessionCount,
      status: 'HEALTHY',
      schemaVersion: '2.4.0',
    };
    return new Response(JSON.stringify({ success: true, data: status }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}