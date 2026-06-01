import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'fd_';

export async function saveToCache(key, value) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (_) {}
}

export async function loadFromCache(key) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export async function clearCache(key) {
  try {
    if (key) {
      await AsyncStorage.removeItem(PREFIX + key);
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const fdKeys = keys.filter(k => k.startsWith(PREFIX));
      if (fdKeys.length) await AsyncStorage.multiRemove(fdKeys);
    }
  } catch (_) {}
}
