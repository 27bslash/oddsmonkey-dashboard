import hljs from 'highlight.js';
import { ReactNode, useEffect, useState } from 'react';
import 'highlight.js/styles/arta.css';
import 'highlight.js/styles/ir-black.css';
import 'highlight.js/styles/monokai-sublime.css';

// import 'highlight.js/styles/panda-syntax-dark.css';
// import 'highlight.js/styles/xt256.css';

import { BData } from '../../../../../../types';
import { IndividualImage } from '../betImages/debugImage';
import { parse } from 'path';

type LogsProps = {
  bet?: BData;
  //   setOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  //   overlay: boolean;
};

// betfair 2846.07
// smarkets 2079.05 2336.89
export const useLogs = ({ bet }: LogsProps) => {
  const [rawLogString, setRawLogStr] = useState('');
  const [tailLogString, setTailLogStr] = useState('');
  const [highlightedContent, setHighlightedContent] = useState('');
  const [tail, setTail] = useState(false);
  const [filter, setFilter] = useState<{ [key: string]: number }>({ INFO: 0 });
  const [errored, setErrored] = useState(false);
  const [Logs, setLogs] = useState<Element[]>([]);
  const basePath = 'D:\\projects\\python\\odds_monkey_bot\\dist';
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const getData = async () => {
      const data = await window.electron.ipcRenderer.readLog(bet);
      const tail = await window.electron.ipcRenderer.tailLog(bet);
      if (data) {
        setRawLogStr(data);
      } else {
        setRawLogStr(tail);
      }
    };

    getData();

    interval = setInterval(async () => {
      const tailUpdate = await window.electron.ipcRenderer.tailLog(bet);
      setTailLogStr(tailUpdate);
      if (!bet) {
        setRawLogStr(tailUpdate);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);
  const groupSimilarLogs = (logStr: string) => {
    let split = logStr.split('\n');
    const logPattern = /(\S+\.py->\S+\(\):\d+])/;

    let previousKey = '';
    let firstOccurrence = true;
    const logs = [];
    for (const line of split) {
      const match = line.match(logPattern);
      if (match) {
        const key = match[1]; // Extract function name + line number
        if (key === previousKey) {
          continue;
        }
        previousKey = key;
        firstOccurrence = false;
        logs.push(line);
      } else {
        logs.push(line);
      }
    }
    return logs.join('\n');
  };
  const countErrors = (logStr: string) => {
    const errorPattern = /ERROR|CRITICAL/gm;
    const matches = logStr.match(errorPattern);
    if (matches) {
      return matches.length;
    }
    return 0;
  };
  useEffect(() => {
    // Apply syntax highlighting after content is set
    if (!rawLogString) return;
    countErrors(rawLogString) > 0 ? setErrored(true) : setErrored(false);
    const regex = /INFO|DEBUG|WARNING|ERROR|CRITICAL/gm;
    const filteredArr = [];
    const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    const logLevelIdx = logLevels
      .reverse()
      .findIndex((x) => x === Object.keys(filter)[0]);
    const filteredLogLevels = logLevels.slice(0, logLevelIdx + 1);
    let temp = [];
    const iterable = tail ? tailLogString : rawLogString;

    for (const line of iterable.split(/\n/)) {
      const filterCheck = filteredLogLevels.some((f) => line.includes(f));
      if (filterCheck || line.includes(Object.keys(filter)[0])) {
        temp.push(line);
        // continue;
      }

      // console.log(
      //   'filePath, ',
      //   <IndividualImage path={`${basePath}/${filePath}`} />,
      // );

      if (temp.length && line.match(regex)) {
        filteredArr.push(temp);
        temp = [];
      } else if (temp.length) {
        temp.push(line);
      }
    }
    temp = temp.map((x) => {
      if (x.match(/(\w)(\')(\w)/gm)) {
        console.log('x, ', x);
        x = x.replace(/(\w)(\')(\w)/gm, '$1$3');
        return x;
      }
      return x;
    });
    for (const line of temp) {
      const match = line.match(/screenshot_file_path=(.*png)/);
      if (match && match[1]) {
        const filePath = match[1];
        break;
      }
    }
    if (!filteredArr.length || temp.length) filteredArr.push(temp);
    const mapped = filteredArr.map((x) => x.join('\n')).join('\n');
    // const escapedContent = escapeHTML(rawLogString);

    //  const highlighted =         hljs.highlight(logStr, { language: 'python' }).value
    let highlighted = hljs.highlight(groupSimilarLogs(iterable), {
      language: 'python',
    }).value;
    if (Object.keys(filter)[0]) {
      highlighted = hljs.highlight(groupSimilarLogs(mapped), {
        language: 'python',
      }).value;
    }

    const customed = logLevelHighlighter(highlighted);
    setHighlightedContent(customed);
  }, [rawLogString, filter, tail, tailLogString]);

  useEffect(() => {
    if (!rawLogString) return;
    countErrors(rawLogString) > 0 ? setErrored(true) : setErrored(false);
    const regex = /INFO|DEBUG|WARNING|ERROR|CRITICAL/gm;
    const filteredArr = [];
    const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    const logLevelIdx = logLevels
      .reverse()
      .findIndex((x) => x === Object.keys(filter)[0]);
    const filteredLogLevels = logLevels.slice(0, logLevelIdx + 1);
    const iterable = tail ? tailLogString : rawLogString;
    const parsedLines = [];
    let lastLogLevel = '';
    const logStr = groupSimilarLogs(iterable);
    for (const line of logStr.split(/\n/)) {
      const filterCheck = filteredLogLevels.some((f) => line.includes(f));
      const b =
        !line.match(regex) &&
        filteredLogLevels.some((f) => lastLogLevel && lastLogLevel.includes(f));
      if (filterCheck) {
        lastLogLevel = line.match(regex)[0];
      }
      if (b || filterCheck || line.includes(Object.keys(filter)[0])) {
        // console.log(b, filterCheck, line.includes(Object.keys(filter)[0]));
        const match = line.match(/screenshot_file_path=(.*png)/m);
        if (match && match[1]) {
          const filePath = match[1];
          parsedLines.push(
            <IndividualImage
              key={`img-${filePath}`}
              path={`${basePath}/${filePath}`}
            />,
          );
        } else {
          parsedLines.push(
            <div
              key={`line-${parsedLines.length}`}
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                color: '#ddd',
              }}
            >
              {tokenizeLine(line, handleFuncClick)}
            </div>,
          );
        }
      }
    }

    setLogs(parsedLines);
  }, [rawLogString, filter, tail, tailLogString]);
  const logLevelHighlighter = (text: string) => {
    text = text.replace(/(INFO)/g, '<span class="info-log">$1</span>');
    text = text.replace(
      /(DEBUG)/g,
      '<span class="debug-log hljs-string">$1</span>',
    );
    text = text.replace(
      /(WARNING|ERROR|CRITICAL)/g,
      '<span class="code-error">$1</span>',
    );
    text = text.replace(
      /([a-z_]+\.\w+)/gm,
      "<span class='code-file hljs-number'>$1</span>",
    );
    text = text.replace(
      /([a-z_]+\(\))/gm,
      "<span class='code-function'>$1</span>",
    );
    text = text.replace(
      /(\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d+)/gm,
      `<span class ='hljs-string'>$1</span>`,
    );
    text = addClassToDateTimes(text);
    return text;
  };
  const handleFuncClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    console.log('func, ', target.textContent);
    if (Object.keys(filter)[0] === target.textContent) {
      setFilter({ '': 0 });
    } else if (target.textContent) {
      setFilter({ [target.textContent]: 0 });
    }
  };

  useEffect(() => {
    document
      .querySelectorAll(
        '.code-file, .code-function, .code-error, .info-log, .debug-log',
      )
      .forEach((el) => {
        el.addEventListener('click', handleFuncClick);
      });

    return () => {
      document
        .querySelectorAll(
          '.code-file, .code-function, .code-error, .info-log, .debug-log',
        )
        .forEach((el) => {
          el.removeEventListener('click', handleFuncClick);
        });
    };
  }, [highlightedContent]);
  //   useEffect(() => {
  //     document.querySelector('#log-icon').style.color = 'red';
  //   }, [errored]);
  return {
    highlightedContent,
    Logs,
    tail,
    filter,
    setTail,
    setFilter,
    errored,
  };
};

// <code style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}></code>
function addClassToDateTimes(htmlLog: string) {
  const datetimePattern =
    /(\[<span class="hljs-number">\d{4}<\/span>-<span class="hljs-number">\d{2}<\/span>-<span class="hljs-number">\d{2}<\/span> <span class="hljs-number">\d{2}<\/span>:<span class="hljs-number">\d{2}<\/span>:<span class="hljs-number">\d{2}<\/span>,<span class="hljs-number">\d+<\/span>)/g;

  const updatedLog = htmlLog.replace(
    datetimePattern,
    "<span class='code-grey'>$1</span>",
  );

  return updatedLog;
}

function tokenizeLine(
  line: string,
  onClick: (e: React.MouseEvent<HTMLElement>) => void,
): (string | JSX.Element)[] {
  const stringHighlightColor = 'rgb(230, 219, 116)';
  const numberHighlightColor = 'rgb(174, 129, 255)';
  const logLevelStyles: Record<string, React.CSSProperties> = {
    DEBUG: { color: stringHighlightColor, cursor: 'pointer' },
    INFO: { color: 'greenyellow', cursor: 'pointer' },
    WARNING: { color: '#f92672', cursor: 'pointer' },
    ERROR: { color: '#f92672', cursor: 'pointer' },
    CRITICAL: { color: '#f92672', cursor: 'pointer' },
  };
  const tokens: (string | JSX.Element)[] = [];

  const logLevelRegex = /\b(DEBUG|INFO|WARNING|ERROR|CRITICAL)\b/;
  const stringRegex = /'\w+'/;
  const numberRegex = /-?\d+(\.\d+)?/;
  const functionCallRegex = /\b\w+\(.*?\)/;
  const filenameRegex = /[a-zA-Z_]+\.py/;
  const masterRegex = new RegExp(
    `${logLevelRegex.source}|${stringRegex.source}|${numberRegex.source}|${functionCallRegex.source}|${filenameRegex.source}`,
    'g',
  );

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = masterRegex.exec(line)) !== null) {
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      tokens.push(line.slice(lastIndex, matchIndex));
    }

    const matchedText = match[0];

    if (logLevelRegex.test(matchedText)) {
      tokens.push(
        <span
          key={`level-${matchIndex}`}
          style={logLevelStyles[matchedText]}
          onClick={(e) => onClick(e)}
          className="code-log-level"
        >
          {matchedText}
        </span>,
      );
    } else if (stringRegex.test(matchedText)) {
      tokens.push(
        <span key={`str-${matchIndex}`} style={{ color: stringHighlightColor }}>
          {matchedText}
        </span>,
      );
    } else if (numberRegex.test(matchedText)) {
      tokens.push(
        <span key={`num-${matchIndex}`} style={{ color: numberHighlightColor }}>
          {matchedText}
        </span>,
      );
    } else if (functionCallRegex.test(matchedText)) {
      tokens.push(
        <span
          key={`func-${matchIndex}`}
          onClick={(e) => onClick(e)}
          className="code-function"
        >
          {matchedText}
        </span>,
      );
    } else if (filenameRegex.test(matchedText)) {
      tokens.push(
        <span
          key={`filename-${matchIndex}`}
          onClick={(e) => onClick(e)}
          className="code-file"
        >
          {matchedText}
        </span>,
      );
    }
    lastIndex = matchIndex + matchedText.length;
  }

  if (lastIndex < line.length) {
    tokens.push(line.slice(lastIndex));
  }

  return tokens;
}
