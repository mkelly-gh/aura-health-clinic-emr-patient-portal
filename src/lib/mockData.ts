import type { Patient } from '../../worker/types';

export function serializeForSQL(p: Patient) {
    return {
        ...p,
        diagnoses: JSON.stringify(p.diagnoses),
        medications: JSON.stringify(p.medications),
        vitals: JSON.stringify(p.vitals)
    };
}