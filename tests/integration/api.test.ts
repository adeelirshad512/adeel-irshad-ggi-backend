import { execSync } from 'child_process';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { app } from '../../src/app';
import { Chat } from '../../src/chat/domains/entities/chat';
import { Usage } from '../../src/chat/domains/entities/usage';
import { AppDataSource } from '../../src/shared/config/database';
import { env } from '../../src/shared/config/env';
import { generateId } from '../../src/shared/utils/uuid';
import { Payment } from '../../src/subscriptions/domains/entities/payment';
import { Subscription } from '../../src/subscriptions/domains/entities/subscription';
import { SubscriptionType } from '../../src/subscriptions/enums/subscription-type';

let dataSource: DataSource;

beforeAll(async () => {
  dataSource = new DataSource({
    type: 'postgres',
    url: env.TEST_DATABASE_URL,
    entities: [Chat, Usage, Subscription, Payment],
    synchronize: true,
    dropSchema: true,
    logging: false,
  });

  await dataSource.initialize();

  Object.defineProperty(AppDataSource, 'getRepository', {
    value: dataSource.getRepository.bind(dataSource),
  });

  execSync('npm run seed-data');
});

afterAll(async () => {
  await dataSource.destroy();
});

describe('API Integration Tests', () => {
  const userId = generateId();
  const anotherUserId = generateId();

  beforeEach(async () => {
    await dataSource.getRepository(Chat).clear();
    await dataSource.getRepository(Usage).clear();
    await dataSource.getRepository(Subscription).clear();
    await dataSource.getRepository(Payment).clear();
  });

  describe('POST /api/chat', () => {
    it('should allow a new user to ask a question and store it', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ userId, question: 'What is TypeScript?' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        result: {
          answer: expect.stringContaining('Mocked response to: What is TypeScript?'),
          date: expect.any(String),
        },
        error: null,
      });

      const usage = await dataSource.getRepository(Usage).findOneBy({ userId });
      expect(usage).toBeTruthy();
      expect(usage?.freeResponses).toBe(2);

      const chat = await dataSource.getRepository(Chat).findOneBy({ userId });
      expect(chat).toBeTruthy();
      expect(chat?.question).toBe('What is TypeScript?');
      expect(chat?.answer).toBe(response.body.result.answer);
    });

    it('should decrement free responses and block after 3', async () => {
      await dataSource.getRepository(Usage).save({ 
        id: generateId(),
        userId, 
        freeResponses: 0, 
        bundleResponses: 0 
      });

      const response = await request(app)
        .post('/api/chat')
        .send({ userId, question: 'Test question' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        result: null,
        error: { 
          code: 403, 
          message: 'Usage limit exceeded. Please subscribe.',
          errorType: 'USAGE_LIMIT_EXCEEDED'
        },
      });
    });

    it('should use bundle responses after free responses are exhausted', async () => {
      await dataSource.getRepository(Usage).save({ 
        id: generateId(),
        userId, 
        freeResponses: 0, 
        bundleResponses: 5 
      });

      const response = await request(app)
        .post('/api/chat')
        .send({ userId, question: 'Test question' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        result: {
          answer: expect.stringContaining('Mocked response to: Test question'),
          date: expect.any(String),
        },
        error: null,
      });

      const usage = await dataSource.getRepository(Usage).findOneBy({ userId });
      expect(usage?.bundleResponses).toBe(4);
    });

    it('should return 400 for invalid userId', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ userId: 'invalid-uuid', question: 'Test question' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        result: null,
        error: {
          code: 400,
          message: expect.stringContaining('Validation failed'),
          errorType: 'VALIDATION_ERROR',
        },
      });
    });

    it('should return 400 for empty question', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ userId, question: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        result: null,
        error: {
          code: 400,
          message: expect.stringContaining('Validation failed'),
          errorType: 'VALIDATION_ERROR',
        },
      });
    });

    it('should return 400 for missing question', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ userId });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        result: null,
        error: {
          code: 400,
          message: expect.stringContaining('Validation failed'),
          errorType: 'VALIDATION_ERROR',
        },
      });
    });
  });

  describe('POST /api/subscriptions', () => {
    it('should create a monthly subscription and update usage', async () => {
      await dataSource.getRepository(Usage).save({ 
        id: generateId(),
        userId, 
        freeResponses: 0, 
        bundleResponses: 0 
      });

      const response = await request(app)
        .post('/api/subscriptions')
        .send({ userId, type: SubscriptionType.MONTHLY, autoRenew: true });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ 
        result: { 
          message: 'Subscription created',
          date: expect.any(String),
        }, 
        error: null 
      });

      const subscription = await dataSource.getRepository(Subscription).findOneBy({ userId });
      expect(subscription).toBeTruthy();
      expect(subscription?.type).toBe(SubscriptionType.MONTHLY);
      expect(subscription?.autoRenew).toBe(true);

      const payment = await dataSource.getRepository(Payment).findOneBy({ subscriptionId: subscription?.id });
      expect(payment).toBeTruthy();
      expect(payment?.amount).toBe(10);

      const usage = await dataSource.getRepository(Usage).findOneBy({ userId });
      expect(usage?.bundleResponses).toBe(10);
    });

    it('should create a yearly subscription', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .send({ userId, type: SubscriptionType.YEARLY, autoRenew: false });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ 
        result: { 
          message: 'Subscription created',
          date: expect.any(String),
        }, 
        error: null 
      });

      const subscription = await dataSource.getRepository(Subscription).findOneBy({ userId });
      expect(subscription?.type).toBe(SubscriptionType.YEARLY);
      expect(subscription?.autoRenew).toBe(false);

      const payment = await dataSource.getRepository(Payment).findOneBy({ subscriptionId: subscription?.id });
      expect(payment?.amount).toBe(100);
    });

    it('should return 400 for existing subscription', async () => {
      await dataSource.getRepository(Subscription).save({
        id: generateId(),
        userId,
        type: SubscriptionType.MONTHLY,
        autoRenew: true,
        responses: 10,
      });

      const response = await request(app)
        .post('/api/subscriptions')
        .send({ userId, type: SubscriptionType.YEARLY, autoRenew: true });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        result: null,
        error: { 
          code: 403,
          message: 'User already has an active subscription.',
          errorType: expect.any(String),
        },
      });
    });

    it('should return 400 for invalid subscription type', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .send({ userId, type: 'invalid', autoRenew: true });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        result: null,
        error: {
          code: 400,
          message: expect.stringContaining('Validation failed'),
          errorType: 'VALIDATION_ERROR',
        },
      });
    });

    it('should return 400 for invalid userId', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .send({ userId: 'invalid-uuid', type: SubscriptionType.MONTHLY, autoRenew: true });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        result: null,
        error: {
          code: 400,
          message: expect.stringContaining('Validation failed'),
          errorType: 'VALIDATION_ERROR',
        },
      });
    });
  });

  describe('PATCH /api/subscriptions/auto-renew', () => {
    it('should toggle auto-renew to false', async () => {
      await dataSource.getRepository(Subscription).save({
        id: generateId(),
        userId,
        type: SubscriptionType.MONTHLY,
        autoRenew: true,
        responses: 10,
      });

      const response = await request(app)
        .patch('/api/subscriptions/auto-renew')
        .send({ userId, autoRenew: false });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        result: { 
          message: 'Auto-renew updated',
          date: expect.any(String),
        }, 
        error: null 
      });

      const subscription = await dataSource.getRepository(Subscription).findOneBy({ userId });
      expect(subscription?.autoRenew).toBe(false);
    });

    it('should return 404 for non-existent subscription', async () => {
      const response = await request(app)
        .patch('/api/subscriptions/auto-renew')
        .send({ userId, autoRenew: false });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        result: null,
        error: { 
          code: 404, 
          message: 'Subscription not found',
          errorType: expect.any(String),
        },
      });
    });

    it('should return 400 for invalid userId', async () => {
      const response = await request(app)
        .patch('/api/subscriptions/auto-renew')
        .send({ userId: 'invalid-uuid', autoRenew: false });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        result: null,
        error: {
          code: 400,
          message: expect.stringContaining('Validation failed'),
          errorType: 'VALIDATION_ERROR',
        },
      });
    });
  });

  describe('POST /api/subscriptions/renew', () => {
    it('should simulate recurring payment and reset responses', async () => {
      await dataSource.getRepository(Subscription).save({
        id: generateId(),
        userId,
        type: SubscriptionType.MONTHLY,
        autoRenew: true,
        responses: 2,
      });
      await dataSource.getRepository(Usage).save({ 
        id: generateId(),
        userId, 
        freeResponses: 0, 
        bundleResponses: 2 
      });

      const response = await request(app)
        .post('/api/subscriptions/renew')
        .send({ userId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        result: { 
          message: 'Payment renewed',
          date: expect.any(String),
        }, 
        error: null 
      });

      const subscription = await dataSource.getRepository(Subscription).findOneBy({ userId });
      expect(subscription?.responses).toBe(10);
      expect(subscription?.renewedAt).toBeTruthy();

      const usage = await dataSource.getRepository(Usage).findOneBy({ userId });
      expect(usage?.bundleResponses).toBe(12);

      const payment = await dataSource.getRepository(Payment).findOneBy({ subscriptionId: subscription?.id });
      expect(payment?.amount).toBe(10);
    });

    it('should return 400 if auto-renew is disabled', async () => {
      await dataSource.getRepository(Subscription).save({
        id: generateId(),
        userId,
        type: SubscriptionType.MONTHLY,
        autoRenew: false,
        responses: 2,
      });

      const response = await request(app)
        .post('/api/subscriptions/renew')
        .send({ userId });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        result: null,
        error: { 
          code: 400, 
          message: 'Auto-renew is disabled',
          errorType: expect.any(String),
        },
      });
    });

    it('should return 404 for non-existent subscription', async () => {
      const response = await request(app)
        .post('/api/subscriptions/renew')
        .send({ userId });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        result: null,
        error: { 
          code: 404, 
          message: 'Subscription not found',
          errorType: expect.any(String),
        },
      });
    });

    it('should return 400 for invalid userId', async () => {
      const response = await request(app)
        .post('/api/subscriptions/renew')
        .send({ userId: 'invalid-uuid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        result: null,
        error: {
          code: 400,
          message: expect.stringContaining('Validation failed'),
          errorType: 'VALIDATION_ERROR',
        },
      });
    });
  });

  describe('Integration Flow Tests', () => {
    it('should handle complete user journey: new user -> exhaust free -> subscribe -> continue chatting', async () => {
      const testUserId = generateId();
      
      const firstChat = await request(app)
        .post('/api/chat')
        .send({ userId: testUserId, question: 'First question' });
      
      expect(firstChat.status).toBe(200);
      
      await request(app)
        .post('/api/chat')
        .send({ userId: testUserId, question: 'Second question' });
      
      await request(app)
        .post('/api/chat')
        .send({ userId: testUserId, question: 'Third question' });
      
      const failedChat = await request(app)
        .post('/api/chat')
        .send({ userId: testUserId, question: 'Fourth question' });
      
      expect(failedChat.status).toBe(403);
      expect(failedChat.body.error.message).toBe('Usage limit exceeded. Please subscribe.');
      
      const subscription = await request(app)
        .post('/api/subscriptions')
        .send({ userId: testUserId, type: SubscriptionType.MONTHLY, autoRenew: true });
      
      expect(subscription.status).toBe(201);
      
      const successChat = await request(app)
        .post('/api/chat')
        .send({ userId: testUserId, question: 'Fifth question after subscription' });
      
      expect(successChat.status).toBe(200);
      expect(successChat.body.result.answer).toContain('Mocked response to: Fifth question after subscription');
      
      const usage = await dataSource.getRepository(Usage).findOneBy({ userId: testUserId });
      expect(usage?.freeResponses).toBe(0);
      expect(usage?.bundleResponses).toBe(9);
    });

    it('should handle subscription renewal correctly', async () => {
      const testUserId = generateId();
      
      await dataSource.getRepository(Usage).save({
        id: generateId(),
        userId: testUserId,
        freeResponses: 0,
        bundleResponses: 0
      });
      
      await request(app)
        .post('/api/subscriptions')
        .send({ userId: testUserId, type: SubscriptionType.MONTHLY, autoRenew: true });
      
      await request(app)
        .post('/api/chat')
        .send({ userId: testUserId, question: 'Using bundle response' });
      
      let usage = await dataSource.getRepository(Usage).findOneBy({ userId: testUserId });
      expect(usage?.bundleResponses).toBe(9);
      
      const renewal = await request(app)
        .post('/api/subscriptions/renew')
        .send({ userId: testUserId });
      
      expect(renewal.status).toBe(200);
      
      usage = await dataSource.getRepository(Usage).findOneBy({ userId: testUserId });
      expect(usage?.bundleResponses).toBe(19);
    });
  });
});