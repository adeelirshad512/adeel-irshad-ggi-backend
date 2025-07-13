import { AppDataSource } from './shared/config/database';
import { logger } from './shared/utils/logger';

AppDataSource.initialize()
  .then(() => logger.info('Database initialized'))
  .catch((err: unknown) => logger.error('Database initialization failed', err));
