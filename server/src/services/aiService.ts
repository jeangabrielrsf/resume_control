import { env } from '../config/env';

export type AIModel = 'kimi' | 'minimax';

const MODELS = {
    kimi: 'moonshotai/kimi-k2.5',
    minimax: 'minimaxai/minimax-m2.1'
};

const MAX_TOKENS = {
    kimi: 16384,
    minimax: 8192
};

const TEMPERATURE = {
    kimi: 0.7,
    minimax: 1.0
};

const TOP_P = {
    kimi: 1.0,
    minimax: 0.95
};

export const generateResume = async (jobDescription: string, baseResume: string, modelType: AIModel = 'kimi') => {
    const apiKey = modelType === 'kimi' ? env.NVIDIA_KIMI_API_KEY : env.NVIDIA_MINIMAX_API_KEY;
    const modelName = MODELS[modelType];

    if (!apiKey) {
        throw new Error(`API Key for ${modelType} is missing`);
    }

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

    console.log(`Generating resume with Nvidia/${modelName}...`);

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
                { role: "user", content: `JOB DESCRIPTION:\n${jobDescription}` }
            ],
            max_tokens: MAX_TOKENS[modelType],
            temperature: TEMPERATURE[modelType],
            top_p: TOP_P[modelType],
            stream: false
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Nvidia API failed: ${response.status} ${errText}`);
    }

    const data = await response.json() as any;
    let content = data.choices?.[0]?.message?.content || "";

    // Cleanup
    content = content.replace(/^```latex\n|```$/g, '').trim();
    content = content.replace(/^```\n/, '').replace(/```$/, '');

    return content;
};
