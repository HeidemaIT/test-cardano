import { env } from './config/env';
import { app } from './app';
const server = app.listen(env.PORT, () => {
    console.log(`Server listening on http://localhost:${env.PORT}`);
});
function shutdown(signal) {
    console.log(`\nReceived ${signal}, shutting down...`);
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
    // Force exit after timeout
    setTimeout(() => {
        console.error('Forcefully exiting');
        process.exit(1);
    }, 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
