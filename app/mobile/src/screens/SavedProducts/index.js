import React from 'react';
import { Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../store';
import { C } from '../../utils/theme';
import { s } from '../../components';

export default function SavedProducts() {
  const { savedProducts, removeSavedProduct } = useApp();
  return <SafeAreaView style={s.screen}><FlatList contentContainerStyle={s.pad} data={savedProducts} keyExtractor={(item, index) => `${item.name}-${index}`}
    ListHeaderComponent={<View><Text style={s.h1}>Saved products</Text><Text style={[s.p, { marginTop: 5, marginBottom: 18 }]}>Your trusted products, ready to check again.</Text></View>}
    ListEmptyComponent={<View style={s.emptyCard}><Text style={{ fontSize: 40 }}>🔖</Text><Text style={s.h2}>No saved products yet</Text><Text style={s.p}>Save a safe product from its result screen and it will appear here.</Text></View>}
    renderItem={({ item }) => <View style={[s.card, s.row, { padding: 12 }]}>{item.image ? <Image source={{ uri: item.image }} style={s.productThumb} /> : <View style={s.productThumbPlaceholder}><Text style={{ fontSize: 24 }}>🏷️</Text></View>}<View style={{ flex: 1, marginLeft: 12 }}><Text style={{ fontWeight: '800', color: C.ink }}>{item.name}</Text><Text style={s.p}>{item.brand || 'Saved product'}</Text></View><Pressable onPress={() => Alert.alert('Remove saved product?', item.name, [{ text: 'Cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removeSavedProduct(item.name) }])}><Text style={{ color: C.bad, fontWeight: '700' }}>×</Text></Pressable></View>} />
  </SafeAreaView>;
}
