import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../store';
import { Btn, s } from '../../components';
import { C } from '../../utils/theme';

export default function Login() {
  const { login, register } = useApp();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <View style={s.loginBrand}>
          <View style={s.logoMark}>
            <Text style={{ fontSize: 28 }}>✓</Text>
          </View>
          <Text style={s.h1}>SafeLabel AI</Text>
          <Text style={s.p}>Scan. Detect. Stay safe.</Text>
        </View>

        <View style={s.authCard}>
          <Text style={s.h2}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text style={s.p}>
            {mode === 'login'
              ? 'Log in to continue your safer food journey.'
              : 'Save products and keep your scan history in one place.'}
          </Text>

          {error ? (
            <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginVertical: 8 }}>
              <Text style={{ color: C.bad, fontSize: 13, fontWeight: '600' }}>{error}</Text>
            </View>
          ) : null}

          {mode === 'register' && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={C.mute}
              style={s.input}
            />
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={C.mute}
            autoCapitalize="none"
            keyboardType="email-address"
            style={s.input}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password (min 8 characters)"
            placeholderTextColor={C.mute}
            secureTextEntry
            style={s.input}
          />

          <Btn
            title={loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
            onPress={submit}
            disabled={loading}
          />

          <Text style={s.switchText}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <Text
              style={s.link}
              onPress={() => {
                setError('');
                setMode(mode === 'login' ? 'register' : 'login');
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
