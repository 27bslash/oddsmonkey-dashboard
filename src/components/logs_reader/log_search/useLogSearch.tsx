import { useEffect, useState } from 'react';
import { BetSection, JsonLogEntry, parseJsonLine } from '../core/types';
import { isJsonRequest, lineMatches } from '../core/jsonSearch';
// search using the structured fields of the parsed JSON log entries, not the raw text lines.
// usage key `key=search_str` uses fuzzy search on the key/value
// NOT removes a key from the list
// AND combines multiple key/value pairs with AND logic
// no key= makes it a free text search on the raw log line text
// Auto complete is provided for keys and values based on the structured fields a current log file has. (values maybe not)

export { isJsonRequest, lineMatches };

export function findAllMatchingLogLines(
  data: BetSection[][],
  searchString: string,
): JsonLogEntry[] {
  const matchingLines: JsonLogEntry[] = [];
  for (const largeSection of data) {
    for (const sub of largeSection) {
      for (const line of sub.data) {
        if (!lineMatches(line, searchString)) continue;
        const parsedLine = parseJsonLine(line);
        if (parsedLine) matchingLines.push(parsedLine);
      }
    }
  }
  return matchingLines;
}

export function getAllKeys(data: BetSection[][]): string[] {
  const keysSet = new Set<string>();
  for (const largeSection of data) {
    for (const section of largeSection) {
      for (const jsonString of section.data) {
        const parsedEntry = parseJsonLine(jsonString);
        if (!parsedEntry) continue;
        for (const key in parsedEntry) {
          keysSet.add(key);
        }
      }
    }
  }
  return Array.from(keysSet);
}

const useLogSearch = ({
  data,
  searchString,
}: {
  data: BetSection[][];
  searchString: string;
}) => {
  const [matchingLogLines, setMatchingLogLines] = useState<JsonLogEntry[]>([]);
  useEffect(() => {
    setMatchingLogLines(findAllMatchingLogLines(data, searchString));
  }, [data, searchString]);
  return matchingLogLines;
};

export default useLogSearch;
