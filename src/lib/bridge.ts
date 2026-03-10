// Bridge 适配层
// window.Bridge 存在时用真实 Bridge.invoke，否则用 localStorage fallback
// 跨端兼容：iOS (WKWebView) 与 Desktop (Electron) 调用签名不同

const isBridge = () => typeof window !== 'undefined' && !!window.Bridge;
const isIOS = () => typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).webkit;

/** 跨端 Pinix RPC 调用 — 统一 iOS / Desktop 差异 */
async function pinixInvoke(command: string, stdin = '{}', args: string[] = []) {
  if (isIOS()) {
    return window.Bridge!.invoke('invoke', { name: command, args, stdin });
  } else {
    return window.Bridge!.invoke(command, { args, stdin });
  }
}

/** 调用高级命令（task-list, project-create 等），自动 JSON stringify/parse + 错误处理 */
export async function invoke<T = unknown>(command: string, input: Record<string, unknown> = {}): Promise<T> {
  if (!isBridge()) {
    throw new Error('Bridge not available');
  }
  const result = await pinixInvoke(command, JSON.stringify(input));
  if (result.exitCode !== 0) {
    throw new Error(`${command} failed: ${result.stderr}`);
  }
  return JSON.parse(result.stdout) as T;
}

export { isBridge };
