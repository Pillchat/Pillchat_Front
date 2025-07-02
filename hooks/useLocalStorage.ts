export const useLocalStorage = () => {
  const getStorageItem = (key: string) => {
    const isServer = typeof window === "undefined";
    if (isServer) return;

    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  };

  const setStorageItem = (key: string, value: unknown) => {
    const isServer = typeof window === "undefined";
    if (isServer) return;

    localStorage.setItem(key, JSON.stringify(value));
  };

  const removeStorageItem = (key: string) => {
    const isServer = typeof window === "undefined";
    if (isServer) return;

    localStorage.removeItem(key);
  };

  return { getStorageItem, setStorageItem, removeStorageItem };
};
