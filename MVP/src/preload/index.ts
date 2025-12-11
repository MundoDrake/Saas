import { contextBridge, ipcRenderer } from 'electron';
import { IPC, IElectronAPI } from '../shared/types';

const api: IElectronAPI = {
    openFolder: () => ipcRenderer.invoke(IPC.OPEN_FOLDER),
    getFiles: (folderPath) => ipcRenderer.invoke(IPC.GET_FILES, folderPath),
    readFile: (filePath) => ipcRenderer.invoke(IPC.READ_FILE, filePath),
    saveFile: (filePath, content) => ipcRenderer.invoke(IPC.SAVE_FILE, filePath, content),
    createFolder: (path, name) => ipcRenderer.invoke(IPC.CREATE_FOLDER, path, name),
    createProjectFile: (folderPath, projectName, content) => ipcRenderer.invoke(IPC.CREATE_PROJECT, folderPath, projectName, content),
    getInitialState: () => ipcRenderer.invoke(IPC.GET_INITIAL_STATE),
    dirname: (p) => ipcRenderer.invoke(IPC.GET_DIRNAME, p),
    deleteFile: (filePath) => ipcRenderer.invoke(IPC.DELETE_FILE, filePath),
    deleteFolder: (dirPath) => ipcRenderer.invoke(IPC.DELETE_FOLDER, dirPath),
    renameItem: (oldPath, newName) => ipcRenderer.invoke(IPC.RENAME_ITEM, oldPath, newName),
    createWorkspace: (name) => ipcRenderer.invoke(IPC.CREATE_WORKSPACE, name),
    getRecentFiles: (path, limit) => ipcRenderer.invoke(IPC.GET_RECENT_FILES, path, limit),
    importFile: (destinationFolder) => ipcRenderer.invoke(IPC.IMPORT_FILE, destinationFolder),
};


// Use `contextBridge` APIs to expose strict typed APIs to renderer
contextBridge.exposeInMainWorld('api', api);
