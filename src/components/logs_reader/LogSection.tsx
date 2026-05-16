import { Chip } from '@mui/material';
import { SetStateAction } from 'react';
import { BetSection } from './useLogs';
import LogLine from './LogLine';

type LogSectionProps = {
  largeSection: BetSection[];
  showSection: string[];
  setShowSection: React.Dispatch<SetStateAction<string[]>>;
  setFilter: React.Dispatch<
    SetStateAction<{
      [key: string]: number;
    }>
  >;
  errors: number;
  warnings: number;
  logBasePath?: string;
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 12px',
  cursor: 'pointer',
  textTransform: 'capitalize',
  fontFamily: 'monospace',
  fontWeight: 600,
  fontSize: '13px',
  userSelect: 'none',
};

const getBorderColor = (errors: number, warnings: number) => {
  if (errors > 0) return 'rgba(255, 80, 80, 0.5)';
  if (warnings > 0) return 'rgba(255, 165, 0, 0.4)';
  return 'rgba(255, 255, 255, 0.1)';
};

const LogSection = ({
  largeSection,
  showSection,
  setShowSection,
  setFilter,
  errors,
  warnings,
  logBasePath,
}: LogSectionProps) => {
  const isExpanded = showSection.includes(largeSection[0]._id);
  const first = largeSection[0];
  const isIncomplete = first._id.replace(/__\d+$/, '').endsWith('_incomplete');
  const borderColor = getBorderColor(errors, warnings);

  const toggleSection = () =>
    setShowSection(
      largeSection[0]._id === showSection[0] ? [] : [largeSection[0]._id],
    );

  const getSubSectionCounts = (section: BetSection) => {
    const e = section.errors.filter(
      (x) => x.errorType === 'error' || x.errorType === 'critical',
    ).length;
    const w = section.errors.filter((x) => x.errorType === 'warning').length;
    return { errors: e, warnings: w };
  };

  return (
    <div
      data-section-id={largeSection[0]._id}
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        marginBottom: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        overflow: 'hidden',
      }}
    >
      {/* Main section header */}
      <div
        onClick={toggleSection}
        style={{
          ...sectionHeaderStyle,
          backgroundColor: isExpanded
            ? 'rgba(255, 255, 255, 0.06)'
            : 'transparent',
          borderBottom: isExpanded ? `1px solid ${borderColor}` : 'none',
        }}
      >
        <span
          style={{
            color: '#e8e8e8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: '2px' }}>
            {isExpanded ? '\u25BC' : '\u25B6'}
          </span>
          {first.eventName ? (
            <>
              <span style={{ color: '#7ec8e3', fontWeight: 700 }}>
                {first.eventName}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
              <span style={{ color: '#e8c87e' }}>{first.betName}</span>
              {isIncomplete && (
                <span
                  style={{
                    color: 'rgba(255,165,0,0.6)',
                    fontSize: '11px',
                    fontStyle: 'italic',
                  }}
                >
                  incomplete
                </span>
              )}
            </>
          ) : (
            <span>{first._id.replaceAll(/__\d+/g, '')}</span>
          )}
        </span>
        <span style={{ display: 'flex', gap: '6px' }}>
          {errors > 0 && (
            <Chip
              label={`${errors}E`}
              size="small"
              sx={{
                height: 20,
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: 'rgba(255, 80, 80, 0.2)',
                color: '#ff5050',
              }}
            />
          )}
          {warnings > 0 && (
            <Chip
              label={`${warnings}W`}
              size="small"
              sx={{
                height: 20,
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: 'rgba(255, 165, 0, 0.2)',
                color: 'orange',
              }}
            />
          )}
          <span
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '11px',
              alignSelf: 'center',
            }}
          >
            {largeSection.reduce((sum, s) => sum + s.data.length, 0)} lines
          </span>
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded &&
        largeSection.map((section, idx) => {
          const counts = getSubSectionCounts(section);
          const subSectionName = section._id.replaceAll('_', ' ');
          const hasDistinctIds =
            new Set(largeSection.map((s) => s._id)).size > 1;
          const showSubHeader = largeSection.length > 1 && hasDistinctIds;

          return (
            <div key={idx}>
              {showSubHeader && (
                <div
                  onClick={() =>
                    setShowSection((prev) =>
                      prev.includes(section._id)
                        ? prev.filter((id) => id !== section._id)
                        : prev.concat([section._id]),
                    )
                  }
                  style={{
                    ...sectionHeaderStyle,
                    fontSize: '12px',
                    fontWeight: 500,
                    paddingLeft: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <span style={{ color: '#ccc' }}>{subSectionName}</span>
                  <span style={{ display: 'flex', gap: '4px' }}>
                    {counts.errors > 0 && (
                      <Chip
                        label={`${counts.errors}E`}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 10,
                          fontWeight: 700,
                          backgroundColor: 'rgba(255, 80, 80, 0.15)',
                          color: '#ff5050',
                        }}
                      />
                    )}
                    {counts.warnings > 0 && (
                      <Chip
                        label={`${counts.warnings}W`}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 10,
                          fontWeight: 700,
                          backgroundColor: 'rgba(255, 165, 0, 0.15)',
                          color: 'orange',
                        }}
                      />
                    )}
                  </span>
                </div>
              )}
              {showSection.includes(section._id) && (
                <div style={{ paddingLeft: showSubHeader ? '12px' : '4px' }}>
                  {section.data.map(
                    (line: string, lineIdx: number) =>
                      !line.includes('BET SECTION') && (
                        <LogLine
                          key={lineIdx}
                          line={line}
                          lineIdx={`${idx}-${lineIdx}`}
                          setFilter={setFilter}
                          sectionId={section._id}
                          logBasePath={logBasePath}
                        />
                      ),
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default LogSection;
