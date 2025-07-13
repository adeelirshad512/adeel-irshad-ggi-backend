import { Chat } from '../chat/domains/entities/chat';
import { Usage } from '../chat/domains/entities/usage';
import { AppDataSource } from '../shared/config/database';
import { Payment } from '../subscriptions/domains/entities/payment';
import { Subscription } from '../subscriptions/domains/entities/subscription';
import { SubscriptionType } from '../subscriptions/enums/subscription-type';

async function dumpData() {
  await AppDataSource.initialize();

  const chatRepository = AppDataSource.getRepository(Chat);
  const usageRepository = AppDataSource.getRepository(Usage);
  const subscriptionRepository = AppDataSource.getRepository(Subscription);
  const paymentRepository = AppDataSource.getRepository(Payment);

  const users = [
    { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'John Doe' },
    { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', name: 'Jane Smith' },
  ];

  for (const user of users) {
    const usage = new Usage();
    usage.userId = user.id;
    usage.freeResponses = 3;
    usage.bundleResponses = 0;
    await usageRepository.save(usage);

    const chat = new Chat();
    chat.userId = user.id;
    chat.question = `Hello from ${user.name}?`;
    chat.answer = `Mocked response to: Hello from ${user.name}?`;
    await chatRepository.save(chat);

    const subscription = new Subscription();
    subscription.userId = user.id;
    subscription.type = user.id === users[0].id ? SubscriptionType.MONTHLY : SubscriptionType.YEARLY;
    subscription.autoRenew = true;
    subscription.responses = 10;
    await subscriptionRepository.save(subscription);

    const payment = new Payment();
    payment.subscriptionId = subscription.id;
    payment.amount = subscription.type === SubscriptionType.MONTHLY ? 10 : 100;
    await paymentRepository.save(payment);
  }

  await AppDataSource.destroy();
}

dumpData().catch((err: unknown) => console.error(err));
