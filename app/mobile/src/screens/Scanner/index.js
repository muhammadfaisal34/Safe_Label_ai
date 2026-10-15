import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../store";
import { analyze, lookupBarcode, ocrImage } from "../../services/api";
import { C } from "../../utils/theme";
import { Btn, s } from "../../components";

const STAGES = [
  "Reading label",
  "Detecting language",
  "Identifying ingredients",
  "Matching allergens",
];

export default function Scanner({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [perm, ask] = useCameraPermissions();
  const [mode, setMode] = useState("barcode");
  const [busy, setBusy] = useState(null);
  const cam = useRef(null);
  const locked = useRef(false);
  const { profile, user, token, addScan } = useApp();

  // Stable top offset matching picture on iOS and preventing upward drift on Android
  const topOffset = Platform.select({
    ios: Math.max(insets.top, 44) + 10,
    android: Math.max(insets.top, StatusBar.currentHeight || 0, 24) + 12,
    default: 20,
  });

  // Animated values for scanner loading ring & pulse
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (busy !== null) {
      // Loop spin animation
      spinValue.setValue(0);
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinAnimation.start();

      // Loop pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseAnimation.start();

      return () => {
        spinAnimation.stop();
        pulseAnimation.stop();
      };
    }
  }, [busy]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const finish = async (product) => {
    for (let i = 1; i < STAGES.length; i++) {
      setBusy(i);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    const result = await analyze(product, profile, token, user);
    addScan(result);
    setBusy(null);
    navigation.replace("Result", { result });
  };

  const run = async (fn) => {
    try {
      setBusy(0);
      const product = await fn();
      if (!product) {
        setBusy(null);
        locked.current = false;
        setMode("label");
        return Alert.alert(
          "Product not found",
          "No ingredients found for this barcode. Photograph the ingredient label instead.",
        );
      }
      await finish(product);
    } catch (err) {
      setBusy(null);
      locked.current = false;
      Alert.alert(
        "Something went wrong",
        "Check your connection and try again.",
      );
    }
  };

  const onBarcode = ({ data }) => {
    if (!locked.current) {
      locked.current = true;
      run(() => lookupBarcode(data));
    }
  };

  const snap = async () => {
    const photo = await cam.current?.takePictureAsync({ quality: 0.7 });
    if (photo) run(() => ocrImage(photo.uri));
  };

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled) run(() => ocrImage(result.assets[0].uri));
  };

  if (!perm) return <View style={s.screen} />;

  if (!perm.granted)
    return (
      <SafeAreaView style={[s.screen, s.pad, { justifyContent: "center" }]}>
        <Text style={s.h1}>Camera access needed</Text>
        <Text style={[s.p, { marginVertical: 12 }]}>
          SafeLabel AI uses the camera to read barcodes and ingredient labels.
          Photos are only used for the scan.
        </Text>
        <Btn title="Allow camera" onPress={ask} />
        <Btn
          title="Pick a photo instead"
          kind="ghost"
          style={{ marginTop: 10 }}
          onPress={pick}
        />
      </SafeAreaView>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        ref={cam}
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={
          mode === "barcode" && busy === null ? onBarcode : undefined
        }
      />

      {/* TOP SWITCHER (BARCODE SCAN VS INGREDIENT LABEL) - ALIGNED EXACTLY AS SHOWN IN PICTURE */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: topOffset,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            width: Math.min(width - 40, 420),
            backgroundColor: "rgba(15, 23, 42, 0.82)",
            borderRadius: 99,
            padding: 5,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.18)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          {["barcode", "label"].map((value) => {
            const active = mode === value;
            return (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  paddingHorizontal: 14,
                  borderRadius: 99,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? C.accent : "transparent",
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontWeight: "700",
                    fontSize: 14,
                    color: active ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)",
                  }}
                >
                  {value === "barcode" ? "Barcode" : "Ingredient label"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Scanning Reticle Frame */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: "32%",
          alignSelf: "center",
          width: Math.min(width - 48, mode === "barcode" ? 280 : 310),
          height: mode === "barcode" ? 140 : 230,
          borderWidth: 3,
          borderColor: C.accent,
          borderRadius: 20,
          backgroundColor: "rgba(2, 132, 199, 0.05)",
          zIndex: 5,
        }}
      />

      {/* Bottom Action Controls */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: "center",
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 16) + 10,
          zIndex: 10,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            marginBottom: 16,
            fontWeight: "600",
            fontSize: 13,
            textAlign: "center",
            textShadowColor: "rgba(0,0,0,0.6)",
            textShadowRadius: 4,
          }}
        >
          {mode === "barcode"
            ? "Point at the barcode — it scans automatically"
            : "Fill the frame with the ingredient list"}
        </Text>
        {mode === "label" && (
          <View style={[s.row, { gap: 28, alignItems: "center" }]}>
            <Pressable onPress={pick} style={{ padding: 10 }}>
              <Text
                style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}
              >
                Gallery
              </Text>
            </Pressable>
            <Pressable
              onPress={snap}
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                borderWidth: 5,
                borderColor: "#FFFFFF",
                backgroundColor: C.accent,
                shadowColor: C.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 8,
              }}
            />
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ padding: 10 }}
            >
              <Text
                style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}
              >
                Close
              </Text>
            </Pressable>
          </View>
        )}
        {mode === "barcode" && (
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ padding: 10 }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
              Close
            </Text>
          </Pressable>
        )}
      </View>

      {/* HIGH-FIDELITY PROCESSING / ANALYSIS LOADING SCREEN (MATCHING GIVEN HTML DESIGN) */}
      {busy !== null && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#FFFFFF",
            zIndex: 100,
          }}
        >
          <SafeAreaView
            style={{
              flex: 1,
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 24,
              paddingVertical: 20,
            }}
          >
            {/* Spacer top */}
            <View style={{ height: 20 }} />

            {/* Main Scanner Graphic & Typography */}
            <View style={{ alignItems: "center", width: "100%" }}>
              {/* Scanner Graphic Container */}
              <View
                style={{
                  width: 220,
                  height: 220,
                  alignItems: "center",
                  justifyControl: "center",
                  justifyContent: "center",
                  marginBottom: 36,
                  position: "relative",
                }}
              >
                {/* Pulsing Backlight Glow */}
                <Animated.View
                  style={{
                    position: "absolute",
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    backgroundColor: "#E0F2FE",
                    opacity: 0.6,
                    transform: [{ scale: pulseValue }],
                  }}
                />

                {/* Outer Ring Circle Track */}
                <View
                  style={{
                    position: "absolute",
                    width: 196,
                    height: 196,
                    borderRadius: 98,
                    borderWidth: 6,
                    borderColor: "#E2E8F0",
                    borderStyle: "dashed",
                  }}
                />

                {/* Animated Rotating Gradient Scanner Segment */}
                <Animated.View
                  style={{
                    position: "absolute",
                    width: 196,
                    height: 196,
                    borderRadius: 98,
                    borderWidth: 6,
                    borderColor: "#0284C7",
                    borderTopColor: "#0070F3",
                    borderRightColor: "#38A4F8",
                    borderBottomColor: "transparent",
                    borderLeftColor: "transparent",
                    transform: [{ rotate: spin }],
                  }}
                />

                {/* Center AI Brain & Shield Icon Badge */}
                <View
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: 56,
                    backgroundColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderColor: "#BAE0FD",
                    shadowColor: "#0284C7",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.18,
                    shadowRadius: 18,
                    elevation: 10,
                  }}
                >
                  {/* Brain / Neural Shield Vector Representation */}
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: "#F0F7FF",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: "#0284C7",
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>🧠</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Status Typography */}
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color: "#0F1E36",
                  textAlign: "center",
                  letterSpacing: -0.4,
                }}
              >
                Analysing your product...
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#64748B",
                  textAlign: "center",
                  marginTop: 8,
                  paddingHorizontal: 16,
                  lineHeight: 20,
                }}
              >
                AI is checking for allergens, additives and harmful ingredients.
              </Text>

              {/* Dynamic Stages Progress List */}
              <View
                style={{
                  marginTop: 32,
                  width: "100%",
                  maxWidth: 300,
                  backgroundColor: "#F8FAFC",
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#F1F5F9",
                }}
              >
                {STAGES.map((text, i) => {
                  const isDone = i < busy;
                  const isCurrent = i === busy;
                  return (
                    <View
                      key={text}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginVertical: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: isDone
                            ? "#10B981"
                            : isCurrent
                              ? "#0284C7"
                              : "#E2E8F0",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}
                      >
                        {isDone ? (
                          <Text
                            style={{
                              color: "#FFF",
                              fontSize: 11,
                              fontWeight: "900",
                            }}
                          >
                            ✓
                          </Text>
                        ) : isCurrent ? (
                          <ActivityIndicator
                            color="#FFF"
                            size="small"
                            style={{ transform: [{ scale: 0.6 }] }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: "#94A3B8",
                            }}
                          />
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isCurrent || isDone ? "700" : "500",
                          color: isDone
                            ? "#0F1E36"
                            : isCurrent
                              ? "#0284C7"
                              : "#94A3B8",
                        }}
                      >
                        {text}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Bottom iOS Home bar spacer */}
            <View
              style={{
                width: 120,
                height: 4,
                backgroundColor: "rgba(15, 30, 54, 0.2)",
                borderRadius: 2,
              }}
            />
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}
