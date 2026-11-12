import { test, expect } from 'vitest';
import { runBot } from './bot';

test('progression du bot sur 6 h', () => {
  const { s } = runBot(6, 7, !!process.env.BAL);
  expect(s.unlocked.length).toBe(5);
  expect(s.hero.gen).toBeGreaterThan(50);
  expect(s.legacyTotal).toBeGreaterThan(30);
}, 120_000);
