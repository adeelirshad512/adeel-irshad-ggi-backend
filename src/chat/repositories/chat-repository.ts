import { DataSource } from 'typeorm';
import { Chat } from '../domains/entities/chat';
import { Usage } from '../domains/entities/usage';
import { ChatRepository as IChatRepository } from '../domains/interfaces/chat-repository.interface';

export class ChatRepository implements IChatRepository {
  constructor(private readonly dataSource: DataSource) {}

  async saveChat(chat: Chat): Promise<void> {
    await this.dataSource.getRepository(Chat).save(chat);
  }

  async findUsageByUserId(userId: string): Promise<Usage | null> {
    return this.dataSource.getRepository(Usage).findOneBy({ userId });
  }

  async saveUsage(usage: Usage): Promise<void> {
    await this.dataSource.getRepository(Usage).save(usage);
  }
}
