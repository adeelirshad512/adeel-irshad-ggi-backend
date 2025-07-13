import { app } from './app';
import { env } from './shared/config/env';
import { AppDataSource } from './shared/config/database';
import { logger } from './shared/utils/logger';

const PORT = env.PORT || 3000;


async function startServer() {
  try {
    await AppDataSource.initialize();
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Closing...');
      server.close(async () => {
        await AppDataSource.destroy();
        logger.info('DB disconnected. Exiting.');
        process.exit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
