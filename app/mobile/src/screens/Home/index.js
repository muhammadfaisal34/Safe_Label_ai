import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../store";
import { ALLERGENS } from "../../utils/data";
import { C, R } from "../../utils/theme";
import { Btn, Disclaimer, OnboardingModal, Verdict, s } from "../../components";

const STEPS = [
  "Scan a barcode or photograph the label",
  "Text is read and translated",
  "Ingredients are matched to allergens",
  "You see the ingredient, allergen and reason",
];
export default function Home({ navigation }) {
  const {
    profile,
    history,
    user,
    savedProducts,
    toggleAllergen,
    showOnboardingAllergies,
    dismissOnboardingAllergies,
  } = useApp();

  return (
    <SafeAreaView style={s.screen}>
      <OnboardingModal
        visible={showOnboardingAllergies}
        profile={profile}
        onToggle={toggleAllergen}
        onSave={dismissOnboardingAllergies}
      />
      <ScrollView contentContainerStyle={s.pad}>
        <View
          style={[
            s.row,
            {
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            },
          ]}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={s.p}>
              Hello, {user.name ? user.name.split(" ")[0] : "User"}!
            </Text>
            <Text style={s.h1}>Stay safe, eat better.</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("Profile")}
            style={({ pressed }) => [
              s.avatar,
              pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open settings and profile"
          >
            <Text style={{ fontWeight: "800", color: "#fff", fontSize: 20 }}>
              {user.name ? user.name[0].toUpperCase() : "U"}
            </Text>
            <View
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                backgroundColor: C.ink,
                borderRadius: 10,
                width: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: "#fff",
              }}
            >
              <Text style={{ fontSize: 10, color: "#fff", fontWeight: "bold" }}>
                ⚙
              </Text>
            </View>
          </Pressable>
        </View>
        <Pressable
          onPress={() => navigation.navigate("Scan")}
          style={s.scanHero}
        >
          <View style={s.scanIcon}>
            <Text style={{ fontSize: 26 }}>⌗</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.scanTitle}>Scan a food label</Text>
            <Text style={s.scanCopy}>
              Check for allergens, ingredients and more.
            </Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 24 }}>›</Text>
        </Pressable>
        <View style={s.quickGrid}>
          <Pressable
            style={s.quickCard}
            onPress={() => navigation.navigate("History")}
          >
            <Text style={s.quickIcon}>◷</Text>
            <Text style={s.quickTitle}>Scan history</Text>
            <Text style={s.quickCopy}>View past scans</Text>
          </Pressable>
          <Pressable
            style={s.quickCard}
            onPress={() => navigation.navigate("Saved")}
          >
            <Text style={s.quickIcon}>▱</Text>
            <Text style={s.quickTitle}>Saved products</Text>
            <Text style={s.quickCopy}>Your trusted foods</Text>
          </Pressable>
          <Pressable
            style={s.quickCard}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={s.quickIcon}>⚙</Text>
            <Text style={s.quickTitle}>Settings</Text>
            <Text style={s.quickCopy}>App preferences</Text>
          </Pressable>
          <Pressable style={s.quickCard}>
            <Text style={s.quickIcon}>?</Text>
            <Text style={s.quickTitle}>Help & support</Text>
            <Text style={s.quickCopy}>Get assistance</Text>
          </Pressable>
        </View>
        <Text style={s.h2}>Checking for</Text>
        {profile.length ? (
          <View style={s.wrap}>
            {profile.map((id) => {
              const a = ALLERGENS.find((x) => x.id === id);
              return (
                <View
                  key={id}
                  style={[
                    s.chip,
                    { backgroundColor: C.badBg, borderColor: C.badBg },
                  ]}
                >
                  <Text>{a.icon}</Text>
                  <Text style={[s.chipT, { color: C.bad }]}>{a.label}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.p}>No allergens selected yet.</Text>
            <Btn
              title="Choose allergens"
              kind="ghost"
              style={{ marginTop: 10 }}
              onPress={() => navigation.navigate("Profile")}
            />
          </View>
        )}
        <Text style={s.h2}>Recent scans</Text>
        {history.length === 0 && (
          <View style={s.card}>
            <Text style={s.p}>Your scans will appear here.</Text>
          </View>
        )}
        {history.slice(0, 3).map((h) => {
          const v = Verdict[h.verdict];
          return (
            <Pressable
              key={h.id}
              style={s.card}
              onPress={() => navigation.navigate("Result", { result: h })}
            >
              <View style={s.row}>
                <Text style={{ fontSize: 22, marginRight: 10 }}>{v.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: C.ink }}>
                    {h.product.name}
                  </Text>
                  <Text style={{ color: v.fg }}>{v.title}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
        <Text style={s.p}>
          {savedProducts.length} saved product
          {savedProducts.length === 1 ? "" : "s"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
