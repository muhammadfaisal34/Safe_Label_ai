import React from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../store";
import { C } from "../../utils/theme";
import { Verdict, s } from "../../components";

export default function History({ navigation }) {
  const { history, clearHistory } = useApp();

  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <FlatList
        contentContainerStyle={[s.pad, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
        data={history}
        keyExtractor={(h) => h.id || String(Math.random())}
        ListHeaderComponent={
          <View
            style={[
              s.row,
              { justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
            ]}
          >
            <Text style={s.h1}>History</Text>
            {history.length > 0 && (
              <Pressable
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() =>
                  Alert.alert(
                    "Clear history?",
                    "This removes all saved scans.",
                    [
                      { text: "Cancel" },
                      {
                        text: "Clear",
                        style: "destructive",
                        onPress: clearHistory,
                      },
                    ],
                  )
                }
              >
                <Text style={{ color: C.bad, fontWeight: "700", fontSize: 14 }}>Clear</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🕘</Text>
            <Text style={s.h2}>No scans yet</Text>
            <Text style={[s.p, { textAlign: "center" }]}>
              Scan a food label or barcode and your scan history will appear here.
            </Text>
          </View>
        }
        renderItem={({ item: h }) => {
          const v = Verdict[h?.verdict] || Verdict.safe || Verdict.none;
          const formattedDate = h?.date
            ? new Date(h.date).toLocaleDateString()
            : "";

          return (
            <Pressable
              style={s.card}
              onPress={() => navigation.navigate("Result", { result: h })}
            >
              <View style={[s.row, { justifyContent: "space-between", alignItems: "center" }]}>
                <View style={[s.row, { flex: 1, paddingRight: 10 }]}>
                  <Text style={{ fontSize: 22, marginRight: 10 }}>{v.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontWeight: "700", color: C.ink, fontSize: 15 }}
                      numberOfLines={1}
                    >
                      {h?.product?.name || "Scanned product"}
                    </Text>
                    <Text style={{ color: v.fg, fontSize: 13, marginTop: 2 }}>
                      {v.title}
                    </Text>
                  </View>
                </View>
                {formattedDate ? (
                  <Text style={{ color: C.mute, fontSize: 12 }}>
                    {formattedDate}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
