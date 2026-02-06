import { db, type Application } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { t } from 'elysia';

export const getApplications = async () => {
    await db.read();
    const now = new Date();
    if (!db.data.applications) db.data.applications = [];

    const updatedApps = db.data.applications.map(app => {
        const start = new Date(app.dataCandidatura);
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...app, tempoProcesso: diffDays };
    });

    return updatedApps;
};

export const getApplicationById = async ({ params: { id }, error }: any) => {
    await db.read();
    const app = db.data.applications.find((a) => a.id === id);
    if (!app) return error(404, 'Application not found');
    return app;
};

export const createApplication = async ({ body }: any) => {
    const newApp: Application = {
        ...(body as any),
        id: uuidv4(),
        tempoProcesso: 0,
        updatedAt: new Date().toISOString()
    };

    if (!newApp.dataCandidatura) newApp.dataCandidatura = new Date().toISOString();

    await db.update(({ applications }) => applications.push(newApp));
    return newApp;
};

export const updateApplication = async ({ params: { id }, body, error }: any) => {
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
};

export const deleteApplication = async ({ params: { id }, error }: any) => {
    await db.read();
    const index = db.data.applications.findIndex(a => a.id === id);
    if (index === -1) return error(404, 'Application not found');

    await db.update(({ applications }) => {
        applications.splice(index, 1);
    });

    return { success: true, id };
};

export const getTags = async () => {
    await db.read();
    const apps = db.data.applications || [];
    const allTags = apps.flatMap(app => app.stack || []);
    return [...new Set(allTags)].sort();
};

export const applicationSchema = {
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
};

export const updateApplicationSchema = {
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
};
