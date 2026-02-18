export interface Patient {
  id: string;
  mrn: string;
  ssn: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: string;
  email: string;
  phone: string;
  address: string;
  diagnoses: { code: string; description: string; date: string }[];
  medications: { name: string; dosage: string; frequency: string; status: 'Active' | 'Discontinued' }[];
  vitals: { height: string; weight: string; bmi: string; bp: string; hr: string; temp: string };
  history: string;
}
const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const DIAGNOSES = [
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
    return {
      id,
      mrn: `AURA-${100000 + i}`,
      ssn: `${Math.floor(100 + Math.random() * 800)}-${Math.floor(10 + Math.random() * 80)}-${Math.floor(1000 + Math.random() * 8000)}`,
      firstName,
      lastName,
      dob: `${dobYear}-${dobMonth.toString().padStart(2, '0')}-${dobDay.toString().padStart(2, '0')}`,
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      bloodType: ['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B-', 'AB-'][Math.floor(Math.random() * 8)],
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `555-${100 + Math.random() * 800}-${Math.floor(1000 + Math.random() * 8000)}`,
      address: `${Math.floor(100 + Math.random() * 900)} Medical Plaza Dr, Healthcare City, ST 12345`,
      diagnoses: [DIAGNOSES[Math.floor(Math.random() * DIAGNOSES.length)]],
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
      history: "Patient has a chronic history of managed hypertension. No known drug allergies."
    };
  });
}