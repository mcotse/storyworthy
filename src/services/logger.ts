/**
 * Structured logging service for Storyworthy
 *
 * Design principles (from loggingsucks.com):
 * - Logs are optimized for querying, not writing
 * - Always use structured JSON with key-value pairs
 * - Include high-cardinality fields for debugging (entry_date, user_id, sync_id)
 * - Context is everything in debugging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  // Core identifiers
  service?: string;
  environment?: 'prod' | 'dev';

  // High-cardinality fields for debugging
  entry_date?: string;
  user_id?: string;
  sync_id?: string;
  request_id?: string;

  // Domain-specific
  photo_type?: 'photo' | 'thumbnail';
  reminder_id?: string;
  tab?: string;

  // Error details
  error_name?: string;
  error_message?: string;
  error_stack?: string;

  // Performance
  duration_ms?: number;
  size_bytes?: number;

  // Additional context
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  service: string;
  environment: 'prod' | 'dev';
  context: LogContext;
}

// Configuration
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Store logs in memory for export/debugging (circular buffer)
const LOG_BUFFER_SIZE = 500;
const logBuffer: LogEntry[] = [];

// Determine environment
const environment: 'prod' | 'dev' =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'dev'
    : 'prod';

// Minimum log level (debug in dev, info in prod)
const minLevel: LogLevel = environment === 'dev' ? 'debug' : 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatError(error: unknown): Partial<LogContext> {
  if (error instanceof Error) {
    return {
      error_name: error.name,
      error_message: error.message,
      error_stack: environment === 'dev' ? error.stack : undefined,
    };
  }
  if (typeof error === 'string') {
    return { error_message: error };
  }
  return { error_message: String(error) };
}

function createLogEntry(
  level: LogLevel,
  event: string,
  context: LogContext = {}
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: context.service || 'storyworthy',
    environment,
    context: { ...context },
  };

  // Remove service and environment from context (already top-level)
  delete entry.context.service;
  delete entry.context.environment;

  return entry;
}

function log(level: LogLevel, event: string, context: LogContext = {}): void {
  if (!shouldLog(level)) return;

  const entry = createLogEntry(level, event, context);

  // Add to circular buffer
  logBuffer.push(entry);
  if (logBuffer.length > LOG_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Output to console with structured data
  const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  const contextStr = Object.keys(entry.context).length > 0
    ? entry.context
    : undefined;

  if (environment === 'dev') {
    // Pretty output in development
    console[consoleMethod](
      `[${entry.level.toUpperCase()}] ${entry.event}`,
      contextStr || ''
    );
  } else {
    // Structured JSON in production (for log aggregation)
    console[consoleMethod](JSON.stringify(entry));
  }
}

// Public API
export const logger = {
  debug: (event: string, context?: LogContext) => log('debug', event, context),
  info: (event: string, context?: LogContext) => log('info', event, context),
  warn: (event: string, context?: LogContext) => log('warn', event, context),
  error: (event: string, error?: unknown, context?: LogContext) =>
    log('error', event, { ...context, ...formatError(error) }),

  /**
   * Get all logs in buffer (for export/debugging)
   */
  getLogs: (): LogEntry[] => [...logBuffer],

  /**
   * Export logs as JSON string
   */
  exportLogs: (): string => JSON.stringify(logBuffer, null, 2),

  /**
   * Clear log buffer
   */
  clearLogs: (): void => {
    logBuffer.length = 0;
  },

  /**
   * Create a child logger with preset context
   */
  child: (defaultContext: LogContext): ChildLogger => {
    const createChildLogger = (ctx: LogContext): ChildLogger => ({
      debug: (event: string, context?: LogContext) =>
        log('debug', event, { ...ctx, ...context }),
      info: (event: string, context?: LogContext) =>
        log('info', event, { ...ctx, ...context }),
      warn: (event: string, context?: LogContext) =>
        log('warn', event, { ...ctx, ...context }),
      error: (event: string, error?: unknown, context?: LogContext) =>
        log('error', event, { ...ctx, ...context, ...formatError(error) }),
      child: (nestedContext: LogContext) =>
        createChildLogger({ ...ctx, ...nestedContext }),
    });
    return createChildLogger(defaultContext);
  },

  /**
   * Time an async operation
   */
  async time<T>(
    event: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration_ms = Math.round(performance.now() - start);
      log('info', `${event}_completed`, { ...context, duration_ms });
      return result;
    } catch (error) {
      const duration_ms = Math.round(performance.now() - start);
      log('error', `${event}_failed`, {
        ...context,
        duration_ms,
        ...formatError(error),
      });
      throw error;
    }
  },

  /**
   * Generate a unique ID for correlation (sync operations, etc.)
   */
  generateId: (): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  },
};

// Type for child loggers (supports nesting)
export interface ChildLogger {
  debug: (event: string, context?: LogContext) => void;
  info: (event: string, context?: LogContext) => void;
  warn: (event: string, context?: LogContext) => void;
  error: (event: string, error?: unknown, context?: LogContext) => void;
  child: (context: LogContext) => ChildLogger;
}

// Export type for main logger
export type Logger = typeof logger;
