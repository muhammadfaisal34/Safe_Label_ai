import React from "react";
import { Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../store";
import { C } from "../../utils/theme";
import { Verdict, s } from "../../components";

export default function SavedProducts({ navigation }) {
  const { savedProducts, removeSavedProduct, clearSavedProducts } = useApp();

  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <FlatList
        contentContainerStyle={[s.pad, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
        data={savedProducts}
        keyExtractor={(item, index) => item.id || `${item.name}-${index}`}
        ListHeaderComponent={
          <View
            style={[
              s.row,
              { justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
            ]}
          >
            <Text style={s.h1}>Saved Products</Text>
            {savedProducts.length > 0 && (
              <Pressable
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() =>
                  Alert.alert(
                    "Clear saved products?",
                    "This removes all saved products.",
                    [
                      { text: "Cancel" },
                      {
                        text: "Clear",
                        style: "destructive",
                        onPress: clearSavedProducts,
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
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔖</Text>
            <Text style={s.h2}>No saved products yet</Text>
            <Text style={[s.p, { textAlign: "center" }]}>
              Save products from your scan results and they will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const v = Verdict[item?.verdict] || Verdict.safe || Verdict.none;
          const formattedDate = item?.date
            ? new Date(item.date).toLocaleDateString()
            : "";

          const handleOpen = () => {
            const resultPayload = item.result || {
              id: item.scan_id || item.id || String(Date.now()),
              date: item.date || Date.now(),
              product: item.product || {
                name: item.name || "Saved product",
                brand: item.brand || "",
                image: item.image,
                barcode: item.barcode,
                text: item.ingredients_text || (Array.isArray(item.ingredients) ? item.ingredients.join(", ") : item.text || ""),
                lang: item.lang || "en",
                source: item.source || "saved",
              },
              ingredients: item.ingredients || [],
              ingredients_text: item.ingredients_text || item.text || "",
              findings: item.findings || [],
              verdict: item.verdict || "safe",
            };
            navigation.navigate("Result", { result: resultPayload });
          };

          const productName = item.product?.name || item.name || "Saved product";

          return (
            <Pressable
              style={s.card}
              onPress={handleOpen}
            >
              <View style={[s.row, { justifyContent: "space-between", alignItems: "center" }]}>
                <View style={[s.row, { flex: 1, paddingRight: 10, alignItems: "center" }]}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={[s.productThumb, { width: 44, height: 44, marginRight: 10 }]} />
                  ) : (
                    <Text style={{ fontSize: 22, marginRight: 10 }}>{v.icon}</Text>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontWeight: "700", color: C.ink, fontSize: 15 }}
                      numberOfLines={1}
                    >
                      {productName}
                    </Text>
                    <Text style={{ color: v.fg, fontSize: 13, marginTop: 2 }}>
                      {v.title}
                    </Text>
                  </View>
                </View>
                <View style={[s.row, { alignItems: "center" }]}>
                  {formattedDate ? (
                    <Text style={{ color: C.mute, fontSize: 12, marginRight: 10 }}>
                      {formattedDate}
                    </Text>
                  ) : null}
                  <Pressable
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() =>
                      Alert.alert("Remove saved product?", productName, [
                        { text: "Cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: () => removeSavedProduct(productName),
                        },
                      ])
                    }
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: "#FEE2E2",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: C.bad, fontWeight: "800", fontSize: 15, lineHeight: 17 }}>×</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
