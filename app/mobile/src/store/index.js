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

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem('safelabel_token');
        const raw = await AsyncStorage.getItem('safelabel_data');
        
        let loadedData = {};
        if (raw) {
          loadedData = JSON.parse(raw);
          if (loadedData.profile) setProfile(loadedData.profile);
          if (loadedData.history) setHistory(loadedData.history);
          if (loadedData.savedProducts) setSavedProducts(loadedData.savedProducts);
          if (loadedData.settings) setSettings(loadedData.settings);
        }

        if (storedToken) {
          try {
            const dbUser = await fetchCurrentUserApi(storedToken);
            setUser({
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.display_name || dbUser.name || 'User',
              role: dbUser.role,
            });
            setToken(storedToken);
            setLoggedIn(true);
          } catch (err) {
            await AsyncStorage.removeItem('safelabel_token');
            setLoggedIn(false);
          }
        } else if (loadedData.loggedIn && loadedData.user) {
          setUser(loadedData.user);
          setLoggedIn(true);
        }
      } catch (err) {
        // Fallback
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistData = (next) =>
    AsyncStorage.setItem(
      'safelabel_data',
      JSON.stringify({ loggedIn, user, profile, history, savedProducts, settings, ...next })
    ).catch(() => {});

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
    persistData({ loggedIn: true, user: nextUser });
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
    setLoggedIn(true);
    persistData({ loggedIn: true, user: nextUser });
    return nextUser;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('safelabel_token');
    setToken(null);
    setLoggedIn(false);
    persistData({ loggedIn: false });
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

  const value = {
    ready,
    loggedIn,
    token,
    user,
    profile,
    history,
    savedProducts,
    settings,
    login,
    register,
    logout,
    toggleAllergen,
    addScan,
    clearHistory,
    saveProduct,
    removeSavedProduct,
    updateSettings,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
