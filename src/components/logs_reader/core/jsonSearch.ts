import { JsonLogEntry, parseJsonLine } from './types';

// search using the structured fields of the parsed JSON log entries, not the raw text lines.
// usage key `key=search_str` uses fuzzy search on the key/value
const KEY_VALUE_REGEX = /(\w+)\s*=\s*("[^"]*"|\S+)/;

export function isJsonRequest(str: string): RegExpMatchArray | null {
  return str.match(KEY_VALUE_REGEX);
}

export function lineMatches(line: string, searchString: string): boolean {
  if (!searchString.trim()) return true;
  const jsonRequest = isJsonRequest(searchString);
  const parsedLine = parseJsonLine(line);
  if (jsonRequest) {
    if (!parsedLine) return false;
    const key = jsonRequest[1];
    const value = jsonRequest[2].replace(/"/g, '');
    const entryValue = parsedLine[key as keyof JsonLogEntry] as unknown;
    if (entryValue === undefined || entryValue === null) return false;
    return String(entryValue).toLowerCase().includes(value.toLowerCase());
  }
  return line.toLowerCase().includes(searchString.toLowerCase());
}
