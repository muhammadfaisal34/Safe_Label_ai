import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../store';
import { ALLERGENS } from '../../utils/data';
import { Disclaimer } from '../../components';

export default function Results({ route, navigation }) {
	const { result } = route.params || {};
	const { profile = [], savedProducts = [], saveProduct } = useApp();

	const verdictKey = result?.verdict || 'none';
	const product = result?.product || { name: 'Scanned Label', brand: '', lang: result?.lang || 'en', source: 'scan' };
	const findings = result?.findings || [];
	const ingredients = result?.ingredients || [];

	const allergenInfo = (id) => {
		if (!id) return { id: 'unknown', icon: '⚠️', label: 'Allergen' };
		const match = ALLERGENS.find((item) => item.id === id || item.id === id.replace(/s$/, ''));
		if (match) return match;
		return { id, icon: '⚠️', label: id.charAt(0).toUpperCase() + id.slice(1) };
	};

	// Determine profile matches vs general findings
	const mineFindings = findings.filter((f) => {
		const info = allergenInfo(f.allergen);
		return profile.includes(f.allergen) || profile.includes(info.id);
	});
	const otherFindings = findings.filter((f) => !mineFindings.includes(f));

	const isDanger = mineFindings.length > 0 || verdictKey === 'danger' || verdictKey === 'warning' || verdictKey === 'caution';
	const isNotice = !isDanger && otherFindings.length > 0;
	const isSafe = !isDanger && !isNotice;

	const formatDate = (ts) => {
		if (!ts) return '26 Oct 2025, 10:24 AM';
		try {
			const d = new Date(ts);
			const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
			const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
			return `${dateStr}, ${timeStr}`;
		} catch {
			return '26 Oct 2025, 10:24 AM';
		}
	};

	const saved = savedProducts.some((item) => item.name === product.name);

	// Banner theme colors
	const bannerBg = isDanger ? '#EB4D3D' : isNotice ? '#0284C7' : '#13A867';
	const bannerTitle = isDanger ? 'Allergens Detected' : isNotice ? 'Safe for Your Profile' : 'Product is Safe';
	const bannerSub = isDanger
		? `${mineFindings.length} match${mineFindings.length > 1 ? 'es' : ''} against your selected allergy profile.`
		: isNotice
			? `No matches for your profile (${profile.length} selected). Contains other common food allergens.`
			: 'No harmful ingredients or common allergens detected.';

	return (
		<View style={{ flex: 1, backgroundColor: '#F4F6F9' }}>
			{/* TOP HEADER & NOTIFICATION BANNER WITH INTEGRATED SAFE-AREA BACK ARROW */}
			<View style={{
				backgroundColor: bannerBg,
				borderBottomLeftRadius: 28,
				borderBottomRightRadius: 28,
				shadowColor: bannerBg,
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.25,
				shadowRadius: 10,
				elevation: 6,
			}}>
				<SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}>
					{/* Navigation Back Header */}
					<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
						<Pressable
							onPress={() => navigation.goBack()}
							style={({ pressed }) => [{
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: 'rgba(255, 255, 255, 0.2)',
								paddingHorizontal: 14,
								paddingVertical: 7,
								borderRadius: 99,
								borderWidth: 1,
								borderColor: 'rgba(255, 255, 255, 0.3)',
								opacity: pressed ? 0.75 : 1,
							}]}
						>
							<Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16, marginRight: 4 }}>‹</Text>
							<Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Back</Text>
						</Pressable>
						<Text style={{ flex: 1, textAlign: 'center', color: '#FFFFFF', fontWeight: '800', fontSize: 16, marginRight: 60 }}>
							Scan result
						</Text>
					</View>

					{/* Banner Main Content */}
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<View style={{
							width: 48,
							height: 48,
							borderRadius: 24,
							backgroundColor: 'rgba(255, 255, 255, 0.22)',
							alignItems: 'center',
							justifyContent: 'center',
							marginRight: 14,
							borderWidth: 1,
							borderColor: 'rgba(255, 255, 255, 0.35)',
						}}>
							<View style={{
								width: 36,
								height: 36,
								borderRadius: 18,
								backgroundColor: '#FFFFFF',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
								<Text style={{ fontSize: 18, color: bannerBg, fontWeight: '900' }}>
									{isDanger ? '!' : isNotice ? 'ℹ' : '✓'}
								</Text>
							</View>
						</View>

						<View style={{ flex: 1 }}>
							<Text style={{ fontSize: 21, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 }}>
								{bannerTitle}
							</Text>
							<Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.92)', marginTop: 2, lineHeight: 18 }}>
								{bannerSub}
							</Text>
						</View>
					</View>
				</SafeAreaView>
			</View>

			{/* MAIN SCROLLABLE CONTENT BODY */}
			<ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
				{/* PRODUCT INFORMATION CARD */}
				<View style={{
					backgroundColor: '#FFFFFF',
					borderRadius: 20,
					padding: 16,
					borderWidth: 1,
					borderColor: '#EDF2F7',
					flexDirection: 'row',
					alignItems: 'center',
					marginBottom: 16,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.04,
					shadowRadius: 6,
					elevation: 2,
				}}>
					{/* Product Thumbnail */}
					{product.image ? (
						<Image source={{ uri: product.image }} style={{ width: 68, height: 68, borderRadius: 14, marginRight: 14 }} />
					) : (
						<View style={{
							width: 68,
							height: 68,
							borderRadius: 14,
							backgroundColor: isDanger ? '#FDF1F0' : '#E6F4FF',
							borderWidth: 1,
							borderColor: isDanger ? '#FADBD8' : '#BAE0FD',
							alignItems: 'center',
							justifyContent: 'center',
							marginRight: 14,
						}}>
							<Text style={{ fontSize: 32 }}>{isDanger ? '🍫' : '🥛'}</Text>
						</View>
					)}

					{/* Product Text Details */}
					<View style={{ flex: 1 }}>
						<Text style={{ fontSize: 17, fontWeight: '800', color: '#1F2937' }} numberOfLines={1}>
							{product.name || 'Scanned Product'}
						</Text>
						<Text style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>
							Brand: <Text style={{ color: '#374151', fontWeight: '600' }}>{product.brand || 'FreshFarm'}</Text>
						</Text>
						<Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
							Scan Date: <Text style={{ color: '#6B7280' }}>{formatDate(result?.date)}</Text>
						</Text>
					</View>
				</View>

				{/* INGREDIENTS SECTION */}
				<View style={{
					backgroundColor: '#FFFFFF',
					borderRadius: 20,
					padding: 18,
					borderWidth: 1,
					borderColor: '#EDF2F7',
					marginBottom: 16,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.04,
					shadowRadius: 6,
					elevation: 2,
				}}>
					<Text style={{ fontSize: 12, fontWeight: '800', color: '#1F2937', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
						INGREDIENTS
					</Text>
					<Text style={{ fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 12 }}>
						{product.text || (ingredients.length > 0 ? ingredients.join(', ') : 'No raw ingredient text extracted.')}
					</Text>

					{/* Extracted Ingredient Chips */}
					{ingredients.length > 0 && (
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
							{ingredients.map((item, idx) => {
								const isMineMatch = mineFindings.some((f) => f.ingredient.toLowerCase() === item.toLowerCase());
								const isOtherMatch = otherFindings.some((f) => f.ingredient.toLowerCase() === item.toLowerCase());

								const chipBg = isMineMatch ? '#FDF1F0' : isOtherMatch ? '#FFF4D9' : '#F8FAFC';
								const chipBorder = isMineMatch ? '#EB4D3D' : isOtherMatch ? '#F59E0B' : '#E2E8F0';
								const chipText = isMineMatch ? '#D93025' : isOtherMatch ? '#B45309' : '#334155';
								const prefix = isMineMatch ? '⚠️ ' : isOtherMatch ? 'ℹ️ ' : '';

								return (
									<View
										key={idx}
										style={{
											paddingHorizontal: 12,
											paddingVertical: 7,
											borderRadius: 99,
											backgroundColor: chipBg,
											borderWidth: 1.5,
											borderColor: chipBorder,
										}}
									>
										<Text style={{ fontSize: 12, fontWeight: '600', color: chipText }}>
											{prefix}{item}
										</Text>
									</View>
								);
							})}
						</View>
					)}
				</View>

				{/* DYNAMIC ALLERGEN STATUS / WARNING CARD */}
				{isDanger ? (
					/* Profile Allergen Warning Box */
					<View style={{
						backgroundColor: '#FDF1F0',
						borderWidth: 1.5,
						borderColor: '#FADBD8',
						borderRadius: 20,
						padding: 16,
						marginBottom: 20,
					}}>
						<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
							<View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#EB4D3D', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
								<Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900' }}>!</Text>
							</View>
							<Text style={{ fontSize: 14, fontWeight: '800', color: '#D93025' }}>
								Contains allergens in your profile
							</Text>
						</View>

						<View style={{ paddingLeft: 4 }}>
							{mineFindings.map((f, i) => {
								const info = allergenInfo(f.allergen);
								const conf = Math.round((f.confidence ?? 0.95) * 100);

								return (
									<View key={i} style={{ marginVertical: 6 }}>
										<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
											<Text style={{ fontSize: 13, fontWeight: '700', color: '#D93025' }}>
												• {f.ingredient}
											</Text>
											<Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF' }}>
												{conf}% confidence
											</Text>
										</View>
										<Text style={{ fontSize: 12, color: '#4B5563', marginTop: 2, paddingLeft: 12 }}>
											Category: {info.icon} {info.label} {f.trace ? '(traces)' : ''} — in your profile
										</Text>
										{f.reason && (
											<Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2, paddingLeft: 12 }}>
												{f.reason}
											</Text>
										)}
									</View>
								);
							})}
						</View>
					</View>
				) : isNotice ? (
					/* Other Allergens Notice Box */
					<View style={{
						backgroundColor: '#F0F7FF',
						borderWidth: 1.5,
						borderColor: '#BAE0FD',
						borderRadius: 20,
						padding: 16,
						marginBottom: 20,
					}}>
						<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
							<View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
								<Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900' }}>ℹ</Text>
							</View>
							<Text style={{ fontSize: 14, fontWeight: '800', color: '#0369A1' }}>
								Contains other common food allergens
							</Text>
						</View>

						<View style={{ paddingLeft: 4 }}>
							{otherFindings.map((f, i) => {
								const info = allergenInfo(f.allergen);
								return (
									<View key={i} style={{ marginVertical: 4 }}>
										<Text style={{ fontSize: 13, fontWeight: '700', color: '#0369A1' }}>
											• {f.ingredient} ({info.icon} {info.label})
										</Text>
										{f.reason && (
											<Text style={{ fontSize: 11, color: '#64748B', marginTop: 1, paddingLeft: 12 }}>
												{f.reason}
											</Text>
										)}
									</View>
								);
							})}
						</View>
					</View>
				) : (
					/* Safe Status Box */
					<View style={{
						backgroundColor: '#F0FDF4',
						borderWidth: 1.5,
						borderColor: '#BBF7D0',
						borderRadius: 20,
						padding: 16,
						flexDirection: 'row',
						alignItems: 'center',
						marginBottom: 20,
					}}>
						<View style={{
							width: 28,
							height: 28,
							borderRadius: 14,
							backgroundColor: '#13A867',
							alignItems: 'center',
							justifyContent: 'center',
							marginRight: 12,
						}}>
							<Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>✓</Text>
						</View>
						<View style={{ flex: 1 }}>
							<Text style={{ fontSize: 14, fontWeight: '800', color: '#166534' }}>
								No common allergens detected
							</Text>
							<Text style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>
								Checked against your active profile and standard allergen term database.
							</Text>
						</View>
					</View>
				)}

				{/* BOTTOM ACTION BUTTONS */}
				<View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
					{/* Scan Another Button */}
					<Pressable
						onPress={() => navigation.replace('Scan')}
						style={({ pressed }) => [{
							flex: 1,
							paddingVertical: 14,
							borderRadius: 14,
							borderWidth: 1.5,
							borderColor: '#1677FF',
							backgroundColor: pressed ? '#E6F4FF' : 'transparent',
							alignItems: 'center',
							justifyContent: 'center',
						}]}
					>
						<Text style={{ fontSize: 14, fontWeight: '700', color: '#1677FF' }}>
							Scan Another
						</Text>
					</Pressable>

					{/* Save Product Button */}
					<Pressable
						onPress={() => saveProduct(product)}
						style={({ pressed }) => [{
							flex: 1,
							paddingVertical: 14,
							borderRadius: 14,
							backgroundColor: '#1677FF',
							alignItems: 'center',
							justifyContent: 'center',
							opacity: pressed ? 0.9 : 1,
							shadowColor: '#1677FF',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.25,
							shadowRadius: 8,
							elevation: 4,
						}]}
					>
						<Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
							{saved ? 'Saved Product' : 'Save Product'}
						</Text>
					</Pressable>
				</View>

				{/* Done Link */}
				<Pressable
					onPress={() => navigation.popToTop()}
					style={{ paddingVertical: 12, alignItems: 'center' }}
				>
					<Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B' }}>
						Done
					</Text>
				</Pressable>

				<Disclaimer />
			</ScrollView>
		</View>
	);
}


