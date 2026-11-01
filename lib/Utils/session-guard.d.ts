export interface SessionGuardOptions {
    threshold?: number;
    windowMs?: number;
    onClear?: (jid: string) => void;
}
export interface SessionGuard {
    clearNow: (jid: string) => Promise<void>;
    detach: () => void;
}
export declare const attachSessionGuard: (sock: any, options?: SessionGuardOptions) => SessionGuard;
