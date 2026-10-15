import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchCurrentUserApi,
  loginApi,
  registerApi,
  updateCurrentUserApi,
  verify2FAApi,
} from '../services/api';

export function extractNameFromEmail(email) {
  if (!email || typeof email !== 'string') return 'User';
  const local = email.split('@')[0] || '';
  const clean = local.replace(/[0-9]+/g, '').replace(/[._-]+/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'User';
}

export function resolveUserDisplayName(name, email) {
  if (name && typeof name === 'string' && name.trim() && name.trim().toLowerCase() !== 'user') {
    return name.trim();
  }
  return extractNameFromEmail(email);
}

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState({ name: 'User', email: '' });
  const [profile, setProfile] = useState([]);
  const [history, setHistory] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [settings, setSettings] = useState({ notifications: true, darkMode: false });
  const [showOnboardingAllergies, setShowOnboardingAllergies] = useState(false);

  const resolveUser = (rawUser, fallbackEmail = '', fallbackName = '') => {
    const email = rawUser?.email || fallbackEmail || '';
    const rawName = rawUser?.display_name || rawUser?.name || fallbackName || '';
    const name = resolveUserDisplayName(rawName, email);
    return {
      id: rawUser?.id || '',
      email,
      name,
      role: rawUser?.role || 'customer',
    };
  };

  // Helper to load user-specific storage
  const loadUserData = async (userId) => {
    try {
      const raw = await AsyncStorage.getItem(`safelabel_user_data_${userId}`);
      if (raw) {
        const loadedData = JSON.parse(raw);
        setProfile(loadedData.profile || []);
        setHistory(loadedData.history || []);
        setSavedProducts(loadedData.savedProducts || []);
        if (loadedData.settings) setSettings(loadedData.settings);
        return loadedData;
      } else {
        setProfile([]);
        setHistory([]);
        setSavedProducts([]);
      }
    } catch (err) {
      setProfile([]);
      setHistory([]);
      setSavedProducts([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem('safelabel_token');
        const storedUser = await AsyncStorage.getItem('safelabel_cached_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {}
        }

        if (storedToken) {
          try {
            const dbUser = await fetchCurrentUserApi(storedToken);
            let cachedName = '';
            if (storedUser) {
              try { cachedName = JSON.parse(storedUser).name; } catch (e) {}
            }
            const currentUser = resolveUser(dbUser, '', cachedName);
            setUser(currentUser);
            AsyncStorage.setItem('safelabel_cached_user', JSON.stringify(currentUser)).catch(() => {});
            setToken(storedToken);
            setLoggedIn(true);

            // Load user-specific profile & data
            await loadUserData(dbUser.id);
          } catch (err) {
            await AsyncStorage.removeItem('safelabel_token');
            setLoggedIn(false);
            setProfile([]);
            setHistory([]);
            setSavedProducts([]);
          }
        }
      } catch (err) {
        // Fallback
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistData = (next, currentUserId = user?.id) => {
    if (!currentUserId) return;
    AsyncStorage.setItem(
      `safelabel_user_data_${currentUserId}`,
      JSON.stringify({
        profile: next.profile !== undefined ? next.profile : profile,
        history: next.history !== undefined ? next.history : history,
        savedProducts: next.savedProducts !== undefined ? next.savedProducts : savedProducts,
        settings: next.settings !== undefined ? next.settings : settings,
      })
    ).catch(() => {});
  };

  const login = async (email, password) => {
    const authRes = await loginApi(email, password);
    if (authRes.two_factor_required) {
      // Temporarily cache intent
      AsyncStorage.setItem('safelabel_cached_user', JSON.stringify({ name: extractNameFromEmail(email), email })).catch(() => {});
      return authRes;
    }

    const jwtToken = authRes.access_token;
    await AsyncStorage.setItem('safelabel_token', jwtToken);
    setToken(jwtToken);

    const dbUser = await fetchCurrentUserApi(jwtToken);
    const nextUser = resolveUser(dbUser, email);
    setUser(nextUser);
    AsyncStorage.setItem('safelabel_cached_user', JSON.stringify(nextUser)).catch(() => {});
    setLoggedIn(true);

    // Load data isolated to this logged in user
    await loadUserData(dbUser.id);
    return nextUser;
  };

  const register = async (name, email, password) => {
    // Cache the chosen name immediately
    AsyncStorage.setItem('safelabel_cached_user', JSON.stringify({ name, email })).catch(() => {});

    const authRes = await registerApi(email, password, name);
    if (authRes.two_factor_required) {
      return authRes;
    }

    const jwtToken = authRes.access_token;
    await AsyncStorage.setItem('safelabel_token', jwtToken);
    setToken(jwtToken);

    const dbUser = await fetchCurrentUserApi(jwtToken);
    const nextUser = resolveUser(dbUser, email, name);
    setUser(nextUser);
    AsyncStorage.setItem('safelabel_cached_user', JSON.stringify(nextUser)).catch(() => {});
    setProfile([]);
    setHistory([]);
    setSavedProducts([]);
    setLoggedIn(true);

    persistData({ profile: [], history: [], savedProducts: [] }, dbUser.id);
    setShowOnboardingAllergies(true);

    return nextUser;
  };

  const verify2FA = async (email, code) => {
    let fn = verify2FAApi;
    if (typeof fn !== 'function') {
      try {
        const apiMod = require('../services/api');
        fn = apiMod.verify2FAApi;
      } catch (e) {}
    }
    if (typeof fn !== 'function') {
      throw new Error('Verification service unavailable. Please refresh or restart the app.');
    }

    const authRes = await fn(email, code);
    const jwtToken = authRes.access_token;
    await AsyncStorage.setItem('safelabel_token', jwtToken);
    setToken(jwtToken);

    let fetchFn = fetchCurrentUserApi;
    if (typeof fetchFn !== 'function') {
      try {
        const apiMod = require('../services/api');
        fetchFn = apiMod.fetchCurrentUserApi;
      } catch (e) {}
    }

    const dbUser = await fetchFn(jwtToken);
    let cachedName = '';
    const storedUserRaw = await AsyncStorage.getItem('safelabel_cached_user');
    if (storedUserRaw) {
      try { cachedName = JSON.parse(storedUserRaw).name; } catch (e) {}
    }

    const nextUser = resolveUser(dbUser, email, cachedName);
    setUser(nextUser);
    AsyncStorage.setItem('safelabel_cached_user', JSON.stringify(nextUser)).catch(() => {});
    setLoggedIn(true);

    await loadUserData(dbUser.id);
    return nextUser;
  };

  const updateUserName = async (newName) => {
    if (!newName || !newName.trim()) return;
    const cleanName = newName.trim();
    const updated = { ...user, name: cleanName };
    setUser(updated);
    AsyncStorage.setItem('safelabel_cached_user', JSON.stringify(updated)).catch(() => {});

    if (token) {
      try {
        await updateCurrentUserApi(token, cleanName);
      } catch (e) {
        // Fallback: local state already updated
      }
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('safelabel_token');
    await AsyncStorage.removeItem('safelabel_cached_user');
    setToken(null);
    setLoggedIn(false);
    setUser({ name: 'User', email: '' });
    setProfile([]);
    setHistory([]);
    setSavedProducts([]);
    setShowOnboardingAllergies(false);
  };

  const toggleAllergen = (id) => {
    setProfile((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      persistData({ profile: next });
      return next;
    });
  };

  const addScan = (scanResult) => {
    const item = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      ...scanResult,
    };
    setHistory((prev) => {
      const next = [item, ...prev];
      persistData({ history: next });
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    persistData({ history: [] });
  };

  const saveProduct = (product) => {
    const pName = product?.product?.name || product?.name;
    setSavedProducts((prev) => {
      if (prev.some((p) => (p?.product?.name || p?.name) === pName)) return prev;
      const next = [product, ...prev];
      persistData({ savedProducts: next });
      return next;
    });
  };

  const removeSavedProduct = (name) => {
    setSavedProducts((prev) => {
      const next = prev.filter((p) => (p?.product?.name || p?.name) !== name && p?.id !== name);
      persistData({ savedProducts: next });
      return next;
    });
  };

  const clearSavedProducts = () => {
    setSavedProducts([]);
    persistData({ savedProducts: [] });
  };

  const updateSettings = (partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      persistData({ settings: next });
      return next;
    });
  };

  const dismissOnboardingAllergies = () => {
    setShowOnboardingAllergies(false);
  };

  const value = {
    ready,
    loggedIn,
    token,
    user,
    profile,
    history,
    savedProducts,
    settings,
    showOnboardingAllergies,
    login,
    register,
    verify2FA,
    updateUserName,
    logout,
    toggleAllergen,
    addScan,
    clearHistory,
    saveProduct,
    removeSavedProduct,
    clearSavedProducts,
    updateSettings,
    dismissOnboardingAllergies,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
