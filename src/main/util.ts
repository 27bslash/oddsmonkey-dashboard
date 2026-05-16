/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import * as fs from 'fs';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function logFile(
  date: Date,
  basePath = 'D:/projects/python/odds_monkey_bot/dist/logs',
): string {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  return isToday
    ? `${basePath}/custom_logs.log`
    : `${basePath}/custom_logs.log.${formatDate(date)}.log`;
}

function findLogFile(startTime: number, endTime: number, basePath?: string) {
  const startDateTime = new Date((startTime - 30) * 1000);
  const endDateTime = new Date((endTime + 30) * 1000);

  const startFileName = logFile(startDateTime, basePath);
  const endFileName = logFile(endDateTime, basePath);

  return { startFileName, endFileName };
}

export function findBetInLogs(
  startUnix: number,
  endUnix: number,
  logFile?: string,
  basePath?: string,
) {
  let { startFileName, endFileName } = findLogFile(
    startUnix,
    endUnix,
    basePath,
  );
  if (logFile) endFileName = logFile;
  if (startUnix === 0 && logFile) startFileName = logFile;
  let lineStart = 0;
  let lineEnd = 0;
  let endBetLine = 0;
  let errored = false;
  const readLines = (fileName: string): string[] => {
    try {
      return fs.readFileSync(fileName, 'utf8').split('\n');
    } catch (error) {
      errored = true;
      return fs
        .readFileSync(
          'D:/projects/python/odds_monkey_bot/dist/logs/custom_logs.log',
          'utf8',
        )
        .split('\n');
    }
  };
  //   console.log('startFileName', startFileName);
  const linesStart = readLines(startFileName);
  for (let i = 0; i < linesStart.length; i++) {
    const line = linesStart[i];
    const match = line.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    if (match) {
      const timestamp = new Date(match[0]).getTime() / 1000;
      if (timestamp >= startUnix - 15 && lineStart === 0) {
        lineStart = i;
        break;
      }
    }
  }

  const linesEnd = readLines(endFileName);
  for (let i = 0; i < linesEnd.length; i++) {
    const line = linesEnd[i];
    const match = line.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    if (match) {
      const timestamp = new Date(match[0]).getTime() / 1000;
      if (timestamp >= startUnix - 30 && timestamp <= endUnix + 40) {
        lineEnd = i;
        if (line.includes('to pending_bets.json times placed')) {
          endBetLine = i;
        }
      }
    }
  }
  let selectedLines = [];
  let sliceEnd = endBetLine + 1;
  if (logFile) {
    sliceEnd = linesEnd.length;
  }
  if (startFileName !== endFileName) {
    const startLogLines = linesStart.slice(lineStart, linesStart.length);
    const endLogLines = linesEnd.slice(0, sliceEnd);
    selectedLines = startLogLines.concat(endLogLines);
    // fs.writeFileSync('test_logs/startLog.log', startLogLines.join('\n'));
    // fs.writeFileSync('test_logs/endLog.log', endLogLines.join('\n'));
    // fs.writeFileSync('test_logs/selectedLog.log', selectedLines.join('\n'));
  } else {
    selectedLines = linesEnd.slice(lineStart, sliceEnd);
  }
  //   console.log('sel', selectedLines[0], selectedLines[selectedLines.length - 1]);
  if (errored) {
  }
  return selectedLines.join('\n');
}
// betMaths.ts

export const weightedAvgOdds = (stakes: number[], odds: number[]): number =>
  stakes.reduce((sum, s, i) => sum + s * odds[i], 0) /
  stakes.reduce((sum, s) => sum + s, 0);
