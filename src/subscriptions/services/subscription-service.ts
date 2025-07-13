import { ChatRepository } from '../../chat/domains/interfaces/chat-repository.interface';
import { CustomError } from '../../shared/utils/error';
import { ErrorType } from '../../shared/utils/error-types';
import { Payment } from '../domains/entities/payment';
import { Subscription } from '../domains/entities/subscription';
import { PaymentService } from '../domains/interfaces/payment-service';
import { SubscriptionRepository } from '../domains/interfaces/subscription-repository';
import { SubscriptionType } from '../enums/subscription-type';

export class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentService: PaymentService,
    private readonly chatRepository: ChatRepository
  ) {}

  static getInstance(
    subscriptionRepository: SubscriptionRepository,
    paymentService: PaymentService,
    chatRepository: ChatRepository
  ): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService(
        subscriptionRepository,
        paymentService,
        chatRepository
      );
    }
    return SubscriptionService.instance;
  }

  async createSubscription(userId: string, type: SubscriptionType, autoRenew: boolean): Promise<void> {
    const existing = await this.subscriptionRepository.findSubscriptionByUserId(userId);
    if (existing) {
      throw new CustomError('User already has an active subscription.', 403, ErrorType.FORBIDDEN);
    }

    const subscription = new Subscription();
    subscription.userId = userId;
    subscription.type = type;
    subscription.autoRenew = autoRenew;

    await this.subscriptionRepository.saveSubscription(subscription);

    const payment = this.createPaymentForSubscription(subscription);
    await this.paymentService.processPayment(subscription.id, payment.amount);
    await this.subscriptionRepository.savePayment(payment);

    await this.updateUsage(userId, 10);
  }

  async toggleAutoRenew(userId: string, autoRenew: boolean): Promise<void> {
    const subscription = await this.subscriptionRepository.findSubscriptionByUserId(userId);
    if (!subscription) {
      throw new CustomError('Subscription not found', 404, ErrorType.NOT_FOUND);
    }

    subscription.autoRenew = autoRenew;
    await this.subscriptionRepository.saveSubscription(subscription);
  }

  async simulateRecurringPayment(userId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findSubscriptionByUserId(userId);
    if (!subscription) {
      throw new CustomError('Subscription not found', 404, ErrorType.NOT_FOUND);
    }

    if (!subscription.autoRenew) {
      throw new CustomError('Auto-renew is disabled', 400, ErrorType.FORBIDDEN);
    }

    const payment = this.createPaymentForSubscription(subscription);
    await this.paymentService.processPayment(subscription.id, payment.amount);
    await this.subscriptionRepository.savePayment(payment);

    subscription.renewedAt = new Date();
    subscription.responses = 10;
    await this.subscriptionRepository.saveSubscription(subscription);

    await this.updateUsage(userId, 10);
  }

  private createPaymentForSubscription(subscription: Subscription): Payment {
    const payment = new Payment();
    payment.subscriptionId = subscription.id;
    payment.amount = subscription.type === SubscriptionType.MONTHLY ? 10 : 100;
    return payment;
  }

  private async updateUsage(userId: string, bonusResponses: number): Promise<void> {
    const usage = await this.chatRepository.findUsageByUserId(userId);
    if (usage) {
      usage.bundleResponses += bonusResponses;
      await this.chatRepository.saveUsage(usage);
    }
  }
}

export const subscriptionService = SubscriptionService.getInstance;
