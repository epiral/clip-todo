// Pinix Bridge 类型声明
interface PinixBridge {
  invoke: (
    action: string,
    payload: { name?: string; args?: string[]; stdin?: string }
  ) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

declare global {
  interface Window {
    Bridge?: PinixBridge;
    webkit?: unknown;
  }
}

export {};
