import { IElectronAPI } from './shared/types';



declare global {
    interface Window {
        api: IElectronAPI;
    }
}
