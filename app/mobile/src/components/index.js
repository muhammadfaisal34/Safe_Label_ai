import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { C, R } from "../utils/theme";
import { ALLERGENS } from "../utils/data";

export const Btn = ({ title, onPress, kind = "solid", style }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      s.btn,
      kind === "ghost" && s.ghost,
      pressed && { opacity: 0.8 },
      style,
    ]}
  >
    <Text style={[s.btnT, kind === "ghost" && { color: C.ink }]}>{title}</Text>
  </Pressable>
);

export const Verdict = {
  danger: { bg: C.badBg, fg: C.bad, icon: "!", title: "Allergens detected" },
  caution: {
    bg: C.warnBg,
    fg: C.warn,
    icon: "❗",
    title: "Possible trace match",
  },
  none: { bg: C.safeBg, fg: C.safe, icon: "✓", title: "Product is safe" },
};

export function AllergenPicker({ profile, onToggle }) {
  return (
    <View style={s.wrap}>
      {ALLERGENS.map((a) => {
        const on = profile.includes(a.id);
        return (
          <Pressable
            key={a.id}
            onPress={() => onToggle(a.id)}
            style={[
              s.chip,
              on && { backgroundColor: C.ink, borderColor: C.ink },
            ]}
          >
            <Text style={{ fontSize: 18 }}>{a.icon}</Text>
            <Text style={[s.chipT, on && { color: "#fff" }]}>{a.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const Disclaimer = () => (
  <Text style={s.disc}>
    SafeLabel AI flags potential allergen matches from label text. It is not a
    medical guarantee — always read the original packaging.
  </Text>
);

export function ScannerGlyph({ active = false, size = 24 }) {
  const color = active ? "#fff" : C.accent;
  const arm = {
    position: "absolute",
    width: size * 0.34,
    height: size * 0.34,
    borderColor: color,
  };
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={[
          arm,
          { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
        ]}
      />
      <View
        style={[
          arm,
          { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
        ]}
      />
      <View
        style={[
          arm,
          { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
        ]}
      />
      <View
        style={[
          arm,
          { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
        ]}
      />
      <View
        style={{
          width: size * 0.34,
          height: size * 0.34,
          borderWidth: 2,
          borderColor: color,
          borderRadius: size,
          backgroundColor: active ? "#fff" : "transparent",
        }}
      />
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  pad: { padding: 20, paddingBottom: 40 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.pale,
    alignItems: "center",
    justifyContent: "center",
  },
  scanHero: {
    backgroundColor: C.accent,
    borderRadius: R.lg,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  scanIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#5BA7F5",
    alignItems: "center",
    justifyContent: "center",
  },
  scanTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  scanCopy: { color: "#D9EEFF", marginTop: 4, fontSize: 12 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: {
    width: "48%",
    minHeight: 100,
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    padding: 13,
  },
  quickIcon: { color: C.accent, fontSize: 24, fontWeight: "800" },
  quickTitle: { color: C.ink, fontWeight: "800", marginTop: 5 },
  quickCopy: { color: C.mute, fontSize: 11, marginTop: 3 },
  loginBrand: { alignItems: "center", marginBottom: 22, marginTop: 28 },
  logoMark: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: C.accent,
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  authCard: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.line,
    padding: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    padding: 13,
    marginTop: 12,
    color: C.ink,
    backgroundColor: "#FBFDFF",
  },
  switchText: {
    textAlign: "center",
    color: C.mute,
    marginTop: 16,
    fontSize: 13,
  },
  link: { color: C.accent, fontWeight: "700" },
  h1: { fontSize: 30, fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
  h2: {
    fontSize: 18,
    fontWeight: "700",
    color: C.ink,
    marginTop: 24,
    marginBottom: 10,
  },
  p: { fontSize: 15, color: C.mute, lineHeight: 22 },
  card: {
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    padding: 14,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    padding: 28,
    alignItems: "center",
    marginTop: 20,
  },
  productThumb: { width: 58, height: 58, borderRadius: 10 },
  productThumbPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: C.safeBg,
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    backgroundColor: C.ink,
    paddingVertical: 15,
    borderRadius: R.md,
    alignItems: "center",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: C.ink,
  },
  btnT: { color: "#fff", fontWeight: "700", fontSize: 16 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: "#fff",
  },
  chipT: { fontWeight: "600", color: C.ink },
  disc: { fontSize: 12, color: C.mute, lineHeight: 18, marginTop: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  settingRow: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingTitle: { color: C.ink, fontWeight: "700" },
  settingCopy: { color: C.mute, fontSize: 12, marginTop: 3 },
});
