import React from 'react';
import { IndividualImage } from '../../bets/Bet/BetCell/betImages/debugImage';
import { JsonLogEntry } from './useJsonLogs';

type JsonLogLineProps = {
  entry: JsonLogEntry;
  setFilter: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  sectionId: string;
  logBasePath?: string;
  lineIdx?: string;
  highlighted?: boolean;
};

const LOG_LEVEL_COLORS: Record<string, string> = {
  DEBUG: 'rgb(230, 219, 116)',
  INFO: 'greenyellow',
  WARNING: '#f59e0b',
  ERROR: '#f92672',
  CRITICAL: '#f92672',
};

const DEFAULT_LOG_BASE_PATH = 'D:/projects/python/odds_monkey_bot/dist/logs';

const KNOWN_KEYS = new Set([
  'timestamp',
  'name',
  'levelname',
  'filename',
  'funcName',
  'lineno',
//   'event',
]);

const SCREENSHOT_PATH_KEYS = new Set(['screenshot_file_path', 'file_path']);

const JsonLogLine = ({
  entry,
  setFilter,
  sectionId,
  logBasePath = DEFAULT_LOG_BASE_PATH,
  lineIdx,
  highlighted = false,
}: JsonLogLineProps) => {
  const {
    timestamp,
    levelname: level,
    filename: file,
    funcName: fn,
    lineno: line,
  } = entry;
  const basePath = logBasePath.replace(/\/logs$/, '').replace(/\//g, '\\');
  const isScreenshot = entry.event.includes('screenshot');
  const screenshotPath = isScreenshot
    ? resolvePath(
        (entry.screenshot_file_path as string) || (entry.file_path as string),
        basePath,
      )
    : undefined;

  return (
    <pre
      className={sectionId}
      data-line-idx={lineIdx}
      style={{
        color: '#ddd',
        fontSize: '16px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        textDecoration: 'none',
        borderLeft: highlighted
          ? '2px solid rgba(249, 38, 114, 0.55)'
          : '2px solid transparent',
        paddingLeft: '8px',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        borderRadius: undefined,
        transition: 'all 0.2s ease',
        margin: 0,
      }}
    >[
      <span style={{ color: 'rgb(174, 129, 255)' }}>{timestamp} </span>
      <span
        onClick={() => {
          window.electron.ipcRenderer.openInVscode(
            file,
            parseInt(String(line), 10),
          );
        }}
        style={{
          color: '#58a6ff',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
        title={`Click to open ${file}:${line} in VS Code`}
      >
        {file}
        {fn ? `->${fn}()` : ''}:{line}
      </span>]
      <span
        className="code-log-level"
        onClick={() => setFilter({ [level]: 1 })}
        style={{
          color: LOG_LEVEL_COLORS[level] || '#ddd',
          cursor: 'pointer',
        }}
      >
        {level}
      </span>:{' '}
      {renderPayload(entry)}
      {screenshotPath && (
        <React.Fragment>
          <br />
          <span title={screenshotPath}>
            <IndividualImage path={screenshotPath} thumbSize={180} />
          </span>
        </React.Fragment>
      )}
    </pre>
  );
};

function renderPayload(entry: JsonLogEntry): React.ReactNode[] {
  const keys = Object.keys(entry).filter(
    (k) => !KNOWN_KEYS.has(k) && !SCREENSHOT_PATH_KEYS.has(k),
  );
  if (keys.length === 0) return [];

keys.sort((a, b) => {
    const rank = (k: string) => (k === 'event' ? 0 : k === 'result' ? 1 : 2);
    return rank(a) - rank(b);
  });

  return keys.flatMap((key, i) => {
    const value = entry[key];
    return [
      i > 0 ? ' ' : null,
      <span key={`k-${i}`} className="code-key">
        {key}=
      </span>,
      <ValueSpan
        key={`v-${i}`}
        value={value}
        isGold={key === 'message' || key === 'reason'}
      />,
    ];
  });
}

function ValueSpan({
  value,
  isGold = false,
}: {
  value: unknown;
  isGold?: boolean;
}): React.ReactNode {
  if (value === null) {
    return <span style={{ color: '#31d2ac' }}>null</span>;
  }
  if (typeof value === 'number') {
    return <span style={{ color: 'rgb(174, 129, 255)' }}>{String(value)}</span>;
  }
  if (typeof value === 'string') {
    return <StringWithLinks value={value} isGold={isGold} />;
  }
  if (typeof value === 'boolean') {
    return <span style={{ color: 'greenyellow' }}>{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    return (
      <span style={{ color: '#ddd' }}>
        [
        {value.map((v, i) => (
          <React.Fragment key={i}>
            {i > 0 ? ', ' : ''}
            <ValueSpan value={v} />
          </React.Fragment>
        ))}
        ]
      </span>
    );
  }
  if (typeof value === 'object') {
    const inner = Object.entries(value as Record<string, unknown>);
    return (
      <span style={{ color: '#ddd' }}>
        (
        {inner.flatMap(([k, v], i) => [
          i > 0 ? ' ' : null,
          <span key={`k-${i}`} className="code-key">
            {k}=
          </span>,
          <ValueSpan
            key={`v-${i}`}
            value={v}
            isGold={k === 'message' || k === 'reason'}
          />,
        ])}
        )
      </span>
    );
  }
  return <span>{String(value)}</span>;
}

const URL_REGEX = /https?:\/\/[^\s)>\]]+/;
const HTML_FILE_REGEX = /[^\s,)>\]]+\.html\b/;

function StringWithLinks({
  value,
  isGold = false,
}: {
  value: string;
  isGold?: boolean;
}): React.ReactNode {
  const base = isGold ? '#FFD700' : '#ddd';
  const tokenRegex = new RegExp(
    `(${URL_REGEX.source}|${HTML_FILE_REGEX.source})`,
  );
  const parts = value.split(tokenRegex).filter(Boolean);
  if (parts.length === 1) {
    return <span style={{ color: base }}>{value}</span>;
  }
  return (
    <span style={{ color: base }}>
      {parts.map((part, i) => {
        if (HTML_FILE_REGEX.test(part)) {
          const normalizedPath = part.replace(/\\/g, '/');
          const filePath = normalizedPath.match(/^[a-zA-Z]:\//)
            ? normalizedPath
            : `D:/projects/python/odds_monkey_bot/${normalizedPath}`;
          const fileHref = `file://${filePath}`;
          return (
            <a
              key={i}
              href={fileHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                const platformPath = filePath.replaceAll('/', '\\');
                window.electron.ipcRenderer.openPath(platformPath);
              }}
              style={{
                color: '#58a6ff',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              {part}
            </a>
          );
        }
        if (URL_REGEX.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#58a6ff',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
}

function resolvePath(raw: string, basePath: string): string {
  const normalized = raw.replace(/\\/g, '/');
  if (/^[a-zA-Z]:\//.test(normalized) || normalized.startsWith('/')) {
    return normalized;
  }
  return `${basePath}/${normalized}`;
}

export default JsonLogLine;
