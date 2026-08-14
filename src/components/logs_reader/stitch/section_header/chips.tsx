import { Chip, alpha } from '@mui/material';
import { BetSection } from '../../core/useLogs';

const TIMESTAMP_REGEXES = [
  /\b(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d{3,6})?)\b/,
  /\b(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2})\b/,
  /\b(\d{2}\/\d{2}\/\d{4}[ T]\d{2}:\d{2}:\d{2})\b/,
];

const extractTimestamp = (line: string) => {
  for (const regex of TIMESTAMP_REGEXES) {
    const match = line.match(regex);
    if (match?.[1]) return match[1];
  }
  return null;
};

const formatTimestampForTag = (value: string) => {
  const noMs = value.replace(/[.,]\d{3,6}\b/, '');
  const timeMatch = noMs.match(/\b(\d{2}:\d{2}:\d{2})\b/);
  return timeMatch ? timeMatch[1] : noMs;
};

const getSectionTimeRange = (largeSection: BetSection[]) => {
  const lines = largeSection.flatMap((s) =>
    s.data.filter(
      (line) =>
        !line.includes('BET SECTION') && !line.includes('END BET SECTION'),
    ),
  );

  let start: string | null = null;
  let end: string | null = null;

  for (const line of lines) {
    const ts = extractTimestamp(line);
    if (ts) {
      start = ts;
      break;
    }
  }

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const ts = extractTimestamp(lines[i]);
    if (ts) {
      end = ts;
      break;
    }
  }

  return {
    start: start ? formatTimestampForTag(start) : null,
    end: end ? formatTimestampForTag(end) : null,
  };
};
function Chips({ largeSection }: { largeSection: BetSection[] }) {
  const first = largeSection[0];
  const isIncomplete = first._id.replace(/__\d+$/, '').endsWith('_incomplete');
  const isTradeout = first._id.replace(/__\d+$/, '').endsWith('_tradeout');
  const { start, end } = getSectionTimeRange(largeSection);

  return (
    <>
      {first.marketType && (
        <Chip
          label={first.marketType}
          size="small"
          sx={{
            height: 16,
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: alpha('#3bbffa', 0.1),
            color: alpha('#3bbffa', 0.7),
            borderRadius: '3px',
          }}
        />
      )}

      {isIncomplete && (
        <Chip
          label="INCOMPLETE"
          size="small"
          sx={{
            height: 16,
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: alpha('#f59e0b', 0.15),
            color: alpha('#f59e0b', 0.7),
            borderRadius: '3px',
          }}
        />
      )}

      {isTradeout && (
        <Chip
          label="TRADEOUT"
          size="small"
          sx={{
            height: 16,
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: alpha('#22c55e', 0.15),
            color: alpha('#22c55e', 0.75),
            borderRadius: '3px',
          }}
        />
      )}

      {start && end && (
        <Chip
          label={`${start} -> ${end}`}
          size="small"
          sx={{
            height: 16,
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: alpha('#93c5fd', 0.12),
            color: alpha('#93c5fd', 0.85),
            borderRadius: '3px',
            fontFamily: 'monospace',
          }}
        />
      )}
      <Chip
        label={`sections: ${largeSection.length}`}
        sx={{
          height: 16,
          fontSize: '11px',
          textTransform: 'capitalize',
          fontWeight: 600,
          backgroundColor: alpha('#93c5fd', 0.12),
          color: alpha('#93c5fd', 0.85),
          borderRadius: '3px',
          fontFamily: 'monospace',
        }}
      />
    </>
  );
}
export default Chips;
