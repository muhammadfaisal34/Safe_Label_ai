import React from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../store";
import { C } from "../../utils/theme";
import { Verdict, s } from "../../components";

export default function History({ navigation }) {
  const { history, clearHistory } = useApp();
  return (
    <SafeAreaView style={s.screen}>
      <FlatList
        contentContainerStyle={s.pad}
        data={history}
        keyExtractor={(h) => h.id}
        ListHeaderComponent={
          <View
            style={[
              s.row,
              { justifyContent: "space-between", marginBottom: 12 },
            ]}
          >
            <Text style={s.h1}>History</Text>
            {history.length > 0 && (
              <Pressable
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
                <Text style={{ color: C.bad, fontWeight: "700" }}>Clear</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text style={s.p}>
            No scans yet. Scan a product and it will be saved here.
          </Text>
        }
        renderItem={({ item: h }) => {
          const v = Verdict[h.verdict];
          return (
            <Pressable
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
                <Text style={{ color: C.mute, fontSize: 12 }}>
                  {new Date(h.date).toLocaleDateString()}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
