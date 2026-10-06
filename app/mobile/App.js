import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store';
import { C } from './src/utils/theme';
import Login from './src/screens/Login';
import Home from './src/screens/Home';
import Scan from './src/screens/Scanner';
import Result from './src/screens/Results';
import History from './src/screens/History';
import Profile from './src/screens/Profile';
import SavedProducts from './src/screens/SavedProducts';
import { ScannerGlyph } from './src/components';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const icon = (e) => ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{e}</Text>;

function ScanTab({ navigation }) {
	return <View style={{ flex: 1, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' }}><Pressable onPress={() => navigation.getParent()?.navigate('Scan')} style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOpacity: 0.35, shadowRadius: 14 }}><ScannerGlyph active size={38} /></Pressable><Text style={{ color: C.ink, fontWeight: '800', marginTop: 12 }}>Scan label</Text></View>;
}

function Tabs() {
	return <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: C.ink }}>
		<Tab.Screen name="Home" component={Home} options={{ tabBarIcon: icon('🏠') }} />
		<Tab.Screen name="History" component={History} options={{ tabBarIcon: icon('🕘') }} />
		<Tab.Screen name="ScanTab" component={ScanTab} options={{ title: 'Scan', tabBarIcon: ({ focused }) => <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: focused ? C.navy : C.accent, alignItems: 'center', justifyContent: 'center', marginTop: -18, borderWidth: 4, borderColor: C.paper }}><ScannerGlyph active size={24} /></View> }} />
		<Tab.Screen name="Saved" component={SavedProducts} options={{ title: 'Products', tabBarIcon: icon('🔖') }} />
		<Tab.Screen name="Profile" component={Profile} options={{ title: 'My allergies', tabBarIcon: icon('🛡️') }} />
	</Tab.Navigator>;
}

function Root() {
	const { ready, loggedIn } = useApp();
	const [splash, setSplash] = useState(true);
	useEffect(() => { const timer = setTimeout(() => setSplash(false), 900); return () => clearTimeout(timer); }, []);
	if (!ready) return null;
	if (splash) return <View style={{ flex: 1, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 86, height: 86, borderRadius: 43, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 42 }}>✓</Text></View><Text style={{ color: C.ink, fontSize: 30, fontWeight: '900', marginTop: 18 }}>SafeLabel AI</Text><Text style={{ color: C.mute, marginTop: 5 }}>Scan. Detect. Stay safe.</Text></View>;
	if (!loggedIn) return <Login />;
	return <NavigationContainer><Stack.Navigator screenOptions={{ headerTintColor: C.ink }}>
		<Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
		<Stack.Screen name="Scan" component={Scan} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
		<Stack.Screen name="Result" component={Result} options={{ headerShown: false }} />
	</Stack.Navigator></NavigationContainer>;
}

export default function App() {
	return <SafeAreaProvider><AppProvider><StatusBar style="dark" /><Root /></AppProvider></SafeAreaProvider>;
}
