import { DataSource } from 'typeorm';
import { Payment } from '../domains/entities/payment';
import { Subscription } from '../domains/entities/subscription';
import { SubscriptionRepository as ISubscriptionRepository } from '../domains/interfaces/subscription-repository';

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly dataSource: DataSource) {}

  async saveSubscription(subscription: Subscription): Promise<void> {
    await this.dataSource.getRepository(Subscription).save(subscription);
  }

  async findSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    return this.dataSource.getRepository(Subscription).findOneBy({ userId });
  }

  async savePayment(payment: Payment): Promise<void> {
    await this.dataSource.getRepository(Payment).save(payment);
  }
}
