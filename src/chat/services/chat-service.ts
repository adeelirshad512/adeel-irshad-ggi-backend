import { CustomError } from '../../shared/utils/error';
import { ErrorType } from '../../shared/utils/error-types';
import { Chat } from '../domains/entities/chat';
import { Usage } from '../domains/entities/usage';
import { AIService } from '../domains/interfaces/ai-service.interface';
import { ChatRepository } from '../domains/interfaces/chat-repository.interface';

export class ChatService {
  private static instance: ChatService;

  private constructor(
    private readonly chatRepository: ChatRepository,
    private readonly aiService: AIService
  ) {}

  static getInstance(chatRepository: ChatRepository, aiService: AIService): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService(chatRepository, aiService);
    }
    return ChatService.instance;
  }

  async askQuestion(userId: string, question: string): Promise<string> {
    const usage = await this.ensureUsage(userId);

    this.consumeUsage(usage);
    await this.chatRepository.saveUsage(usage);

    const answer = await this.aiService.generateResponse(question);

    const chat = this.buildChat(userId, question, answer);
    await this.chatRepository.saveChat(chat);

    return answer;
  }

  private async ensureUsage(userId: string): Promise<Usage> {
    let usage = await this.chatRepository.findUsageByUserId(userId);
    if (!usage) {
      usage = new Usage();
      usage.userId = userId;
      await this.chatRepository.saveUsage(usage);
      usage = (await this.chatRepository.findUsageByUserId(userId))!;
    }
    return usage;
  }

  private consumeUsage(usage: Usage): void {
    const noFree = usage.freeResponses === 0;
    const noBundle = usage.bundleResponses === 0;

    if (noFree && noBundle) {
      throw new CustomError('Usage limit exceeded. Please subscribe.', 403, ErrorType.USAGE_LIMIT);
    }

    if (!noFree) {
      usage.freeResponses -= 1;
    } else {
      usage.bundleResponses -= 1;
    }
  }

  private buildChat(userId: string, question: string, answer: string): Chat {
    const chat = new Chat();
    chat.userId = userId;
    chat.question = question;
    chat.answer = answer;
    return chat;
  }
}

export const chatService = ChatService.getInstance;
