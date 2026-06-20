import { BData } from './../../types';
import path from 'path';
import fs from 'fs';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  net,
  protocol,
  dialog,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { findBetInLogs, resolveHtmlPath } from './util';
import { MongoClient, ObjectId } from 'mongodb';
import { exec } from 'child_process';
import dotenv from 'dotenv';

// Load .env — packaged: extraResources dir, dev: project root
dotenv.config({
  path: path.join(
    app.isPackaged ? process.resourcesPath : app.getAppPath(),
    '.env',
  ),
});

const eventStatus = new Map<string, boolean>();
const client = new MongoClient(process.env.MONGO_URI || '');

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();

    // Example: listen for update events
    autoUpdater.on('update-available', () => {
      log.info('Update available');
    });
    autoUpdater.on('update-downloaded', () => {
      dialog
        .showMessageBox({
          type: 'info',
          title: 'Update Ready',
          message: 'A new version is ready. Restart now to install?',
          buttons: ['Restart', 'Later'],
        })
        .then((result) => {
          if (result.response === 0) autoUpdater.quitAndInstall();
        });
    });
    autoUpdater.on('error', (err) => {
      log.error('Update error:', err);
    });
  }
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  require('source-map-support').install();
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
      extensions.map((name: string) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const getImagesFromDirectoryRecursive = (
  directoryPath: string,
): string[] | undefined => {
  try {
    return fs.readdirSync(directoryPath);
  } catch (error) {
    console.error('Error reading directory:', error);
    return;
  }
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string =>
    path.join(RESOURCES_PATH, ...paths);

  mainWindow = new BrowserWindow({
    show: false,
    width: 1920,
    height: 1088,
    fullscreen: !!getImagesFromDirectoryRecursive(
      'D:\\projects\\python\\odds_monkey_bot\\dist\\logs\\screenshots',
    ),
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
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) throw new Error('"mainWindow" is not defined');
    if (process.env.START_MINIMIZED) mainWindow.minimize();
    else mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  new AppUpdater();
};

async function addItem(item: any, collection_name: string) {
  const collection = client.db('oddsmonkey').collection(collection_name);
  return await collection.insertOne(item);
}

async function updateItem({
  collectionName,
  query,
  update,
}: {
  collectionName: string;
  query: any;
  update: any;
}) {
  if (query._id?.buffer) {
    query._id = new ObjectId(Buffer.from(query._id.buffer));
  }
  const collection = client.db('oddsmonkey').collection(collectionName);
  const result = await collection.updateOne(query, update, { upsert: true });
  await fetchItems('pending_bets', 'update items');
  return result.modifiedCount;
}

async function fetchItems(
  collection_name: string,
  func?: string,
  limit?: number,
  skip = 0, 
) {
  const collection = client.db('oddsmonkey').collection(collection_name);
  const cursor = collection.find({});
  if (collection_name === 'pending_bets') {
    cursor.sort({ 'bet_info.bet_unix_time': -1 });
  }
  if (skip) {
    cursor.skip(skip);
  }
  if (typeof limit === 'number') {
    cursor.limit(limit);
  }
  const data = await cursor.toArray();
  if (collection_name === 'pending_bets' && func) {
    console.log('fetched', func);
  }
  if (collection_name !== 'pending_bets' || func) {
    mainWindow?.webContents.send(`${collection_name}-fetched`, data);
  }
  return data;
}

async function isExeRunning(exeName: string): Promise<boolean> {
  try {
    const { stdout } = await new Promise<{ stdout: string }>((resolve) => {
      exec('tasklist', (err, stdout) => {
        if (err) return resolve({ stdout: '' });
        resolve({ stdout });
      });
    });
    return stdout.toLowerCase().includes(exeName.toLowerCase());
  } catch {
    return false;
  }
}

// --- IPC handlers ---

ipcMain.handle(
  'fetch-items',
  async (
    _event,
    collection_name: string,
    func?: string,
    limit?: number,
    skip?: number,
  ) => {
    return await fetchItems(collection_name, func, limit, skip);
  },
);

ipcMain.handle(
  'delete',
  async (_event, _id: any, replace: { [key: string]: number }) => {
    const pendingbets = client.db('oddsmonkey').collection('pending_bets');
    const manualProfitOverride = client
      .db('oddsmonkey')
      .collection('manual_profit_override');
    await manualProfitOverride.updateOne(
      {},
      { $push: { profit_tracker: replace } },
      { upsert: true },
    );
    const objectId = new ObjectId(Buffer.from(_id['buffer']));
    await pendingbets.findOneAndDelete({ _id: objectId });
  },
);

ipcMain.handle('add-item', async (_event, item, collection_name: string) => {
  return await addItem(item, collection_name);
});

ipcMain.handle('read-file', async () => {
  try {
    const fpath =
      'D:\\projects\\python\\odds_monkey_bot\\dist\\logs\\custom_logs.log';
    return fs.readFileSync(fpath, 'utf8');
  } catch (err) {
    console.error('Error reading file:', err);
    return null;
  }
});

ipcMain.handle(
  'get-todays-logs',
  (_event, bet?: BData, logBasePath?: string, logFilePath?: string) => {
    let startTime = 0;
    let endTime = 33461130417;
    if (bet) {
      const matchedTimes = bet.bet_profit.exchange_matched
        .map((matchObj) => matchObj.bet_matched_time!)
        .concat(
          bet.bet_profit.exchange_matched.map(
            (matchObj) => matchObj.bet_matched_time!,
          ),
        );
      if (matchedTimes.some((x) => !x)) return;
      startTime = Math.min(...matchedTimes);
      endTime = Math.max(...matchedTimes);
    }
    const basePath =
      logBasePath || 'D:/projects/python/odds_monkey_bot/dist/logs';
    return findBetInLogs(startTime, endTime, logFilePath, basePath);
  },
);

ipcMain.handle(
  'get-logs',
  (_event, bet?: BData, logBasePath?: string, logFilePath?: string) => {
    if (!bet) return;
    const matchedTimes = bet.bet_profit.exchange_matched
      .map((matchObj) => matchObj.bet_matched_time!)
      .concat(
        bet.bet_profit.exchange_matched.map(
          (matchObj) => matchObj.bet_matched_time!,
        ),
      );
    if (matchedTimes.some((x) => !x)) return;
    const startTime = Math.min(...matchedTimes);
    const endTime = Math.max(...matchedTimes);
    return findBetInLogs(startTime, endTime, logFilePath, logBasePath);
  },
);

ipcMain.handle('detect-active-log-path', () => {
  const paths = {
    dist: 'D:/projects/python/odds_monkey_bot/dist/logs/custom_logs.log',
    dev: 'D:/projects/python/odds_monkey_bot/logs/custom_logs.log',
  };
  try {
    const distMtime = fs.existsSync(paths.dist)
      ? fs.statSync(paths.dist).mtimeMs
      : 0;
    const devMtime = fs.existsSync(paths.dev)
      ? fs.statSync(paths.dev).mtimeMs
      : 0;
    if (devMtime > distMtime) return 'D:/projects/python/odds_monkey_bot/logs';
    return 'D:/projects/python/odds_monkey_bot/dist/logs';
  } catch {
    return 'D:/projects/python/odds_monkey_bot/dist/logs';
  }
});

ipcMain.handle('detect-log-path-for-bet', (_event, bet?: BData) => {
  const fallback = 'D:/projects/python/odds_monkey_bot/dist/logs';
  if (!bet) return fallback;

  const matchedTimes = bet.bet_profit.exchange_matched
    .map((matchObj) => matchObj.bet_matched_time!)
    .concat(
      bet.bet_profit.exchange_matched.map(
        (matchObj) => matchObj.bet_matched_time!,
      ),
    );

  if (!matchedTimes.length || matchedTimes.some((x) => !x)) {
    return fallback;
  }

  const startTime = Math.min(...matchedTimes) - 30;
  const endTime = Math.max(...matchedTimes) + 300;
  const candidates = [
    'D:/projects/python/odds_monkey_bot/dist/logs',
    'D:/projects/python/odds_monkey_bot/logs',
  ];

  const toDateStamp = (unix: number) =>
    new Date(unix * 1000).toISOString().split('T')[0];
  const datesToCheck = new Set([toDateStamp(startTime), toDateStamp(endTime)]);

  for (const basePath of candidates) {
    for (const d of datesToCheck) {
      const archivedPath = `${basePath}/custom_logs.log.${d}.log`;
      if (fs.existsSync(archivedPath)) {
        return basePath;
      }
    }
    if (fs.existsSync(`${basePath}/custom_logs.log`)) {
      return basePath;
    }
  }

  return fallback;
});

ipcMain.handle('list-compatible-log-files', (_event, logBasePath?: string) => {
  const basePath =
    logBasePath || 'D:/projects/python/odds_monkey_bot/dist/logs';
  try {
    const files = fs
      .readdirSync(basePath, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() &&
          /^custom_logs\.log(\.\d{4}-\d{2}-\d{2}\.log)?$/i.test(entry.name),
      )
      .map((entry) => ({
        name: entry.name,
        path: `${basePath}/${entry.name}`,
      }))
      .sort((a, b) => b.name.localeCompare(a.name));
    return files;
  } catch {
    return [];
  }
});

ipcMain.handle('open-path', (_event, filePath: string) => {
  return shell.openPath(filePath);
});

ipcMain.handle(
  'open-in-vscode',
  (_event, filePath: string, lineNumber?: number) => {
    const sourceRoot = 'D:/projects/python/odds_monkey_bot';
    const fileName = path.basename(filePath);

    // Recursive function to find file
    const findFile = (dir: string): string | null => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // Skip common non-source directories
            if (
              ![
                'dist',
                'build',
                '.git',
                'node_modules',
                '__pycache__',
                '.pytest_cache',
                'tests',
              ].includes(entry.name)
            ) {
              const found = findFile(fullPath);
              if (found) return found;
            }
          } else if (entry.name === fileName) {
            return fullPath;
          }
        }
      } catch (error) {
        log.error('Error searching directory:', error);
      }
      return null;
    };

    const foundPath = findFile(sourceRoot);
    const fullPath = foundPath
      ? foundPath.replace(/\\\\/g, '/')
      : path.join(sourceRoot, filePath).replace(/\\\\/g, '/');

    const gotoCommand = lineNumber ? `${fullPath}:${lineNumber}` : fullPath;
    const command = `code --goto "${gotoCommand}"`;

    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          log.error('Failed to open in VS Code:', error);
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  },
);

