import { Elysia, t } from 'elysia';
import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { cors } from '@elysiajs/cors';

// Types based on the Implementation Plan
type Application = {
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

type Settings = {
    baseResume: string;
};

type Data = {
    applications: Application[];
    settings: Settings;
};

// Initialize LowDB
const defaultData: Data = {
    applications: [],
    settings: { baseResume: '' }
};
// Use data directory for persistence
const db = await JSONFilePreset<Data>('./data/db.json', defaultData);

const app = new Elysia()
    .use(cors())
    .get('/', () => 'Job Tracker API Running')

    // --- Settings / Base Resume ---
    .get('/settings', async () => {
        await db.read();
        // Ensure settings exists if migration happened
        if (!db.data.settings) {
            db.data.settings = { baseResume: '' };
            await db.write();
        }
        return db.data.settings;
    })
    .put('/settings', async ({ body }) => {
        await db.read();
        db.data.settings = { ...db.data.settings, ...(body as any) };
        await db.write();
        return db.data.settings;
    }, {
        body: t.Object({
            baseResume: t.String()
        })
    })

    // --- AI Generation ---
    .post('/ai/generate-resume', async ({ body, error }) => {
        const { jobDescription } = body as { jobDescription: string };
        await db.read();
        const baseResume = db.data.settings?.baseResume;

        if (!baseResume) {
            return error(400, 'Base Resume is empty. Please set it in settings first.');
        }

        // Call Ollama
        try {
            const ollamaUrl = process.env.OLLAMA_API_URL || 'http://host.docker.internal:11434/api/generate';
            console.log(`Sending request to Ollama at: ${ollamaUrl}`); // Log for debug

            const response = await fetch(ollamaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-oss:20b', // User requested this model
                    prompt: `You are a Resume Expert.
        
TASK: Customize the following LaTeX resume for the job description provided.
RULES:
1. Keep the exact same LaTeX structure and commands. Do NOT remove packages or structural elements.
2. Only modify the Content (Summary, Experience bullets, Skills) to better match the Job Description keywords.
3. Output ONLY the raw LaTeX code. No markdown code blocks, no intro text.

JOB DESCRIPTION:
${jobDescription}

BASE RESUME LATEX:
${baseResume}
`,
                    stream: false
                }),
                signal: AbortSignal.timeout(900_000) // 15 minutes timeout
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}`);
            }

            const data = await response.json();
            return { generatedResume: data.response };

        } catch (err) {
            console.error(err);
            return error(500, 'Failed to generate resume via Ollama');
        }
    }, {
        body: t.Object({
            jobDescription: t.String()
        })
    })

    // --- Applications ---
    // GET All Applications
    .get('/applications', async () => {
        await db.read();

        // Computation of 'tempoProcesso' could happen here or on client. 
        // Let's ensure it's up to date.
        const now = new Date();
        // Ensure applications array exists
        if (!db.data.applications) db.data.applications = [];

        const updatedApps = db.data.applications.map(app => {
            const start = new Date(app.dataCandidatura);
            const diffTime = Math.abs(now.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...app, tempoProcesso: diffDays };
        });

        return updatedApps;
    })

    // GET Single Application
    .get('/applications/:id', async ({ params: { id }, error }) => {
        await db.read();
        const app = db.data.applications.find((a) => a.id === id);
        if (!app) return error(404, 'Application not found');
        return app;
    })

    // POST Create Application
    .post('/applications', async ({ body }) => {
        const newApp: Application = {
            ...(body as any),
            id: uuidv4(),
            tempoProcesso: 0,
            updatedAt: new Date().toISOString()
        };

        // Simple validation default if missing
        if (!newApp.dataCandidatura) newApp.dataCandidatura = new Date().toISOString();

        await db.update(({ applications }) => applications.push(newApp));
        return newApp;
    }, {
        body: t.Object({
            empresa: t.String(),
            vaga: t.String(),
            linkVaga: t.Optional(t.String()),
            dataCandidatura: t.Optional(t.String()),
            stack: t.Optional(t.Array(t.String())),
            etapa: t.String(),
            senioridade: t.Optional(t.String()),
            local: t.Optional(t.String()),
            tipoVaga: t.Optional(t.String()),
            observacoes: t.Optional(t.String()),
            description: t.Optional(t.String())
        })
    })

    // PUT Update Application
    .put('/applications/:id', async ({ params: { id }, body, error }) => {
        await db.read();
        const index = db.data.applications.findIndex(a => a.id === id);
        if (index === -1) return error(404, 'Application not found');

        const updatedApp = {
            ...db.data.applications[index],
            ...(body as any),
            updatedAt: new Date().toISOString()
        };

        await db.update(({ applications }) => {
            applications[index] = updatedApp;
        });

        return updatedApp;
    }, {
        body: t.Object({
            empresa: t.Optional(t.String()),
            vaga: t.Optional(t.String()),
            linkVaga: t.Optional(t.String()),
            dataCandidatura: t.Optional(t.String()),
            stack: t.Optional(t.Array(t.String())),
            etapa: t.Optional(t.String()),
            senioridade: t.Optional(t.String()),
            local: t.Optional(t.String()),
            tipoVaga: t.Optional(t.String()),
            observacoes: t.Optional(t.String()),
            description: t.Optional(t.String())
        })
    })

    // DELETE Application
    .delete('/applications/:id', async ({ params: { id }, error }) => {
        await db.read();
        const index = db.data.applications.findIndex(a => a.id === id);
        if (index === -1) return error(404, 'Application not found');

        await db.update(({ applications }) => {
            applications.splice(index, 1);
        });

        return { success: true, id };
    })

    .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);