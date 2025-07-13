import { Request, Response, Router } from 'express';
import { chatServiceInstance } from '../../app';
import { validateChat } from '../../shared/middleware/validator';
import { asyncHandler } from '../../shared/middleware/async-handler';

export class ChatController {
  private static instance: ChatController;
  private router = Router();

  private constructor() {
    this.setupRoutes();
  }

  static getInstance(): ChatController {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  private setupRoutes() {
    this.router.post(
      '/',
      validateChat,
      asyncHandler(async (req: Request, res: Response) => {
        const { userId, question } = req.body;
        const answer = await chatServiceInstance.askQuestion(userId, question);
        res.json({ answer });
      })
    );
  }

  getRouter() {
    return this.router;
  }
}

export const chatRouter = ChatController.getInstance().getRouter();
