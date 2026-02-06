export const API_URL = import.meta.env.VITE_API_URL || '/applications';

const request = async (url, options = {}) => {
    try {
        const res = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || `Request failed with status ${res.status}`);
        }

        // Handle empty responses (like from DELETE)
        if (res.status === 204) return null;

        return res.json();
    } catch (err) {
        console.error(`API Error (${url}):`, err);
        throw err;
    }
};

export const fetchApplications = () => request(API_URL);

export const createApplication = (data) => request(API_URL, {
    method: 'POST',
    body: JSON.stringify(data),
});

export const updateApplication = (id, data) => request(`${API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});

export const deleteApplication = (id) => request(`${API_URL}/${id}`, {
    method: 'DELETE',
});

// --- Settings / AI ---

export const getSettings = async () => {
    try {
        return await request('/settings');
    } catch {
        // Fallback for settings if endpoint fails or doesn't exist yet
        return { baseResume: '' };
    }
};

export const saveSettings = (settings) => request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
});

export const generateResume = async (jobDescription) => {
    const data = await request('/ai/generate-resume', {
        method: 'POST',
        body: JSON.stringify({ jobDescription }),
    });
    return data.generatedResume;
};

export const getTags = async () => {
    try {
        return await request('/tags');
    } catch {
        return [];
    }
};
