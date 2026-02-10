import { Elysia, t } from 'elysia';
import * as AppController from '../controllers/applicationController';
import * as SettingsController from '../controllers/settingsController';
import * as ResumeController from '../controllers/resumeController';
import * as ScrapeController from '../controllers/scrapeController';

export const routes = new Elysia()
    .get('/', () => 'Job Tracker API Running')

    // Settings
    .get('/settings', SettingsController.getSettings)
    .put('/settings', SettingsController.updateSettings, SettingsController.settingsSchema)

    // AI
    .post('/ai/generate-resume', ResumeController.generateResumeController, {
        body: t.Object({
            jobDescription: t.String(),
            model: t.Optional(t.Union([t.Literal('kimi'), t.Literal('minimax'), t.Literal('glm4'), t.Literal('deepseek')]))
        })
    })
    .post('/ai/scrape-job', ScrapeController.scrapeJobController, {
        body: t.Object({
            url: t.String(),
            model: t.Optional(t.Union([t.Literal('kimi'), t.Literal('minimax'), t.Literal('glm4'), t.Literal('deepseek')]))
        })
    })

    // Tags
    .get('/tags', AppController.getTags)

    // Applications
    .get('/applications', AppController.getApplications)
    .get('/applications/:id', AppController.getApplicationById)
    .post('/applications', AppController.createApplication, AppController.applicationSchema)
    .put('/applications/:id', AppController.updateApplication, AppController.updateApplicationSchema)
    .delete('/applications/:id', AppController.deleteApplication);