ipcMain.handle('flash-icon', (_event, eventId: string) => {
  if (!eventStatus.get(eventId)) {
    mainWindow?.flashFrame(true);
    eventStatus.set(eventId, true);
  }
});

ipcMain.handle('reset-icon-event', (_event, eventId: string) => {
  eventStatus.set(eventId, false);
});

ipcMain.handle(
  'update-document',
  async (_event, { collectionName, query, update }) => {
    return await updateItem({ collectionName, query, update });
  },
);

ipcMain.handle('get-images', (_event, directoryPath) => {
  return getImagesFromDirectoryRecursive(directoryPath);
});

ipcMain.handle(
  'find-images-by-name',
  (_event, baseDir: string, betName: string, betTimestamp?: number) => {
    const results: string[] = [];
    // Normalize: lowercase + spaces to underscores to match filename convention
    const normalized = betName.toLowerCase().replaceAll(' ', '_');
    const TIMESTAMP_WINDOW = 120; // ±120 seconds
    const walk = (dir: string) => {
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            walk(path.join(dir, entry.name));
          } else if (
            entry.name.toLowerCase().includes(normalized) &&
            /\.(png|jpe?g|webp)$/i.test(entry.name)
          ) {
            if (betTimestamp) {
              const filePath = path.join(dir, entry.name);
              const fileBirth = fs.statSync(filePath).birthtimeMs / 1000;
              if (Math.abs(fileBirth - betTimestamp) > TIMESTAMP_WINDOW)
                continue;
            }
            results.push(path.join(dir, entry.name).replace(/\\/g, '/'));
          }
        }
      } catch {
        /* skip inaccessible dirs */
      }
    };
    walk(baseDir);
    return results;
  },
);

