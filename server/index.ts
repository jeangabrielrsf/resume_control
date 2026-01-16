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

    // --- AI Generation (Gemini) ---
    .post('/ai/generate-resume', async ({ body, error }) => {
        const { jobDescription } = body as { jobDescription: string };
        await db.read();
        const baseResume = db.data.settings?.baseResume;

        if (!baseResume) {
            return error(400, 'Base Resume is empty. Please set it in settings first.');
        }

        // Call Gemini API
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.error("GEMINI_API_KEY is missing");
                return error(500, 'GEMINI_API_KEY is not configured on the server.');
            }

            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

            console.log("Generating resume with Gemini...");

            const prompt = `You are a Resume Expert.
        
TASK: Customize the following LaTeX resume for the job description provided.
RULES:
1. Keep the same LaTeX structure and commands. Do NOT remove packages, structural elements or comments.
2. Only modify the Content (Summary, Experience bullets, Skills) to better match the Job Description keywords.
3. Output ONLY the raw LaTeX code. No markdown code blocks, no intro text. Do not wrap in \`\`\`latex.
4. Use power verbs in job's description, under "EXPERIÊNCIA" section, like "Desenvolvi soluções", "Gerenciei equipes", "Otimizei processos", etc.
5. Use the same bullet points style as the base resume.

JOB DESCRIPTION:
${jobDescription}

BASE RESUME LATEX:
${baseResume}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up: Remove markdown blocks if present
            const cleanText = text.replace(/^```latex\n|```$/g, '').trim();
            // Also remove if it starts with ```
            const finalClean = cleanText.replace(/^```\n/, '').replace(/```$/, '');

            return { generatedResume: finalClean };

        } catch (err) {
            console.error("Gemini API Error:", err);
            return error(500, 'Failed to generate resume via Gemini API');
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