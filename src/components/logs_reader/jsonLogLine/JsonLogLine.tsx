import React, { useState } from 'react';
import { IndividualImage } from '../../bets/Bet/BetCell/betImages/debugImage';
import { JsonLogEntry } from '../core/types';
import ValueSpan from './ValueSpan';
import {
  DEFAULT_LOG_BASE_PATH,
  KNOWN_KEYS,
  SCREENSHOT_PATH_KEYS,
  LOG_LEVEL_COLORS,
  KEY_COLOR,
  resolvePath,
} from './utils';

type JsonLogLineProps = {
  entry: JsonLogEntry;
  setFilter: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  setSearchStr: (s: string) => void;
  sectionId: string;
  logBasePath?: string;
  lineIdx?: string;
  highlighted?: boolean;
  isContextLine?: boolean;
  visible?: boolean;
  hasContext?: boolean;
  contextExpanded?: boolean;
  onToggleContext?: () => void;
  expandAll?: boolean;
};

function renderPayload(
  entry: JsonLogEntry,
  expanded: boolean,
  setSearchStr: (s: string) => void,
): React.ReactNode[] {
  const keys = Object.keys(entry).filter(
    (k) => !KNOWN_KEYS.has(k) && !SCREENSHOT_PATH_KEYS.has(k),
  );
  if (keys.length === 0) return [];

  const visibleKeys = expanded
    ? keys
    : keys.filter((k) => k === 'event' || k === 'result');

  if (visibleKeys.length === 0) return [];

  visibleKeys.sort((a, b) => {
    const rank = (k: string) => {
      if (k === 'event') return 0;
      if (k === 'result') return 1;
      return 2;
    };
    return rank(a) - rank(b);
  });

  return visibleKeys.flatMap((key, i) => {
    const value = entry[key];
    return [
      i > 0 ? ' ' : null,
      <span key={`k-${i}`} className="code-key" style={{ color: KEY_COLOR }}>
        {key}=
      </span>,
      <ValueSpan
        key={`v-${i}`}
        value={value}
        isGold={key === 'message' || key === 'reason'}
        setSearchStr={setSearchStr}
        splitDots={key === 'event'}
      />,
    ];
  });
}

function JsonLogLine({
  entry,
  setFilter,
  setSearchStr,
  sectionId,
  logBasePath = DEFAULT_LOG_BASE_PATH,
  lineIdx,
  highlighted = false,
  isContextLine = false,
  visible = true,
  hasContext = false,
  contextExpanded = false,
  onToggleContext,
  expandAll = false,
}: JsonLogLineProps) {
  const [expandedOverride, setExpandedOverride] = useState<boolean | undefined>(
    undefined,
  );
  const expanded = expandedOverride ?? expandAll;
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
        backgroundColor: isContextLine
          ? 'rgba(88, 166, 255, 0.05)'
          : 'transparent',
        display: visible ? 'block' : 'none',
        boxShadow: 'none',
        borderRadius: undefined,
        transition: 'all 0.2s ease',
        margin: 0,
      }}
    >
      [
      {hasContext && onToggleContext && (
        <span
          onClick={onToggleContext}
          style={{
            float: 'right',
            color: isContextLine ? 'rgb(230, 219, 116)' : '#58a6ff',
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: '12px',
            marginLeft: '10px',
          }}
          title={
            contextExpanded
              ? 'Hide surrounding context'
              : 'Show surrounding context'
          }
        >
          {contextExpanded ? '[ctx-]' : '[ctx+]'}
        </span>
      )}
      <span
        onClick={() => setExpandedOverride((prev) => !(prev ?? expandAll))}
        style={{
          float: 'right',
          color: '#888',
          cursor: 'pointer',
          userSelect: 'none',
          fontSize: '12px',
          marginLeft: '10px',
        }}
      >
        {expanded ? '[-]' : '[+]'}
      </span>
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
      </span>
      ]
      <span
        className="code-log-level"
        onClick={() => setFilter({ [level]: 1 })}
        style={{
          color: LOG_LEVEL_COLORS[level] || '#ddd',
          cursor: 'pointer',
        }}
      >
        {level}
      </span>
      : {/* finally render out the Log json content */}
      {renderPayload(entry, expanded, setSearchStr)}
      {screenshotPath && (
        <>
          <br />
          <span title={screenshotPath}>
            <IndividualImage path={screenshotPath} thumbSize={180} />
          </span>
        </>
      )}
    </pre>
  );
}

export default JsonLogLine;
