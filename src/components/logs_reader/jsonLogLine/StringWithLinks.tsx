import React from 'react';
import { URL_REGEX, HTML_FILE_REGEX } from './utils';

type StringWithLinksProps = {
  value: string;
  isGold?: boolean;
  setSearchStr: (s: string) => void;
  splitDots?: boolean;
};

function StringWithLinks({
  value,
  isGold = false,
  setSearchStr,
  splitDots = false,
}: StringWithLinksProps): React.ReactNode {
  const base = isGold ? '#FFD700' : '#ddd';
  const tokenRegex = new RegExp(
    `(${URL_REGEX.source}|${HTML_FILE_REGEX.source})`,
  );
  const parts = value.split(tokenRegex).filter(Boolean);
  if (parts.length === 1) {
    return (
      <SearchSpan
        text={value}
        base={base}
        setSearchStr={setSearchStr}
        splitDots={splitDots}
      />
    );
  }
  return (
    <span style={{ color: base }}>
      {parts.map((part, i) => {
        if (HTML_FILE_REGEX.test(part)) {
          return renderHTML(part, i);
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
        return (
          <SearchSpan
            key={i}
            text={part}
            base={base}
            setSearchStr={setSearchStr}
          />
        );
      })}
    </span>
  );
}

export default StringWithLinks;

const searchableStyle: React.CSSProperties = {
  cursor: 'pointer',
  textDecoration: 'underline dotted',
  textUnderlineOffset: '2px',
  textDecorationColor: 'rgba(255, 255, 255, 0.35)',
};

function SearchSpan({
  text,
  base,
  setSearchStr,
  splitDots = false,
}: {
  text: string;
  base: string;
  setSearchStr: (s: string) => void;
  splitDots?: boolean;
}) {
  const search = (s: string) => setSearchStr(s);

  if (!splitDots || !text.includes('.')) {
    return (
      <span
        onClick={() => search(text)}
        title={`Search for ${text}`}
        style={{ color: base, ...searchableStyle }}
      >
        {text}
      </span>
    );
  }

  const segments = text.split('.');
  return (
    <>
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: base }}>.</span>}
          {seg && (
            <span
              onClick={() => search(seg)}
              title={`Search for ${seg}`}
              style={{ color: base, ...searchableStyle }}
            >
              {seg}
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

function renderHTML(part: string, i: number) {
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
