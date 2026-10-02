import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { BRAND, FONTS } from '@/constants/theme';
import { formatPeso } from '@/data/books';
import { fmtDate } from '@/lib/dates';
import { Icon, type IconName } from '@/components/icons';
import { OrdersFooter, OrdersHeader } from '@/components/OrdersChrome';
import { StatusPill, Tracker, downloadInvoice, orderNumber, statusIndex } from '@/components/orders-ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useShop, type Order, type OrderItem } from '@/store/shop';

const TABS = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
const RANGES = ['All time', 'Last 30 days', 'Last 6 months', '2026'] as const;
const SORTS = ['Newest', 'Oldest'] as const;

const MENU: { label: string; icon: IconName; to: string }[] = [
  { label: 'My orders', icon: 'bag', to: '/(tabs)/orders' },
  { label: 'Wishlist', icon: 'heart', to: '/(tabs)/wishlist' },
  { label: 'Cart', icon: 'bag', to: '/(tabs)/cart' },
  { label: 'Addresses', icon: 'pin', to: '/(tabs)/account' },
  { label: 'Account settings', icon: 'settings', to: '/(tabs)/account' },
  { label: 'Sign out', icon: 'logout', to: '' },
];

function inRange(createdAt: string, range: (typeof RANGES)[number]): boolean {
  if (range === 'All time') return true;
  const d = new Date(createdAt).getTime();
  const now = Date.now();
  if (range === 'Last 30 days') return now - d <= 30 * 86400000;
  if (range === 'Last 6 months') return now - d <= 182 * 86400000;
  return new Date(createdAt).getFullYear() === 2026;
}

