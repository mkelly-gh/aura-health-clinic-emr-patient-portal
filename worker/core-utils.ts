import type { AppController } from './app-controller';
import type { Patient } from './types';
export interface Env {
    CF_AI_BASE_URL: string;
    CF_AI_API_KEY: string;
    SERPAPI_KEY: string;
    OPENROUTER_API_KEY: string;
    CHAT_AGENT: DurableObjectNamespace<any>;
    APP_CONTROLLER: DurableObjectNamespace<any>;
}
/**
 * DEPRECATED: Returns a mock stub as we use volatile in-memory storage now.
 */
export function getAppController(env: Env): any {
  return {
    addSession: async () => {},
    updateSessionActivity: async () => {},
    removeSession: async () => true,
    getPatients: async () => [],
    getPatient: async () => null,
    getPatientCount: async () => 0,
    seedPatients: async () => {}
  };
}
export async function registerSession(env: Env, sessionId: string, title?: string): Promise<void> {
  // Logic handled in userRoutes globals now
}
export async function updateSessionActivity(env: Env, sessionId: string): Promise<void> {
  // Logic handled in userRoutes globals now
}
export async function unregisterSession(env: Env, sessionId: string): Promise<boolean> {
  return true;
}
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
export function generatePatients(): Patient[] {
  const patients: Patient[] = [];
  for (let i = 0; i < 50; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const fullName = `${firstName} ${lastName}`;
    const ssn = `123-45-${String(6789 + i).padStart(4, '0')}`;
    const mrn = `MRN${String(100000 + i).padStart(6, '0')}`;
    // Generate detailed medical records
    const numRecords = Math.floor(Math.random() * 5) + 1; // 1 to 5 records
    const medicalRecords: string[] = [];
    for (let j = 0; j < numRecords; j++) {
      medicalRecords.push(HISTORY_SNIPPETS[Math.floor(Math.random() * HISTORY_SNIPPETS.length)]);
    }
    const diagnosis = DIAGNOSES_TEMPLATES[Math.floor(Math.random() * DIAGNOSES_TEMPLATES.length)];
    const numTreatments = Math.floor(Math.random() * 3) + 1; // 1 to 3 treatments
    const treatments: string[] = [];
    for (let j = 0; j < numTreatments; j++) {
      treatments.push(MEDS_LIBRARY[Math.floor(Math.random() * MEDS_LIBRARY.length)]);
    }
    // Assign ICD-10 codes based on diagnosis (simplified mapping)
    const icd10Codes: string[] = [];
    if (diagnosis.includes('Hypertension')) icd10Codes.push('I10');
    if (diagnosis.includes('Diabetes')) icd10Codes.push('E11.9');
    if (diagnosis.includes('Asthma')) icd10Codes.push('J45.909');
    if (diagnosis.includes('Depression')) icd10Codes.push('F32.9');
    if (diagnosis.includes('Arthritis')) icd10Codes.push('M19.90');
    // Add more mappings as needed, default to a generic code
    if (icd10Codes.length === 0) icd10Codes.push('Z00.00'); // General health check
    patients.push({
      fullName,
      ssn: pseudoEncrypt(ssn),
      mrn,
      medicalRecords,
      diagnosis,
      treatments,
      icd10Codes
    });
  }
  return patients;
}