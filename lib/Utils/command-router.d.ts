export interface CommandContext {
    sock: any;
    msg: any;
    jid: string;
    args: string[];
    text: string;
}
export interface CommandDefinition {
    handler: (ctx: CommandContext) => Promise<void> | void;
    aliases?: string[];
    ownerOnly?: boolean;
}
export interface CommandRouterOptions {
    prefix?: string;
    commands?: Record<string, CommandDefinition>;
    ownerJids?: string[];
    onUnauthorized?: (ctx: { sock: any; msg: any; jid: string; name: string }) => Promise<void> | void;
    onError?: (err: unknown, ctx: { sock: any; msg: any; jid: string; name: string; args: string[] }) => Promise<void> | void;
}
export interface CommandRouter {
    handle: (sock: any, msg: any) => Promise<boolean>;
    list: () => string[];
}
export declare const makeCommandRouter: (options?: CommandRouterOptions) => CommandRouter;
