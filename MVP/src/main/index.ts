import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { setupIpcHandlers } from './ipc';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;

const preload = path.join(__dirname, 'preload.js');
const distHtml = path.join(process.env.DIST, 'index.html');

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // We need some node access in main, but strictly controlled via preload
        },
        titleBarStyle: 'hiddenInset', // Mac style, or use custom titlebar for generic
        backgroundColor: '#0f172a', // match dark mode background
    });

    setupIpcHandlers();

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
        win.webContents.openDevTools();
    } else {
        win.loadFile(distHtml);
    }
}

app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.whenReady().then(createWindow);
