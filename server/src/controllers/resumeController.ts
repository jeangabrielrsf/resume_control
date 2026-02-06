import { db } from '../db';
import { generateResume, type AIModel } from '../services/aiService';

export const generateResumeController = async ({ body, error }: any) => {
    const { jobDescription, model } = body as { jobDescription: string; model?: AIModel };

    await db.read();
    const baseResume = db.data.settings?.baseResume;

    if (!baseResume) {
        return error(400, 'Base Resume is empty. Please set it in settings first.');
    }

    try {
        const generatedResume = await generateResume(jobDescription, baseResume, model || 'kimi');
        return { generatedResume };
    } catch (err: any) {
        console.error("AI Generation Error:", err);
        return error(500, err.message || 'Failed to generate resume');
    }
};
