import React, { SetStateAction } from 'react';
import { IndividualImage } from '../../bets/Bet/BetCell/betImages/debugImage';

type LogLineProps = {
  line: string;
  setFilter: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  sectionId: string;
  logBasePath?: string;
  lineIdx?: string;
  highlighted?: boolean;
};

const LogLine = ({
  line,
  setFilter,
  sectionId,
  logBasePath,
  lineIdx,
  highlighted = false,
}: LogLineProps) => {
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
      }}
    >
      {renderLine(line, setFilter, logBasePath)}
    </pre>
  );
};

function renderLine(
  line: string,
  setFilter: React.Dispatch<
    React.SetStateAction<{
      [key: string]: number;
    }>
  >,
  logBasePath = 'D:/projects/python/odds_monkey_bot/dist/logs',
) {
  const LOG_LEVEL_REGEX = /\bDEBUG|INFO|WARNING|ERROR|CRITICAL\b/;
  const NUMBER_REGEX = /\b-?\d+(?:\.\d+)?\b/;
  const STRING_REGEX = /'\w+'/;
  const FUNCTION_CALL_WITH_LINE_REGEX = /[a-zA-Z_]+\.py->\w+\(\):?\d+/;
  const FUNCTION_CALL_REGEX = /\b->\w+\(.*?\)/;
  const FILE_REGEX = /[a-zA-Z_]+\.py/;
  const IMAGE_REGEX = /screenshot_file_path=\s*(.*\.png)/;
  const URL_REGEX = /https?:\/\/[^\s)>\]]+/;
  const HTML_FILE_REGEX = /[^\s,)>\]]+\.html\b/;
  const TOKEN_REGEX = new RegExp(
    `(${[
      URL_REGEX.source,
      IMAGE_REGEX.source,
      HTML_FILE_REGEX.source,
      FUNCTION_CALL_WITH_LINE_REGEX.source,
      LOG_LEVEL_REGEX.source,
      NUMBER_REGEX.source,
      STRING_REGEX.source,
      FUNCTION_CALL_REGEX.source,
      FILE_REGEX.source,
    ].join('|')})`,
  );

  const logLevelStyles: Record<string, React.CSSProperties> = {
    DEBUG: { color: 'rgb(230, 219, 116)', cursor: 'pointer' },
    INFO: { color: 'greenyellow', cursor: 'pointer' },
    WARNING: { color: '#f59e0b', cursor: 'pointer' },
    ERROR: { color: '#f92672', cursor: 'pointer' },
    CRITICAL: { color: '#f92672', cursor: 'pointer' },
  };
  const basePath = logBasePath.replace(/\/logs$/, '').replace(/\//g, '\\');

  return line
    .split(TOKEN_REGEX)
    .filter(Boolean)
    .map((part, i) => {
      // Handle function calls with line numbers: filename.py->functionName():lineNumber
      // clicking function opens vscode directly to the line
      if (/[a-zA-Z_]+\.py->\w+\(\):?\d+/.test(part)) {
        const match = part.match(/([a-zA-Z_]+\.py)->(\w+)\(\):?(\d+)/);
        if (match) {
          const [, fileName, functionName, lineNumber] = match;
          return (
            <span
              key={i}
              onClick={() => {
                window.electron.ipcRenderer.openInVscode(
                  fileName,
                  parseInt(lineNumber),
                );
              }}
              style={{
                color: '#58a6ff',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              title={`Click to open ${fileName}:${lineNumber} in VS Code`}
            >
              {part}
            </span>
          );
        }
      }
      // color numbers
      if (/^-?\d+(\.\d+)?$/.test(part)) {
        return (
          <span key={i} style={{ color: 'rgb(174, 129, 255)' }}>
            {part}
          </span>
        );
      }
      // color strings
      if (/^'\w+'$/.test(part)) {
        return (
          <span key={i} style={{ color: 'rgb(230, 219, 116)' }}>
            {part}
          </span>
        );
      }
      // color function calls
      if (/^->\w+\(.*?\)$/.test(part)) {
        return (
          <span key={i}>
            -&gt;
            <span className="code-function">{part.slice(2)}</span>
          </span>
        );
      }
      // color files
      if (/^[a-zA-Z_]+\.py$/.test(part)) {
        return (
          <span key={i} className="code-file">
            {part}
          </span>
        );
      }
      // color log levels
      if (/^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$/.test(part)) {
        return (
          <span
            key={i}
            className="code-log-level"
            onClick={() => setFilter({ [part]: 1 })}
            style={{
              color: logLevelStyles[part].color,
              cursor: 'pointer',
            }}
          >
            {part}
          </span>
        );
      }
      // handle local html files including click to open
      if (HTML_FILE_REGEX.test(part) && !IMAGE_REGEX.test(part)) {
        const normalizedPath = part.replace(/\\/g, '/');
        const filePath = normalizedPath.match(/^[a-zA-Z]:\//)
          ? normalizedPath
          : `${basePath.replaceAll('\\', '/')}/${normalizedPath}`;
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
      // handle external urls and click to open
      if (URL_REGEX.test(part) && !IMAGE_REGEX.test(part)) {
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
      // generate thumbnails of local screenshots
      if (IMAGE_REGEX.test(part)) {
        return (
          <React.Fragment key={i}>
            <br></br>
            <IndividualImage
              path={`${basePath}/${part.trim().replace(/screenshot_file_path=\s*/, '')}`}
              thumbSize={180}
            />
          </React.Fragment>
        );
      }
      return part;
    });
}

export default LogLine;
