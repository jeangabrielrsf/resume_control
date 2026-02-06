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

    // --- AI Generation (Nvidia / Kimi-k2.5) ---
    .post('/ai/generate-resume', async ({ body, error }) => {
        const { jobDescription } = body as { jobDescription: string };
        await db.read();
        const baseResume = db.data.settings?.baseResume;

        if (!baseResume) {
            return error(400, 'Base Resume is empty. Please set it in settings first.');
        }

        const apiKey = process.env.NVIDIA_API_KEY;
        if (!apiKey) {
            console.error("NVIDIA_API_KEY is missing");
            return error(500, 'NVIDIA_API_KEY is not configured on the server.');
        }

        try {
            console.log("Generating resume with Nvidia/Minimax-m2.1...");

            const systemPrompt = `You are a Resume Expert.
TASK: Customize the following LaTeX resume for the job description provided.
RULES:
1. Keep the same LaTeX structure and commands. Do NOT remove packages, structural elements or comments.
2. Only modify the Content (Summary, Experience bullets, Skills) to better match the Job Description keywords.
3. Output ONLY the raw LaTeX code. No markdown code blocks, no intro text.
4. Use power verbs in job's description, under "EXPERIÊNCIA" section, like "Desenvolvi soluções", "Gerenciei equipes", "Otimizei processos", etc.
5. Use the same bullet points style as the base resume.
6. Do NOT include \`\`\`latex or \`\`\` markers.

BASE RESUME LATEX:
${baseResume}`;

            const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    model: "minimaxai/minimax-m2.1",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `JOB DESCRIPTION:\n${jobDescription}` }
                    ],
                    max_tokens: 8192,
                    temperature: 1.00,
                    top_p: 0.95,
                    stream: false
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Nvidia API Error:", response.status, errText);
                throw new Error(`Nvidia API failed: ${response.status} ${errText}`);
            }

            const data = await response.json() as any;
            let content = data.choices?.[0]?.message?.content || "";

            // Clean up: Remove markdown blocks if present (just in case model disobeys)
            content = content.replace(/^```latex\n|```$/g, '').trim();
            content = content.replace(/^```\n/, '').replace(/```$/, '');

            return { generatedResume: content };

        } catch (err) {
            console.error("AI Generation Error:", err);
            return error(500, 'Failed to generate resume via AI API');
        }
    }, {
        body: t.Object({
            jobDescription: t.String()
        })
    })

    // --- Tags ---
    .get('/tags', async () => {
        await db.read();
        const apps = db.data.applications || [];
        const allTags = apps.flatMap(app => app.stack || []);
        // Return unique tags sorted
        return [...new Set(allTags)].sort();
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