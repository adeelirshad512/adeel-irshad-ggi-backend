import express from 'express';
import { AppDataSource } from './shared/config/database';
import { MockAIService } from './chat/services/ai-service-mock';
import { chatService } from './chat/services/chat-service';
import { chatRouter } from './chat/controllers/chat-controller';
import { MockPaymentService } from './subscriptions/services/payment-service-mock';
import { subscriptionService } from './subscriptions/services/subscription-service';
import { subscriptionRouter } from './subscriptions/controllers/subscription-controller';
import { errorHandler } from './shared/middleware/error-handler';
import { responseInterceptor } from './shared/middleware/response-interceptor';
import { SubscriptionRepository } from './subscriptions/repositories/subscription-repository';
import { ChatRepository } from './chat/repositories/chat-repository';

const chatRepository = new ChatRepository(AppDataSource);
const aiService = new MockAIService();
const subscriptionRepository = new SubscriptionRepository(AppDataSource);
const paymentService = new MockPaymentService();

const chatServiceInstance = chatService(chatRepository, aiService);
const subscriptionServiceInstance = subscriptionService(subscriptionRepository, paymentService, chatRepository);

const app = express();

app.use(express.json());
app.use(responseInterceptor);

app.use('/api/chat', chatRouter);
app.use('/api/subscriptions', subscriptionRouter);

app.use(errorHandler);

export { app, chatServiceInstance, subscriptionServiceInstance };
