export {};
declare global {
  interface Window {
    Bridge?: {
      invoke(action: string, payload: unknown): Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
      }>;
    };
  }
}
