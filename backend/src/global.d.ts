declare module 'net-snmp' {
  export interface Options {
    version?: number;
  }
  export function createSession(target: string, community: string, options?: Options): any;
  export const Version1: number;
  export const Version2c: number;
  export const Version3: number;
}

declare module 'ssh2' {
  export class Client {
    connect(options: any): void;
    shell(callback: (err: any, stream: any) => void): void;
    on(event: string, callback: (...args: any[]) => void): void;
    end(): void;
    exec(cmd: string, callback: (err: any, stream: any) => void): void;
  }
}