export default function OrdersScreen() {
  const { user, signOut } = useAuth();
  const cart = useCart();
  const { listOrders, listOrderItems, getBook } = useShop();
  const { small } = useBreakpoint();
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<number, OrderItem[]>>({});
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof TABS)[number]>('All');
  const [range, setRange] = useState<(typeof RANGES)[number]>('All time');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Newest');
  const [kebab, setKebab] = useState<number | null>(null);
  const [invoiceMsg, setInvoiceMsg] = useState('');

  useFocusEffect(
    useCallback(() => {
      listOrders(user?.id ?? null, user?.isAdmin ?? false)
        .then(setOrders)
        .catch(() => setOrders([]));
    }, [listOrders, user?.id, user?.isAdmin]),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<number, OrderItem[]> = {};
      await Promise.all(
        orders.map(async (o) => {
          try {
            map[o.id] = await listOrderItems(o.id);
          } catch {
            map[o.id] = [];
          }
        }),
      );
      if (!cancelled) setItemsMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [orders, listOrderItems]);

  const counts: Record<string, number> = { All: orders.length };
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;

  const q = query.trim().toLowerCase();
  let visible = orders.filter((o) => {
    if (tab !== 'All' && o.status !== tab) return false;
    if (!inRange(o.createdAt, range)) return false;
    if (!q) return true;
    if (`#${o.id}`.includes(q) || orderNumber(o.id).toLowerCase().includes(q)) return true;
    if (o.name.toLowerCase().includes(q)) return true;
    return (itemsMap[o.id] ?? []).some((it) => it.title.toLowerCase().includes(q));
  });
  visible = [...visible].sort((a, b) =>
    sort === 'Newest' ? +new Date(b.createdAt) - +new Date(a.createdAt) : +new Date(a.createdAt) - +new Date(b.createdAt),
  );

  const buyAgain = (o: Order) => {
    for (const it of itemsMap[o.id] ?? []) {
      const book = getBook(it.bookId);
      if (book) cart.add(book, it.qty);
    }
    router.push('/(tabs)/cart');
  };

  const invoice = async (o: Order) => {
    setKebab(null);
    setInvoiceMsg('');
    const res = await downloadInvoice(o, itemsMap[o.id] ?? []);
    if (!res.ok) setInvoiceMsg(res.error);
  };

  const menuPress = (label: string, to: string) => {
    if (label === 'Sign out') {
      void signOut();
      return;
    }
    router.push(to as '/(tabs)/orders');
  };

  if (!user && orders.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <OrdersHeader />
        <ScrollView contentContainerStyle={styles.shell}>
          <View style={styles.signedOut}>
            <View style={styles.lockMark}>
              <Icon name="lock" size={28} color={BRAND.brown} />
            </View>
            <Text style={styles.signedTitle}>Sign in to see your orders</Text>
            <Text style={styles.signedCopy}>Keep track of deliveries, view past purchases, and find every story you’ve ordered.</Text>
            <View style={styles.signedBtns}>
              <Pressable style={styles.primary} onPress={() => router.push('/(tabs)/account')}>
                <Text style={styles.primaryText}>Sign in</Text>
              </Pressable>
              <Pressable style={styles.outline} onPress={() => router.push('/(tabs)/account')}>
                <Text style={styles.outlineText}>Create account</Text>
              </Pressable>
            </View>
          </View>
          <OrdersFooter />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <OrdersHeader />
      <ScrollView contentContainerStyle={styles.shell}>
        <View style={styles.body}>
          <Text style={styles.crumb}>
            Home <Text style={styles.crumbDim}>/ </Text>
            <Text style={styles.crumbHere}>My orders</Text>
          </Text>

          <View style={[styles.heading, small && styles.headingSmall]}>
            <View>
              <Text style={[styles.h1, small && styles.h1Small]}>My orders</Text>
              <View style={styles.accent} />
              <Text style={styles.sub}>
                {orders.length} order{orders.length === 1 ? '' : 's'} placed
              </Text>
            </View>
            <View style={styles.search}>
              <Icon name="search" size={16} color={BRAND.brown} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by order number or book title"
                placeholderTextColor="rgba(122, 84, 46, 0.8)"
                style={styles.searchInput}
              />
            </View>
          </View>

          {small ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {MENU.map((m, i) => (
                <Pressable
                  key={m.label}
                  style={[styles.mchip, i === 0 && styles.mchipOn]}
                  onPress={() => menuPress(m.label, m.to)}>
                  <Icon name={m.icon} size={14} color={i === 0 ? '#fff' : BRAND.text} />
                  <Text style={[styles.mchipText, i === 0 && styles.mchipTextOn]}>{m.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          <View style={[styles.layout, small && styles.layoutSmall]}>
            {!small ? (
              <View style={styles.sidebar}>
                <View style={styles.profile}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(user?.name || 'G').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.profileName}>{user?.name ?? 'Guest'}</Text>
                    <Text style={styles.profileEmail}>{user?.email ?? 'Browsing as guest'}</Text>
                  </View>
                </View>
                <View style={styles.menu}>
                  {MENU.map((m, i) => (
                    <Pressable
                      key={m.label}
                      style={[styles.menuItem, i === 0 && styles.menuOn]}
                      onPress={() => menuPress(m.label, m.to)}>
                      <Icon name={m.icon} size={18} color={i === 0 ? '#fff' : BRAND.text} />
                      <Text style={[styles.menuText, i === 0 && styles.menuTextOn]}>{m.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.content}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
                {TABS.map((t) => (
                  <Pressable key={t} style={[styles.tab, tab === t && styles.tabOn]} onPress={() => setTab(t)}>
                    <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t}</Text>
                    <View style={[styles.tabCount, tab === t && styles.tabCountOn]}>
                      <Text style={[styles.tabCountText, tab === t && styles.tabCountTextOn]}>{counts[t] ?? 0}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.filterRow}>
                <Text style={styles.resultCount}>
                  {visible.length} result{visible.length === 1 ? '' : 's'}
                </Text>
                <View style={styles.filterRight}>
                  <View style={styles.selectWrap}>
                    <Picker
                      selectedValue={range}
                      onValueChange={(v) => setRange(v)}
                      style={styles.picker}
                      accessibilityLabel="Date range">
                      {RANGES.map((r) => (
                        <Picker.Item key={r} label={r} value={r} />
                      ))}
                    </Picker>
                    <Icon name="chevron" size={14} color={BRAND.brown} />
                  </View>
                  <View style={styles.selectWrap}>
                    <Text style={styles.sortPrefix}>Sort by</Text>
                    <Picker selectedValue={sort} onValueChange={(v) => setSort(v)} style={styles.picker} accessibilityLabel="Sort orders">
                      {SORTS.map((s) => (
                        <Picker.Item key={s} label={s} value={s} />
                      ))}
                    </Picker>
                    <Icon name="chevron" size={14} color={BRAND.brown} />
                  </View>
                </View>
              </View>
              {invoiceMsg ? <Text style={styles.invoiceMsg}>{invoiceMsg}</Text> : null}

              {visible.length === 0 ? (
                <View style={styles.empty}>
                  <View style={styles.emptyArt}>
                    <Icon name="box" size={30} color={BRAND.brown} />
                  </View>
                  <Text style={styles.emptyTitle}>No orders match your filters</Text>
                  <Text style={styles.emptyCopy}>Try another status or search term.</Text>
                  <Pressable
                    onPress={() => {
                      setTab('All');
                      setRange('All time');
                      setQuery('');
                    }}>
                    <Text style={styles.emptyLink}>Clear filters</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.stack}>
                  {visible.map((o) => {
                    const items = itemsMap[o.id] ?? [];
                    const idx = statusIndex(o.status);
                    return (
                      <View key={o.id} style={styles.card}>
                        <View style={styles.cardHead}>
                          <View style={styles.meta}>
                            <View>
                              <Text style={styles.metaSmall}>ORDER</Text>
                              <Text style={styles.metaOrder}>#{orderNumber(o.id)}</Text>
                            </View>
                            <View>
                              <Text style={styles.metaSmall}>PLACED</Text>
                              <Text style={styles.metaText}>{fmtDate(o.createdAt)}</Text>
                            </View>
                            <View>
                              <Text style={styles.metaSmall}>TOTAL</Text>
                              <Text style={styles.metaText}>{formatPeso(o.total)}</Text>
                            </View>
                          </View>
                          <StatusPill status={o.status} small={small} />
                        </View>

                        <View style={styles.cardBody}>
                          <View style={styles.bookRow}>
                            {items.slice(0, small ? 1 : 4).map((it) => (
                              <View key={it.id} style={styles.book}>
                                <View style={styles.thumb}>
                                  <Text style={styles.thumbText}>{it.title.charAt(0)}</Text>
                                </View>
                                <View style={styles.bookInfo}>
                                  <Text style={styles.bookTitle} numberOfLines={2}>
                                    {it.title}
                                  </Text>
                                  <Text style={styles.bookSub} numberOfLines={1}>
                                    Qty {it.qty}
                                  </Text>
                                </View>
                              </View>
                            ))}
                            {items.length === 0 ? (
                              <Text style={styles.bookSub}>Loading items…</Text>
                            ) : null}
                          </View>
                          <View style={styles.trackWrap}>
                            {!small ? (
                              <Tracker status={o.status} compact />
                            ) : (
                              <View style={styles.mobileBar}>
                                <View
                                  style={[styles.mobileFill, { width: `${idx < 0 ? 0 : Math.round(((idx + 1) / 4) * 100)}%` }]}
                                />
                              </View>
                            )}
                            <Text style={[styles.estimate, small && styles.estimateLeft]}>
                              {o.status.toLowerCase().startsWith('deliver')
                                ? `Delivered ${fmtDate(o.createdAt)}`
                                : `Estimated delivery: ${fmtDate(new Date(new Date(o.createdAt).getTime() + 4 * 86400000))}`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.cardFoot}>
                          <Text style={styles.footTotal}>{formatPeso(o.total)}</Text>
                          <View style={styles.cardActions}>
                            {!small ? (
                              <Pressable style={styles.btnOutline} onPress={() => router.push(`/order/${o.id}`)}>
                                <Text style={styles.btnOutlineText}>Track order</Text>
                              </Pressable>
                            ) : null}
                            <Pressable style={styles.btnPrimary} onPress={() => router.push(`/order/${o.id}`)}>
                              <Text style={styles.btnPrimaryText}>View details</Text>
                            </Pressable>
                            {!small ? (
                              <Pressable style={styles.btnText} onPress={() => buyAgain(o)}>
                                <Text style={styles.btnTextText}>Buy again</Text>
                              </Pressable>
                            ) : null}
                            <View style={styles.kebabWrap}>
                              <Pressable
                                style={styles.kebab}
                                accessibilityLabel="More order actions"
                                onPress={() => setKebab((k) => (k === o.id ? null : o.id))}>
                                <Icon name="more" size={18} color={BRAND.brown} />
                              </Pressable>
                              {kebab === o.id ? (
                                <View style={styles.pop}>
                                  <Pressable style={styles.popItem} onPress={() => invoice(o)}>
                                    <Icon name="download" size={15} color={BRAND.text} />
                                    <Text style={styles.popText}>Download invoice</Text>
                                  </Pressable>
                                  <Pressable
                                    style={styles.popItem}
                                    onPress={() => {
                                      setKebab(null);
                                      router.push('/(tabs)/account');
                                    }}>
                                    <Icon name="help" size={15} color={BRAND.text} />
                                    <Text style={styles.popText}>Need help?</Text>
                                  </Pressable>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>
        <OrdersFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const TINT08 = 'rgba(122, 84, 46, 0.08)';
const TINT15 = 'rgba(122, 84, 46, 0.15)';
const TINT25 = 'rgba(122, 84, 46, 0.25)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  shell: { paddingBottom: 0 },
  body: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 96 },
  crumb: { color: BRAND.brown, fontSize: 13, marginBottom: 26, fontFamily: FONTS.sans },
  crumbDim: { opacity: 0.45 },
  crumbHere: { color: BRAND.text, fontWeight: '500' },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 150 },
  headingSmall: { flexDirection: 'column', alignItems: 'flex-start', gap: 0, minHeight: 0, paddingTop: 26 },
  h1: { fontSize: 40, color: BRAND.text, letterSpacing: -0.5, fontFamily: FONTS.serifBold, lineHeight: 48 },
  h1Small: { fontSize: 32 },
  accent: { backgroundColor: BRAND.brown, width: 48, height: 3, marginTop: 13, marginBottom: 10 },
  sub: { color: BRAND.brown, fontSize: 14, fontFamily: FONTS.sans },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: TINT25,
    width: 360,
    maxWidth: '100%',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  searchInput: { flex: 1, color: BRAND.text, fontSize: 13, fontFamily: FONTS.sans },
  chips: { gap: 7, paddingVertical: 12, marginHorizontal: -24, paddingHorizontal: 24 },
  mchip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: TINT08, borderRadius: 9, height: 36, paddingHorizontal: 11 },
  mchipOn: { backgroundColor: BRAND.ink },
  mchipText: { fontSize: 11, color: BRAND.text, fontFamily: FONTS.sans },
  mchipTextOn: { color: '#fff' },
  layout: { flexDirection: 'row', gap: 40, alignItems: 'flex-start', marginTop: 8 },
  layoutSmall: { flexDirection: 'column' },
  sidebar: { width: 260, borderWidth: 1, borderColor: TINT15, borderRadius: 20, padding: 14, backgroundColor: '#fff' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: TINT15, paddingHorizontal: 8, paddingBottom: 20, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: BRAND.ink, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontFamily: FONTS.serifBold },
  profileName: { fontSize: 15, color: BRAND.text, marginBottom: 3, fontFamily: FONTS.serifBold },
  profileEmail: { color: BRAND.brown, fontSize: 10, fontFamily: FONTS.sans },
  menu: { gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44, borderRadius: 10, paddingHorizontal: 14 },
  menuOn: { backgroundColor: BRAND.ink },
  menuText: { fontSize: 13, color: BRAND.text, fontFamily: FONTS.sans },
  menuTextOn: { color: '#fff' },
  content: { flex: 1, minWidth: 0 },
  tabs: { gap: 6, marginBottom: 18, paddingRight: 16 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: TINT08, borderRadius: 18, height: 36, paddingHorizontal: 13 },
  tabOn: { backgroundColor: BRAND.ink },
  tabText: { fontSize: 12, fontWeight: '500', color: BRAND.text, fontFamily: FONTS.sans },
  tabTextOn: { color: '#fff' },
  tabCount: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: TINT15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  tabCountOn: { backgroundColor: 'rgba(255,255,255,0.16)' },
  tabCountText: { fontSize: 9, color: BRAND.brown, fontFamily: FONTS.sans },
  tabCountTextOn: { color: BRAND.text },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  resultCount: { color: BRAND.brown, fontSize: 12, fontFamily: FONTS.sans },
  filterRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  selectWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: TINT25, borderRadius: 9, height: 36, paddingLeft: 12, paddingRight: 8 },
  picker: { height: 36, fontSize: 12, minWidth: 110 },
  sortPrefix: { fontSize: 11, color: BRAND.brown, fontFamily: FONTS.sans },
  invoiceMsg: { color: '#B91C1C', fontSize: 12, marginBottom: 8, fontFamily: FONTS.sans },
  stack: { gap: 16 },
  card: { borderWidth: 1, borderColor: TINT15, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: TINT08,
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 20, flex: 1, flexWrap: 'wrap' },
  metaSmall: { color: BRAND.brown, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10, fontFamily: FONTS.sans },
  metaOrder: { fontSize: 14, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  metaText: { fontSize: 12, color: BRAND.text, fontFamily: FONTS.sans },
  cardBody: { padding: 20 },
  bookRow: { flexDirection: 'row', gap: 17, borderBottomWidth: 1, borderBottomColor: TINT15, paddingBottom: 20, overflow: 'hidden' },
  book: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, minWidth: 0 },
  thumb: { width: 56, height: 76, borderRadius: 8, backgroundColor: BRAND.paper, alignItems: 'center', justifyContent: 'center' },
  thumbText: { fontSize: 26, fontFamily: FONTS.serifBold, color: BRAND.brown },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 14, color: BRAND.text, marginBottom: 5, lineHeight: 18, fontFamily: FONTS.serifSemi },
  bookSub: { color: BRAND.brown, fontSize: 10, lineHeight: 14, fontFamily: FONTS.sans },
  trackWrap: { marginTop: 19 },
  mobileBar: { height: 4, borderRadius: 2, backgroundColor: TINT15, overflow: 'hidden' },
  mobileFill: { height: '100%', backgroundColor: BRAND.brown, borderRadius: 2 },
  estimate: { color: BRAND.brown, textAlign: 'center', marginTop: 12, fontSize: 11, fontFamily: FONTS.sans },
  estimateLeft: { textAlign: 'left', fontSize: 9, marginTop: 9 },
  cardFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: TINT15,
    minHeight: 64,
    paddingVertical: 10,
    paddingLeft: 20,
    paddingRight: 14,
  },
  footTotal: { fontSize: 14, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: BRAND.ink, borderWidth: 1, borderColor: BRAND.ink, borderRadius: 10, minHeight: 42, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '600', fontFamily: FONTS.sansSemi },
  btnOutline: { borderWidth: 1, borderColor: BRAND.brown, borderRadius: 10, minHeight: 42, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
  btnText: { paddingHorizontal: 8, height: 42, alignItems: 'center', justifyContent: 'center' },
  btnTextText: { color: BRAND.brown, fontSize: 12, fontWeight: '600', fontFamily: FONTS.sansSemi },
  kebabWrap: { position: 'relative' },
  kebab: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pop: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 178,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TINT15,
    borderRadius: 12,
    padding: 6,
    zIndex: 10,
    shadowColor: BRAND.ink,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  popItem: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 38, paddingHorizontal: 10, borderRadius: 7 },
  popText: { fontSize: 11, color: BRAND.text, fontFamily: FONTS.sans },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderColor: TINT25, borderRadius: 20, minHeight: 300, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyArt: { width: 64, height: 64, borderRadius: 32, backgroundColor: TINT08, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 22, color: BRAND.text, marginBottom: 6, fontFamily: FONTS.serifBold },
  emptyCopy: { color: BRAND.brown, fontSize: 13, marginBottom: 12, fontFamily: FONTS.sans },
  emptyLink: { color: BRAND.brown, fontSize: 12, textDecorationLine: 'underline', fontFamily: FONTS.sans },
  signedOut: { alignItems: 'center', borderWidth: 1, borderColor: TINT15, borderRadius: 24, padding: 54, maxWidth: 480, width: '100%', alignSelf: 'center', marginVertical: 48 },
  lockMark: { width: 64, height: 64, borderRadius: 32, backgroundColor: TINT08, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  signedTitle: { fontSize: 28, color: BRAND.text, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.serifBold },
  signedCopy: { color: BRAND.brown, fontSize: 12, lineHeight: 20, textAlign: 'center', marginBottom: 25, fontFamily: FONTS.sans },
  signedBtns: { flexDirection: 'row', gap: 9 },
  primary: { backgroundColor: BRAND.ink, borderRadius: 11, height: 50, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: FONTS.sansBold },
  outline: { borderWidth: 1, borderColor: BRAND.ink, borderRadius: 11, height: 50, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  outlineText: { fontSize: 12, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
});
