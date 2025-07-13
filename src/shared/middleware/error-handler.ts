import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/error';
import { ErrorType } from '../utils/error-types';

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error caught by error handler:', error);

  if (error instanceof CustomError) {
    return res.status(error.statusCode).json({
      result: null,
      error: {
        code: error.statusCode,
        message: error.message,
        errorType: error.errorType,
      },
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      result: null,
      error: {
        code: 400,
        message: 'Validation failed',
        errorType: ErrorType.VALIDATION,
      },
    });
  }

  if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
    return res.status(409).json({
      result: null,
      error: {
        code: 409,
        message: 'Duplicate entry',
        errorType: ErrorType.DUPLICATION,
      },
    });
  }

  return res.status(500).json({
    result: null,
    error: {
      code: 500,
      message: 'Internal server error',
      errorType: ErrorType.INTERNAL,
    },
  });
}
