export interface GracefulShutdownOptions {
    saveCreds?: () => Promise<void> | void;
    onShutdown?: (signal: string) => void;
    signals?: NodeJS.Signals[];
    timeoutMs?: number;
}
export interface GracefulShutdown {
    detach: () => void;
}
export declare const attachGracefulShutdown: (sock: any, options?: GracefulShutdownOptions) => GracefulShutdown;
