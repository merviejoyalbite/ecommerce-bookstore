import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BRAND, FONTS } from '@/constants/theme';
import { Icon } from '@/components/icons';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useCart } from '@/store/cart';

// Header from the cart/payment Figma Make: 80px bar, logo, nav links, cart button with badge.
export function ShopHeader() {
  const cart = useCart();
  const { small } = useBreakpoint();

  if (small) {
    return (
      <View style={styles.barSmall}>
        <Pressable style={styles.brandSmall} onPress={() => router.push('/(tabs)')}>
          <View style={styles.markSmall}>
            <Icon name="book" size={16} color="#fff" />
          </View>
          <Text style={styles.brandTextSmall}>Chapter One Shop</Text>
        </Pressable>
        <Pressable style={styles.cartBtn} accessibilityLabel={`Cart, ${cart.count} items`} onPress={() => router.push('/(tabs)/cart')}>
          <Icon name="bag" size={20} color={BRAND.text} />
          {cart.count > 0 ? (
            <View style={styles.count}>
              <Text style={styles.countText}>{cart.count}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      <Pressable style={styles.brand} onPress={() => router.push('/(tabs)')}>
        <View style={styles.mark}>
          <Icon name="book" size={17} color="#fff" />
        </View>
        <Text style={styles.brandText}>Chapter One Shop</Text>
      </Pressable>
      <View style={styles.nav}>
        <Pressable style={styles.navLink} onPress={() => router.push('/(tabs)/catalog')}>
          <Text style={styles.navText}>Catalog</Text>
        </Pressable>
        <Pressable style={styles.navLink} onPress={() => router.push('/(tabs)/wishlist')}>
          <Text style={styles.navText}>Wishlist</Text>
        </Pressable>
        <Pressable style={styles.navLink} onPress={() => router.push('/(tabs)/account')}>
          <Text style={styles.navText}>Account</Text>
        </Pressable>
      </View>
      <Pressable style={styles.cartBtn} accessibilityLabel={`Cart, ${cart.count} items`} onPress={() => router.push('/(tabs)/cart')}>
        <Icon name="bag" size={22} color={BRAND.text} />
        {cart.count > 0 ? (
          <View style={styles.count}>
            <Text style={styles.countText}>{cart.count}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

// Footer from the cart/payment Figma Make: ink bar, 4 columns, newsletter input, copyright.
export function ShopFooter() {
  const { small } = useBreakpoint();
  if (small) return null;
  return (
    <View style={styles.footer}>
      <View style={styles.footerGrid}>
        <View style={styles.fBrand}>
          <View style={styles.fMark}>
            <Icon name="book" size={15} color={BRAND.text} />
          </View>
          <Text style={styles.fBrandText}>Chapter One Shop</Text>
        </View>
        <View style={styles.fCol}>
          <Text style={styles.fHead}>Explore</Text>
          <Pressable onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.fLink}>New arrivals</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.fLink}>Best sellers</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.fLink}>Gift cards</Text>
          </Pressable>
        </View>
        <View style={styles.fCol}>
          <Text style={styles.fHead}>Help</Text>
          <Pressable onPress={() => router.push('/(tabs)')}>
            <Text style={styles.fLink}>Shipping & returns</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.fLink}>Contact us</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.fLink}>FAQs</Text>
          </Pressable>
        </View>
        <View style={styles.fCol}>
          <Text style={styles.fHead}>Stay in the story</Text>
          <Text style={styles.fCopy}>Bookish notes, new arrivals, and quiet recommendations.</Text>
          <View style={styles.fInput}>
            <Text style={styles.fInputText}>Your email address</Text>
            <Pressable>
              <Text style={styles.fInputBtn}>→</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View style={styles.fBottom}>
        <Text style={styles.fBottomText}>© 2025 Chapter One Shop</Text>
        <Text style={styles.fBottomText}>Privacy · Terms</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 84, 46, 0.15)',
    backgroundColor: 'rgba(255,255,255,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
  },
  barSmall: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 84, 46, 0.15)',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandSmall: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 38, height: 38, borderRadius: 19, backgroundColor: BRAND.ink, alignItems: 'center', justifyContent: 'center' },
  markSmall: { width: 34, height: 34, borderRadius: 17, backgroundColor: BRAND.ink, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 23, color: BRAND.text, fontFamily: FONTS.serifBold },
  brandTextSmall: { fontSize: 20, color: BRAND.text, fontFamily: FONTS.serifBold },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 32, marginLeft: 70 },
  navLink: { paddingVertical: 12 },
  navText: { fontSize: 14, color: BRAND.text, fontFamily: FONTS.sans },
  cartBtn: { position: 'relative', width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  count: {
    position: 'absolute',
    top: 2,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: BRAND.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: { color: '#fff', fontSize: 9, fontWeight: '700', fontFamily: FONTS.sansBold },
  // Footer
  footer: { backgroundColor: BRAND.ink, paddingHorizontal: 40, paddingTop: 52, paddingBottom: 20, marginTop: 64 },
  footerGrid: { maxWidth: 1120, width: '100%', alignSelf: 'center', flexDirection: 'row', gap: 50 },
  fBrand: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  fBrandText: { fontSize: 21, color: '#fff', fontFamily: FONTS.serifBold },
  fCol: { flex: 1, gap: 10 },
  fHead: { fontSize: 13, color: '#fff', fontFamily: FONTS.serifSemi },
  fLink: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: FONTS.sans },
  fCopy: { fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 17, fontFamily: FONTS.sans },
  fInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.4)',
  },
  fInputText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: FONTS.sans },
  fInputBtn: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fBottom: {
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    marginTop: 40,
    paddingTop: 18,
  },
  fBottomText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: FONTS.sans },
});
