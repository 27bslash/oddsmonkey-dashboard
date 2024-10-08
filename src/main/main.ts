/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { MongoClient } from 'mongodb';

const uri =
  'mongodb+srv://admin:RmQPhObcTdZeLYUX@pro-item-tracker.ifybd.mongodb.net';
const client = new MongoClient(uri);

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1424,
    height: 1028,
    fullscreen: true,
    x: -1800,
    y: 300,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url); // Open URL in user's browser.
    return { action: 'deny' }; // Prevent the app from opening the URL.
  });
  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    } 
  });

  async function addItem(item: any, collection_name: string) {
    const collection = client.db('oddsmonkey').collection(collection_name);
    const result = await collection.insertOne(item);
    return result; 
  }
  async function updateItem({ collectionName, query, update }) {
    console.log(collectionName, query, update);
    const collection = client.db('oddsmonkey').collection(collectionName);
    const result = await collection.updateOne(query, update);
    console.log(result.modifiedCount);
    return result.modifiedCount;
  }
  ipcMain.handle('fetch-items', async (event, collection_name: string) => {
    return await fetchItems(collection_name);
  });

  ipcMain.handle('add-item', async (event, item, collection_name: string) => {
    return await addItem(item, collection_name);
  });
  ipcMain.handle(
    'update-document',
    async (event, { collectionName, query, update }) => {
      return await updateItem({ collectionName, query, update });
    },
  );
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
async function fetchItems(collection_name: string) {
  const collection = client.db('oddsmonkey').collection(collection_name);
  const data = await collection.find({}).toArray();
  //   if (collection_name === 'balance') {
  //     console.log(data);
  //   }
  mainWindow!.webContents.send(`${collection_name}-fetched`, data);
  return data;
}
fetchItems('config');
fetchItems('pending_bets');
fetchItems('heartbeat');
fetchItems('balance');
setInterval(() => {
  fetchItems('pending_bets');
  fetchItems('balance');
  fetchItems('config');
  fetchItems('heartbeat');
}, 10000);
app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
