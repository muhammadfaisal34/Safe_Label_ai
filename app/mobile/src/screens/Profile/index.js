import React from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../store';
import { AllergenPicker, Btn, Disclaimer, s } from '../../components';
import { C } from '../../utils/theme';

export default function Profile() {
	const { profile, toggleAllergen, user, settings, updateSettings, logout } = useApp();
	return <SafeAreaView style={s.screen}><ScrollView contentContainerStyle={s.pad}><View style={[s.row, { marginBottom: 18 }]}><View style={[s.avatar, { width: 62, height: 62, borderRadius: 31, marginRight: 14 }]}><Text style={{ fontSize: 24, fontWeight: '800', color: C.ink }}>{user.name[0]}</Text></View><View><Text style={s.h1}>{user.name}</Text><Text style={s.p}>{user.email}</Text></View></View>
		<View style={s.card}><Text style={s.h2}>My allergies</Text><Text style={[s.p, { marginBottom: 12 }]}>Selected allergens are highlighted in every scan result.</Text><AllergenPicker profile={profile} onToggle={toggleAllergen} /></View>
		<Text style={s.h2}>Settings</Text><View style={s.card}><View style={s.settingRow}><View><Text style={s.settingTitle}>Notifications</Text><Text style={s.settingCopy}>Scan reminders and safety alerts</Text></View><Switch value={settings.notifications} onValueChange={(value) => updateSettings({ notifications: value })} trackColor={{ false: C.line, true: C.accent }} /></View><View style={s.settingRow}><View><Text style={s.settingTitle}>Dark mode</Text><Text style={s.settingCopy}>Use a darker app appearance</Text></View><Switch value={settings.darkMode} onValueChange={(value) => updateSettings({ darkMode: value })} trackColor={{ false: C.line, true: C.accent }} /></View><Pressable style={s.settingRow}><View><Text style={s.settingTitle}>Privacy & security</Text><Text style={s.settingCopy}>Manage your SafeLabel data</Text></View><Text style={{ color: C.mute, fontSize: 22 }}>›</Text></Pressable></View>
		<Btn title="Log out" kind="ghost" onPress={logout} /><Disclaimer /></ScrollView></SafeAreaView>;
}
