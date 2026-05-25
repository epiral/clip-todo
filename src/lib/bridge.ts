/**
 * Clip Web bridge — wraps @pinixai/core/web invoke for typed command calls.
 *
 * In Hub/standalone mode, calls go through the SDK's auto-detected transport.
 * In development (no backend), falls back to localStorage.
 */
import { invoke as sdkInvoke } from "@pinixai/core/web";

let _useLocalStorage = false;

/**
 * Detect whether the SDK transport is available.
 * In standalone dev (vite dev server), there's no clip backend,
 * so we fall back to localStorage.
 */
function detectMode(): boolean {
  // If running on the Vite dev server port, use localStorage
  if (typeof window !== "undefined") {
    const port = window.location.port;
    if (port === "5173" || port === "5174") return true;
  }
  return false;
}

/**
 * Invoke a clip command. Sends the input object as the JSON body.
 * The @pinixai/core HTTP server validates it against the command's Zod schema.
 */
export async function invoke<T = unknown>(
  command: string,
  input: Record<string, unknown> = {},
): Promise<T> {
  if (_useLocalStorage) {
    throw new Error("localStorage mode — no backend");
  }
  // Pass input directly as the opts body. Zod strips unknown fields (args, stdin).
  return sdkInvoke<T>(command, input as Parameters<typeof sdkInvoke>[1]);
}

export function isLocalStorageMode(): boolean {
  return _useLocalStorage;
}

// Auto-detect on load
if (typeof window !== "undefined") {
  _useLocalStorage = detectMode();
}
