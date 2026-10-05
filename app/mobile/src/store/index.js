import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCurrentUserApi, loginApi, registerApi } from '../services/api';

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
        // New user or no saved data for this user ID
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
        if (storedToken) {
          try {
            const dbUser = await fetchCurrentUserApi(storedToken);
            const currentUser = {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.display_name || dbUser.name || 'User',
              role: dbUser.role,
            };
            setUser(currentUser);
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
    const jwtToken = authRes.access_token;
    await AsyncStorage.setItem('safelabel_token', jwtToken);
    setToken(jwtToken);

    const dbUser = await fetchCurrentUserApi(jwtToken);
    const nextUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.display_name || dbUser.name || 'User',
      role: dbUser.role,
    };
    setUser(nextUser);
    setLoggedIn(true);

    // Load data isolated to this logged in user
    await loadUserData(dbUser.id);
    return nextUser;
  };

  const register = async (name, email, password) => {
    const authRes = await registerApi(email, password, name);
    const jwtToken = authRes.access_token;
    await AsyncStorage.setItem('safelabel_token', jwtToken);
    setToken(jwtToken);

    const dbUser = await fetchCurrentUserApi(jwtToken);
    const nextUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.display_name || dbUser.name || name || 'User',
      role: dbUser.role,
    };
    setUser(nextUser);
    // Reset user-specific state for clean new account
    setProfile([]);
    setHistory([]);
    setSavedProducts([]);
    setLoggedIn(true);

    // Persist empty profile for new user
    persistData({ profile: [], history: [], savedProducts: [] }, dbUser.id);
    // Trigger onboarding allergy picker modal for new user
    setShowOnboardingAllergies(true);

    return nextUser;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('safelabel_token');
    setToken(null);
    setLoggedIn(false);
    setUser({ name: 'User', email: '' });
    setProfile([]);
    setHistory([]);
    setSavedProducts([]);
    setShowOnboardingAllergies(false);
  };

  const toggleAllergen = (id) => {
    const n = profile.includes(id) ? profile.filter((x) => x !== id) : [...profile, id];
    setProfile(n);
    persistData({ profile: n });
  };

  const addScan = (r) => {
    const n = [r, ...history].slice(0, 50);
    setHistory(n);
    persistData({ history: n });
  };

  const clearHistory = () => {
    setHistory([]);
    persistData({ history: [] });
  };

  const saveProduct = (product) => {
    const n = savedProducts.some((item) => item.name === product.name)
      ? savedProducts
      : [product, ...savedProducts];
    setSavedProducts(n);
    persistData({ savedProducts: n });
  };

  const removeSavedProduct = (name) => {
    const n = savedProducts.filter((item) => item.name !== name);
    setSavedProducts(n);
    persistData({ savedProducts: n });
  };

  const updateSettings = (next) => {
    const n = { ...settings, ...next };
    setSettings(n);
    persistData({ settings: n });
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
    logout,
    toggleAllergen,
    addScan,
    clearHistory,
    saveProduct,
    removeSavedProduct,
    updateSettings,
    dismissOnboardingAllergies,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

