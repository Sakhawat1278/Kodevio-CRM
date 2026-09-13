const { app, BrowserWindow, ipcMain, shell, Tray, Menu, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn, execSync } = require('child_process');
const { pathToFileURL } = require('url');

let mainWindow = null;
let tray = null;
let serverProcess = null;
let isQuitting = false;
const BACKEND_PORT = process.env.PORT || 5000;
const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';

// Ensure single app instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Helper to poll backend readiness
function waitForServer(port, timeout = 20000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on('error', () => retry());
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
      req.end();
    };

    const retry = () => {
      if (Date.now() - start > timeout) {
        resolve(false);
      } else {
        setTimeout(check, 300);
      }
    };

    check();
  });
}

// Helper to determine server script and root directory
function getServerConfig() {
  if (app.isPackaged) {
    const unpackedDir = path.join(process.resourcesPath, 'app.asar.unpacked');
    const unpackedScript = path.join(unpackedDir, 'server', 'index.js');
    if (fs.existsSync(unpackedScript)) {
      return { script: unpackedScript, cwd: unpackedDir };
    }
    return { script: path.join(app.getAppPath(), 'server', 'index.js'), cwd: app.getAppPath() };
  }
  return {
    script: path.join(__dirname, '..', 'server', 'index.js'),
    cwd: path.join(__dirname, '..')
  };
}

function freePortIfStale(port) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve();
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const state = parts[3];
        const pid = parts[parts.length - 1];
        if (state === 'LISTENING' && pid && pid !== '0' && pid !== process.pid.toString()) {
          console.log(`⚠️ Freeing stale process ${pid} on port ${port}...`);
          try {
            execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore' });
          } catch (e) {}
        }
      }
    } catch (e) {
      // Ignore if netstat or taskkill errors (e.g. port already free)
    }
    resolve();
  });
}

