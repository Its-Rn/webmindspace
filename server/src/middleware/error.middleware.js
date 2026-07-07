import { appEnv } from '../config/env.js';

export const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || 'Internal server error'
  };

  if (error.details) {
    response.details = error.details;
  }

  if (appEnv.nodeEnv !== 'production') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

