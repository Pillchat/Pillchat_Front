export function openCamera() {
  if ((window as any).ReactNativeWebView) {
    (window as any).ReactNativeWebView.postMessage(
      JSON.stringify({ type: "OPEN_CAMERA" }),
    );
  }
  {
    /*else {
    console.log("웹 카메라 fallback");
  }*/
  }
}
