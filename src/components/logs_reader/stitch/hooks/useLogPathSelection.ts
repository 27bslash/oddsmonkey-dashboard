import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { BData } from '../../../../../types';

export function useLogPathSelection({
  bet,
  logBasePath,
  setLogBasePath,
  setLogFilePath,
}: {
  bet?: BData;
  logBasePath: string;
  setLogBasePath: Dispatch<SetStateAction<string>>;
  setLogFilePath: Dispatch<SetStateAction<string>>;
}) {
  const [compatibleLogFiles, setCompatibleLogFiles] = useState<
    { name: string; path: string }[]
  >([]);

  useEffect(() => {
    if (bet) {
      window.electron.ipcRenderer.detectLogPathForBet(bet).then((path) => {
        setLogBasePath(path);
      });
      return;
    }
    window.electron.ipcRenderer.detectActiveLogPath().then((path) => {
      setLogBasePath(path);
    });
  }, [setLogBasePath, bet]);

  useEffect(() => {
    let mounted = true;
    window.electron.ipcRenderer.listCompatibleLogFiles(logBasePath).then((files) => {
      if (!mounted) return;

      setCompatibleLogFiles(files);
      if (!files.length) {
        setLogFilePath('');
        return;
      }

      setLogFilePath((prev) => {
        if (prev && files.some((f) => f.path === prev)) return prev;
        const defaultFile = files.find((f) => f.name === 'custom_logs.log');
        return defaultFile?.path ?? files[0].path;
      });
    });

    return () => {
      mounted = false;
    };
  }, [logBasePath, setLogFilePath]);

  return {
    compatibleLogFiles,
  };
}
