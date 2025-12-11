import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');

interface UserConfig {
    lastVaultPath?: string;
}

export const store = {
    get(key: keyof UserConfig): any {
        try {
            if (!fs.existsSync(configPath)) return undefined;
            const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            return data[key];
        } catch (error) {
            console.error('Error reading store:', error);
            return undefined;
        }
    },
    set(key: keyof UserConfig, value: any) {
        try {
            let data: UserConfig = {};
            if (fs.existsSync(configPath)) {
                data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            }
            data[key] = value;
            fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error writing store:', error);
        }
    }
};
