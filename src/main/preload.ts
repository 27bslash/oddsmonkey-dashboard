import { ObjectId } from 'mongodb';
// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { BData } from '../../types';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    detectActiveLogPath: () => ipcRenderer.invoke('detect-active-log-path') as Promise<string>,
    detectLogPathForBet: (bet?: BData) =>
      ipcRenderer.invoke('detect-log-path-for-bet', bet) as Promise<string>,
    openPath: (filePath: string) => ipcRenderer.invoke('open-path', filePath),
    findImagesByName: (baseDir: string, betName: string, betTimestamp?: number) =>
      ipcRenderer.invoke('find-images-by-name', baseDir, betName, betTimestamp) as Promise<string[]>,
    flashIcon: (eventId: string) => ipcRenderer.invoke('flash-icon', eventId),
    resetIconEvent: (eventId: string) =>
      ipcRenderer.invoke('reset-icon-event', eventId),
    readLog: (bet?: BData, logBasePath?: string, logFilePath?: string) =>
      ipcRenderer.invoke('get-logs', bet, logBasePath, logFilePath),
    tailLog: (bet?: BData, logBasePath?: string, logFilePath?: string) =>
      ipcRenderer.invoke('get-todays-logs', bet, logBasePath, logFilePath),
    listCompatibleLogFiles: (logBasePath?: string) =>
      ipcRenderer.invoke('list-compatible-log-files', logBasePath) as Promise<
        { name: string; path: string }[]
      >,
    fetchItems: (collection_name: string, func?: string, limit?: number) =>
      ipcRenderer.invoke('fetch-items', collection_name, func, limit),
    addItem: (item: any, collection_name: string) =>
      ipcRenderer.invoke('add-item', item, collection_name),
    updateItem: ({
      collectionName,
      query,
      update,
    }: {
      collectionName: string;
      query: { [key: string]: any };
      update: { [key: string]: any };
    }) =>
      ipcRenderer.invoke('update-document', { collectionName, query, update }),
    onDataFetched: (callback: (data: any) => void) =>
      ipcRenderer.on('pending_bets-fetched', (_event, data) => {
        return callback(data);
      }),
    onDataUpdated: (callback: (data: any) => void) =>
      ipcRenderer.on('pending_bets-updated', (_event, data) => {
        return callback(data);
      }),
    onBalanceFetched: (callback: (data: any) => void) =>
      ipcRenderer.on('balance-fetched', (_event, data) => {
        return callback(data);
      }),
    onConfigFetched: (callback: (data: any) => void) =>
      ipcRenderer.on('config-fetched', (_event, data) => {
        return callback(data);
      }),
    onHeartbeatFetched: (callback: (data: any) => void) =>
      ipcRenderer.on('heartbeat-fetched', (_event, data) => {
        return callback(data);
      }),
    getAllImages: async (directoryPath: string) =>
      await ipcRenderer.invoke('get-images', directoryPath),
    deleteEntry: (_id: ObjectId, replaceAmount: { [key: string]: number }) =>
      ipcRenderer.invoke('delete', _id, replaceAmount),
    ShutDown: () => {
      ipcRenderer.invoke('shutdown');
    },
    isExeRunning: (exeName: string) => {
      return ipcRenderer.invoke('is-exe-running', exeName);
    },
    startDiscordBot: () => {
      ipcRenderer.invoke('start-discord-bot');
    },
  },
};
contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