ipcMain.handle('get-image', async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) throw new Error('File does not exist');
    if (!/\.(png|jpe?g|gif|bmp|webp)$/i.test(path.extname(filePath))) {
      throw new Error('File is not a valid image');
    }
    return filePath;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
});

ipcMain.handle('shutdown', () => {
  exec('shutdown /s /t 0', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });
});

ipcMain.handle('is-exe-running', async (_event, exeName: string) => {
  return await isExeRunning(exeName);
});

ipcMain.handle('start-discord-bot', async () => {
  const exePath =
    process.env.APPDATA +
    '\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\discord_bot.lnk';
  exec(`cmd.exe /c start "" "${exePath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error opening Startup folder: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Startup folder stderr: ${stderr}`);
      return;
    }
    console.log(`Startup folder opened: ${stdout}`);
  });
  return 'Windows Startup folder opened';
});

fetchItems('config');
fetchItems('pending_bets', 'init');
fetchItems('heartbeat');
fetchItems('balance');

setInterval(() => {
  isExeRunning('discord_bot.exe').then((isRunning) => {});
  fetchItems('balance', 'timed');
  fetchItems('config', 'timed');
  fetchItems('heartbeat', 'timed');
}, 10000);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    protocol.handle('media', (req) => {
      const pathToMedia = new URL(req.url).pathname;
      return net.fetch(`file://${pathToMedia}`);
    });
    createWindow();
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
