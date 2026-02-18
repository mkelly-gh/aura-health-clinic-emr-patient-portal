import type { Patient } from '../../worker/types';
// We simulate btoa/atob for the frontend as well for consistent generation
const pseudoEncrypt = (text: string) => btoa(text);
const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const DIAGNOSES_TEMPLATES = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'F41.1', description: 'Generalized anxiety disorder' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' }
];
export function generatePatients(count: number = 50): Patient[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const id = (i + 1).toString();
    const dobYear = 1950 + Math.floor(Math.random() * 50);
    const dobMonth = 1 + Math.floor(Math.random() * 12);
    const dobDay = 1 + Math.floor(Math.random() * 28);
    const ssnRaw = `${Math.floor(100 + Math.random() * 800)}-${Math.floor(10 + Math.random() * 80)}-${Math.floor(1000 + Math.random() * 8000)}`;
    const emailRaw = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    return {
      id,
      mrn: `AURA-${100000 + i}`,
      ssn: pseudoEncrypt(ssnRaw),
      firstName,
      lastName,
      dob: `${dobYear}-${dobMonth.toString().padStart(2, '0')}-${dobDay.toString().padStart(2, '0')}`,
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      bloodType: ['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B-', 'AB-'][Math.floor(Math.random() * 8)],
      email: pseudoEncrypt(emailRaw),
      phone: `555-${Math.floor(100 + Math.random() * 800)}-${Math.floor(1000 + Math.random() * 8000)}`,
      address: `${Math.floor(100 + Math.random() * 900)} Medical Plaza Dr, Healthcare City, ST 12345`,
      diagnoses: [
        {
          ...DIAGNOSES_TEMPLATES[Math.floor(Math.random() * DIAGNOSES_TEMPLATES.length)],
          date: new Date(2023, Math.floor(Math.random() * 12), 1).toISOString().split('T')[0]
        }
      ],
      medications: [
        { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', status: 'Active' },
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', status: 'Active' }
      ],
      vitals: {
        height: "5'9\"",
        weight: "175 lbs",
        bmi: "25.8",
        bp: "120/80",
        hr: "72",
        temp: "98.6 F"
      },
      history: "Patient has a chronic history of managed hypertension. Routine screening suggested. No known drug allergies."
    };
  });
}
export function serializeForSQL(p: Patient) {
    return {
        ...p,
        diagnoses: JSON.stringify(p.diagnoses),
        medications: JSON.stringify(p.medications),
        vitals: JSON.stringify(p.vitals)
    };
}