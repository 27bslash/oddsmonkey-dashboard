import hljs from 'highlight.js';
import { useEffect, useState } from 'react';
import 'highlight.js/styles/arta.css';
import 'highlight.js/styles/ir-black.css';
import 'highlight.js/styles/monokai-sublime.css';

// import 'highlight.js/styles/panda-syntax-dark.css';
// import 'highlight.js/styles/xt256.css';

import { Box, Button } from '@mui/material';
import { BData } from '../../../../../../types';
import LogButtons from './logs_buttons';

type LogsProps = {
  bet: BData;
  setOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  overlay: boolean;
};
const Logs = ({ bet, overlay, setOverlay }: LogsProps) => {
  const [rawLogString, setRawLogStr] = useState('');
  const [tailLogString, setTailLogStr] = useState('');
  const [filteredStr, setFilteredStr] = useState('');
  const [highlightedContent, setHighlightedContent] = useState('');
  const [tail, setTail] = useState(true);
  const [filter, setFilter] = useState({ '': 0 });
  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const getData = async () => {
      console.log(bet);
      if (!bet) return;

      const data = await window.electron.ipcRenderer.readLog(bet);
      const tail = await window.electron.ipcRenderer.tailLog(bet);

      setRawLogStr(data);
      setTailLogStr(tail);

      interval = setInterval(async () => {
        const tailUpdate = await window.electron.ipcRenderer.tailLog(bet);
        setTailLogStr(tailUpdate);
      }, 1000);
    };
    if (overlay) getData();
    return () => {
      clearInterval(interval);
    };
  }, [overlay]);
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
  useEffect(() => {
    // Apply syntax highlighting after content is set
    if (!rawLogString) return;
    const regex = /INFO|DEBUG|WARNING|ERROR|CRITICAL/gm;
    const filteredArr = [];
    const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    const logLevelIdx = logLevels
      .reverse()
      .findIndex((x) => x === Object.keys(filter)[0]);
    const filteredLogLevels = logLevels.slice(0, logLevelIdx + 1);
    let temp: string[] = [];
    console.log(temp);
    const iterable = tail ? tailLogString : rawLogString;
    for (const line of iterable.split(/\n/)) {
      const filterCheck = filteredLogLevels.some((f) => line.includes(f));
      if (filterCheck || line.includes(Object.keys(filter)[0])) {
        temp.push(line);
        continue;
      }
      if (temp.length && line.match(regex)) {
        filteredArr.push(temp);
        temp = [];
      } else if (temp.length) {
        temp.push(line);
      }
    }
    if (!filteredArr.length || temp.length) filteredArr.push(temp);
    const mapped = filteredArr.map((x) => x.join('\n')).join('\n');
    // const escapedContent = escapeHTML(rawLogString);

    //  const highlighted =         hljs.highlight(logStr, { language: 'python' }).value
    groupSimilarLogs(iterable);
    let highlighted = hljs.highlight(groupSimilarLogs(iterable), {
      language: 'python',
    }).value;
    if (Object.keys(filter)[0]) {
      groupSimilarLogs(mapped);
      highlighted = hljs.highlight(mapped, {
        language: 'python',
      }).value;
    }
    const customed = customHighlighter(highlighted);
    setHighlightedContent(customed);
  }, [rawLogString, filter, tail]);
  const handleFuncClick = (e: React.MouseEvent) => {
    console.log('func, ', e.target.textContent);
    if (Object.keys(filter)[0] === e.target.textContent) {
      setFilter({ '': 0 });
    } else {
      setFilter({ [e.target.textContent]: 0 });
    }
  };
  const customHighlighter = (text: string) => {
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
  return (
    <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
      <LogButtons
        setTail={setTail}
        tail={tail}
        filter={filter}
        setFilter={setFilter}
      ></LogButtons>
      <Box
        sx={{
          zIndex: 99,
          width: '1600px',
          // flexDirection: 'column',
          // alignItems: 'center',
          // justifyContent: 'center',
          position: 'sticky',
          top: '50px',
          height: '600px',
          padding: '5px',
          backgroundColor: 'black',
          border: 'solid 3px black',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        }}
      >
        <code
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            letterSpacing: '0.5px',
            overflowY: 'auto',
            maxHeight: '100%',
            display: 'block',
          }}
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />
      </Box>
    </Box>
  );

  // <code style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}></code>
};
function addClassToDateTimes(htmlLog: string) {
  const datetimePattern =
    /(\[<span class="hljs-number">\d{4}<\/span>-<span class="hljs-number">\d{2}<\/span>-<span class="hljs-number">\d{2}<\/span> <span class="hljs-number">\d{2}<\/span>:<span class="hljs-number">\d{2}<\/span>:<span class="hljs-number">\d{2}<\/span>,<span class="hljs-number">\d+<\/span>)/g;

  const updatedLog = htmlLog.replace(
    datetimePattern,
    "<span class='code-grey'>$1</span>",
  );

  return updatedLog;
}
export default Logs;
