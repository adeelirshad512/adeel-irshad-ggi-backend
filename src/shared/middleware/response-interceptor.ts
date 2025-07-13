import { Request, Response, NextFunction } from 'express';

export function responseInterceptor(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;

  res.json = function (this: Response, data: any) {
    const isAlreadyFormatted = data && typeof data === 'object' && 'result' in data && 'error' in data;

    if (isAlreadyFormatted) {
      return originalJson.call(this, data);
    }

    return originalJson.call(this, {
      result: {
        ...data,
        date: new Date().toISOString(),
      },
      error: null,
    });
  };

  next();
}
