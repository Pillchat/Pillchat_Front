declare global {
  type NachocodeResult = {
    status: "success" | "error";
    statusCode: number;
    message?: string;
  };

  type NachocodePurchaseResult = {
    purchaseId?: number;
    status: {
      success: boolean;
      error?: { code?: string; message?: string };
    };
  };

  type NachocodeKakaoLoginData = {
    accessToken?: string;
    accessTokenExpiresAt?: Date;
    refreshToken?: string;
    refreshTokenExpiresAt?: Date;
    idToken?: string;
  };

  type NachocodeGoogleUserData = {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
    isEmailVerified?: boolean;
    providerId?: string;
  };

  interface Window {
    Kakao: any;
    Nachocode?: {
      initAsync: (
        apiKey: string,
        options?: { sandbox?: boolean },
      ) => Promise<void>;
      env: {
        isApp: () => boolean;
      };
      iap?: {
        purchase: (
          productKey: string,
          userId: string,
          callback: (result: NachocodePurchaseResult) => void,
        ) => Promise<void>;
      };
      browser?: {
        openLink: (
          url: string,
          option?: "external" | "internal" | "internal_default",
        ) => void;
      };
      event?: {
        on: (
          name:
            | "foreground"
            | "background"
            | "networkchanged"
            | "keyboardshown"
            | "keyboardhidden",
          callback: (params?: { isConnected?: boolean }) => void,
        ) => void;
      };
      backkey?: {
        addEvent: (
          callback: (id: string) => void,
          id?: string,
        ) => string | void;
        removeEvent: (id?: string) => unknown;
      };
      google?: {
        login: (
          callback: (
            result: NachocodeResult,
            idToken?: string,
            userData?: NachocodeGoogleUserData,
          ) => void,
        ) => void;
        isLoggedIn: (
          callback: (
            result: NachocodeResult,
            isLoggedIn: boolean,
            idToken?: string,
          ) => void,
        ) => void;
        getUserData: (
          callback: (
            result: NachocodeResult,
            userData?: NachocodeGoogleUserData,
          ) => void,
        ) => void;
        logout: (callback?: (result: NachocodeResult) => void) => void;
      };
      kakao?: {
        login: (
          callback: (
            result: NachocodeResult,
            loginData?: NachocodeKakaoLoginData,
          ) => void,
        ) => void;
        isLoggedIn: (
          callback: (
            result: NachocodeResult,
            isLoggedIn: boolean,
            loginData?: NachocodeKakaoLoginData,
          ) => void,
        ) => void;
        getUserData: (
          callback: (result: NachocodeResult, userData?: unknown) => void,
        ) => void;
        logout: (callback?: (result: NachocodeResult) => void) => void;
        unlink: (callback?: (result: NachocodeResult) => void) => void;
      };
      permission: {
        checkPermission: (
          options: { type: string; ask: boolean },
          callback: (granted: boolean) => void,
        ) => void;
      };
      push: {
        registerPushToken: (userId: string) => Promise<{ status: string }>;
        deletePushToken: () => Promise<{ status: string }>;
        sendLocalPush: (
          options: {
            title: string;
            content: string;
            link?: string;
            scheduledTime?: Date;
            id?: number;
          },
          callback: (result: {
            status: string;
            id?: number;
            message?: string;
          }) => void,
        ) => void;
        cancelLocalPush: (id: number) => void;
      };
    };
  }
}

export {};
