import { scrapeJobFromUrl } from '../services/scrapeService';
import type { AIModel } from '../services/aiService';

export const scrapeJobController = async ({ body, error }: any) => {
    const { url, model } = body as { url: string; model?: AIModel };

    try {
        const jobData = await scrapeJobFromUrl(url, model || 'kimi');
        return jobData;
    } catch (err: any) {
        console.error("Scrape Error:", err);
        return error(500, err.message || 'Failed to scrape job listing');
    }
};
