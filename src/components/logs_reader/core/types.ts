export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type JsonLogEntry = {
  timestamp: string;
  levelname: LogLevel;
  filename: string;
  funcName: string;
  lineno: number;
  /** Always snakecased  e.g. `bet.logged_event`. */
  event: string;
  /** snakecase e.g. `taking_screenshot`. */
  result: string;
  event_name?: string;
  bet?: string;
  market_type?: string;
  [key: string]: unknown;
};

export function parseJsonLine(line: string): JsonLogEntry | undefined {
  const trimmed = line?.trim();
  if (!trimmed || !trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return undefined;
  }
  try {
    return JSON.parse(trimmed) as JsonLogEntry;
  } catch {
    return undefined;
  }
}

export type LogError = {
  lineNum: number;
  errorType: 'critical' | 'error' | 'warning';
};

export type ErrorContextWindow = {
  /** Index into the section's (filtered) data of the error-level line. */
  anchorIdx: number;
  /** Indices into the section's (filtered) data of hidden context lines
   *  revealed when the anchor's inline toggle is clicked. */
  contextIdxs: number[];
};

export type BetSection = {
  data: string[];
  _id: string;
  eventName?: string;
  betName?: string;
  marketType?: string;
  errors: LogError[];
  miniSection?: boolean;
  errorContext?: ErrorContextWindow[];
};
