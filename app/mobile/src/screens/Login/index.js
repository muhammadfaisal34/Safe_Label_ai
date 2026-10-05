import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../store';
import { resend2FAApi } from '../../services/api';
import { Btn, s } from '../../components';
import { C } from '../../utils/theme';

export default function Login() {
  const { login, register, verify2FA } = useApp();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | '2fa'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setInfoMessage('');

    if (mode === '2fa') {
      if (!twoFactorCode.trim() || twoFactorCode.trim().length < 6) {
        setError('Please enter the full 6-digit verification code.');
        return;
      }
      setLoading(true);
      try {
        await verify2FA(twoFactorEmail, twoFactorCode.trim());
      } catch (err) {
        setError(err.message || 'Verification failed. Please check the 6-digit code and try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (mode === 'register' && !trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    if (!trimmedEmail || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    // Email validation
    const ALLOWED_EMAIL_DOMAINS = [
      '@gmail.com',
      '@yahoo.com',
      '@outlook.com',
      '@hotmail.com',
      '@icloud.com',
      '@live.com',
      '@proton.me',
      '@protonmail.com',
    ];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const lowerEmail = trimmedEmail.toLowerCase();
    const hasValidDomain = ALLOWED_EMAIL_DOMAINS.some((d) => lowerEmail.endsWith(d));

    if (!emailRegex.test(trimmedEmail) || !hasValidDomain) {
      setError('Please enter a valid email address ending with a recognized domain (e.g., @gmail.com or @yahoo.com).');
      return;
    }

    // Password validation for signup
    if (mode === 'register') {
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (!hasLetter || !hasNumber || !hasSpecial) {
        setError('Password must include at least one letter, one number, and one special character (e.g. @, #, $, !).');
        return;
      }
    }

    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await login(trimmedEmail, password);
      } else {
        res = await register(trimmedName, trimmedEmail, password);
      }

      if (res && res.two_factor_required) {
        setTwoFactorEmail(res.email || trimmedEmail);
        setMode('2fa');
        setInfoMessage(res.message || `We sent a 6-digit 2FA code to ${res.email || trimmedEmail}`);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const res = await resend2FAApi(twoFactorEmail);
      setInfoMessage(res.message || 'A new 2FA verification code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
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
            {mode === '2fa'
              ? 'Verify your email ✉️'
              : mode === 'login'
              ? 'Welcome back'
              : 'Create your account'}
          </Text>
          <Text style={s.p}>
            {mode === '2fa'
              ? `Enter the 6-digit verification code sent to ${twoFactorEmail}`
              : mode === 'login'
              ? 'Log in to continue your safer food journey.'
              : 'Save products and keep your scan history in one place.'}
          </Text>

          {infoMessage ? (
            <View style={{ backgroundColor: '#E0F2FE', padding: 12, borderRadius: 8, marginVertical: 8 }}>
              <Text style={{ color: '#0369A1', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                {infoMessage}
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginVertical: 8 }}>
              <Text style={{ color: C.bad, fontSize: 13, fontWeight: '600' }}>{error}</Text>
            </View>
          ) : null}

          {mode === '2fa' ? (
            <View style={{ marginVertical: 8 }}>
              <TextInput
                value={twoFactorCode}
                onChangeText={setTwoFactorCode}
                placeholder="Enter 6-digit code"
                placeholderTextColor={C.mute}
                keyboardType="number-pad"
                maxLength={6}
                style={[
                  s.input,
                  {
                    fontSize: 24,
                    letterSpacing: 8,
                    textAlign: 'center',
                    fontWeight: '700',
                    color: C.accent,
                    marginVertical: 14,
                  },
                ]}
              />

              <Btn
                title={loading ? 'Verifying code...' : 'Verify & Continue'}
                onPress={submit}
                disabled={loading}
              />

              <Pressable onPress={handleResendCode} disabled={loading} style={{ marginTop: 14 }}>
                <Text style={[s.switchText, { textDecorationLine: 'underline' }]}>
                  Didn't receive code? Resend email
                </Text>
              </Pressable>

              <Text style={s.switchText}>
                <Text
                  style={s.link}
                  onPress={() => {
                    setError('');
                    setInfoMessage('');
                    setMode('login');
                  }}
                >
                  ← Back to Log in
                </Text>
              </Text>
            </View>
          ) : (
            <>
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
                    setInfoMessage('');
                    setMode(mode === 'login' ? 'register' : 'login');
                  }}
                >
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </Text>
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
