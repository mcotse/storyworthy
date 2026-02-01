import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    logger.clearLogs();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('logs info messages with structured data', () => {
    logger.info('test_event', { user_id: '123' });

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].event).toBe('test_event');
    expect(logs[0].level).toBe('info');
    expect(logs[0].context.user_id).toBe('123');
    expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('logs errors with error details', () => {
    const error = new Error('Something went wrong');
    logger.error('error_event', error, { entry_date: '2024-01-15' });

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].event).toBe('error_event');
    expect(logs[0].level).toBe('error');
    expect(logs[0].context.error_name).toBe('Error');
    expect(logs[0].context.error_message).toBe('Something went wrong');
    expect(logs[0].context.entry_date).toBe('2024-01-15');
  });

  it('creates child loggers with preset context', () => {
    const childLog = logger.child({ service: 'sync', sync_id: 'abc123' });
    childLog.info('child_event', { extra: 'data' });

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    // service is lifted to top-level, not in context
    expect(logs[0].service).toBe('sync');
    expect(logs[0].context.sync_id).toBe('abc123');
    expect(logs[0].context.extra).toBe('data');
  });

  it('supports nested child loggers', () => {
    const serviceLog = logger.child({ service: 'sync' });
    const operationLog = serviceLog.child({ sync_id: 'xyz789' });
    operationLog.info('nested_event', { entry_date: '2024-01-15' });

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].service).toBe('sync');
    expect(logs[0].context.sync_id).toBe('xyz789');
    expect(logs[0].context.entry_date).toBe('2024-01-15');
  });

  it('generates unique IDs', () => {
    const id1 = logger.generateId();
    const id2 = logger.generateId();

    expect(id1).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('times async operations', async () => {
    const result = await logger.time(
      'test_operation',
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      },
      { operation: 'test' }
    );

    expect(result).toBe('done');

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].event).toBe('test_operation_completed');
    expect(logs[0].context.duration_ms).toBeGreaterThanOrEqual(10);
  });

  it('times failed async operations', async () => {
    await expect(
      logger.time('failing_operation', async () => {
        throw new Error('Failed');
      })
    ).rejects.toThrow('Failed');

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].event).toBe('failing_operation_failed');
    expect(logs[0].level).toBe('error');
    expect(logs[0].context.error_message).toBe('Failed');
  });

  it('exports logs as JSON', () => {
    logger.info('event1');
    logger.warn('event2');

    const exported = logger.exportLogs();
    const parsed = JSON.parse(exported);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].event).toBe('event1');
    expect(parsed[1].event).toBe('event2');
  });

  it('maintains circular buffer', () => {
    // Log more than buffer size (500) to test circular buffer
    for (let i = 0; i < 510; i++) {
      logger.info(`event_${i}`);
    }

    const logs = logger.getLogs();
    expect(logs).toHaveLength(500);
    expect(logs[0].event).toBe('event_10'); // First 10 should be dropped
    expect(logs[499].event).toBe('event_509');
  });
});
