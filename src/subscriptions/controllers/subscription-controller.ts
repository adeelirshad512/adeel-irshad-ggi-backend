import { Request, Response, Router } from 'express';
import { subscriptionServiceInstance } from '../../app';
import { validateAutoRenew, validateRenew, validateSubscription } from '../../shared/middleware/validator';
import { asyncHandler } from '../../shared/middleware/async-handler';

export class SubscriptionController {
  private static instance: SubscriptionController;
  private router = Router();

  private constructor() {
    this.setupRoutes();
  }

  static getInstance(): SubscriptionController {
    if (!SubscriptionController.instance) {
      SubscriptionController.instance = new SubscriptionController();
    }
    return SubscriptionController.instance;
  }

  private setupRoutes() {
    this.router.post(
      '/',
      validateSubscription,
      asyncHandler(async (req: Request, res: Response) => {
        const { userId, type, autoRenew } = req.body;
        await subscriptionServiceInstance.createSubscription(userId, type, autoRenew);
        res.status(201).json({ message: 'Subscription created' });
      })
    );

    this.router.patch(
      '/auto-renew',
      validateAutoRenew,
      asyncHandler(async (req: Request, res: Response) => {
        const { userId, autoRenew } = req.body;
        await subscriptionServiceInstance.toggleAutoRenew(userId, autoRenew);
        res.json({ message: 'Auto-renew updated' });
      })
    );

    this.router.post(
      '/renew',
      validateRenew,
      asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.body;
        await subscriptionServiceInstance.simulateRecurringPayment(userId);
        res.json({ message: 'Payment renewed' });
      })
    );
  }

  getRouter() {
    return this.router;
  }
}

export const subscriptionRouter = SubscriptionController.getInstance().getRouter();
