export interface PaymentService {
  processPayment(subscriptionId: string, amount: number): Promise<void>;
}
