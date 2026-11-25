import { getNativeApp } from "./nativeApp";

export function externalUrl(value: string) {
  const url = new URL(value);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("열 수 없는 링크입니다.");
  }
  return url.href;
}

export function openNativeExternal(value: string) {
  const url = externalUrl(value);
  const sdk = getNativeApp();
  if (!sdk?.browser) return false;
  sdk.browser.openLink(url, "external");
  return true;
}

// Reserve a browser window during the tap, before fetching a signed URL.
// Native browsers are opened through the bridge after that URL arrives.
export function prepareExternalOpen() {
  const native = !!getNativeApp()?.browser;
  const popup = native ? null : window.open("about:blank", "_blank");
  if (!native && !popup)
    throw new Error(
      "새 창이 차단되었습니다. 팝업을 허용하고 다시 시도해주세요.",
    );
  if (popup) popup.opener = null;
  return {
    open(value: string) {
      const url = externalUrl(value);
      if (native) {
        if (!openNativeExternal(url))
          throw new Error("파일을 열지 못했습니다. 다시 시도해주세요.");
      } else if (popup && !popup.closed) popup.location.href = url;
      else throw new Error("파일을 열 창이 닫혔습니다. 다시 시도해주세요.");
    },
    close() {
      popup?.close();
    },
  };
}
