import { AppDataSource } from '../shared/config/database';

async function deleteData() {
  await AppDataSource.initialize();

  await AppDataSource.query('TRUNCATE TABLE chat, usage, subscription, payment CASCADE;');
  await AppDataSource.destroy();
}

deleteData().catch((err: unknown) => console.error(err));
