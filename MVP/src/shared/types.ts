export interface FileMetadata {
    path: string;
    name: string;
    isDirectory: boolean;
    size?: number;
    lastModified?: Date;
    createdAt?: Date;
    // Frontmatter fields
    title?: string;
    status?: string;
    tags?: string[];
    [key: string]: any;
}

export interface FolderContent {
    path: string;
    files: FileMetadata[];
}

// IPC Channel Names
export const IPC = {
    OPEN_FOLDER: 'dialog:open-folder',
    GET_FILES: 'fs:get-files',
    READ_FILE: 'fs:read-file',
    SAVE_FILE: 'fs:save-file',
    CREATE_FOLDER: 'fs:create-folder',
    CREATE_PROJECT: 'fs:create-project',
    GET_INITIAL_STATE: 'app:get-initial-state',
    GET_DIRNAME: 'fs:get-dirname',
    DELETE_FILE: 'fs:delete-file',
    DELETE_FOLDER: 'fs:delete-folder',
    RENAME_ITEM: 'fs:rename-item',
    CREATE_WORKSPACE: 'fs:create-workspace',
    GET_RECENT_FILES: 'fs:get-recent-files',
    IMPORT_FILE: 'dialog:import-file',
} as const;

export interface GetInitialStateResponse {
    rootPath: string;
    files: FileMetadata[];
}

export interface IElectronAPI {
    openFolder: () => Promise<string | null>;
    getFiles: (folderPath: string) => Promise<FileMetadata[]>;
    readFile: (filePath: string) => Promise<string>;
    saveFile: (filePath: string, content: string) => Promise<void>;
    createFolder: (path: string, name: string) => Promise<{ success: boolean; error?: string }>;
    createProjectFile: (folderPath: string, projectName: string, content?: string) => Promise<{ success: boolean; error?: string }>;
    getInitialState: () => Promise<GetInitialStateResponse | null>;
    dirname: (path: string) => Promise<string>;
    deleteFile: (filePath: string) => Promise<boolean>;
    deleteFolder: (dirPath: string) => Promise<boolean>;
    renameItem: (oldPath: string, newName: string) => Promise<string | null>;
    createWorkspace: (name: string) => Promise<string | null>;
    getRecentFiles: (folderPath: string, limit?: number) => Promise<FileMetadata[]>;
    importFile: (destinationFolder: string) => Promise<{ success: boolean; error?: string }>;
}



