export const LOG_LEVEL_COLORS: Record<string, string> = {
  DEBUG: 'rgb(230, 219, 116)',
  INFO: 'greenyellow',
  WARNING: '#f59e0b',
  ERROR: '#f92672',
  CRITICAL: '#f92672',
};

export const DEFAULT_LOG_BASE_PATH =
  'D:/projects/python/odds_monkey_bot/dist/logs';

export const KNOWN_KEYS = new Set([
  'timestamp',
  'name',
  'levelname',
  'filename',
  'funcName',
  'lineno',
]);

export const SCREENSHOT_PATH_KEYS = new Set([
  'screenshot_file_path',
  'file_path',
]);

export const KEY_COLOR = '#5bc0be';

export const URL_REGEX = /https?:\/\/[^\s)>\]]+/;
export const HTML_FILE_REGEX = /[^\s,)>\]]+\.html\b/;

export function resolvePath(raw: string, basePath: string): string {
  const normalized = raw.replace(/\\/g, '/');
  if (/^[a-zA-Z]:\//.test(normalized) || normalized.startsWith('/')) {
    return normalized;
  }
  return `${basePath}/${normalized}`;
}
