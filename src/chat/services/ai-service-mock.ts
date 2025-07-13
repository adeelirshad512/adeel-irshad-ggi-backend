import { AIService } from '../domains/interfaces/ai-service.interface';

export class MockAIService implements AIService {
  async generateResponse(question: string): Promise<string> {
    return `Mocked response to: ${question}`;
  }
}
