import { DataSource } from 'typeorm';
import { Chat } from '../../chat/domains/entities/chat';
import { Usage } from '../../chat/domains/entities/usage';
import { Payment } from '../../subscriptions/domains/entities/payment';
import { Subscription } from '../../subscriptions/domains/entities/subscription';
import { env } from './env';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [Chat, Usage, Subscription, Payment],
  synchronize: true,
  logging: false,
});
