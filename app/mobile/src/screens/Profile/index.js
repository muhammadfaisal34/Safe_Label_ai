import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveUserDisplayName, useApp } from '../../store';
import { AllergenPicker, Btn, Disclaimer, s } from '../../components';
import { C, R } from '../../utils/theme';

export default function Profile() {
  const {
    profile,
    toggleAllergen,
    user,
    settings,
    updateSettings,
    updateUserName,
    logout,
  } = useApp();

  const displayName = resolveUserDisplayName(user?.name, user?.email);
  const userInitial = displayName.charAt(0).toUpperCase() || 'U';

  const [editModal, setEditModal] = useState(false);
  const [tempName, setTempName] = useState(displayName !== 'User' ? displayName : '');

  const saveName = () => {
    if (tempName.trim()) {
      updateUserName(tempName.trim());
    }
    setEditModal(false);
  };

  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[s.pad, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Header */}
        <View style={[s.row, { marginBottom: 20, alignItems: 'center' }]}>
          <Pressable
            onPress={() => {
              setTempName(displayName !== 'User' ? displayName : '');
              setEditModal(true);
            }}
            style={[
              s.avatar,
              {
                width: 62,
                height: 62,
                borderRadius: 31,
                marginRight: 14,
                backgroundColor: C.accent,
              },
            ]}
          >
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF' }}>
              {userInitial}
            </Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[s.h1, { fontSize: 22, flex: 1, marginRight: 8 }]} numberOfLines={1}>
                {displayName}
              </Text>
              <Pressable
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => {
                  setTempName(displayName !== 'User' ? displayName : '');
                  setEditModal(true);
                }}
                style={{
                  backgroundColor: '#E0F2FE',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: C.accent, fontWeight: '700', fontSize: 12 }}>Edit</Text>
              </Pressable>
            </View>
            <Text style={[s.p, { fontSize: 13, marginTop: 2 }]} numberOfLines={1}>
              {user?.email || 'user@safelabel.ai'}
            </Text>
          </View>
        </View>

        {/* My Allergies Section */}
        <View style={s.card}>
          <Text style={[s.h2, { marginTop: 0, marginBottom: 4 }]}>My allergies</Text>
          <Text style={[s.p, { fontSize: 13, marginBottom: 14 }]}>
            Selected allergens are highlighted in every scan result.
          </Text>
          <AllergenPicker profile={profile} onToggle={toggleAllergen} />
        </View>

        {/* Settings Header */}
        <Text style={s.h2}>Settings</Text>

        {/* Settings Card */}
        <View style={s.card}>
          {/* Notifications Row */}
          <View style={s.settingRow}>
            <View style={s.settingTextCol}>
              <Text style={s.settingTitle}>Notifications</Text>
              <Text style={s.settingCopy}>Scan reminders and safety alerts</Text>
            </View>
            <Switch
              value={!!settings?.notifications}
              onValueChange={(value) => updateSettings({ notifications: value })}
              trackColor={{ false: '#E2E8F0', true: C.accent }}
              thumbColor={Platform.OS === 'android' ? (settings?.notifications ? '#FFFFFF' : '#F8FAFC') : undefined}
            />
          </View>

          {/* Dark Mode Row */}
          <View style={s.settingRow}>
            <View style={s.settingTextCol}>
              <Text style={s.settingTitle}>Dark mode</Text>
              <Text style={s.settingCopy}>Use a darker app appearance</Text>
            </View>
            <Switch
              value={!!settings?.darkMode}
              onValueChange={(value) => updateSettings({ darkMode: value })}
              trackColor={{ false: '#E2E8F0', true: C.accent }}
              thumbColor={Platform.OS === 'android' ? (settings?.darkMode ? '#FFFFFF' : '#F8FAFC') : undefined}
            />
          </View>

          {/* Privacy & Security Row */}
          <Pressable style={[s.settingRow, { borderBottomWidth: 0 }]}>
            <View style={s.settingTextCol}>
              <Text style={s.settingTitle}>Privacy & security</Text>
              <Text style={s.settingCopy}>Manage your SafeLabel data</Text>
            </View>
            <Text style={{ color: C.mute, fontSize: 20, paddingRight: 4 }}>›</Text>
          </Pressable>
        </View>

        {/* Log Out Button */}
        <Btn
          title="Log out"
          kind="ghost"
          style={{ marginTop: 14, marginBottom: 12 }}
          onPress={logout}
        />

        <Disclaimer />
      </ScrollView>

      {/* Edit Display Name Modal */}
      <Modal visible={editModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: R.lg,
              padding: 22,
              width: '100%',
              maxWidth: 340,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            <Text style={[s.h2, { marginTop: 0, marginBottom: 6 }]}>Edit Display Name</Text>
            <Text style={[s.p, { fontSize: 13, marginBottom: 14 }]}>
              Enter your real name to display on your profile and dashboard.
            </Text>
            <TextInput
              value={tempName}
              onChangeText={setTempName}
              placeholder="e.g. Faisal Sajid"
              placeholderTextColor={C.mute}
              autoFocus
              style={[s.input, { marginTop: 0, marginBottom: 16 }]}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setEditModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: R.sm,
                  borderWidth: 1.5,
                  borderColor: C.line,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: C.ink, fontWeight: '700', fontSize: 14 }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveName}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: R.sm,
                  backgroundColor: C.accent,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
