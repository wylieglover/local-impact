import pino, { type LoggerOptions } from 'pino';
import { env } from '../config/env.js';

const pinoOptions: LoggerOptions = {
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  // Serializers transform the log objects before they are printed
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      // only include the cookie if you're actively debugging it
      // cookie: req.headers.cookie 
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err, // Standard error formatting
  },
};

if (env.NODE_ENV === 'development') {
  pinoOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      // Ignore these internal pino keys to keep the line short
      ignore: 'pid,hostname,req.headers,res.headers', 
      translateTime: 'HH:MM:ss',
    },
  };
}

export const logger = pino(pinoOptions);