// Start Node backend silently inside Electron
function startBackend() {
  return new Promise(async (resolve) => {
    // First check if server is already running (e.g. during concurrent dev)
    const alreadyRunning = await waitForServer(BACKEND_PORT, 800);
    if (alreadyRunning) {
      console.log('⚡ Backend already active on port', BACKEND_PORT);
      return resolve();
    }

    // Free port if a dead/stale non-Kodevio process is blocking it
    await freePortIfStale(BACKEND_PORT);

    const { script: serverScript, cwd: serverCwd } = getServerConfig();
    console.log('🚀 Launching embedded Express backend from:', serverScript);

    if (!app.isPackaged) {
      // DEV MODE: in-process import is fine (no ASAR complications)
      try {
        await import(pathToFileURL(serverScript).href);
        console.log('✅ Express backend running in-process (dev)');
        await waitForServer(BACKEND_PORT, 20000);
        return resolve();
      } catch (importErr) {
        console.warn('⚠️ In-process server import failed in dev:', importErr.message);
      }
    }

    // PACKAGED MODE (or dev fallback): Spawn as child process
    // node_modules live in app.asar.unpacked/node_modules
    const unpackedDir = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked')
      : path.join(__dirname, '..');

    const nodeModulesPaths = [
      path.join(unpackedDir, 'node_modules'),
      path.join(__dirname, '..', 'node_modules'),
      process.env.NODE_PATH || ''
    ].filter(Boolean);

    // Resolve .env file path for the spawned server
    const envFilePath = app.isPackaged
      ? path.join(unpackedDir, '.env')
      : path.join(__dirname, '..', '.env');

    console.log('📦 Spawning server child process with NODE_PATH:', nodeModulesPaths[0]);
    console.log('📦 .env path:', envFilePath);

    serverProcess = spawn(process.execPath, [serverScript], {
      cwd: serverCwd,
      env: {
        ...process.env,
        PORT: BACKEND_PORT.toString(),
        ELECTRON_RUN_AS_NODE: '1',
        NODE_ENV: app.isPackaged ? 'production' : (process.env.NODE_ENV || 'development'),
        NODE_PATH: nodeModulesPaths.join(path.delimiter),
        DOTENV_CONFIG_PATH: envFilePath,
      },
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[Backend] ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data.toString().trim()}`);
    });

    serverProcess.on('close', (code) => {
      console.log(`[Backend] Process exited with code ${code}`);
      serverProcess = null;
    });

    serverProcess.on('error', (err) => {
      console.error('[Backend] Spawn error:', err.message);
    });

    const ready = await waitForServer(BACKEND_PORT, 25000);
    if (ready) {
      console.log('✅ Express backend ready on port', BACKEND_PORT);
    } else {
      console.error('❌ Backend did NOT start within 25s on port', BACKEND_PORT);
    }
    resolve();
  });
}


function stopBackend() {
  if (serverProcess) {
    try {
      console.log('🛑 Terminating embedded backend process...');
      if (process.platform === 'win32' && serverProcess.pid) {
        spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t']);
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch (err) {
      console.warn('Error killing backend process:', err.message);
    }
    serverProcess = null;
  }
}

function getAppIconPath() {
  const iconCandidates = [
    path.join(__dirname, '..', 'public', 'icon.ico'),
    path.join(__dirname, '..', 'public', 'icon.png'),
    path.join(process.resourcesPath || '', 'public', 'icon.ico'),
    path.join(process.resourcesPath || '', 'public', 'icon.png'),
    path.join(app.getAppPath(), 'public', 'icon.ico'),
    path.join(app.getAppPath(), 'public', 'icon.png'),
  ];
  return iconCandidates.find((p) => fs.existsSync(p)) || iconCandidates[0];
}

function createMainWindow() {
  const iconPath = getAppIconPath();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    frame: false, // Frameless for custom smooth Windows 11 titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#0F172A',
    icon: iconPath,
    show: false, // Don't show until content is rendered for zero-flicker launch
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false
    }
  });

  // Windows Maximize State Event Emission
  mainWindow.on('maximize', () => mainWindow?.webContents.send('window-maximize-change', true));
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window-maximize-change', false));

  // Open external links in user default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Load UI
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, load the precompiled frontend assets directly via loadFile
    const distCandidates = [
      path.join(app.getAppPath(), 'dist', 'index.html'),
      path.join(process.resourcesPath || '', 'app.asar.unpacked', 'dist', 'index.html'),
      path.join(__dirname, '..', 'dist', 'index.html'),
      path.join(process.resourcesPath || '', 'dist', 'index.html')
    ];
    const indexHtmlPath = distCandidates.find((p) => p && fs.existsSync(p));

    if (indexHtmlPath) {
      console.log('📄 Loading local frontend bundle from:', indexHtmlPath);
      mainWindow.loadFile(indexHtmlPath);
    } else {
      console.log(`🌐 Falling back to backend server URL http://localhost:${BACKEND_PORT}`);
      mainWindow.loadURL(`http://localhost:${BACKEND_PORT}`);
    }
  }

  // Gracefully show window once ready-to-show for seamless buttery visual
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = getAppIconPath();
  if (!fs.existsSync(iconPath)) return;

  try {
    tray = new Tray(iconPath);
    tray.setToolTip('Kodevio Agency OS — Standalone Software');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Kodevio Agency OS',
        click: () => {
          if (mainWindow) {
            if (!mainWindow.isVisible()) mainWindow.show();
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Refresh Database Sync',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('trigger-sync');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Exit Application',
        click: () => {
          isQuitting = true;
          stopBackend();
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) {
        if (!mainWindow.isVisible()) mainWindow.show();
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('Could not initialize system tray:', err.message);
  }
}

// IPC Handlers for Desktop Window Controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.on('show-notification', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'Kodevio Agency OS',
      body: body || '',
      icon: getAppIconPath()
    }).show();
  }
});

// App Lifecycle
app.whenReady().then(async () => {
  await startBackend();
  createMainWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBackend();
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});

