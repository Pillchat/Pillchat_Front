type NativeSdk = NonNullable<Window["Nachocode"]>;

export const NATIVE_READY = "pillchat:native-ready";
export const APP_RESUME = "pillchat:resume";
export const APP_BACKGROUND = "pillchat:background";
export const APP_KEYBOARD = "pillchat:keyboard";
export const nachocodeSandbox =
  process.env.NEXT_PUBLIC_NACHOCODE_SANDBOX === "true";

const initialized = new WeakMap<NativeSdk, Promise<NativeSdk | null>>();
const connected = new WeakSet<NativeSdk>();

export function getNativeApp() {
  if (typeof window === "undefined") return null;
  try {
    const sdk = window.Nachocode;
    return sdk?.env.isApp() ? sdk : null;
  } catch {
    return null;
  }
}

export async function initializeNativeApp() {
  const sdk = typeof window !== "undefined" ? window.Nachocode : undefined;
  if (!sdk) return null;
  let task = initialized.get(sdk);
  if (!task) {
    task = (async () => {
      const key = process.env.NEXT_PUBLIC_NACHOCODE_API_KEY;
      if (key) await sdk.initAsync(key, { sandbox: nachocodeSandbox });
      return getNativeApp();
    })().catch(() => {
      initialized.delete(sdk);
      return null;
    });
    initialized.set(sdk, task);
  }
  const result = await task;
  if (!result) initialized.delete(sdk);
  return result;
}

// SDK off(name) removes every listener for that event. Install one bridge per
// SDK for the document lifetime; React consumers subscribe to DOM events.
export function connectNativeEvents(sdk: NativeSdk) {
  if (connected.has(sdk)) return;
  connected.add(sdk);
  sdk.event?.on("foreground", () =>
    window.dispatchEvent(new Event(APP_RESUME)),
  );
  sdk.event?.on("background", () =>
    window.dispatchEvent(new Event(APP_BACKGROUND)),
  );
  sdk.event?.on("keyboardshown", () =>
    window.dispatchEvent(new CustomEvent(APP_KEYBOARD, { detail: true })),
  );
  sdk.event?.on("keyboardhidden", () =>
    window.dispatchEvent(new CustomEvent(APP_KEYBOARD, { detail: false })),
  );
  sdk.event?.on("networkchanged", (status) => {
    if (typeof status?.isConnected === "boolean") {
      window.dispatchEvent(
        new CustomEvent("pillchat:network", { detail: status.isConnected }),
      );
    }
  });
  window.dispatchEvent(new Event(NATIVE_READY));
}

type BackHandler = { callback: () => void; priority: number };
const backHandlers: BackHandler[] = [];
let backSdk: NativeSdk | null = null;
const backId = "pillchat:back";
function bindBackKey() {
  const sdk = getNativeApp();
  if (!sdk?.backkey || backSdk === sdk || !backHandlers.length) return;
  try {
    sdk.backkey.addEvent(() => {
      const next = [...backHandlers]
        .reverse()
        .sort((a, b) => b.priority - a.priority)[0];
      next?.callback();
    }, backId);
    backSdk = sdk;
  } catch {
    // Older app builds and iOS may expose the namespace without back-key support.
  }
}

export function registerNativeBack(callback: () => void, priority = 0) {
  const handler = { callback, priority };
  backHandlers.push(handler);
  if (backHandlers.length === 1)
    window.addEventListener(NATIVE_READY, bindBackKey);
  bindBackKey();
  return () => {
    const index = backHandlers.indexOf(handler);
    if (index >= 0) backHandlers.splice(index, 1);
    if (!backHandlers.length) {
      window.removeEventListener(NATIVE_READY, bindBackKey);
      backSdk?.backkey?.removeEvent(backId);
      backSdk = null;
    }
  };
}
