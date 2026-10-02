import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { BRAND, FONTS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useShop } from '@/store/shop';
import { Icon, type IconName } from '@/components/icons';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const PERKS: { icon: IconName; label: string }[] = [
  { icon: 'truck', label: 'Free shipping over ₱1,500' },
  { icon: 'heart', label: 'Save your wishlist' },
  { icon: 'map', label: 'Easy order tracking' },
];

const DEMOS = [
  { label: 'Admin', account: 'admin@booknook.example / admin123', email: 'admin@booknook.example', password: 'admin123', icon: 'shield' as IconName },
  { label: 'Reader', account: 'reader@example.com / reader123', email: 'reader@example.com', password: 'reader123', icon: 'book' as IconName },
];

export default function AccountScreen() {
  const { user, ready, signIn, signUp, signOut } = useAuth();
  const cart = useCart();
  const { listOrders, wishlist } = useShop();
  const { small } = useBreakpoint();
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [accountType, setAccountType] = useState<'buyer' | 'admin'>('buyer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('jane@example.com');
  const [password, setPassword] = useState('booknook');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [hello, setHello] = useState('');
  const [busy, setBusy] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      listOrders(user?.id ?? null, user?.isAdmin ?? false)
        .then((o) => setOrderCount(o.length))
        .catch(() => setOrderCount(0));
    }, [listOrders, user?.id, user?.isAdmin]),
  );

  const submit = async () => {
    if (!password) {
      setError('Enter your password to continue.');
      return;
    }
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const res = mode === 'signin' ? await signIn(email, password) : await signUp(name, email, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPassword('');
      if (mode === 'create' && accountType === 'admin') {
        setInfo(
          `Buyer account created. To activate admin access, run this in Supabase SQL Editor: update profiles set is_admin = true where email = '${email.trim().toLowerCase()}'; then sign out and back in.`,
        );
      }
      setHello(mode === 'signin' ? 'Signed in successfully. Welcome back!' : 'Account created successfully. Welcome to Chapter One Shop!');
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError('');
    setInfo('');
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Enter your email above first, then tap Forgot password.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean);
      if (error) setError(error.message);
      else setInfo('Password reset email sent. Check your inbox.');
    } catch {
      setError('Could not send reset email. Please try again.');
    }
  };

  const fillDemo = (d: (typeof DEMOS)[number]) => {
    setEmail(d.email);
    setPassword(d.password);
    setError('');
    setInfo('');
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.muted}>Loading account…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const storeCards = [
    { icon: 'package' as IconName, title: 'View my orders', sub: 'Track delivery and view order history', count: orderCount, to: '/(tabs)/orders' as const, primary: true },
    { icon: 'heart' as IconName, title: 'View wishlist', sub: 'Return to the books you have saved', count: wishlist.length, to: '/(tabs)/wishlist' as const, primary: false },
    { icon: 'bag' as IconName, title: `View cart (${cart.count})`, sub: 'Review the books waiting in your bag', count: cart.count, to: '/(tabs)/cart' as const, primary: false },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SiteHeader />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.body}>
        {small ? (
          <View style={styles.mobileHero}>
            <View>
              <Text style={styles.mobileEyebrow}>Welcome back,</Text>
              <Text style={styles.mobileTitle}>{user ? `${user.name.split(' ')[0]}.` : 'reader.'}</Text>
            </View>
            <View style={styles.mobileMark}>
              <Icon name="book" size={44} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        ) : null}

        <View style={[styles.main, small && styles.mainSmall]}>
          <View style={[styles.card, small && styles.cardSmall]}>
            {!small ? (
              <View style={styles.welcome}>
                <Text style={styles.welcomeTitle}>Welcome back, reader.</Text>
                <Text style={styles.welcomeCopy}>
                  Sign in to track your orders, save your wishlist, and pick up where you left off.
                </Text>
                <View style={styles.perks}>
                  {PERKS.map((p) => (
                    <View key={p.label} style={styles.perk}>
                      <View style={styles.perkIcon}>
                        <Icon name={p.icon} size={15} color="#fff" />
                      </View>
                      <Text style={styles.perkLabel}>{p.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={[styles.form, small && styles.formSmall]}>
              <View style={styles.heading}>
                <Text style={[styles.h2, small && styles.h2Small]}>Account</Text>
                <View style={styles.bar} />
              </View>

              {user ? (
                <View style={styles.profile}>
                  {hello ? <Text style={styles.hello}>{hello}</Text> : null}
                  {user.isAdmin ? (
                    <View style={styles.roleAdmin}>
                      <Text style={styles.roleAdminText}>★ LOGGED IN AS ADMIN</Text>
                    </View>
                  ) : (
                    <View style={styles.roleBuyer}>
                      <Text style={styles.roleBuyerText}>● BUYER ACCOUNT</Text>
                    </View>
                  )}
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(user.name || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.profileName}>{user.name}</Text>
                  <Text style={styles.muted}>{user.email}</Text>
                  {user.isAdmin ? <Text style={styles.adminBadge}>★ Store admin</Text> : null}
                  <Pressable style={[styles.primary, styles.profileBtn]} onPress={() => signOut()}>
                    <Text style={styles.primaryText}>Sign out</Text>
                  </Pressable>
                  {user.isAdmin ? (
                    <Pressable style={styles.adminPanel} onPress={() => router.push('/(tabs)/admin')}>
                      <Text style={styles.adminPanelText}>Open admin panel</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <>
                  <View style={styles.tabs}>
                    <View style={[styles.indicator, mode === 'create' && styles.indicatorRight]} />
                    <Pressable style={styles.tab} onPress={() => { setMode('signin'); setError(''); setInfo(''); }}>
                      <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Sign in</Text>
                    </Pressable>
                    <Pressable style={styles.tab} onPress={() => { setMode('create'); setError(''); setInfo(''); }}>
                      <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>Create account</Text>
                    </Pressable>
                  </View>

                  {mode === 'create' ? (
                    <View style={styles.field}>
                      <Text style={styles.label}>Name</Text>
                      <View style={styles.shell}>
                        <View style={styles.shellIcon}>
                          <Icon name="user" size={18} color={BRAND.brown} />
                        </View>
                        <TextInput value={name} onChangeText={setName} placeholder="Jane Doe" placeholderTextColor={BRAND.faint} style={styles.input} />
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.field}>
                    <Text style={styles.label}>Email address</Text>
                    <View style={styles.shell}>
                      <View style={styles.shellIcon}>
                        <Icon name="mail" size={18} color={BRAND.brown} />
                      </View>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="jane@example.com"
                        placeholderTextColor={BRAND.faint}
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.shell}>
                      <View style={styles.shellIcon}>
                        <Icon name="lock" size={18} color={BRAND.brown} />
                      </View>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••"
                        placeholderTextColor={BRAND.faint}
                        style={styles.input}
                        secureTextEntry={!showPassword}
                      />
                      <Pressable
                        style={styles.eye}
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        onPress={() => setShowPassword((v) => !v)}>
                        <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} color={BRAND.brown} />
                      </Pressable>
                    </View>
                  </View>

                  {mode === 'create' ? (
                    <>
                      <Text style={styles.label}>Account type</Text>
                      <View style={styles.typeRow}>
                        {(['buyer', 'admin'] as const).map((t) => (
                          <Pressable
                            key={t}
                            style={[styles.typeBtn, accountType === t && styles.typeOn]}
                            onPress={() => setAccountType(t)}>
                            <Text style={[styles.typeText, accountType === t && styles.typeTextOn]}>
                              {t === 'buyer' ? '● Buyer — shop & order' : '★ Admin — manage store'}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      {accountType === 'admin' ? (
                        <Text style={styles.typeNote}>
                          Admin access must be approved in Supabase after signing up — we&apos;ll show you the exact step.
                        </Text>
                      ) : null}
                    </>
                  ) : null}

                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  {info ? <Text style={styles.infoMsg}>{info}</Text> : null}

                  {mode === 'signin' ? (
                    <Pressable onPress={forgot}>
                      <Text style={styles.forgot}>Forgot password?</Text>
                    </Pressable>
                  ) : null}

                  <Pressable style={[styles.primary, busy && styles.disabled]} disabled={busy} onPress={submit}>
                    <Text style={styles.primaryText}>
                      {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                    </Text>
                  </Pressable>

                  <View style={styles.divider}>
                    <Text style={styles.dividerText}>demo access</Text>
                  </View>
                  <View style={[styles.demoGrid, small && styles.demoGridSmall]}>
                    {DEMOS.map((d) => (
                      <View key={d.label} style={styles.demoChip}>
                        <View style={styles.demoIcon}>
                          <Icon name={d.icon} size={15} color={BRAND.brown} />
                        </View>
                        <View style={styles.demoDetails}>
                          <Text style={styles.demoLabel}>{d.label}</Text>
                          <Text style={styles.demoAccount} numberOfLines={1}>
                            {d.account}
                          </Text>
                        </View>
                        <Pressable onPress={() => fillDemo(d)}>
                          <Text style={styles.demoUse}>Use</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={[styles.store, small && styles.storeSmall]}>
            <View style={styles.storeTitle}>
              <Text style={[styles.storeH2, small && styles.storeH2Small]}>My store</Text>
              <Text style={styles.storeSub}>
                {orderCount} order(s) • {cart.count} item(s) in cart
              </Text>
            </View>
            <View style={[styles.storeGrid, small && styles.storeGridSmall]}>
              {storeCards.map((c) => (
                <Pressable
                  key={c.title}
                  style={[styles.storeCard, c.primary && !small && styles.storeCardPrimary, small && styles.storeCardSmall]}
                  onPress={() => router.push(c.to)}>
                  <View style={styles.storeIcon}>
                    <Icon name={c.icon} size={22} color={c.primary && !small ? '#fff' : BRAND.text} />
                  </View>
                  <View style={styles.storeCopy}>
                    <Text style={[styles.storeName, c.primary && !small && styles.storeNamePrimary]}>{c.title}</Text>
                    <Text style={[styles.storeDesc, c.primary && !small && styles.storeDescPrimary]}>{c.sub}</Text>
                  </View>
                  <View style={styles.storeArrow}>
                    <Icon name="arrow" size={14} color={c.primary && !small ? '#fff' : BRAND.brown} />
                  </View>
                  {c.count > 0 ? (
                    <View style={styles.countPill}>
                      <Text style={styles.countText}>{c.count}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        </View>
        <SiteFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARAMEL_08 = 'rgba(122, 84, 46, 0.08)';
const CARAMEL_15 = 'rgba(122, 84, 46, 0.15)';
const CARAMEL_25 = 'rgba(122, 84, 46, 0.25)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 0 },
  body: { paddingBottom: 32 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: BRAND.muted, fontFamily: FONTS.sans },
  // Mobile hero (prototype ≤900px)
  mobileHero: {
    backgroundColor: BRAND.ink,
    minHeight: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 25,
  },
  mobileEyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: FONTS.sans },
  mobileTitle: { color: '#fff', fontSize: 36, fontFamily: FONTS.serifBold, letterSpacing: -1 },
  mobileMark: { opacity: 0.9 },
  // Card
  main: { width: '100%', maxWidth: 1120, alignSelf: 'center', marginTop: 48, marginBottom: 72, paddingHorizontal: 24 },
  mainSmall: { marginTop: -24, marginBottom: 0, paddingHorizontal: 0 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    flexDirection: 'row',
    minHeight: 616,
    overflow: 'hidden',
    shadowColor: BRAND.ink,
    shadowOpacity: 0.1,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 20 },
    elevation: 8,
  },
  cardSmall: { borderRadius: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: 0, flexDirection: 'column' },
  // Welcome panel
  welcome: { width: 480, backgroundColor: BRAND.ink, paddingHorizontal: 44, paddingTop: 38, paddingBottom: 40 },
  welcomeTitle: { color: '#fff', fontSize: 44, lineHeight: 48, fontFamily: FONTS.serifBold, letterSpacing: -1.5, maxWidth: 350 },
  welcomeCopy: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 23, marginTop: 14, maxWidth: 360, fontFamily: FONTS.sans },
  perks: { gap: 10, marginTop: 'auto', paddingTop: 22 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: BRAND.brown, alignItems: 'center', justifyContent: 'center' },
  perkLabel: { color: '#fff', fontSize: 13, fontWeight: '500', fontFamily: FONTS.sansMedium },
  // Form panel
  form: { flex: 1, paddingHorizontal: 48, paddingTop: 42, paddingBottom: 38 },
  formSmall: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 30 },
  heading: { marginBottom: 24 },
  h2: { color: BRAND.text, fontSize: 36, lineHeight: 43, fontFamily: FONTS.serifBold, letterSpacing: -1 },
  h2Small: { fontSize: 32 },
  bar: { width: 40, height: 3, borderRadius: 2, backgroundColor: BRAND.brown, marginTop: 10 },
  // Segmented tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: CARAMEL_08,
    borderRadius: 24,
    height: 48,
    padding: 4,
    marginBottom: 24,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    width: '50%',
    marginRight: -4,
    backgroundColor: BRAND.ink,
    borderRadius: 20,
  },
  indicatorRight: { left: '50%', marginLeft: 0, marginRight: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tabText: { fontSize: 13, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  tabTextActive: { color: '#fff' },
  // Fields
  field: { marginBottom: 17 },
  label: { color: BRAND.text, fontSize: 13, fontWeight: '600', marginBottom: 7, fontFamily: FONTS.sansSemi },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  typeBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(122, 84, 46, 0.25)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  typeOn: { backgroundColor: BRAND.ink, borderColor: BRAND.ink },
  typeText: { fontSize: 12, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  typeTextOn: { color: '#fff' },
  typeNote: { color: BRAND.brown, fontSize: 11, marginTop: 6, fontFamily: FONTS.sans },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARAMEL_25,
    borderRadius: 12,
    height: 52,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  shellIcon: { width: 48, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, height: '100%', color: BRAND.text, fontSize: 15, paddingRight: 12, fontFamily: FONTS.sans },
  eye: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  error: { color: BRAND.brown, fontSize: 12, fontFamily: FONTS.sans, marginBottom: 4 },
  infoMsg: { color: BRAND.green, fontSize: 12, fontFamily: FONTS.sans, marginBottom: 4 },
  forgot: { color: BRAND.brown, fontSize: 12, fontWeight: '600', textAlign: 'right', marginTop: 7, fontFamily: FONTS.sansSemi },
  primary: {
    backgroundColor: BRAND.ink,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '700', fontFamily: FONTS.sansBold },
  disabled: { opacity: 0.45 },
  // Demo access
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerText: { color: BRAND.brown, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600', fontFamily: FONTS.sansSemi },
  demoGrid: { flexDirection: 'row', gap: 10 },
  demoGridSmall: { flexDirection: 'column' },
  demoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 68,
    padding: 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: BRAND.brown,
    backgroundColor: CARAMEL_08,
    borderRadius: 12,
  },
  demoIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  demoDetails: { flex: 1 },
  demoLabel: { color: BRAND.text, fontSize: 12, fontWeight: '700', fontFamily: FONTS.sansBold },
  demoAccount: { color: BRAND.brown, fontSize: 9, fontFamily: FONTS.sans },
  demoUse: { color: BRAND.brown, fontSize: 10, fontWeight: '700', padding: 4, fontFamily: FONTS.sansBold },
  // Signed-in profile
  profile: { alignItems: 'flex-start' },
  roleAdmin: {
    backgroundColor: BRAND.ink,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  roleAdminText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1, fontFamily: FONTS.sansBold },
  roleBuyer: {
    borderWidth: 1,
    borderColor: BRAND.brown,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  roleBuyerText: { color: BRAND.brown, fontSize: 13, fontWeight: '800', letterSpacing: 1, fontFamily: FONTS.sansBold },
  hello: {
    backgroundColor: 'rgba(21, 128, 61, 0.1)',
    borderWidth: 1,
    borderColor: BRAND.green,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: BRAND.green,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    alignSelf: 'stretch',
    fontFamily: FONTS.sansBold,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: BRAND.brown, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 24, fontFamily: FONTS.serifBold },
  profileName: { fontSize: 22, color: BRAND.text, fontFamily: FONTS.serifBold },
  adminBadge: { color: BRAND.brown, fontWeight: '700', marginTop: 4, fontFamily: FONTS.sansBold },
  profileBtn: { alignSelf: 'stretch' },
  adminPanel: { backgroundColor: BRAND.brown, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 10, alignSelf: 'stretch' },
  adminPanelText: { color: '#fff', fontSize: 14, fontWeight: '700', fontFamily: FONTS.sansBold },
  // My store
  store: { marginTop: 52 },
  storeSmall: { marginTop: 0, paddingHorizontal: 16, paddingTop: 28, paddingBottom: 32, borderTopWidth: 1, borderTopColor: CARAMEL_15 },
  storeTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 },
  storeH2: { color: BRAND.text, fontSize: 24, fontFamily: FONTS.serifBold, letterSpacing: -0.5 },
  storeH2Small: { fontSize: 22 },
  storeSub: { color: BRAND.brown, fontSize: 13, fontFamily: FONTS.sans },
  storeGrid: { flexDirection: 'row', gap: 16 },
  storeGridSmall: { flexDirection: 'column', gap: 10 },
  storeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 134,
    padding: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: CARAMEL_15,
    borderRadius: 20,
    position: 'relative',
  },
  storeCardPrimary: { backgroundColor: BRAND.ink, borderColor: BRAND.ink },
  storeCardSmall: { minHeight: 78, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16 },
  storeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: CARAMEL_08, alignItems: 'center', justifyContent: 'center' },
  storeCopy: { flex: 1, gap: 7 },
  storeName: { fontSize: 15, color: BRAND.text, fontFamily: FONTS.sansSemi, lineHeight: 20 },
  storeNamePrimary: { color: '#fff' },
  storeDesc: { fontSize: 11, color: BRAND.brown, lineHeight: 16, fontFamily: FONTS.sans },
  storeDescPrimary: { color: 'rgba(255,255,255,0.6)' },
  storeArrow: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: CARAMEL_25, alignItems: 'center', justifyContent: 'center' },
  countPill: {
    position: 'absolute',
    top: 18,
    right: 18,
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    backgroundColor: CARAMEL_08,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: { fontSize: 10, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
});
