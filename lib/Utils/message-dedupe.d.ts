export interface MessageDedupeOptions {
    max?: number;
    ttlMs?: number;
}
export interface MessageDedupe {
    isDuplicate: (id: string | undefined | null) => boolean;
    wrapHandler: (handler: (payload: any) => Promise<void> | void) => (payload: any) => Promise<void>;
    readonly size: number;
    clear: () => void;
}
export declare const makeMessageDedupe: (options?: MessageDedupeOptions) => MessageDedupe;
