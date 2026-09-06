export const LOG_PATHS = {
  DIST: 'D:/projects/python/odds_monkey_bot/dist/logs',
  DEV: 'D:/projects/python/odds_monkey_bot/logs',
};

export const LOG_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

export const ERROR_SOURCE_REGEX =
  /(\w+\.py)->\w+\(\):(\d+)\](ERROR|CRITICAL):\s*(.+)/;

export type RecurringError = {
  pattern: string;
  level: 'warning' | 'error' | 'critical';
  count: number;
  sectionIds: string[];
};
