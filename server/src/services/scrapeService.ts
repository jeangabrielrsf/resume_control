import { env } from '../config/env';
import type { AIModel } from './aiService';

const MODELS: Record<AIModel, string> = {
    kimi: 'moonshotai/kimi-k2.5',
    minimax: 'minimaxai/minimax-m2.1',
    glm4: 'z-ai/glm4.7'
};

function getApiKey(modelType: AIModel): string {
    const keys: Record<AIModel, string | undefined> = {
        kimi: env.NVIDIA_KIMI_API_KEY,
        minimax: env.NVIDIA_MINIMAX_API_KEY,
        glm4: env.NVIDIA_MINIMAX_API_KEY
    };
    const key = keys[modelType];
    if (!key) throw new Error(`API Key for ${modelType} is missing`);
    return key;
}

function stripThinkTags(content: string): string {
    return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export type ScrapedJobData = {
    empresa: string;
    vaga: string;
    stack: string[];
    senioridade: string;
    local: string;
    tipoVaga: string;
    description: string;
};

async function fetchPageContent(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();

    // Strip HTML tags, scripts, styles to get plain text
    const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Limit to ~8000 chars to avoid token limits
    return text.substring(0, 8000);
}

export async function scrapeJobFromUrl(url: string, modelType: AIModel = 'kimi'): Promise<ScrapedJobData> {
    const pageContent = await fetchPageContent(url);

    const apiKey = getApiKey(modelType);
    const modelName = MODELS[modelType];

    const systemPrompt = `You are a Job Listing Data Extractor.
TASK: Extract structured job information from the provided page content.
RULES:
1. Output ONLY valid JSON, no markdown, no explanation.
2. Use this exact JSON schema:
{
  "empresa": "Company name",
  "vaga": "Job title",
  "stack": ["Tech1", "Tech2"],
  "senioridade": "One of: Estágio, Júnior, Pleno, Sênior",
  "local": "Location or country",
  "tipoVaga": "One of: Remoto, Híbrido, Presencial",
  "description": "Full job description text, summarized in 2-3 paragraphs"
}
3. For "senioridade", infer from context (e.g., "senior" → "Sênior", "junior" → "Júnior", "intern" → "Estágio"). Default to "Pleno" if unclear.
4. For "tipoVaga", infer from context (e.g., "remote" → "Remoto", "hybrid" → "Híbrido", "on-site" → "Presencial"). Default to "Remoto" if unclear.
5. For "stack", extract all technologies, frameworks, languages, and tools mentioned.
6. If a field cannot be determined, use an empty string "" or empty array [].`;

    console.log(`Scraping job with Nvidia/${modelName}...`);

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `PAGE CONTENT:\n${pageContent}` }
            ],
            max_tokens: 4096,
            temperature: 0.3,
            top_p: 0.95,
            stream: false,
            ...(modelType === 'glm4' && { extra_body: { chat_template_kwargs: { enable_thinking: true, clear_thinking: false } } })
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Nvidia API failed: ${response.status} ${errText}`);
    }

    const data = await response.json() as any;
    let content = data.choices?.[0]?.message?.content || "{}";

    // Clean up potential markdown wrappers and think tags
    content = stripThinkTags(content);
    content = content.replace(/^```json\n?|```$/g, '').trim();
    content = content.replace(/^```\n?/, '').replace(/```$/, '').trim();

    const parsed: ScrapedJobData = JSON.parse(content);
    console.log("Scraping job completed")
    return parsed;
}
