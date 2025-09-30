export const useLocalStorage = () => {
  const getStorageItem = (key: string) => {
    const isServer = typeof window === "undefined";
    if (isServer) return;

    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  };

  const setStorageItem = (key: string, value: unknown) => {
    const isServer = typeof window === "undefined";
    if (isServer) return;
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }

    localStorage.setItem(key, value as string);
  };

  const removeStorageItem = (key: string) => {
    const isServer = typeof window === "undefined";
    if (isServer) return;

    localStorage.removeItem(key);
  };

  return { getStorageItem, setStorageItem, removeStorageItem };
};
