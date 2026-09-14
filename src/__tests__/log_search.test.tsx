import '@testing-library/jest-dom';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import LogSearch from '../components/logs_reader/log_search/search';
import useLogSearch, {
  findAllMatchingLogLines,
  lineMatches,
} from '../components/logs_reader/log_search/useLogSearch';
import { td } from '../components/logs_reader/log_search/td';
import {
  BetSection,
  parseJsonLine,
} from '../components/logs_reader/core/types';

const data: BetSection[][] = [[{ data: td, _id: 'test', errors: [] }]];
const jsonLines = () => td.filter((line) => parseJsonLine(line) !== undefined);

describe('useLogSearch', () => {
  it('returns every parseable line for an empty search', () => {
    const matches = findAllMatchingLogLines(data, '');
    expect(matches).toHaveLength(jsonLines().length);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('fuzzy matches key=value against the structured field', () => {
    const matches = findAllMatchingLogLines(data, 'event=balance');
    expect(matches).toHaveLength(2);
    expect(
      matches.every((entry) => entry.event === 'balance.balance_check'),
    ).toBe(true);
  });

  it('matches a full qualified value', () => {
    const matches = findAllMatchingLogLines(
      data,
      'result=balance_checked_successfully',
    );
    expect(matches).toHaveLength(2);
  });

  it('matches quoted values', () => {
    expect(lineMatches(td[2], 'event="balance.balance_check"')).toBe(true);
    expect(lineMatches(td[1], 'event="balance.balance_check"')).toBe(false);
  });

  it('returns no matches when the key does not exist', () => {
    expect(findAllMatchingLogLines(data, 'nonexistent=foo')).toHaveLength(0);
  });

  it('falls back to free text search on the raw line text', () => {
    const matches = findAllMatchingLogLines(data, 'lecce');
    expect(matches).toHaveLength(
      jsonLines().filter((line) => line.toLowerCase().includes('lecce')).length,
    );
    expect(matches.length).toBeGreaterThan(0);
  });

  it('searches across all sections when passed the total data', () => {
    const twoBets: BetSection[][] = [
      [{ data: td.slice(0, 6), _id: 'bet_one', errors: [] }],
      [{ data: td.slice(6), _id: 'bet_two', errors: [] }],
    ];
    const matches = findAllMatchingLogLines(twoBets, 'event=balance');
    expect(matches).toHaveLength(2);
  });

  it('recomputes matching lines when the search string changes', () => {
    const { result, rerender } = renderHook(
      ({ searchString }) => useLogSearch({ data, searchString }),
      { initialProps: { searchString: 'event=balance' } },
    );
    expect(result.current).toHaveLength(2);
    rerender({ searchString: '' });
    expect(result.current).toHaveLength(jsonLines().length);
  });
});

describe('LogSearch integration', () => {
  it('counts the parseable lines from its data prop when the search is empty', () => {
    render(<LogSearch data={data} searchStr="" setSearchStr={() => {}} />);
    expect(screen.getByText(String(jsonLines().length))).toBeInTheDocument();
  });

  it('recomputes the count from its data prop as the search string changes', () => {
    const setSearchStr = jest.fn();
    const { rerender } = render(
      <LogSearch
        data={data}
        searchStr="event=balance"
        setSearchStr={setSearchStr}
      />,
    );
    expect(screen.getByText('2')).toBeInTheDocument();

    rerender(
      <LogSearch
        data={data}
        searchStr="nonexistent=foo"
        setSearchStr={setSearchStr}
      />,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('calls setSearchStr as the user types', () => {
    const setSearchStr = jest.fn();
    render(<LogSearch data={data} searchStr="" setSearchStr={setSearchStr} />);
    fireEvent.change(screen.getByPlaceholderText('SEARCH LOGS...'), {
      target: { value: 'lecce' },
    });
    expect(setSearchStr).toHaveBeenCalledWith('lecce');
  });

  it('renders a zero count when passed empty data', () => {
    render(
      <LogSearch data={[]} searchStr="event=balance" setSearchStr={() => {}} />,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
