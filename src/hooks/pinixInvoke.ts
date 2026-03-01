// 跨端 Pinix RPC 调用（按 clip-bridge-compat.md 规范）
export async function pinixInvoke(
  command: string,
  stdin = "{}",
  args: string[] = []
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const isIOS = !!window.webkit;
  if (isIOS) {
    return window.Bridge!.invoke("invoke", { name: command, args, stdin });
  } else {
    return window.Bridge!.invoke(command, { args, stdin });
  }
}

export function hasBridge(): boolean {
  return !!window.Bridge;
}
