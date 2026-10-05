import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../store';
import { analyze, lookupBarcode, ocrImage } from '../../services/api';
import { C } from '../../utils/theme';
import { Btn, s } from '../../components';

const STAGES = ['Reading label', 'Detecting language', 'Identifying ingredients', 'Matching allergens'];
export default function Scanner({ navigation }) {
	const [perm, ask] = useCameraPermissions(); const [mode, setMode] = useState('barcode'); const [busy, setBusy] = useState(null); const cam = useRef(null); const locked = useRef(false); const { profile, addScan } = useApp();
	const finish = async (product) => { for (let i = 1; i < STAGES.length; i++) { setBusy(i); await new Promise((resolve) => setTimeout(resolve, 350)); } const result = await analyze(product, profile); addScan(result); navigation.replace('Result', { result }); };
	const run = async (fn) => { try { setBusy(0); const product = await fn(); if (!product) { setBusy(null); locked.current = false; setMode('label'); return Alert.alert('Product not found', 'No ingredients found for this barcode. Photograph the ingredient label instead.'); } await finish(product); } catch { setBusy(null); locked.current = false; Alert.alert('Something went wrong', 'Check your connection and try again.'); } };
	const onBarcode = ({ data }) => { if (!locked.current) { locked.current = true; run(() => lookupBarcode(data)); } };
	const snap = async () => { const photo = await cam.current?.takePictureAsync({ quality: 0.7 }); if (photo) run(() => ocrImage(photo.uri)); };
	const pick = async () => { const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 }); if (!result.canceled) run(() => ocrImage(result.assets[0].uri)); };
	if (!perm) return <View style={s.screen} />;
	if (!perm.granted) return <SafeAreaView style={[s.screen, s.pad, { justifyContent: 'center' }]}><Text style={s.h1}>Camera access needed</Text><Text style={[s.p, { marginVertical: 12 }]}>SafeLabel AI uses the camera to read barcodes and ingredient labels. Photos are only used for the scan.</Text><Btn title="Allow camera" onPress={ask} /><Btn title="Pick a photo instead" kind="ghost" style={{ marginTop: 10 }} onPress={pick} /></SafeAreaView>;
	return <View style={{ flex: 1, backgroundColor: '#000' }}><CameraView ref={cam} style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }} onBarcodeScanned={mode === 'barcode' && busy === null ? onBarcode : undefined} />
		<SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><View style={{ flexDirection: 'row', margin: 16, backgroundColor: '#000A', borderRadius: 99, padding: 4 }}>{['barcode', 'label'].map((value) => <Pressable key={value} onPress={() => setMode(value)} style={{ flex: 1, padding: 10, borderRadius: 99, alignItems: 'center', backgroundColor: mode === value ? C.accent : 'transparent' }}><Text style={{ fontWeight: '700', color: mode === value ? C.ink : '#fff' }}>{value === 'barcode' ? 'Barcode' : 'Ingredient label'}</Text></Pressable>)}</View></SafeAreaView>
		<View pointerEvents="none" style={{ position: 'absolute', top: '30%', alignSelf: 'center', width: mode === 'barcode' ? 280 : 320, height: mode === 'barcode' ? 140 : 220, borderWidth: 3, borderColor: C.accent, borderRadius: 18 }} />
		<SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', padding: 20 }}><Text style={{ color: '#fff', marginBottom: 14 }}>{mode === 'barcode' ? 'Point at the barcode — it scans automatically' : 'Fill the frame with the ingredient list'}</Text>{mode === 'label' && <View style={[s.row, { gap: 24 }]}><Pressable onPress={pick}><Text style={{ color: '#fff', fontWeight: '700' }}>Gallery</Text></Pressable><Pressable onPress={snap} style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 5, borderColor: '#fff', backgroundColor: C.accent }} /><Pressable onPress={() => navigation.goBack()}><Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text></Pressable></View>}{mode === 'barcode' && <Pressable onPress={() => navigation.goBack()}><Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text></Pressable>}</SafeAreaView>
		{busy !== null && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0E2A2FEE', justifyContent: 'center', padding: 40 }}><ActivityIndicator color={C.accent} size="large" style={{ marginBottom: 24 }} />{STAGES.map((text, i) => <Text key={text} style={{ fontSize: 18, marginVertical: 6, fontWeight: '700', color: i < busy ? C.accent : i === busy ? '#fff' : '#5F7773' }}>{i < busy ? '✓ ' : ''}{text}</Text>)}</View>}
	</View>;
}
