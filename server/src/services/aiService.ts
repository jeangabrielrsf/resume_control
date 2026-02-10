import { env } from '../config/env';

export type AIModel = 'kimi' | 'minimax' | 'glm4' | 'deepseek';

const BASE_URL: Record<AIModel, string> = {
    kimi: 'https://integrate.api.nvidia.com/v1/chat/completions',
    minimax: 'https://integrate.api.nvidia.com/v1/chat/completions',
    glm4: 'https://integrate.api.nvidia.com/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/v1/chat/completions'
};

const MODELS: Record<AIModel, string> = {
    kimi: 'moonshotai/kimi-k2.5',
    minimax: 'minimaxai/minimax-m2.1',
    glm4: 'z-ai/glm4.7',
    deepseek: 'deepseek-reasoner'
};

const MAX_TOKENS: Record<AIModel, number> = {
    kimi: 16000,
    minimax: 16000,
    glm4: 16000,
    deepseek: 16000
};

const TEMPERATURE: Record<AIModel, number> = {
    kimi: 0.7,
    minimax: 1.0,
    glm4: 1.0,
    deepseek: 1.3
};

const TOP_P: Record<AIModel, number> = {
    kimi: 1.0,
    minimax: 0.95,
    glm4: 1.0,
    deepseek: 1.0
};

function getApiKey(modelType: AIModel): string {
    const keys: Record<AIModel, string | undefined> = {
        kimi: env.NVIDIA_KIMI_API_KEY,
        minimax: env.NVIDIA_MINIMAX_API_KEY,
        glm4: env.NVIDIA_MINIMAX_API_KEY,
        deepseek: env.DEEPSEEK_API_KEY
    };
    const key = keys[modelType];
    if (!key) throw new Error(`API Key for ${modelType} is missing`);
    return key;
}

function stripThinkTags(content: string): string {
    return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export const generateResume = async (jobDescription: string, baseResume: string, modelType: AIModel = 'kimi') => {
    const apiKey = getApiKey(modelType);
    const modelName = MODELS[modelType];

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

    console.log(`Generating resume with ${modelName}...`);

    const response = await fetch(BASE_URL[modelType], {
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
                { role: "user", content: `JOB DESCRIPTION:\n${jobDescription}` }
            ],
            max_tokens: MAX_TOKENS[modelType],
            temperature: TEMPERATURE[modelType],
            top_p: TOP_P[modelType],
            stream: false,
            ...(modelType === 'glm4' && { extra_body: { chat_template_kwargs: { enable_thinking: true, clear_thinking: false } } })
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI API failed (${modelType}): ${response.status} ${errText}`);
    }

    const data = await response.json() as any;
    let content = data.choices?.[0]?.message?.content || "";

    // Cleanup
    content = stripThinkTags(content);
    content = content.replace(/^```latex\n|```$/g, '').trim();
    content = content.replace(/^```\n/, '').replace(/```$/, '');

    console.log("Generating resume completed")
    return content;
};
