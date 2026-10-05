import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
	const [ready, setReady] = useState(false);
	const [loggedIn, setLoggedIn] = useState(false);
	const [user, setUser] = useState({ name: 'Faisal Ahmed', email: 'faisal@example.com' });
	const [profile, setProfile] = useState([]);
	const [history, setHistory] = useState([]);
	const [savedProducts, setSavedProducts] = useState([]);
	const [settings, setSettings] = useState({ notifications: true, darkMode: false });
	useEffect(() => { (async () => {
		try { const raw = await AsyncStorage.getItem('safelabel'); if (raw) { const d = JSON.parse(raw); setLoggedIn(Boolean(d.loggedIn)); setUser(d.user || user); setProfile(d.profile || []); setHistory(d.history || []); setSavedProducts(d.savedProducts || []); setSettings(d.settings || settings); } } catch {}
		setReady(true);
	})(); }, []);
	const persist = (next) => AsyncStorage.setItem('safelabel', JSON.stringify({ loggedIn, user, profile, history, savedProducts, settings, ...next })).catch(() => {});
	const value = { ready, loggedIn, user, profile, history, savedProducts, settings,
		login: (email, name = 'Faisal Ahmed') => { const nextUser = { name, email }; setUser(nextUser); setLoggedIn(true); persist({ loggedIn: true, user: nextUser }); },
		register: (name, email) => { const nextUser = { name, email }; setUser(nextUser); setLoggedIn(true); persist({ loggedIn: true, user: nextUser }); },
		logout: () => { setLoggedIn(false); persist({ loggedIn: false }); },
		toggleAllergen: (id) => { const n = profile.includes(id) ? profile.filter((x) => x !== id) : [...profile, id]; setProfile(n); persist({ profile: n }); },
		addScan: (r) => { const n = [r, ...history].slice(0, 50); setHistory(n); persist({ history: n }); },
		clearHistory: () => { setHistory([]); persist({ history: [] }); },
		saveProduct: (product) => { const n = savedProducts.some((item) => item.name === product.name) ? savedProducts : [product, ...savedProducts]; setSavedProducts(n); persist({ savedProducts: n }); },
		removeSavedProduct: (name) => { const n = savedProducts.filter((item) => item.name !== name); setSavedProducts(n); persist({ savedProducts: n }); },
		updateSettings: (next) => { const n = { ...settings, ...next }; setSettings(n); persist({ settings: n }); } };
	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
