import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/shared/middleware/error-handler';
import { CustomError } from '../../../src/shared/utils/error';
import { ErrorType } from '../../../src/shared/utils/error-types';

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    req = {};
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn();
    res = {
      status: mockStatus,
      json: mockJson,
    };
    next = jest.fn();

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle CustomError instances', () => {
    const customError = new CustomError('Custom error message', 422, ErrorType.VALIDATION);

    errorHandler(customError, req as Request, res as Response, next);

    expect(mockStatus).toHaveBeenCalledWith(422);
    expect(mockJson).toHaveBeenCalledWith({
      result: null,
      error: {
        code: 422,
        message: 'Custom error message',
        errorType: ErrorType.VALIDATION,
      },
    });
  });

  it('should handle ValidationError', () => {
    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';

    errorHandler(validationError, req as Request, res as Response, next);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      result: null,
      error: {
        code: 400,
        message: 'Validation failed',
        errorType: ErrorType.VALIDATION,
      },
    });
  });

  it('should handle MySQL duplicate entry error', () => {
    const duplicateError = new Error('Duplicate entry');
    (duplicateError as any).code = 'ER_DUP_ENTRY';

    errorHandler(duplicateError, req as Request, res as Response, next);

    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({
      result: null,
      error: {
        code: 409,
        message: 'Duplicate entry',
        errorType: ErrorType.DUPLICATION,
      },
    });
  });

  it('should handle PostgreSQL duplicate entry error', () => {
    const duplicateError = new Error('Duplicate entry');
    (duplicateError as any).code = '23505';

    errorHandler(duplicateError, req as Request, res as Response, next);

    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({
      result: null,
      error: {
        code: 409,
        message: 'Duplicate entry',
        errorType: ErrorType.DUPLICATION,
      },
    });
  });

  it('should handle unknown errors as internal server error', () => {
    const unknownError = new Error('Something went wrong');

    errorHandler(unknownError, req as Request, res as Response, next);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      result: null,
      error: {
        code: 500,
        message: 'Internal server error',
        errorType: ErrorType.INTERNAL,
      },
    });
  });

  it('should log errors to console', () => {
    const testError = new Error('Test error');
    
    errorHandler(testError, req as Request, res as Response, next);

    expect(console.error).toHaveBeenCalledWith('Error caught by error handler:', testError);
  });
});
