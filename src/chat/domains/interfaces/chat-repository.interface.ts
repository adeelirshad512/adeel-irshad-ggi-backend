import { Chat } from '../entities/chat';
import { Usage } from '../entities/usage';

export interface ChatRepository {
  saveChat(chat: Chat): Promise<void>;
  findUsageByUserId(userId: string): Promise<Usage | null>;
  saveUsage(usage: Usage): Promise<void>;
}
