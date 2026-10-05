import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BRAND, FONTS, coverTone } from '@/constants/theme';
import { formatPeso } from '@/data/books';
import { Icon } from '@/components/icons';
import { PageTitle, Stepper, SummaryCard, TrustRow } from '@/components/checkout-ui';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useShop } from '@/store/shop';

const FREE_SHIP_AT = 1500;
const STANDARD_SHIP = 120;

export default function CartScreen() {
  const cart = useCart();
  const { user } = useAuth();
  const { toggleWishlist } = useShop();
  const { small, stacked } = useBreakpoint();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const shipping = cart.lines.length === 0 || cart.subtotal - cart.discount >= FREE_SHIP_AT ? 0 : STANDARD_SHIP;
  const total = cart.subtotal - cart.discount + shipping;
  const toFree = Math.max(0, FREE_SHIP_AT - (cart.subtotal - cart.discount));
  const progress = Math.min(1, (cart.subtotal - cart.discount) / FREE_SHIP_AT);

  const applyPromo = () => {
    setPromoError('');
    if (!promoInput.trim()) return;
    if (!cart.applyPromo(promoInput)) {
      setPromoError('Invalid code. Try BOOKNOOK10.');
    } else {
      setPromoInput('');
    }
  };

  const saveForLater = () => {
    if (!user) {
      router.push('/(tabs)/account');
      return;
    }
    for (const l of cart.lines) void toggleWishlist(user.id, l.book.id);
    cart.clear();
    setSavedMsg('Saved to your wishlist.');
  };

  if (cart.lines.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <SiteHeader />
        <ScrollView contentContainerStyle={styles.shell}>
          <View style={styles.body}>
            <Stepper step={1} />
            <View style={styles.empty}>
            <View style={styles.emptyArt}>
              <Icon name="bag" size={44} color={BRAND.brown} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyCopy}>Looks like you haven&apos;t added any books yet.</Text>
            <Pressable style={styles.primary} onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.primaryText}>Browse catalog</Text>
            </Pressable>
          </View>
          </View>
          <SiteFooter />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SiteHeader />
      <ScrollView contentContainerStyle={styles.shell}>
        <View style={styles.body}>
          <Stepper step={1} />
          <PageTitle title="Your cart" sub={`${cart.count} item${cart.count === 1 ? '' : 's'}`} />

        <View style={[styles.grid, stacked && styles.gridSmall]}>
          <View style={styles.list}>
            {cart.lines.map((l) => {
              const tone = coverTone(l.book.tone);
              return (
                <View key={l.book.id} style={[styles.item, small && styles.itemSmall]}>
                  <Pressable onPress={() => router.push(`/book/${l.book.id}`)}>
                    <View style={[styles.thumb, small && styles.thumbSmall, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.thumbText, { color: tone.fg }]}>{l.book.title.charAt(0)}</Text>
                    </View>
                  </Pressable>
                  <View style={styles.info}>
                    <Pressable onPress={() => router.push(`/book/${l.book.id}`)}>
                      <Text style={[styles.itemTitle, small && styles.itemTitleSmall]} numberOfLines={2}>
                        {l.book.title}
                      </Text>
                    </Pressable>
                    <Text style={styles.itemAuthor}>{l.book.author}</Text>
                    <Text style={styles.pill}>{l.book.format}</Text>
                    <View style={styles.qty}>
                      <Pressable
                        style={styles.qtyBtn}
                        accessibilityLabel="Decrease quantity"
                        onPress={() => cart.setQty(l.book.id, l.qty - 1)}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.qtyNum}>{l.qty}</Text>
                      <Pressable
                        style={styles.qtyBtn}
                        accessibilityLabel="Increase quantity"
                        onPress={() => cart.setQty(l.book.id, l.qty + 1)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={[styles.price, small && styles.priceSmall]}>{formatPeso(l.book.price * l.qty)}</Text>
                    <Pressable style={styles.remove} onPress={() => cart.remove(l.book.id)}>
                      <Icon name="trash" size={small ? 16 : 15} color={BRAND.brown} />
                      {!small ? <Text style={styles.removeText}>Remove</Text> : null}
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <View style={styles.actions}>
              <Pressable style={styles.backLink} onPress={() => router.push('/(tabs)/catalog')}>
                <Text style={styles.backLinkText}>← Continue shopping</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={saveForLater}>
                <Text style={styles.secondaryText}>Save for later</Text>
              </Pressable>
            </View>
            {savedMsg ? <Text style={styles.savedMsg}>{savedMsg}</Text> : null}

            {cart.promo ? (
              <Pressable style={styles.promoChip} onPress={() => cart.clearPromo()}>
                <Text style={styles.promoChipText}>{cart.promo} −10% applied ✕</Text>
              </Pressable>
            ) : (
              <View style={styles.promo}>
                <TextInput
                  value={promoInput}
                  onChangeText={(v) => {
                    setPromoInput(v);
                    setPromoError('');
                  }}
                  onSubmitEditing={applyPromo}
                  placeholder="Promo code"
                  placeholderTextColor={BRAND.faint}
                  style={styles.promoInput}
                  autoCapitalize="characters"
                  aria-label="Promo code"
                />
                <Pressable style={styles.secondary} onPress={applyPromo}>
                  <Text style={styles.secondaryText}>Apply</Text>
                </Pressable>
              </View>
            )}
            {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
          </View>

          <View style={[styles.side, stacked && styles.sideSmall]}>
            <SummaryCard subtotal={cart.subtotal} shipping={shipping} discount={cart.discount} />
            <Text style={styles.shipCopy}>
              {toFree > 0 ? (
                <>{formatPeso(toFree)} away from free shipping</>
              ) : (
                <>You&apos;ve unlocked free shipping over {formatPeso(FREE_SHIP_AT)}</>
              )}
            </Text>
            <View style={styles.progress}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            {!small ? (
              <Pressable style={[styles.primary, styles.checkoutBtn]} onPress={() => router.push('/checkout')}>
                <Text style={styles.primaryText}>Proceed to checkout →</Text>
              </Pressable>
            ) : null}
            <TrustRow />
          </View>
        </View>
        </View>
        <SiteFooter />
      </ScrollView>
      {small ? (
        <View style={styles.stickyBar}>
          <View>
            <Text style={styles.stickyCap}>Total</Text>
            <Text style={styles.stickyTotal}>{formatPeso(total)}</Text>
          </View>
          <Pressable style={[styles.primary, styles.stickyBtn]} onPress={() => router.push('/checkout')}>
            <Text style={styles.primaryText}>Proceed to checkout →</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  shell: { paddingBottom: 96 },
  body: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 48 },
  grid: { flexDirection: 'row', gap: 40, alignItems: 'flex-start' },
  gridSmall: { flexDirection: 'column' },
  list: { flex: 1.9, minWidth: 0, maxWidth: 700 },
  side: { flex: 1, minWidth: 260, maxWidth: 380 },
  sideSmall: { width: '100%', maxWidth: '100%', marginTop: 8 },
  // Items
  item: {
    flexDirection: 'row',
    gap: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(122, 84, 46, 0.15)',
    borderRadius: 20,
    padding: 20,
    minHeight: 162,
    marginBottom: 12,
  },
  itemSmall: { borderRadius: 16, gap: 13, padding: 14, minHeight: 132 },
  thumb: { width: 88, height: 120, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  thumbSmall: { width: 64, height: 88 },
  thumbText: { fontSize: 40, fontFamily: FONTS.serifBold },
  info: { flex: 1, position: 'relative' },
  itemTitle: { fontSize: 18, color: BRAND.text, marginTop: 4, fontFamily: FONTS.serifBold },
  itemTitleSmall: { fontSize: 15, maxWidth: 180 },
  itemAuthor: { color: BRAND.brown, fontSize: 13, marginTop: 2, marginBottom: 10, fontFamily: FONTS.sans },
  pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(122, 84, 46, 0.08)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, color: BRAND.text, fontFamily: FONTS.sans },
  qty: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: 104,
    height: 34,
    borderWidth: 1,
    borderColor: 'rgba(122, 84, 46, 0.25)',
    borderRadius: 17,
    backgroundColor: '#fff',
  },
  qtyBtn: { width: 30, alignItems: 'center' },
  qtyBtnText: { fontSize: 18, color: BRAND.text },
  qtyNum: { fontSize: 13, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  priceCol: { alignItems: 'flex-end', justifyContent: 'space-between' },
  price: { fontSize: 16, fontWeight: '700', color: BRAND.text, marginTop: 5, fontFamily: FONTS.sansBold },
  priceSmall: { fontSize: 13 },
  remove: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  removeText: { color: BRAND.brown, fontSize: 12, fontWeight: '600', fontFamily: FONTS.sansSemi },
  // Actions + promo
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 24 },
  backLink: { paddingVertical: 4 },
  backLinkText: { color: BRAND.brown, fontSize: 12, fontWeight: '600', fontFamily: FONTS.sansSemi },
  secondary: { borderWidth: 1, borderColor: BRAND.ink, borderRadius: 12, height: 48, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 13, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  savedMsg: { color: BRAND.green, fontSize: 12, marginBottom: 8, fontFamily: FONTS.sans },
  promo: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(122, 84, 46, 0.15)', paddingTop: 24 },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(122, 84, 46, 0.25)',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    color: BRAND.text,
    fontFamily: FONTS.sans,
  },
  promoChip: { alignSelf: 'flex-start', backgroundColor: BRAND.ink, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginTop: 24 },
  promoChipText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: FONTS.sansBold },
  promoError: { color: '#B91C1C', fontSize: 12, marginTop: 8, fontFamily: FONTS.sans },
  // Summary extras
  shipCopy: { color: BRAND.brown, fontSize: 12, marginTop: 24, marginBottom: 9, fontFamily: FONTS.sans },
  progress: { height: 6, borderRadius: 3, backgroundColor: 'rgba(122, 84, 46, 0.15)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: BRAND.brown, borderRadius: 3 },
  primary: { backgroundColor: BRAND.ink, borderRadius: 12, height: 48, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: FONTS.sansBold },
  checkoutBtn: { height: 52, marginTop: 16, width: '100%' },
  // Empty
  empty: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(122, 84, 46, 0.15)',
    borderRadius: 24,
    paddingVertical: 75,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyArt: { marginBottom: 22, opacity: 0.9 },
  emptyTitle: { fontSize: 28, color: BRAND.text, marginBottom: 10, fontFamily: FONTS.serifBold },
  emptyCopy: { color: BRAND.brown, fontSize: 13, marginBottom: 24, fontFamily: FONTS.sans },
  // Sticky mobile bar
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(122, 84, 46, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 76,
  },
  stickyCap: { color: BRAND.brown, fontSize: 9, fontFamily: FONTS.sans },
  stickyTotal: { fontSize: 18, color: BRAND.text, fontFamily: FONTS.serifBold },
  stickyBtn: { flex: 1, height: 52 },
});
