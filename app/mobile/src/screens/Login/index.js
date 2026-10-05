import React from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../store';
import { Btn, s } from '../../components';
import { C } from '../../utils/theme';

export default function Login() {
	const { login, register } = useApp();
	const [mode, setMode] = React.useState('login');
	const [name, setName] = React.useState('');
	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');
	const submit = () => mode === 'login' ? login(email || 'faisal@example.com') : register(name || 'Faisal Ahmed', email || 'faisal@example.com');
	return <SafeAreaView style={s.screen}><ScrollView contentContainerStyle={s.pad}>
		<View style={s.loginBrand}><View style={s.logoMark}><Text style={{ fontSize: 28 }}>✓</Text></View><Text style={s.h1}>SafeLabel AI</Text><Text style={s.p}>Scan. Detect. Stay safe.</Text></View>
		<View style={s.authCard}><Text style={s.h2}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text><Text style={s.p}>{mode === 'login' ? 'Log in to continue your safer food journey.' : 'Save products and keep your scan history in one place.'}</Text>
			{mode === 'register' && <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={C.mute} style={s.input} />}
			<TextInput value={email} onChangeText={setEmail} placeholder="Email or username" placeholderTextColor={C.mute} autoCapitalize="none" style={s.input} />
			<TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={C.mute} secureTextEntry style={s.input} />
			<Btn title={mode === 'login' ? 'Log in' : 'Create account'} onPress={submit} />
			<Text style={s.switchText}>{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <Text style={s.link} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Sign up' : 'Log in'}</Text></Text>
		</View>
	</ScrollView></SafeAreaView>;
}
