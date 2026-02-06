import { JSONFilePreset } from 'lowdb/node';

// Types
export type Application = {
    id: string;
    empresa: string;
    vaga: string;
    linkVaga: string;
    dataCandidatura: string; // ISO Date
    stack: string[];
    etapa: 'Enviei candidatura' | 'Etapa com RH' | 'Etapa técnica' | 'Oferta' | 'Negativa';
    tempoProcesso: number; // Computed in days
    senioridade: 'Júnior' | 'Pleno' | 'Sênior' | 'Estágio';
    local: string;
    tipoVaga: 'Remoto' | 'Híbrido' | 'Presencial';
    observacoes: string;
    description: string;
    updatedAt: string;
};

export type Settings = {
    baseResume: string;
};

export type Data = {
    applications: Application[];
    settings: Settings;
};

const defaultData: Data = {
    applications: [],
    settings: { baseResume: '' }
};

// Initialize LowDB
export const db = await JSONFilePreset<Data>('./data/db.json', defaultData);
