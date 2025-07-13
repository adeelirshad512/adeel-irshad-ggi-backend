export interface AIService {
  generateResponse(question: string): Promise<string>;
}
