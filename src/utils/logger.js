import pino from "pino";
import { v4 as uuidv4 } from "uuid";

// Create pino logger with pretty printing for development
const pinoLogger = pino(
  process.env.NODE_ENV === "production"
    ? {}
    : {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname"
          }
        }
      }
);

/**
 * Logger class with request context
 */
export class Logger {
  constructor(requestId = null) {
    this.requestId = requestId || uuidv4().slice(0, 8);
    this.logger = pinoLogger.child({ requestId: this.requestId });
  }

  info(msg, meta = {}) {
    this.logger.info({ ...meta }, msg);
  }

  error(msg, err = null, meta = {}) {
    if (err) {
      this.logger.error({ ...meta, err }, msg);
    } else {
      this.logger.error({ ...meta }, msg);
    }
  }

  warn(msg, meta = {}) {
    this.logger.warn({ ...meta }, msg);
  }

  debug(msg, meta = {}) {
    this.logger.debug({ ...meta }, msg);
  }
}

/**
 * Middleware to attach logger to request and add request context
 */
export const loggerMiddleware = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || uuidv4().slice(0, 8);
  req.logger = new Logger(requestId);
  req.id = requestId;

  res.setHeader("x-request-id", requestId);

  // Log request
  req.logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    restaurantId: req.restaurantId || null,
    userId: req.userId || null
  });

  // Log response
  res.on("finish", () => {
    req.logger.info(`${req.method} ${req.path} - ${res.statusCode}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      contentLength: res.getHeader("content-length") || 0
    });
  });

  next();
};

// Global logger for non-request context
export const logger = new Logger();
