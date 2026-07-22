declare global {
  type NachocodeResult = {
    status: "success" | "error";
    statusCode: number;
    message?: string;
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
      initAsync: (apiKey: string) => Promise<void>;
      env: {
        isApp: () => boolean;
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
