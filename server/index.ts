import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { routes } from './src/routes';
import { env } from './src/config/env';

const app = new Elysia()
    .use(cors())
    .use(routes)
    .listen(env.PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);