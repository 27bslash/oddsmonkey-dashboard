import { Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { BetSection } from './useLogs';

type LogErrorProps = {
  logString: BetSection[][];
  onNavigate?: (sectionId: string) => void;
};

type SectionSummary = {
  id: string;
  baseName: string;
  errors: number;
  warnings: number;
  occurrences: number;
  ids: string[];
};

type RepeatedError = {
  pattern: string;
  count: number;
  sectionIds: string[];
};

const ERROR_SOURCE_REGEX = /(\w+\.py)->\w+\(\):(\d+)\](ERROR|CRITICAL):\s*(.+)/;

const LogErrors = ({ logString, onNavigate }: LogErrorProps) => {
  const [expanded, setExpanded] = useState(false);

  // Detect repeated error patterns (same file:line + message) across sections
  const repeatedErrors: RepeatedError[] = (() => {
    const patternMap = new Map<string, { count: number; sectionIds: Set<string> }>();
    for (const largeSection of logString) {
      const sectionId = largeSection[0]?._id || 'unknown';
      for (const sub of largeSection) {
        for (const line of sub.data) {
          const match = line.match(ERROR_SOURCE_REGEX);
          if (match && !match[4].toLowerCase().includes('taking screenshot')) {
            const pattern = `${match[1]}:${match[2]} ${match[4].slice(0, 80)}`;
            const existing = patternMap.get(pattern);
            if (existing) {
              existing.count++;
              existing.sectionIds.add(sectionId);
            } else {
              patternMap.set(pattern, { count: 1, sectionIds: new Set([sectionId]) });
            }
          }
        }
      }
    }
    return Array.from(patternMap.entries())
      .filter(([, v]) => v.count > 1)
      .map(([pattern, v]) => ({
        pattern,
        count: v.count,
        sectionIds: Array.from(v.sectionIds),
      }))
      .sort((a, b) => b.count - a.count);
  })();

  const rawSections = logString
    .map((largeSection) => {
      const id = largeSection[0]?._id || 'unknown';
      const baseName = id.replace(/__\d+$/, '').replace(/_incomplete$/, '');
      const errors = largeSection.reduce(
        (prev, curr) =>
          prev +
          curr.errors.filter(
            (x) => x.errorType === 'error' || x.errorType === 'critical',
          ).length,
        0,
      );
      const warnings = largeSection.reduce(
        (prev, curr) =>
          prev + curr.errors.filter((x) => x.errorType === 'warning').length,
        0,
      );
      return { id, baseName, errors, warnings };
    })
    .filter((s) => s.errors > 0 || s.warnings > 0);

  // Group by baseName to show repeated errors
  const grouped = new Map<string, SectionSummary>();
  for (const s of rawSections) {
    const existing = grouped.get(s.baseName);
    if (existing) {
      existing.errors += s.errors;
      existing.warnings += s.warnings;
      existing.occurrences += 1;
      existing.ids.push(s.id);
    } else {
      grouped.set(s.baseName, {
        id: s.id,
        baseName: s.baseName,
        errors: s.errors,
        warnings: s.warnings,
        occurrences: 1,
        ids: [s.id],
      });
    }
  }
  const sections = Array.from(grouped.values())
    .sort((a, b) => b.errors - a.errors || b.warnings - a.warnings);

  const totalErrors = sections.reduce((p, c) => p + c.errors, 0);
  const totalWarnings = sections.reduce((p, c) => p + c.warnings, 0);

  if (!totalErrors && !totalWarnings) return null;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor:
          totalErrors > 0 ? 'rgba(255,80,80,0.4)' : 'rgba(255,165,0,0.4)',
        borderRadius: '6px',
        padding: '6px 12px',
        marginBottom: '8px',
        backgroundColor:
          totalErrors > 0 ? 'rgba(255,0,0,0.08)' : 'rgba(255,165,0,0.08)',
        width: '54%',
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        sx={{ cursor: 'pointer' }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {totalErrors > 0 && (
            <Chip
              label={`${totalErrors} error${totalErrors !== 1 ? 's' : ''}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,80,80,0.25)',
                color: '#ff5050',
                fontWeight: 600,
              }}
            />
          )}
          {totalWarnings > 0 && (
            <Chip
              label={`${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,165,0,0.25)',
                color: 'orange',
                fontWeight: 600,
              }}
            />
          )}
          <Typography variant="body2" sx={{ color: 'grey', ml: 1 }}>
            across {sections.length} section{sections.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: 'grey', ml: 'auto' }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '250px', overflowY: 'auto' }}>
        {repeatedErrors.length > 0 && (
          <>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', position: 'sticky', top: 0, backgroundColor: 'inherit', zIndex: 1 }}>
              Recurring errors
            </Typography>
            {repeatedErrors.map((re) => (
              <Box
                key={re.pattern}
                onClick={() => onNavigate?.(re.sectionIds[0])}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255,50,50,0.08)',
                  border: '1px solid rgba(255,80,80,0.2)',
                  cursor: onNavigate ? 'pointer' : 'default',
                  '&:hover': onNavigate ? { backgroundColor: 'rgba(255,50,50,0.15)' } : {},
                  transition: 'background-color 0.15s',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ddd',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {re.pattern}
                </Typography>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#ff5050',
                  backgroundColor: 'rgba(255,80,80,0.2)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                }}>
                  x{re.count}
                </span>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                  in {re.sectionIds.length} section{re.sectionIds.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            ))}
          </>
        )}
          {sections.map((section) => (
            <Box
              key={section.id}
              display="flex"
              alignItems="center"
              gap={1}
              onClick={() => onNavigate?.(section.id)}
              sx={{
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                cursor: onNavigate ? 'pointer' : 'default',
                '&:hover': onNavigate
                  ? { backgroundColor: 'rgba(255,255,255,0.08)' }
                  : {},
                transition: 'background-color 0.15s',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#ccc',
                  textTransform: 'capitalize',
                  minWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {section.baseName.replaceAll('_', ' ')}
                {section.occurrences > 1 && (
                  <span style={{
                    marginLeft: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#ff8c00',
                    backgroundColor: 'rgba(255,140,0,0.15)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}>
                    x{section.occurrences}
                  </span>
                )}
              </Typography>
              {section.errors > 0 && (
                <Typography
                  variant="body2"
                  sx={{ color: '#ff5050', fontWeight: 600 }}
                >
                  {section.errors}E
                </Typography>
              )}
              {section.warnings > 0 && (
                <Typography
                  variant="body2"
                  sx={{ color: 'orange', fontWeight: 600 }}
                >
                  {section.warnings}W
                </Typography>
              )}
              {onNavigate && (
                <NavigateNextIcon
                  sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}
                />
              )}
            </Box>
          ))}
        </Box>
        </Collapse>
    </Box>
  );
};
export default LogErrors;
