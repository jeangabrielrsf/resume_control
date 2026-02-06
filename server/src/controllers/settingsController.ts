import { db } from '../db';
import { t } from 'elysia';

export const getSettings = async () => {
    await db.read();
    if (!db.data.settings) {
        db.data.settings = { baseResume: '' };
        await db.write();
    }
    return db.data.settings;
};

export const updateSettings = async ({ body }: any) => {
    await db.read();
    db.data.settings = { ...db.data.settings, ...(body as any) };
    await db.write();
    return db.data.settings;
};

export const settingsSchema = {
    body: t.Object({
        baseResume: t.String()
    })
};
