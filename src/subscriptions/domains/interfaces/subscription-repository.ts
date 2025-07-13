import { Subscription } from '../entities/subscription';
import { Payment } from '../entities/payment';

export interface SubscriptionRepository {
  saveSubscription(subscription: Subscription): Promise<void>;
  findSubscriptionByUserId(userId: string): Promise<Subscription | null>;
  savePayment(payment: Payment): Promise<void>;
}
