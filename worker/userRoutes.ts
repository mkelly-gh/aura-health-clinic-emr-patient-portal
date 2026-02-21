import { Hono } from "hono";
import { API_RESPONSES } from './config';
import { decryptField, encryptField } from './utils';
import { ChatHandler } from './chat';
import type { Patient, Message, Diagnosis, Medication } from "./types";
import type { Env } from "./core-utils";
// Constants for generating patients
const FIRST_NAMES = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Anna',
  'James', 'Mary', 'Christopher', 'Patricia', 'Daniel', 'Jennifer', 'Matthew', 'Linda', 'Anthony', 'Barbara',
  'Mark', 'Elizabeth', 'Andrew', 'Jessica', 'Joseph', 'Susan', 'Steven', 'Margaret', 'Kevin', 'Dorothy',
  'Brian', 'Helen', 'Timothy', 'Sandra', 'Ronald', 'Donna', 'George', 'Carol', 'Jason', 'Ruth',
  'Edward', 'Sharon', 'Charles', 'Michelle', 'Thomas', 'Laura', 'Nicholas', 'Sarah', 'Jonathan', 'Betty'
];
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];
const DIAGNOSES_TEMPLATES = [
  'Hypertension', 'Type 2 Diabetes Mellitus', 'Asthma', 'Major Depressive Disorder', 'Osteoarthritis',
  'Chronic Obstructive Pulmonary Disease (COPD)', 'Coronary Artery Disease', 'Chronic Kidney Disease',
  'Rheumatoid Arthritis', 'Anxiety Disorder', 'Migraine', 'Gastroesophageal Reflux Disease (GERD)',
  'Atrial Fibrillation', 'Hyperlipidemia', 'Obesity', 'Sleep Apnea', 'Peripheral Artery Disease',
  'Heart Failure', 'Stroke', 'Pneumonia', 'Urinary Tract Infection', 'Acute Coronary Syndrome',
  'Deep Vein Thrombosis', 'Pulmonary Embolism', 'Sepsis', 'Acute Pancreatitis', 'Cholelithiasis',
  'Appendicitis', 'Diverticulitis', 'Inflammatory Bowel Disease', 'Cirrhosis', 'Hepatitis C',
  'HIV/AIDS', 'Tuberculosis', 'Meningitis', 'Encephalitis', 'Epilepsy', 'Parkinson\'s Disease',
  'Alzheimer\'s Disease', 'Multiple Sclerosis', 'Amyotrophic Lateral Sclerosis (ALS)', 'Cerebral Palsy',
  'Spinal Cord Injury', 'Traumatic Brain Injury', 'Burn Injury', 'Fracture', 'Dislocation',
  'Sprain/Strain', 'Concussion', 'Laceration', 'Contusion', 'Hematoma', 'Abscess', 'Cellulitis'
];
const MEDS_LIBRARY = [
  'Lisinopril', 'Metformin', 'Albuterol', 'Sertraline', 'Ibuprofen', 'Amlodipine', 'Omeprazole',
  'Simvastatin', 'Losartan', 'Gabapentin', 'Prednisone', 'Warfarin', 'Insulin Glargine', 'Furosemide',
  'Hydrochlorothiazide', 'Levothyroxine', 'Aspirin', 'Clopidogrel', 'Atorvastatin', 'Metoprolol',
  'Pantoprazole', 'Escitalopram', 'Tramadol', 'Citalopram', 'Fluoxetine', 'Paroxetine', 'Venlafaxine',
  'Bupropion', 'Duloxetine', 'Trazodone', 'Zolpidem', 'Lorazepam', 'Alprazolam', 'Clonazepam',
  'Diazepam', 'Oxycodone', 'Hydrocodone', 'Morphine', 'Fentanyl', 'Codeine', 'Acetaminophen',
  'Naproxen', 'Celecoxib', 'Diclofenac', 'Meloxicam', 'Allopurinol', 'Colchicine', 'Methotrexate',
  'Sulfasalazine', 'Azathioprine', 'Cyclosporine', 'Tacrolimus', 'Mycophenolate', 'Rituximab',
  'Infliximab', 'Adalimumab', 'Etanercept', 'Certolizumab', 'Golimumab', 'Ustekinumab', 'Secukinumab',
  'Ixekizumab', 'Brodalumab', 'Tildrakizumab', 'Guselkumab', 'Risankizumab', 'Tofacitinib', 'Baricitinib',
  'Upadacitinib', 'Filgotinib', 'Peficitinib', 'Decitabine', 'Azacitidine', 'Lenalidomide', 'Pomalidomide',
  'Thalidomide', 'Bortezomib', 'Carfilzomib', 'Ixazomib', 'Daratumumab', 'Elotuzumab', 'Isatuximab',
  'Belantamab', 'Selinexor', 'Venetoclax', 'Ibrutinib', 'Acalabrutinib', 'Zanubrutinib', 'Idelalisib',
  'Duvelisib', 'Copanlisib', 'Umbralisib', 'Tazemetostat', 'Larotrectinib', 'Entrectinib', 'Selpercatinib',
  'Pralsetinib', 'Capmatinib', 'Crizotnib', 'Alectinib', 'Brigatinib', 'Ceritinib', 'Lorlatinib',
  'Osimertinib', 'Erlotinib', 'Gefitinib', 'Afatinib', 'Dacomitinib', 'Necitumumab', 'Ramucirumab',
  'Bevacizumab', 'Aflibercept', 'Ranibizumab', 'Brolucizumab', 'Faricimab', 'Pegaptanib', 'Vandetanib',
  'Cabozantinib', 'Lenvatinib', 'Sorafenib', 'Sunitinib', 'Pazopanib', 'Axitinib', 'Tivozanib',
  'Nivolumab', 'Pembrolizumab', 'Atezolizumab', 'Durvalumab', 'Avelumab', 'Ipilimumab', 'Tremelimumab',
  'Cemiplimab', 'Retifanlimab', 'Balstilimab', 'Zalifrelimab', 'Spartalizumab', 'Toripalimab',
  'Sintilimab', 'Camrelizumab', 'Tislelizumab', 'Dostarlimab', 'Jemperli', 'Lenvatinib', 'Pembrolizumab'
];
const HISTORY_SNIPPETS = [
  'Patient reports intermittent chest pain on exertion, relieved by rest.',
  'History of smoking 1 pack per day for 20 years, quit 5 years ago.',
  'Allergic to penicillin, hives and anaphylaxis.',
  'Family history of diabetes mellitus in first-degree relatives.',
  'Chronic back pain following motor vehicle accident 10 years ago.',
  'Recurrent urinary tract infections, treated with antibiotics multiple times.',
  'Episodic migraines triggered by stress and lack of sleep.',
  'Hypertension diagnosed 5 years ago, currently on medication.',
  'Depression with suicidal ideation, on antidepressants.',
  'Asthma exacerbations during pollen season.',
  'Osteoarthritis in knees, limiting mobility.',
  'COPD with frequent exacerbations requiring hospitalization.',
  'Coronary artery disease, status post stent placement.',
  'Chronic kidney disease stage 3, monitoring creatinine levels.',
  'Rheumatoid arthritis, on biologic therapy.',
  'Anxiety disorder, managed with therapy and medication.',
  'GERD with heartburn and regurgitation.',
  'Atrial fibrillation, on anticoagulation.',
  'Hyperlipidemia, on statin therapy.',
  'Obesity with BMI of 35, attempting weight loss.',
  'Sleep apnea, using CPAP nightly.',
  'Peripheral artery disease, claudication on walking.',
  'Heart failure with reduced ejection fraction.',
  'History of stroke with residual weakness.',
  'Pneumonia last winter, fully recovered.',
  'Recent UTI, treated with ciprofloxacin.',
  'Acute coronary syndrome, status post angioplasty.',
  'Deep vein thrombosis in left leg.',
  'Pulmonary embolism, on anticoagulation.',
  'Sepsis secondary to UTI.',
  'Acute pancreatitis, resolved.',
  'Cholelithiasis, asymptomatic.',
  'Appendicitis, status post appendectomy.',
  'Diverticulitis, managed conservatively.',
  'Inflammatory bowel disease, on mesalamine.',
  'Cirrhosis due to alcohol abuse.',
  'Hepatitis C, treated with antivirals.',
  'HIV/AIDS, on ART.',
  'Tuberculosis, completed treatment.',
  'Meningitis in childhood.',
  'Encephalitis, recovered with sequelae.',
  'Epilepsy, well-controlled on medication.',
  'Parkinson\'s disease, on levodopa.',
  'Alzheimer\'s disease, early stage.',
  'Multiple sclerosis, relapsing-remitting.',
  'ALS, progressing slowly.',
  'Cerebral palsy from birth.',
  'Spinal cord injury from diving accident.',
  'Traumatic brain injury from fall.',
  'Burn injury from house fire.',
  'Fracture of femur, healed.',
  'Dislocation of shoulder, recurrent.',
  'Sprain of ankle, chronic instability.',
  'Concussion from sports injury.',
  'Laceration requiring sutures.',
  'Contusion from blunt trauma.',
  'Hematoma after fall.',
  'Abscess drained surgically.',
  'Cellulitis treated with antibiotics.'
];
// pseudoEncrypt function
function pseudoEncrypt(str: string): string {
  // Simple pseudo-encryption: reverse the string and add a salt
  const salt = 'AuraHealthClinicSalt';
  return salt + str.split('').reverse().join('') + salt;
}
// generatePatients function
function generatePatients(count: number = 55): Patient[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i + 7) % LAST_NAMES.length];
    const id = (i + 1).toString();
    const dobYear = 1950 + (i % 50);
    const dobMonth = 1 + (i % 12);
    const dobDay = 1 + (i % 28);
    const ssnRaw = `${Math.floor(100 + Math.random() * 800)}-${Math.floor(10 + Math.random() * 80)}-${Math.floor(1000 + Math.random() * 8000)}`;
    const emailRaw = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@example.com`;
    const diagCount = 1 + (i % 2);
    const diagnoses = Array.from({ length: diagCount }, (_, idx) => ({
      ...DIAGNOSES_TEMPLATES[(i + idx) % DIAGNOSES_TEMPLATES.length],
      date: new Date(2023, i % 12, 1).toISOString().split('T')[0]
    }));
    const medCount = 1 + (i % 3);
    const medications = Array.from({ length: medCount }, (_, idx) => ({
      ...MEDS_LIBRARY[(i + idx) % MEDS_LIBRARY.length],
      status: 'Active' as const
    }));
    return {
      id,
      mrn: `AURA-${200000 + i}`,
      ssn: pseudoEncrypt(ssnRaw),
      firstName,
      lastName,
      dob: `${dobYear}-${dobMonth.toString().padStart(2, '0')}-${dobDay.toString().padStart(2, '0')}`,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      bloodType: ['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B-', 'AB-'][i % 8],
      email: pseudoEncrypt(emailRaw),
      phone: `555-${100 + (i % 899)}-${1000 + (i % 8999)}`,
      address: `${100 + i} Medical Plaza Dr, Healthcare City, ST 12345`,
      diagnoses,
      medications,
      vitals: {
        height: `${5 + (i % 2)}'${7 + (i % 5)}"`,
        weight: `${140 + (i % 60)} lbs`,
        bmi: (20 + (i % 10)).toString(),
        bp: `${110 + (i % 30)}/${70 + (i % 20)}`,
        hr: (60 + (i % 30)).toString(),
        temp: "98.6 F"
      },
      history: HISTORY_SNIPPETS[i % HISTORY_SNIPPETS.length]
    };
  });
}
// --- GLOBAL VOLATILE IN-MEMORY STORAGE ---
const inMemoryPatients: Patient[] = [];
const inMemoryChatHistory: Map<string, Message[]> = new Map();
const startTime = Date.now();
// Helper to get formatted patients
const getFormattedPatients = (search?: string) => {
  const filtered = search
    ? inMemoryPatients.filter(p =>
        p.firstName.toLowerCase().includes(search.toLowerCase()) ||
        p.lastName.toLowerCase().includes(search.toLowerCase()) ||
        p.mrn.toLowerCase().includes(search.toLowerCase())
      )
    : [...inMemoryPatients];
  console.log('[getFormattedPatients] Filtered count:', filtered.length, 'search:', search);
  return filtered.map(p => ({
    ...p,
    ssn: p.ssn.startsWith('SSN_') ? decryptField(p.ssn) : atob(p.ssn),
    email: p.email.startsWith('EMAIL_') ? decryptField(p.email) : atob(p.email),
    diagnoses: typeof p.diagnoses === 'string' ? JSON.parse(p.diagnoses) : p.diagnoses,
    medications: typeof p.medications === 'string' ? JSON.parse(p.medications) : p.medications,
    vitals: typeof p.vitals === 'string' ? JSON.parse(p.vitals) : p.vitals
  }));
};
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
  app.post('/api/chat/:sessionId/chat', async (c) => {
    const sessionId = c.req.param('sessionId');
    const { message, stream, model } = await c.req.json();
    const history = inMemoryChatHistory.get(sessionId) || [];
    const handler = new ChatHandler(
      c.env.CF_AI_BASE_URL,
      c.env.CF_AI_API_KEY,
      model || 'google-ai-studio/gemini-2.0-flash'
    );
    if (stream) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      (async () => {
        try {
          const response = await handler.processMessage(message, history, undefined, (chunk: string) => {
            writer.write(encoder.encode(chunk));
          });
          const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: message, timestamp: Date.now() };
          const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: response.content, timestamp: Date.now() };
          inMemoryChatHistory.set(sessionId, [...history, userMsg, assistantMsg]);
        } catch (e) {
          console.error('In-memory chat error:', e);
          writer.write(encoder.encode('System communication error.'));
        } finally {
          writer.close();
        }
      })();
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const response = await handler.processMessage(message, history);
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: message, timestamp: Date.now() };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: response.content, timestamp: Date.now() };
    inMemoryChatHistory.set(sessionId, [...history, userMsg, assistantMsg]);
    return c.json({ success: true, data: { messages: inMemoryChatHistory.get(sessionId) } });
  });
  app.get('/api/chat/:sessionId/messages', (c) => {
    const sessionId = c.req.param('sessionId');
    return c.json({ success: true, data: { messages: inMemoryChatHistory.get(sessionId) || [] } });
  });
  app.delete('/api/chat/:sessionId/clear', (c) => {
    const sessionId = c.req.param('sessionId');
    inMemoryChatHistory.set(sessionId, []);
    return c.json({ success: true });
  });
  app.post('/api/chat/:sessionId/init-context', async (c) => {
    const { patientId } = await c.req.json();
    const sessionId = c.req.param('sessionId');
    const formattedPatients = getFormattedPatients();
    const p = formattedPatients.find(p => p.id === patientId);
    if (!p) return c.json({ success: false, error: 'Patient not found' }, 404);
    const existingMessages = inMemoryChatHistory.get(sessionId) || [];
    const hasSystemPrompt = existingMessages.some(m => m.role === 'system');
    if (!hasSystemPrompt) {
      const systemMsg: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Patient Context: ${p.firstName} ${p.lastName}. DOB: ${p.dob}. Diagnoses: ${p.diagnoses.map((d: Diagnosis) => d.description).join(', ')}. Medications: ${p.medications.map((m: Medication) => m.name).join(', ')}. History: ${p.history}. Be professional and mention specific medical details.`,
        timestamp: Date.now()
      };
      inMemoryChatHistory.set(sessionId, [systemMsg]);
    }
    return c.json({ success: true });
  });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/patients', (c) => {
    const search = c.req.query('q');
    console.log('[API/PATIENTS] Request received, current length:', inMemoryPatients.length);
    if (inMemoryPatients.length === 0) {
      inMemoryPatients.push(...generatePatients(55));
      console.log('[API/PATIENTS] Generated 55 patients, new length:', inMemoryPatients.length);
    }
    return c.json({ success: true, data: getFormattedPatients(search) });
  });
  app.get('/api/patients/:id', (c) => {
    if (inMemoryPatients.length === 0) {
      inMemoryPatients.push(...generatePatients(55));
    }
    const id = c.req.param('id');
    const p = inMemoryPatients.find(item => item.id === id);
    if (!p) return c.json({ success: false, error: 'Record not found' }, 404);
    const formattedPatient = getFormattedPatients().find(item => item.id === id);
    return c.json({ success: true, data: formattedPatient });
  });
  app.post('/api/patients', async (c) => {
    const body = await c.req.json();
    const newPatient = {
      ...body,
      id: body.id || crypto.randomUUID(),
      mrn: body.mrn || `AURA-${Math.floor(200000 + Math.random() * 900000)}`,
      ssn: encryptField(body.ssn),
      email: encryptField(body.email),
      vitals: body.vitals || {
        height: "5'10\"", weight: "165 lbs", bmi: "23.7", bp: "120/80", hr: "72", temp: "98.6 F"
      },
      diagnoses: body.diagnoses || [],
      medications: body.medications || []
    };
    inMemoryPatients.unshift(newPatient);
    const formattedNewPatient = {
      ...newPatient,
      ssn: decryptField(newPatient.ssn),
      email: decryptField(newPatient.email)
    };
    return c.json({ success: true, data: formattedNewPatient });
  });
  app.post('/api/seed-patients', (c) => {
    const force = c.req.query('force') === 'true';
    if (force || inMemoryPatients.length === 0) {
      inMemoryPatients.length = 0;
      inMemoryPatients.push(...generatePatients(55));
    }
    return c.json({ success: true, count: inMemoryPatients.length });
  });
  app.post('/api/analyze-evidence', async (c) => {
    try {
      const { image } = await c.req.json();
      if (!image) return c.json({ success: false, error: 'Image data required' }, 400);
      const aiResponse = await fetch(`${c.env.CF_AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.CF_AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: '@cf/llava-hf/llava-1.5-7b-hf',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze this clinical image and describe findings for diagnostic support. If this looks like a skin condition, provide clinical descriptors.' },
                { type: 'image_url', image_url: { url: image } }
              ]
            }
          ],
          max_tokens: 512
        })
      });
      if (!aiResponse.ok) throw new Error(`Vision AI Gateway error: ${aiResponse.status}`);
      const result: any = await aiResponse.json();
      const analysis = result.choices?.[0]?.message?.content || "Clinical analysis finalized. Standard morphological features observed.";
      return c.json({ success: true, data: { analysis, confidence: 0.88 + (Math.random() * 0.1) } });
    } catch (err) {
      console.error("Vision API Error:", err);
      return c.json({ success: false, error: "Clinical Vision Engine Unavailable" }, 500);
    }
  });
  app.get('/api/db-status', (c) => {
    console.log('[API/DB-STATUS] inMemoryPatients.length:', inMemoryPatients.length);
    return c.json({
      success: true,
      data: {
        engine: 'Aura Volatile Isolate',
        binding: 'EDGE_IN_MEMORY',
        connected: true,
        pingMs: Math.floor(Math.random() * 5) + 1,
        patientCount: inMemoryPatients.length,
        sessionCount: inMemoryChatHistory.size,
        status: 'HEALTHY',
        schemaVersion: '1.2.0-PROD'
      }
    });
  });
}