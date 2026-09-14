import React from 'react';
import StringWithLinks from './StringWithLinks';
import { KEY_COLOR } from './utils';

function ValueSpan({
  value,
  isGold = false,
  setSearchStr,
  splitDots = false,
}: {
  value: unknown;
  isGold?: boolean;
  setSearchStr: (s: string) => void;
  splitDots?: boolean;
}): React.ReactNode {
  if (value === null) {
    return <span style={{ color: '#31d2ac' }}>null</span>;
  }
  if (typeof value === 'number') {
    return <span style={{ color: 'rgb(174, 129, 255)' }}>{String(value)}</span>;
  }
  if (typeof value === 'string') {
    return (
      <StringWithLinks
        value={value}
        isGold={isGold}
        setSearchStr={setSearchStr}
        splitDots={splitDots}
      />
    );
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
            <ValueSpan
              value={v}
              setSearchStr={setSearchStr}
              splitDots={splitDots}
            />
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
          <span
            key={`k-${i}`}
            className="code-key"
            style={{ color: KEY_COLOR }}
          >
            {k}=
          </span>,
          <ValueSpan
            key={`v-${i}`}
            value={v}
            isGold={k === 'message' || k === 'reason'}
            setSearchStr={setSearchStr}
            splitDots={k === 'event'}
          />,
        ])}
        )
      </span>
    );
  }
  return <span>{String(value)}</span>;
}

export default ValueSpan;
