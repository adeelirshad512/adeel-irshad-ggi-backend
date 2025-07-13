import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { SubscriptionType } from '../../subscriptions/enums/subscription-type';
import { CustomError } from '../utils/error';
import { ErrorType } from '../utils/error-types';

function formatValidationErrors(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const mainMessage = firstError.msg;
    const detailedMessages = errors.array().map((error: any) => `${error.param}: ${error.msg}`);
    const detailedMessage = `Validation failed: ${detailedMessages.join(', ')}`;
    throw new CustomError(detailedMessage, 400, ErrorType.VALIDATION);
  }
}

export const validateChat = [
  body('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('question').isString().notEmpty().withMessage('question must be a non-empty string'),
  (req: Request, res: Response, next: NextFunction) => {
    formatValidationErrors(req);
    next();
  },
];

export const validateSubscription = [
  body('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('type').isIn(Object.values(SubscriptionType)).withMessage('type must be either "monthly" or "yearly"'),
  body('autoRenew').isBoolean().withMessage('autoRenew must be a boolean'),
  (req: Request, res: Response, next: NextFunction) => {
    formatValidationErrors(req);
    next();
  },
];

export const validateAutoRenew = [
  body('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('autoRenew').isBoolean().withMessage('autoRenew must be a boolean'),
  (req: Request, res: Response, next: NextFunction) => {
    formatValidationErrors(req);
    next();
  },
];

export const validateRenew = [
  body('userId').isUUID().withMessage('userId must be a valid UUID'),
  (req: Request, res: Response, next: NextFunction) => {
    formatValidationErrors(req);
    next();
  },
];
