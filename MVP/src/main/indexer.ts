import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import crypto from 'node:crypto';
import { FileMetadata } from '../shared/types';

export class FileIndexer {
    private rootPath: string = '';

    setRoot(rootPath: string) {
        this.rootPath = path.normalize(rootPath);
    }

    getRoot(): string {
        return this.rootPath;
    }

    /**
     * Security: Validates that a target path is within the vault root.
     * Prevents path traversal attacks (e.g., using ../ to escape the vault).
     */
    private isPathSafe(targetPath: string): boolean {
        if (!this.rootPath) return false;
        const normalizedTarget = path.normalize(path.resolve(targetPath));
        const normalizedRoot = path.normalize(path.resolve(this.rootPath));
        return normalizedTarget.startsWith(normalizedRoot + path.sep) || normalizedTarget === normalizedRoot;
    }

    /**
     * Security: Escapes special characters for safe YAML insertion.
     */
    private escapeYaml(str: string): string {
        // If string contains special YAML characters or newlines, wrap in quotes and escape
        if (/[":{}[\],&*#?|\-<>=!%@`\n\r]/.test(str) || str.trim() !== str) {
            return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`;
        }
        return `"${str}"`;
    }

    async scanDirectory(dirPath: string): Promise<FileMetadata[]> {
        if (!dirPath) return [];
        if (!this.isPathSafe(dirPath)) {
            console.error('[Security] Path traversal attempt blocked:', dirPath);
            return [];
        }

        try {
            const dirents = await fs.readdir(dirPath, { withFileTypes: true });
            const files: FileMetadata[] = [];

            for (const dirent of dirents) {
                // Skip hidden files/folders
                if (dirent.name.startsWith('.')) continue;

                const fullPath = path.join(dirPath, dirent.name);

                // Double-check each constructed path is still safe
                if (!this.isPathSafe(fullPath)) continue;

                const stats = await fs.stat(fullPath);

                const metadata: FileMetadata = {
                    path: fullPath,
                    name: dirent.name,
                    isDirectory: dirent.isDirectory(),
                    size: stats.size,
                    lastModified: stats.mtime,
                    createdAt: stats.birthtime,
                };

                if (!dirent.isDirectory() && dirent.name.endsWith('.md')) {
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        const parsed = matter(content);
                        // Merge frontmatter
                        Object.assign(metadata, parsed.data);
                    } catch (e) {
                        console.error(`Failed to parse markdown frontmatter for ${fullPath}`, e);
                    }
                }

                files.push(metadata);
            }

            return files.sort((a, b) => {
                // Folders first
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });
        } catch (error) {
            console.error('Error scanning directory:', error);
            return [];
        }
    }

    async readFile(filePath: string): Promise<string> {
        if (!this.isPathSafe(filePath)) {
            throw new Error('[Security] Access denied: Path is outside vault');
        }
        return fs.readFile(filePath, 'utf-8');
    }

    async saveFile(filePath: string, content: string): Promise<void> {
        if (!this.isPathSafe(filePath)) {
            throw new Error('[Security] Access denied: Path is outside vault');
        }
        return fs.writeFile(filePath, content, 'utf-8');
    }

    async createFolder(dirPath: string, name: string): Promise<{ success: boolean; error?: string }> {
        // Validate base path
        if (!this.isPathSafe(dirPath)) {
            console.error('[Security] Path traversal attempt blocked in createFolder:', dirPath);
            return { success: false, error: 'Acesso negado: Caminho inválido' };
        }

        // Sanitize folder name (remove path separators and dangerous chars)
        const sanitizedName = name.replace(/[\\/:*?"<>|]/g, '_');
        if (!sanitizedName) {
            return { success: false, error: 'Nome de pasta inválido' };
        }
        const fullPath = path.join(dirPath, sanitizedName);

        // Validate resulting path
        if (!this.isPathSafe(fullPath)) {
            console.error('[Security] Path traversal attempt blocked in createFolder result:', fullPath);
            return { success: false, error: 'Nome de pasta inválido ou inseguro' };
        }

        try {
            await fs.mkdir(fullPath);
            return { success: true };
        } catch (e: any) {
            console.error('Error creating folder:', e);
            if (e.code === 'EEXIST') {
                return { success: false, error: 'Uma pasta com este nome já existe' };
            }
            return { success: false, error: 'Erro ao criar pasta: ' + e.message };
        }
    }

    async createProjectFile(folderPath: string, projectName: string, content: string = ''): Promise<string | null> {
        // Validate base path
        if (!this.isPathSafe(folderPath)) {
            console.error('[Security] Path traversal attempt blocked in createProjectFile:', folderPath);
            return null;
        }

        try {
            // 1. Generate filename (kebab-case, sanitized)
            // Use name as provided if it has extension, otherwise sanitize
            let fileName = projectName;
            if (!fileName.endsWith('.md') && !fileName.endsWith('.txt')) {
                const safeName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                if (!safeName) return null;
                fileName = `${safeName}.md`;
            }

            const fullPath = path.join(folderPath, fileName);

            // Validate resulting path
            if (!this.isPathSafe(fullPath)) {
                console.error('[Security] Path traversal attempt blocked in createProjectFile result:', fullPath);
                return null;
            }

            // 2. Check existence
            try {
                await fs.access(fullPath);
                throw { code: 'EEXIST', message: 'File already exists' };
            } catch (e: any) {
                if (e.code === 'EEXIST') throw e;
                // File doesn't exist, proceed
            }

            // 3. Create file with content
            // If content is empty/default, use template for .md files
            if (!content && fileName.endsWith('.md')) {
                const escapedTitle = this.escapeYaml(projectName.replace('.md', ''));
                content = `---
id: "${crypto.randomUUID()}"
title: ${escapedTitle}
status: "backlog"
created_at: "${new Date().toISOString()}"
tags: []
---
# ${projectName.replace(/[<>]/g, '').replace('.md', '')}

Start defining your project here...
`;
            }

            await fs.writeFile(fullPath, content, 'utf8');
            return fullPath;

        } catch (e) {
            console.error('Error creating project file:', e);
            throw e; // Re-throw for IPC handler to catch
        }
    }

    async deleteFile(filePath: string): Promise<boolean> {
        if (!this.isPathSafe(filePath)) {
            console.error('[Security] Path traversal attempt blocked in deleteFile:', filePath);
            return false;
        }

        try {
            await fs.unlink(filePath);
            return true;
        } catch (e) {
            console.error('Error deleting file:', e);
            return false;
        }
    }

    async deleteFolder(dirPath: string): Promise<boolean> {
        if (!this.isPathSafe(dirPath)) {
            console.error('[Security] Path traversal attempt blocked in deleteFolder:', dirPath);
            return false;
        }

        // Prevent deleting the root vault
        if (path.normalize(dirPath) === path.normalize(this.rootPath)) {
            console.error('[Security] Cannot delete root vault folder');
            return false;
        }

        try {
            await fs.rm(dirPath, { recursive: true, force: true });
            return true;
        } catch (e) {
            console.error('Error deleting folder:', e);
            return false;
        }
    }

    async renameItem(oldPath: string, newName: string): Promise<string | null> {
        if (!this.isPathSafe(oldPath)) {
            console.error('[Security] Path traversal attempt blocked in renameItem:', oldPath);
            return null;
        }

        // Sanitize new name
        const sanitizedName = newName.replace(/[\\/:*?"<>|]/g, '_');
        const parentDir = path.dirname(oldPath);
        const newPath = path.join(parentDir, sanitizedName);

        if (!this.isPathSafe(newPath)) {
            console.error('[Security] Path traversal attempt blocked in renameItem result:', newPath);
            return null;
        }

        try {
            await fs.rename(oldPath, newPath);
            return newPath;
        } catch (e) {
            console.error('Error renaming item:', e);
            return null;
        }
    }

    async scanRecursive(dirPath: string, depth: number = 0, maxDepth: number = 3): Promise<FileMetadata[]> {
        if (depth > maxDepth) return [];
        if (!this.isPathSafe(dirPath)) return [];

        try {
            const dirents = await fs.readdir(dirPath, { withFileTypes: true });
            let allFiles: FileMetadata[] = [];

            for (const dirent of dirents) {
                // Skip hidden
                if (dirent.name.startsWith('.')) continue;

                const fullPath = path.join(dirPath, dirent.name);
                if (!this.isPathSafe(fullPath)) continue;

                if (dirent.isDirectory()) {
                    // Recurse
                    const subFiles = await this.scanRecursive(fullPath, depth + 1, maxDepth);
                    allFiles = allFiles.concat(subFiles);
                } else if (dirent.name.endsWith('.md')) {
                    // Add file
                    const stats = await fs.stat(fullPath);
                    allFiles.push({
                        path: fullPath,
                        name: dirent.name,
                        isDirectory: false,
                        size: stats.size,
                        lastModified: stats.mtime,
                        createdAt: stats.birthtime,
                    });
                }
            }
            return allFiles;
        } catch (error) {
            console.error('Error scanning recursive:', error);
            return [];
        }
    }

    async getRecentFiles(folderPath: string, limit: number = 10): Promise<FileMetadata[]> {
        console.log('[Indexer] getRecentFiles called for:', folderPath);
        if (!this.isPathSafe(folderPath)) {
            console.error('[Indexer] Path unsafe:', folderPath);
            return [];
        }

        // Scan up to depth 4
        // Use a Set to prevent duplicates if any, though recursive logic shouldn't produce them if structure is a tree
        const allFiles = await this.scanRecursive(folderPath, 0, 4);
        console.log('[Indexer] Found files recursively:', allFiles.length);

        // Sort by createdAt desc
        const sorted = allFiles
            .sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, limit);

        console.log('[Indexer] Top recent files:', sorted.map(f => f.name));
        return sorted;
    }
}

export const fileIndexer = new FileIndexer();

