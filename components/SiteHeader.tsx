import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BRAND, FONTS } from '@/constants/theme';
import { Icon } from '@/components/icons';
import { LogoWord } from '@/components/Logo';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useCart } from '@/store/cart';

const LINKS = [
  { label: 'Catalog', to: '/(tabs)/catalog' as const, params: undefined },
  { label: 'New releases', to: '/(tabs)/catalog' as const, params: { badge: 'New' } },
  { label: 'Best sellers', to: '/(tabs)/catalog' as const, params: { badge: 'Best seller' } },
  { label: 'About', to: '/(tabs)' as const, params: undefined },
];

export function SiteHeader() {
  const cart = useCart();
  const { small } = useBreakpoint();
  const [open, setOpen] = useState(false);

  const go = (to: (typeof LINKS)[number]['to'], params: (typeof LINKS)[number]['params']) => {
    setOpen(false);
    if (params) router.push({ pathname: to, params });
    else router.push(to);
  };

  return (
    <View style={[styles.header, small && styles.headerSmall]}>
      <View style={styles.inner}>
        <Pressable style={styles.logo} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.logoText}>
            <LogoWord size={27} color={BRAND.text} />
          </Text>
        </Pressable>
        {!small ? (
          <View style={styles.nav}>
            {LINKS.map((l) => (
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
          {LINKS.map((l) => (
            <Pressable key={l.label} style={styles.menuItem} onPress={() => go(l.to, l.params)}>
              <Text style={styles.menuText}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
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
  logo: { flexShrink: 1 },
  logoText: { fontSize: 27, color: BRAND.text, fontFamily: FONTS.serifBold },
  logoAccent: { color: BRAND.brown },
  nav: { flexDirection: 'row', gap: 32 },
  navText: { fontSize: 13, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBtn: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute',
    top: -3,
    right: -2,
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
});
