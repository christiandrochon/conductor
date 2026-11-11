import test from 'node:test';
import assert from 'node:assert/strict';
import pino from 'pino';
import { createLogger } from '../src/support/logger';

/*
 * Prouve qu'un seul transport (donc un seul worker thread) est créé quel que
 * soit le nombre de loggers hors production, et aucun en production.
 */
test('un seul transport pino-pretty pour N loggers (dev)', () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  const original = pino.transport;
  let calls = 0;
  (pino as { transport: unknown }).transport = (...args: Parameters<typeof pino.transport>) => {
    calls += 1;
    return original(...args);
  };
  try {
    const loggers = Array.from({ length: 50 }, (_, i) => createLogger(`scenario-${i}`));
    assert.equal(calls, 1);
    assert.equal(loggers.length, 50);
    loggers[0].info('smoke');
  } finally {
    (pino as { transport: unknown }).transport = original;
    process.env.NODE_ENV = previous;
  }
});

test('aucun transport en production', () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const original = pino.transport;
  let calls = 0;
  (pino as { transport: unknown }).transport = (...args: Parameters<typeof pino.transport>) => {
    calls += 1;
    return original(...args);
  };
  try {
    createLogger('a');
    createLogger('b');
    assert.equal(calls, 0);
  } finally {
    (pino as { transport: unknown }).transport = original;
    process.env.NODE_ENV = previous;
  }
});
