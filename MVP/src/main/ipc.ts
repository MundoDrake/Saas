import { ipcMain, dialog, app } from 'electron';
import { IPC } from '../shared/types';
import { fileIndexer } from './indexer';
import { store } from './store';
import fs from 'fs';
import path from 'path';

/**
 * Type guard for validating string inputs from IPC
 */
function isValidString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

export function setupIpcHandlers() {
    ipcMain.handle(IPC.OPEN_FOLDER, async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });

        if (canceled || filePaths.length === 0) {
            return null;
        }

        const rootPath = filePaths[0];
        fileIndexer.setRoot(rootPath);
        store.set('lastVaultPath', rootPath);
        return rootPath;
    });

    ipcMain.handle(IPC.GET_FILES, async (_, dirPath: unknown) => {
        if (!isValidString(dirPath)) {
            console.error('[IPC] GET_FILES: Invalid dirPath argument');
            return [];
        }
        return fileIndexer.scanDirectory(dirPath);
    });

    ipcMain.handle(IPC.READ_FILE, async (_, filePath: unknown) => {
        if (!isValidString(filePath)) {
            throw new Error('Invalid file path');
        }
        return fileIndexer.readFile(filePath);
    });

    ipcMain.handle(IPC.SAVE_FILE, async (_, filePath: unknown, content: unknown) => {
        if (!isValidString(filePath)) {
            throw new Error('Invalid file path');
        }
        if (typeof content !== 'string') {
            throw new Error('Invalid content');
        }
        return fileIndexer.saveFile(filePath, content);
    });

    ipcMain.handle(IPC.CREATE_FOLDER, async (_, dirPath: unknown, name: unknown) => {
        if (!isValidString(dirPath) || !isValidString(name)) {
            console.error('[IPC] CREATE_FOLDER: Invalid arguments');
            return { success: false, error: 'Argumentos inválidos' };
        }
        return fileIndexer.createFolder(dirPath, name);
    });

    ipcMain.handle(IPC.CREATE_PROJECT, async (_, folderPath: unknown, projectName: unknown, content: unknown) => {
        if (!isValidString(folderPath) || !isValidString(projectName)) {
            console.error('[IPC] CREATE_PROJECT: Invalid arguments');
            return { success: false, error: 'Argumentos inválidos' };
        }
        const fileContent = typeof content === 'string' ? content : '';

        try {
            const res = await fileIndexer.createProjectFile(folderPath, projectName, fileContent);
            if (res) {
                return { success: true, path: res };
            }
            return { success: false, error: 'Falha ao criar arquivo' };
        } catch (error: any) {
            console.error('[MAIN] createProjectFile error:', error);
            if (error.code === 'EEXIST') {
                return { success: false, error: 'Um arquivo com este nome já existe' };
            }
            return { success: false, error: error.message || 'Erro desconhecido' };
        }
    });

    ipcMain.handle(IPC.GET_INITIAL_STATE, async () => {
        try {
            console.log('[MAIN] Getting initial state (StudioVault Hub)...');
            const docPath = app.getPath('documents');
            const targetPath = path.join(docPath, 'StudioVault');

            if (!fs.existsSync(targetPath)) {
                console.log('[MAIN] Creating default vault hub at:', targetPath);
                fs.mkdirSync(targetPath, { recursive: true });
            }

            console.log('[MAIN] Vault Hub Path:', targetPath);
            fileIndexer.setRoot(targetPath);
            store.set('lastVaultPath', targetPath);

            const files = await fileIndexer.scanDirectory(targetPath);
            return { rootPath: targetPath, files };
        } catch (error) {
            console.error('[MAIN] Error getting initial state:', error);
            return null;
        }
    });

    ipcMain.handle(IPC.GET_DIRNAME, async (_, filePath: unknown) => {
        if (!isValidString(filePath)) {
            throw new Error('Invalid file path');
        }
        // Return the parent directory - path validation is done client-side for navigation
        // The actual file operations (readFile, saveFile) will validate paths anyway
        return path.dirname(filePath);
    });

    ipcMain.handle(IPC.DELETE_FILE, async (_, filePath: unknown) => {
        if (!isValidString(filePath)) {
            console.error('[IPC] DELETE_FILE: Invalid filePath argument');
            return false;
        }
        return fileIndexer.deleteFile(filePath);
    });

    ipcMain.handle(IPC.DELETE_FOLDER, async (_, dirPath: unknown) => {
        if (!isValidString(dirPath)) {
            console.error('[IPC] DELETE_FOLDER: Invalid dirPath argument');
            return false;
        }
        return fileIndexer.deleteFolder(dirPath);
    });

    ipcMain.handle(IPC.RENAME_ITEM, async (_, oldPath: unknown, newName: unknown) => {
        if (!isValidString(oldPath) || !isValidString(newName)) {
            console.error('[IPC] RENAME_ITEM: Invalid arguments');
            return null;
        }
        return fileIndexer.renameItem(oldPath, newName);
    });

    ipcMain.handle(IPC.CREATE_WORKSPACE, async (_, name: unknown) => {
        if (!isValidString(name)) {
            console.error('[IPC] CREATE_WORKSPACE: Invalid name');
            return null;
        }

        try {
            // Base path: Documents/StudioVault
            const docPath = app.getPath('documents');
            const vaultBase = path.join(docPath, 'StudioVault');

            // Ensure base exists
            if (!fs.existsSync(vaultBase)) {
                fs.mkdirSync(vaultBase, { recursive: true });
            }

            // Sanitize workspace name
            const safeName = name.replace(/[\\/:*?"<>|]/g, '_');
            const newWorkspacePath = path.join(vaultBase, safeName);

            // Create workspace folder if not exists
            if (!fs.existsSync(newWorkspacePath)) {
                fs.mkdirSync(newWorkspacePath, { recursive: true });
            }

            // We do NOT change root to the child anymore. Root stays at Vault Base.
            // Client will refresh files and see the new folder.

            return newWorkspacePath;
        } catch (error) {
            console.error('[IPC] CREATE_WORKSPACE Error:', error);
            return null;
        }
    });


    ipcMain.handle(IPC.GET_RECENT_FILES, async (_, folderPath: unknown, limit: unknown) => {
        if (!isValidString(folderPath)) {
            return [];
        }
        const max = typeof limit === 'number' ? limit : 10;
        return fileIndexer.getRecentFiles(folderPath, max);
    });

    ipcMain.handle(IPC.IMPORT_FILE, async (_, destinationFolder: unknown) => {
        if (!isValidString(destinationFolder)) {
            return { success: false, error: 'Pasta de destino inválida' };
        }

        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Documentos', extensions: ['md', 'txt'] },
                // Placeholder for .doc/docx support (requires library like mammoth/libreoffice)
                { name: 'Word (Texto simples)', extensions: ['doc', 'docx'] }
            ]
        });

        if (canceled || filePaths.length === 0) {
            return { success: false, error: 'Seleção cancelada' };
        }

        const sourcePath = filePaths[0];
        const ext = path.extname(sourcePath).toLowerCase();

        try {
            let content = '';
            // Basic raw read for text-based files
            // For .doc/.docx we'd need a converter. For now we try to read as utf8 but it will fail/be garbage for binary.
            // Let's protect against binary garbage for .doc/.docx by using a placeholder or basic text extraction if possible.
            // Since we don't have 'mammoth' installed, we will only support text files officially.
            // But user asked for doc support. We can try to read it but it will be binary.
            // Let's throw error for binary formats for now or read as safe text.

            if (['.md', '.txt'].includes(ext)) {
                content = await fs.promises.readFile(sourcePath, 'utf8');
            } else {
                return { success: false, error: 'Formato .doc/.docx requer conversor (não instalado)' };
            }

            const fileName = path.basename(sourcePath); // keep original name including extension
            // We want to convert to .md eventually or keep as is? User said "virar md".
            // So we should change extension to .md if it's .txt.

            let targetName = fileName;
            if (ext === '.txt') {
                targetName = fileName.replace(/\.txt$/, '.md');
            }

            // Create file uses createProjectFile which handles safe creation
            const result = await fileIndexer.createProjectFile(destinationFolder, targetName, content);

            if (result) {
                return { success: true };
            } else {
                return { success: false, error: 'Falha ao salvar arquivo importado' };
            }

        } catch (error: any) {
            console.error('Import Error:', error);
            if (error.code === 'EEXIST') {
                return { success: false, error: 'Arquivo já existe no destino' };
            }
            return { success: false, error: 'Erro ao ler arquivo: ' + error.message };
        }
    });
}
