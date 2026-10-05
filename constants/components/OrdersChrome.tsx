import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { BRAND, FONTS } from '@/constants/theme';
import { Icon } from '@/components/icons';
import { LogoWord } from '@/components/Logo';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useCart } from '@/store/cart';

const NAV = [
  { label: 'Home', to: '/(tabs)' as const, params: undefined },
  { label: 'Catalog', to: '/(tabs)/catalog' as const, params: undefined },
  { label: 'New arrivals', to: '/(tabs)/catalog' as const, params: { badge: 'New' } },
  { label: 'About', to: '/(tabs)' as const, params: undefined },
];

export function OrdersHeader() {
  const cart = useCart();
  const { small } = useBreakpoint();
  const [open, setOpen] = useState(false);

  const go = (to: (typeof NAV)[number]['to'], params: (typeof NAV)[number]['params']) => {
    setOpen(false);
    if (params) router.push({ pathname: to, params });
    else router.push(to);
  };

  return (
    <View style={[styles.header, small && styles.headerSmall]}>
      <View style={styles.inner}>
        <Pressable style={styles.brand} onPress={() => router.push('/(tabs)')}>
          <View style={styles.mark}>
            <Icon name="book" size={20} color="#fff" />
          </View>
          <LogoWord size={22} color={BRAND.text} />
        </Pressable>
        {!small ? (
          <View style={styles.nav}>
            {NAV.map((l) => (
              <Pressable key={l.label} onPress={() => go(l.to, l.params)}>
                <Text style={styles.navText}>{l.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.actions}>
          <Pressable style={styles.iconBtn} accessibilityLabel="Search" onPress={() => router.push('/(tabs)/catalog')}>
            <Icon name="search" size={20} color={BRAND.text} />
          </Pressable>
          <Pressable style={styles.iconBtn} accessibilityLabel="Account" onPress={() => router.push('/(tabs)/account')}>
            <Icon name="user" size={20} color={BRAND.text} />
          </Pressable>
          <Pressable style={styles.iconBtn} accessibilityLabel={`Cart, ${cart.count} items`} onPress={() => router.push('/(tabs)/cart')}>
            <Icon name="bag" size={20} color={BRAND.text} />
            {cart.count > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cart.count}</Text>
              </View>
            ) : null}
          </Pressable>
          {small ? (
            <Pressable style={styles.iconBtn} accessibilityLabel="Menu" onPress={() => setOpen((v) => !v)}>
              <Icon name="menu" size={20} color={BRAND.text} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {small && open ? (
        <View style={styles.menu}>
          {NAV.map((l) => (
            <Pressable key={l.label} style={styles.menuItem} onPress={() => go(l.to, l.params)}>
              <Text style={styles.menuText}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function OrdersFooter() {
  const { small } = useBreakpoint();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const join = () => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) setDone(true);
  };

  return (
    <View style={styles.footer}>
      <View style={[styles.finner, small && styles.finnerSmall]}>
        <View style={styles.fbrand}>
          <View style={styles.brand}>
            <View style={[styles.mark, styles.markLight]}>
              <Icon name="book" size={20} color={BRAND.text} />
            </View>
            <LogoWord size={22} />
          </View>
          <Text style={styles.fcopy}>Stories to keep, worlds to discover.</Text>
        </View>
        <View style={styles.fcol}>
          <Text style={styles.fhead}>Discover</Text>
          <Pressable onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.flink}>Catalog</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { badge: 'New' } })}>
            <Text style={styles.flink}>New arrivals</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { badge: 'Best seller' } })}>
            <Text style={styles.flink}>Bestsellers</Text>
          </Pressable>
        </View>
        <View style={styles.fcol}>
          <Text style={styles.fhead}>Help</Text>
          <Pressable onPress={() => router.push('/(tabs)')}>
            <Text style={styles.flink}>Shipping & returns</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.flink}>Contact us</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.flink}>FAQs</Text>
          </Pressable>
        </View>
        <View style={styles.fnews}>
          <Text style={styles.fhead}>A quiet note from us</Text>
          <Text style={styles.fcopy}>New books and thoughtful reads, occasionally.</Text>
          {done ? (
            <Text style={styles.newsDone}>Welcome to the reading list. Check your inbox soon.</Text>
          ) : (
            <View style={styles.newsForm}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={join}
                placeholder="Your email address"
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={styles.newsInput}
                autoCapitalize="none"
                keyboardType="email-address"
                aria-label="Email address"
              />
              <Pressable onPress={join}>
                <Text style={styles.join}>Join</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.copyright}>© 2026 Chapter1. Made for readers.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(122, 84, 46, 0.15)', height: 80, zIndex: 20 },
  headerSmall: { height: 'auto', minHeight: 64 },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    height: 80,
    paddingHorizontal: 24,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  mark: { width: 36, height: 36, borderRadius: 18, backgroundColor: BRAND.ink, alignItems: 'center', justifyContent: 'center' },
  markLight: { backgroundColor: '#fff' },
  brandText: { fontSize: 22, color: BRAND.text, fontFamily: FONTS.serifBold },
  brandTextLight: { color: '#fff' },
  nav: { flexDirection: 'row', gap: 34, marginLeft: 60 },
  navText: { fontSize: 14, color: BRAND.text, fontFamily: FONTS.sans },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 23 },
  iconBtn: { paddingVertical: 29, paddingHorizontal: 2, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 20,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  menu: { borderTopWidth: 1, borderTopColor: 'rgba(122, 84, 46, 0.15)', paddingVertical: 8 },
  menuItem: { paddingHorizontal: 24, paddingVertical: 12 },
  menuText: { fontSize: 14, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
  footer: { backgroundColor: BRAND.ink, paddingTop: 52, paddingBottom: 20 },
  finner: { flexDirection: 'row', gap: 50, maxWidth: 1120, width: '100%', alignSelf: 'center', paddingHorizontal: 24 },
  finnerSmall: { flexDirection: 'column', gap: 32 },
  fbrand: { flex: 1.45 },
  fcol: { flex: 0.8, flexDirection: 'column', gap: 10 },
  fnews: { flex: 1.45, flexDirection: 'column', gap: 10 },
  fhead: { fontSize: 13, color: '#fff', marginBottom: 6, fontFamily: FONTS.serifSemi },
  flink: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: FONTS.sans },
  fcopy: { color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 18, marginTop: 16, fontFamily: FONTS.sans },
  newsForm: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 9, height: 42, paddingLeft: 12 },
  newsInput: { flex: 1, color: '#fff', fontSize: 11, height: '100%', fontFamily: FONTS.sans },
  join: { color: '#fff', fontSize: 11, fontWeight: '600', paddingHorizontal: 14, fontFamily: FONTS.sansSemi },
  newsDone: { color: '#fff', fontSize: 11, fontFamily: FONTS.sans },
  copyright: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', maxWidth: 1120, width: '100%', alignSelf: 'center', marginHorizontal: 24, marginTop: 40, paddingTop: 17, fontSize: 10, fontFamily: FONTS.sans },
});
