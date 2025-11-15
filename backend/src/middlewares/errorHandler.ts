import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  logger.error(message, { error: err });
  res.status(status).json({ error: message });
}


