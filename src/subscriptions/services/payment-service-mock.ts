import { PaymentService } from '../domains/interfaces/payment-service';
import { logger } from '../../shared/utils/logger';

export class MockPaymentService implements PaymentService {
  async processPayment(subscriptionId: string, amount: number): Promise<void> {
    logger.info(`Mock payment processed for subscription ${subscriptionId}: $${amount}`);
  }
}
