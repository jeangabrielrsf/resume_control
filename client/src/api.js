export const API_URL = '/applications';

export const fetchApplications = async () => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to fetch applications');
    return res.json();
};

export const createApplication = async (data) => {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create application');
    return res.json();
};

export const updateApplication = async (id, data) => {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update application');
    return res.json();
};

export const deleteApplication = async (id) => {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    return res.json();
};

// --- Settings / AI ---

export const getSettings = async () => {
    const res = await fetch(`/settings`, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return { baseResume: '' };
    return res.json();
};

export const saveSettings = async (settings) => {
    const res = await fetch(`/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    return res.json();
};

export const generateResume = async (jobDescription) => {
    const res = await fetch(`/ai/generate-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate resume');
    return data.generatedResume;
};
