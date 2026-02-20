import type { Patient } from '../../worker/types';
const pseudoEncrypt = (text: string) => btoa(text);
const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Thomas', 'Nancy', 'Steven', 'Karen', 'Kevin'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez'];
const DIAGNOSES_TEMPLATES = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'F41.1', description: 'Generalized anxiety disorder' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'K90.0', description: 'Celiac disease' },
  { code: 'E55.9', description: 'Vitamin D deficiency, unspecified' },
  { code: 'G43.909', description: 'Migraine, unspecified, not intractable' },
  { code: 'G47.33', description: 'Obstructive sleep apnea (adult) (pediatric)' },
  { code: 'M17.11', description: 'Unilateral primary osteoarthritis, right knee' }
];
const MEDS_LIBRARY = [
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
  { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime' },
  { name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily in morning' },
  { name: 'Albuterol', dosage: '90mcg/actuation', frequency: 'Every 4 hours as needed' },
  { name: 'Sertraline', dosage: '50mg', frequency: 'Once daily' },
  { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
  { name: 'Omeprazole', dosage: '20mg', frequency: 'Once daily' }
];
const HISTORY_SNIPPETS = [
  "Patient has a chronic history of managed hypertension. Routine screening suggested.",
  "Diagnosed with childhood asthma; episodes now infrequent and managed with rescue inhaler.",
  "Family history significant for early-onset cardiovascular disease. Monitoring lipid profile closely.",
  "Recent onset of migraine headaches; patient keeping a trigger diary for clinical review.",
  "Management of type 2 diabetes through diet and exercise; medication compliance is excellent.",
  "Reporting fatigue and joint pain. Vitamin D levels were found to be critically low in recent labs.",
  "Patient presents with seasonal allergies and occasional acid reflux symptoms."
];
export function generatePatients(count: number = 55): Patient[] {
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
export function serializeForSQL(p: Patient) {
    return {
        ...p,
        diagnoses: JSON.stringify(p.diagnoses),
        medications: JSON.stringify(p.medications),
        vitals: JSON.stringify(p.vitals)
    };
}