import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Circle } from 'react-native-svg';
import { Picker } from '@react-native-picker/picker';
import { router, useFocusEffect } from 'expo-router';
import { BRAND, FONTS, coverTone } from '@/constants/theme';
import { CATEGORIES, formatPeso } from '@/data/books';
import { fmtDate } from '@/lib/dates';
import { Icon, type IconName } from '@/components/icons';
import { LogoWord } from '@/components/Logo';
import { StatusPill, orderNumber } from '@/components/orders-ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuth } from '@/store/auth';
import { useShop, type Order } from '@/store/shop';

type ViewKey = 'dashboard' | 'books' | 'customers' | 'inventory' | 'categories' | 'reports';

const NAV: { key: string; label: string; icon: IconName; view?: ViewKey; to?: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid', view: 'dashboard' },
  { key: 'books', label: 'Books', icon: 'book', view: 'books' },
  { key: 'orders', label: 'Orders', icon: 'bag', to: '/(tabs)/orders' },
  { key: 'customers', label: 'Customers', icon: 'users', view: 'customers' },
  { key: 'inventory', label: 'Inventory', icon: 'boxes', view: 'inventory' },
  { key: 'categories', label: 'Categories', icon: 'tag', view: 'categories' },
  { key: 'reports', label: 'Reports', icon: 'chart', view: 'reports' },
  { key: 'settings', label: 'Settings', icon: 'settings', to: '/(tabs)/account' },
];

const DONUT_COLORS = [BRAND.ink, BRAND.brown, '#7a542e99', 'rgba(122, 84, 46, 0.25)'];

function greeting(name: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name.split(' ')[0]}`;
}

function Donut({ slices, total }: { slices: { label: string; value: number; color: string }[]; total: string }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const sum = slices.reduce((a, s) => a + s.value, 0) || 1;
  const segs = slices.reduce<{ rot: number; frac: number }[]>((arr, s) => {
    const prev = arr.length > 0 ? arr[arr.length - 1] : null;
    const start = prev ? prev.rot + prev.frac * 360 : 0;
    return [...arr, { rot: start, frac: s.value / sum }];
  }, []);
  return (
    <View style={styles.donutWrap}>
      <View style={styles.donut}>
        <Svg width={130} height={130} viewBox="0 0 130 130">
          {slices.map((s, i) => {
            const dash = `${Math.max(0, segs[i].frac * C - 2)} ${C}`;
            return (
              <Circle
                key={s.label + i}
                cx={65}
                cy={65}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={26}
                strokeDasharray={dash}
                rotation={segs[i].rot - 90}
                origin="65, 65"
              />
            );
          })}
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutTotal}>{total}</Text>
          <Text style={styles.donutCap}>Revenue</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {slices.map((s) => (
          <View key={s.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {s.label}
            </Text>
            <Text style={styles.legendVal}>{formatPeso(s.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const { user, signOut } = useAuth();
  const { books, listOrders, listItems, listProfiles, addBook, updateBook, deleteBook } = useShop();
  const { small, medium, stacked } = useBreakpoint();
  const [view, setView] = useState<ViewKey>('dashboard');
  const [drawer, setDrawer] = useState(false);
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [chartMode, setChartMode] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [search, setSearch] = useState('');
  const [bellOpen, setBellOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<{ bookId: string; price: number; qty: number }[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string; email: string; isAdmin: boolean; createdAt: string }[]>([]);

  // Books CRUD state (Books view)
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string>('Fiction');
  const [stock, setStock] = useState('20');
  const [blurb, setBlurb] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [o, it, pf] = await Promise.all([listOrders(undefined, true), listItems(1000), listProfiles()]);
          setOrders(o);
          setItems(it);
          setProfiles(pf);
        } catch {
          // Stay on seed/empty state.
        }
      })();
    }, [listOrders, listItems, listProfiles]),
  );

  const days = range === 'week' ? 7 : 30;
  const [now] = useState(() => Date.now());
  const inSpan = useCallback(
    (ts: number, spanDays: number, backSpans = 0) => {
      const start = now - (backSpans + 1) * spanDays * 86400000;
      const end = now - backSpans * spanDays * 86400000;
      return ts > start && ts <= end;
    },
    [now],
  );

  const cur = useMemo(() => orders.filter((o) => inSpan(+new Date(o.createdAt), days)), [orders, days, inSpan]);
  const prev = useMemo(
    () => orders.filter((o) => inSpan(+new Date(o.createdAt), days, 1)),
    [orders, days, inSpan],
  );
  const pct = (c: number, p: number) => (p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100));

  const sales = cur.reduce((a, o) => a + o.total, 0);
  const salesPrev = prev.reduce((a, o) => a + o.total, 0);
  const newCust = profiles.filter((p) => inSpan(+new Date(p.createdAt), days)).length;
  const newCustPrev = profiles.filter((p) => inSpan(+new Date(p.createdAt), days, 1)).length;
  const lowStock = useMemo(() => [...books].filter((b) => (b.stock ?? 20) <= 10).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)), [books]);

  const bars = useMemo(() => {
    const n = chartMode === 'Weekly' ? 7 : 10;
    const span = chartMode === 'Weekly' ? 7 : 30;
    const out: { label: string; value: number }[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const end = now - (i * span * 86400000) / n;
      const start = now - ((i + 1) * span * 86400000) / n;
      const v = orders.filter((o) => {
        const t = +new Date(o.createdAt);
        return t > start && t <= end;
      }).reduce((a, o) => a + o.total, 0);
      const d = new Date(end);
      out.push({ label: chartMode === 'Weekly' ? 'SMTWTFS'[d.getDay()] : String(d.getDate()), value: Math.round(v) });
    }
    return out;
  }, [orders, chartMode, now]);

  const barMax = Math.max(1, ...bars.map((b) => b.value));

  const catRevenue = useMemo(() => {
    const byCat: Record<string, number> = {};
    const bookCat = new Map(books.map((b) => [b.id, b.category]));
    for (const it of items) {
      const c = bookCat.get(it.bookId) ?? 'Other';
      byCat[c] = (byCat[c] ?? 0) + it.price * it.qty;
    }
    return Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, value], i) => ({ label, value: Math.round(value), color: DONUT_COLORS[i % DONUT_COLORS.length] }));
  }, [items, books]);

  const catStats = useMemo(() => {
    const bookCat = new Map(books.map((b) => [b.id, b.category]));
    const sold: Record<string, number> = {};
    for (const it of items) sold[bookCat.get(it.bookId) ?? 'Other'] = (sold[bookCat.get(it.bookId) ?? 'Other'] ?? 0) + it.qty;
    return CATEGORIES.filter((c) => c !== 'All').map((c) => ({
      name: c,
      books: books.filter((b) => b.category === c).length,
      stock: books.filter((b) => b.category === c).reduce((a, b) => a + (b.stock ?? 0), 0),
      sold: sold[c] ?? 0,
      revenue: (catRevenue.find((r) => r.label === c)?.value ?? 0),
    }));
  }, [books, items, catRevenue]);

  const recent = useMemo(() => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6), [orders]);

  if (!user) {
    return (
      <SafeAreaView style={styles.gate}>
        <View style={styles.gateCard}>
          <Text style={styles.gateTitle}>Admin</Text>
          <Text style={styles.gateCopy}>Sign in as an admin to open the dashboard.</Text>
          <Pressable style={styles.btnPrimary} onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.btnPrimaryText}>Go to account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!user.isAdmin) {
    return (
      <SafeAreaView style={styles.gate}>
        <View style={styles.gateCard}>
          <Text style={styles.gateTitle}>Admin</Text>
          <Text style={styles.gateCopy}>This area is for store admins only. Signed in as {user.email}.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const navPress = (n: (typeof NAV)[number]) => {
    setDrawer(false);
    if (n.to) router.push(n.to as '/(tabs)/orders');
    else if (n.view) setView(n.view);
  };

  const submitBook = async () => {
    setBusy(true);
    setFormError('');
    try {
      await addBook({ title, author, price: Number(price), category, blurb, stock: Number(stock) });
      setTitle('');
      setAuthor('');
      setPrice('');
      setBlurb('');
      setStock('20');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not add book.');
    } finally {
      setBusy(false);
    }
  };

  const removeBook = (id: string, bookTitle: string) => {
    Alert.alert('Delete book', `Remove "${bookTitle}" from the catalogue?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteBook(id).catch(() => {}) },
    ]);
  };

  const saveStock = async (id: string) => {
    const raw = editingStock[id];
    if (raw === undefined) return;
    try {
      await updateBook(id, { stock: Number(raw) });
      setEditingStock((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      // Keep editing on validation error.
    }
  };

  const restock = (id: string, current: number) => {
    void updateBook(id, { stock: current + 20 }).catch(() => {});
  };

  const kpis = [
    { icon: 'chart' as const, label: 'Total sales', value: formatPeso(sales), delta: pct(sales, salesPrev), inverted: true },
    { icon: 'bag' as const, label: 'Orders', value: String(cur.length), delta: pct(cur.length, prev.length), inverted: false },
    { icon: 'users' as const, label: 'New customers', value: String(newCust), delta: pct(newCust, newCustPrev), inverted: false },
    { icon: 'boxes' as const, label: 'Low-stock books', value: String(lowStock.length), delta: null as number | null, note: `${lowStock.length} need attention`, inverted: false },
  ];

  const side = (
    <View style={[styles.side, small && styles.sideDrawer]}>
      <View style={styles.brand}>
        <Icon name="book" size={24} color="#fff" />
        <LogoWord size={19} />
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>
      <View style={styles.sideNav}>
        {NAV.map((n) => (
          <Pressable
            key={n.key}
            style={[styles.navItem, view === n.view && styles.navOn]}
            onPress={() => navPress(n)}>
            <Icon name={n.icon} size={18} color={view === n.view ? '#fff' : 'rgba(255,255,255,0.68)'} />
            {(!small || drawer) && <Text style={[styles.navText, view === n.view && styles.navTextOn]}>{n.label}</Text>}
            {n.key === 'orders' && orders.length > 0 ? (
              <View style={styles.navCount}>
                <Text style={styles.navCountText}>{orders.length}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
      <View style={styles.sideUser}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        {(!small || drawer) && (
          <View style={styles.sideUserInfo}>
            <Text style={styles.sideUserName} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.sideUserEmail} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        )}
        {(!small || drawer) && (
          <Pressable accessibilityLabel="Sign out" onPress={() => void signOut()}>
            <Icon name="logout" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.shell}>
        {!small ? side : null}

        <View style={styles.main}>
          <View style={styles.topbar}>
            {small ? (
              <Pressable accessibilityLabel="Open menu" onPress={() => setDrawer(true)}>
                <Icon name="menu" size={22} color={BRAND.text} />
              </Pressable>
            ) : null}
            <View style={styles.topTitle}>
              <Text style={styles.topH1}>Store overview</Text>
              <Text style={styles.topSub}>{greeting(user.name)}</Text>
            </View>
            {!small ? (
              <Pressable onPress={() => router.push('/(tabs)')}>
                <Text style={styles.storefront}>View storefront →</Text>
              </Pressable>
            ) : null}
            {!small ? (
              <View style={styles.topSearch}>
                <Icon name="search" size={15} color={BRAND.brown} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={() => router.push({ pathname: '/(tabs)/catalog', params: search.trim() ? { q: search.trim() } : {} })}
                  placeholder="Search books, orders, customers"
                  placeholderTextColor={BRAND.faint}
                  style={styles.topSearchInput}
                  returnKeyType="search"
                />
              </View>
            ) : null}
            <Picker selectedValue={range} onValueChange={(v) => setRange(v)} style={styles.rangePicker} accessibilityLabel="Date range">
              <Picker.Item label="Last 7 days" value="week" />
              <Picker.Item label="Last 30 days" value="month" />
            </Picker>
            <View>
              <Pressable accessibilityLabel="Notifications" onPress={() => setBellOpen((v) => !v)}>
                <Icon name="bell" size={20} color={BRAND.text} />
                {lowStock.length > 0 ? <View style={styles.bellDot} /> : null}
              </Pressable>
              {bellOpen ? (
                <View style={styles.bellPop}>
                  <Text style={styles.bellTitle}>Needs your attention</Text>
                  {lowStock.slice(0, 5).map((b) => (
                    <Pressable key={b.id} style={styles.bellRow} onPress={() => { setBellOpen(false); setView('inventory'); }}>
                      <Text style={styles.bellText} numberOfLines={1}>
                        {b.title} — {b.stock} left
                      </Text>
                    </Pressable>
                  ))}
                  {lowStock.length === 0 ? <Text style={styles.bellText}>All stocked up.</Text> : null}
                </View>
              ) : null}
            </View>
            <Pressable onPress={() => router.push('/(tabs)/account')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {view === 'dashboard' || view === 'reports' ? (
              <>
                <View style={styles.kpis}>
                  {kpis.map((k) => (
                    <View key={k.label} style={[styles.kpi, k.inverted && styles.kpiInv]}>
                      <View style={styles.kpiIcon}>
                        <Icon name={k.icon} size={18} color={k.inverted ? '#fff' : BRAND.text} />
                      </View>
                      <Text style={[styles.kpiLabel, k.inverted && styles.kpiLabelInv]}>{k.label}</Text>
                      <Text style={[styles.kpiValue, k.inverted && styles.kpiValueInv]}>{k.value}</Text>
                      <Text style={[styles.kpiDelta, k.inverted && styles.kpiDeltaInv]}>
                        {k.delta == null ? k.note : `↑ ${k.delta}% vs last ${range}`}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.row, (small || medium) && styles.rowStack]}>
                  <View style={[styles.panel, styles.salesPanel]}>
                    <View style={styles.panelHead}>
                      <View>
                        <Text style={styles.panelTitle}>Sales overview</Text>
                        <Text style={styles.panelSub}>
                          {chartMode === 'Weekly' ? 'Revenue over the last 7 days' : 'Revenue over the last 30 days'}
                        </Text>
                      </View>
                      <View style={styles.toggle}>
                        {(['Weekly', 'Monthly'] as const).map((m) => (
                          <Pressable key={m} style={[styles.toggleBtn, chartMode === m && styles.toggleOn]} onPress={() => setChartMode(m)}>
                            <Text style={[styles.toggleText, chartMode === m && styles.toggleTextOn]}>{m}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={styles.chart}>
                      {[0, 1, 2].map((i) => (
                        <View key={i} style={styles.chartLine} />
                      ))}
                      <View style={styles.bars}>
                        {bars.map((b, i) => (
                          <View key={i} style={styles.barCol}>
                            <View style={[styles.bar, { height: `${Math.max(3, Math.round((b.value / barMax) * 100))}%` }]} />
                            <Text style={styles.barLabel}>{b.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.panel, styles.donutPanel]}>
                    <View style={styles.panelHead}>
                      <View>
                        <Text style={styles.panelTitle}>Top categories</Text>
                        <Text style={styles.panelSub}>By revenue</Text>
                      </View>
                    </View>
                    <Donut slices={catRevenue.length > 0 ? catRevenue : [{ label: 'No sales yet', value: 1, color: 'rgba(122, 84, 46, 0.25)' }]} total={formatPeso(sales)} />
                  </View>
                </View>
              </>
            ) : null}

            {view === 'dashboard' ? (
              <View style={[styles.row, (small || medium) && styles.rowStack]}>
                <View style={[styles.panel, styles.recentPanel]}>
                  <View style={styles.panelHead}>
                    <View>
                      <Text style={styles.panelTitle}>Recent orders</Text>
                      <Text style={styles.panelSub}>Latest purchases from your store</Text>
                    </View>
                    <Pressable onPress={() => router.push('/(tabs)/orders')}>
                      <Text style={styles.viewAll}>View all →</Text>
                    </Pressable>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={[styles.table, stacked && styles.tableWide]}>
                    <View style={[styles.tr, styles.trHead]}>
                      <Text style={styles.thText}>Order</Text>
                      <Text style={styles.thText}>Customer</Text>
                      <Text style={styles.thText}>Items</Text>
                      <Text style={styles.thText}>Total</Text>
                      <Text style={styles.thText}>Status</Text>
                      <Text style={styles.thText} />
                    </View>
                    {recent.slice(0, 5).map((o) => (
                      <Pressable key={o.id} style={styles.tr} onPress={() => router.push(`/order/${o.id}`)}>
                        <Text style={styles.tdBold}>#{orderNumber(o.id)}</Text>
                        <Text style={styles.td} numberOfLines={1}>
                          {o.name}
                        </Text>
                        <Text style={styles.td}>{o.email}</Text>
                        <Text style={styles.td}>{formatPeso(o.total)}</Text>
                        <StatusPill status={o.status} small />
                        <Icon name="chevron" size={14} color={BRAND.brown} />
                      </Pressable>
                    ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={[styles.panel, styles.stockPanel]}>
                  <View style={styles.panelHead}>
                    <View>
                      <Text style={styles.panelTitle}>Low-stock books</Text>
                      <Text style={styles.panelSub}>Needs your attention</Text>
                    </View>
                    <Pressable onPress={() => setView('inventory')}>
                      <Text style={styles.viewAll}>View all →</Text>
                    </Pressable>
                  </View>
                  {lowStock.slice(0, 5).map((b) => {
                    const tone = coverTone(b.tone);
                    return (
                      <View key={b.id} style={styles.stockRow}>
                        <View style={[styles.stockThumb, { backgroundColor: tone.bg }]}>
                          <Text style={[styles.stockThumbText, { color: tone.fg }]}>{b.title.charAt(0)}</Text>
                        </View>
                        <View style={styles.stockInfo}>
                          <Text style={styles.stockTitle} numberOfLines={1}>
                            {b.title}
                          </Text>
                          <Text style={styles.stockSub}>{b.stock} left</Text>
                        </View>
                        <Pressable style={styles.restock} onPress={() => restock(b.id, b.stock ?? 0)}>
                          <Text style={styles.restockText}>Restock</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                  {lowStock.length === 0 ? <Text style={styles.muted}>All stocked up.</Text> : null}
                </View>
              </View>
            ) : null}

            {view === 'books' ? (
              <View style={styles.booksWrap}>
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Add a book</Text>
                  <Text style={styles.formLabel}>Title</Text>
                  <TextInput value={title} onChangeText={setTitle} placeholder="Book title" style={styles.formInput} />
                  <Text style={styles.formLabel}>Author</Text>
                  <TextInput value={author} onChangeText={setAuthor} placeholder="Author" style={styles.formInput} />
                  <View style={styles.formRow}>
                    <View style={styles.formHalf}>
                      <Text style={styles.formLabel}>Price (₱)</Text>
                      <TextInput value={price} onChangeText={setPrice} placeholder="799" style={styles.formInput} keyboardType="decimal-pad" />
                    </View>
                    <View style={styles.formHalf}>
                      <Text style={styles.formLabel}>Stock</Text>
                      <TextInput value={stock} onChangeText={setStock} placeholder="20" style={styles.formInput} keyboardType="number-pad" />
                    </View>
                  </View>
                  <Text style={styles.formLabel}>Category</Text>
                  <View style={styles.chips}>
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <Pressable key={c} style={[styles.chip, category === c && styles.chipOn]} onPress={() => setCategory(c)}>
                        <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.formLabel}>Blurb</Text>
                  <TextInput value={blurb} onChangeText={setBlurb} placeholder="Short description" style={[styles.formInput, styles.multiline]} multiline />
                  {formError ? <Text style={styles.formError}>{formError}</Text> : null}
                  <Pressable style={[styles.btnPrimary, busy && styles.disabled]} disabled={busy} onPress={submitBook}>
                    <Text style={styles.btnPrimaryText}>{busy ? 'Adding…' : 'Add book'}</Text>
                  </Pressable>
                </View>

                {books.map((b) => (
                  <View key={b.id} style={styles.bookRow}>
                    <View style={styles.bookInfo}>
                      <Text style={styles.bookTitle}>{b.title}</Text>
                      <Text style={styles.muted}>
                        {b.author} • {b.category} • {formatPeso(b.price)} • ★ {b.rating.toFixed(1)}
                      </Text>
                      <View style={styles.stockEdit}>
                        <Text style={styles.muted}>Stock:</Text>
                        <TextInput
                          value={editingStock[b.id] ?? String(b.stock ?? 20)}
                          onChangeText={(v) => setEditingStock((prev) => ({ ...prev, [b.id]: v }))}
                          style={styles.stockInput}
                          keyboardType="number-pad"
                        />
                        {editingStock[b.id] !== undefined ? (
                          <Pressable style={styles.saveBtn} onPress={() => void saveStock(b.id)}>
                            <Text style={styles.saveText}>Save</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.bookActions}>
                      <Pressable onPress={() => router.push(`/book/${b.id}`)}>
                        <Text style={styles.viewText}>View</Text>
                      </Pressable>
                      <Pressable onPress={() => removeBook(b.id, b.title)}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {view === 'customers' ? (
              <View style={styles.panel}>
                <View style={styles.panelHead}>
                  <View>
                    <Text style={styles.panelTitle}>Customers</Text>
                    <Text style={styles.panelSub}>{profiles.length} account{profiles.length === 1 ? '' : 's'}</Text>
                  </View>
                </View>
                {profiles.map((p) => {
                  const count = orders.filter((o) => o.userId === p.id).length;
                  return (
                    <View key={p.id} style={styles.custRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(p.name || '?').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.custInfo}>
                        <Text style={styles.custName} numberOfLines={1}>
                          {p.name}
                          {p.isAdmin ? ' ★' : ''}
                        </Text>
                        <Text style={styles.muted} numberOfLines={1}>
                          {p.email}
                        </Text>
                      </View>
                      <Text style={styles.custMeta}>
                        {count} order{count === 1 ? '' : 's'}
                      </Text>
                      <Text style={styles.muted}>{fmtDate(p.createdAt)}</Text>
                    </View>
                  );
                })}
                {profiles.length === 0 ? <Text style={styles.muted}>No customer accounts yet.</Text> : null}
              </View>
            ) : null}

            {view === 'inventory' ? (
              <View style={styles.panel}>
                <View style={styles.panelHead}>
                  <View>
                    <Text style={styles.panelTitle}>Inventory</Text>
                    <Text style={styles.panelSub}>Lowest stock first</Text>
                  </View>
                </View>
                {[...books]
                  .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
                  .map((b) => {
                    const tone = coverTone(b.tone);
                    return (
                      <View key={b.id} style={styles.stockRow}>
                        <View style={[styles.stockThumb, { backgroundColor: tone.bg }]}>
                          <Text style={[styles.stockThumbText, { color: tone.fg }]}>{b.title.charAt(0)}</Text>
                        </View>
                        <View style={styles.stockInfo}>
                          <Text style={styles.stockTitle} numberOfLines={1}>
                            {b.title}
                          </Text>
                          <Text style={styles.stockSub}>{b.stock} left • {formatPeso(b.price)}</Text>
                        </View>
                        <TextInput
                          value={editingStock[b.id] ?? String(b.stock ?? 0)}
                          onChangeText={(v) => setEditingStock((prev) => ({ ...prev, [b.id]: v }))}
                          style={styles.stockInput}
                          keyboardType="number-pad"
                        />
                        {editingStock[b.id] !== undefined ? (
                          <Pressable style={styles.saveBtn} onPress={() => void saveStock(b.id)}>
                            <Text style={styles.saveText}>Save</Text>
                          </Pressable>
                        ) : (
                          <Pressable style={styles.restock} onPress={() => restock(b.id, b.stock ?? 0)}>
                            <Text style={styles.restockText}>+20</Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
              </View>
            ) : null}

            {view === 'categories' ? (
              <View style={styles.panel}>
                <View style={styles.panelHead}>
                  <View>
                    <Text style={styles.panelTitle}>Top categories</Text>
                    <Text style={styles.panelSub}>By catalogue and sales</Text>
                  </View>
                </View>
                {catStats.map((c) => (
                  <Pressable
                    key={c.name}
                    style={styles.catRow}
                    onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { cat: c.name } })}>
                    <View style={styles.catDot} />
                    <View style={styles.catInfo}>
                      <Text style={styles.catName}>{c.name}</Text>
                      <Text style={styles.muted}>
                        {c.books} book{c.books === 1 ? '' : 's'} • {c.sold} sold • {formatPeso(c.revenue)}
                      </Text>
                    </View>
                    <Icon name="chevron" size={15} color={BRAND.brown} />
                  </Pressable>
                ))}
              </View>
            ) : null}

            {view === 'reports' ? (
              <View style={styles.panel}>
                <View style={styles.panelHead}>
                  <View>
                    <Text style={styles.panelTitle}>Reports</Text>
                    <Text style={styles.panelSub}>All orders, newest first</Text>
                  </View>
                </View>
                {[...orders]
                  .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                  .slice(0, 20)
                  .map((o) => (
                    <Pressable key={o.id} style={styles.repRow} onPress={() => router.push(`/order/${o.id}`)}>
                      <Text style={styles.repBold}>#{orderNumber(o.id)}</Text>
                      <Text style={styles.repCust} numberOfLines={1}>
                        {o.name}
                      </Text>
                      <Text style={styles.muted}>{fmtDate(o.createdAt)}</Text>
                      <Text style={styles.repBold}>{formatPeso(o.total)}</Text>
                      <StatusPill status={o.status} small />
                    </Pressable>
                  ))}
                {orders.length === 0 ? <Text style={styles.muted}>No orders yet.</Text> : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>

      <Modal visible={drawer} transparent animationType="slide" onRequestClose={() => setDrawer(false)}>
        <Pressable style={styles.backdrop} onPress={() => setDrawer(false)}>
          <Pressable style={styles.drawer} onPress={() => {}}>
            {side}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const TINT08 = 'rgba(122, 84, 46, 0.08)';
const TINT15 = 'rgba(122, 84, 46, 0.15)';
const TINT25 = 'rgba(122, 84, 46, 0.25)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TINT08 },
  gate: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  gateCard: { maxWidth: 420, width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: TINT15, borderRadius: 20, padding: 28 },
  gateTitle: { fontSize: 26, color: BRAND.text, marginBottom: 8, fontFamily: FONTS.serifBold },
  gateCopy: { color: BRAND.muted, marginBottom: 16, fontFamily: FONTS.sans },
  shell: { flex: 1, flexDirection: 'row' },
  // Sidebar
  side: { width: 260, backgroundColor: BRAND.ink, paddingHorizontal: 18, paddingVertical: 24 },
  sideDrawer: { width: 260, height: '100%' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingBottom: 28 },
  brandText: { fontSize: 19, color: '#fff', flex: 1, fontFamily: FONTS.serifBold },
  adminBadge: { backgroundColor: BRAND.brown, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5 },
  adminBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  sideNav: { gap: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 13, height: 44, borderRadius: 11, paddingHorizontal: 13 },
  navOn: { backgroundColor: BRAND.brown },
  navText: { color: 'rgba(255,255,255,0.68)', fontSize: 12, flex: 1, fontFamily: FONTS.sans },
  navTextOn: { color: '#fff' },
  navCount: { backgroundColor: '#fff', borderRadius: 10, minWidth: 22, height: 19, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  navCountText: { color: BRAND.ink, fontSize: 10, fontWeight: '700' },
  sideUser: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', marginTop: 'auto', paddingTop: 20, paddingHorizontal: 5 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: BRAND.brown, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  sideUserInfo: { flex: 1 },
  sideUserName: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: FONTS.sansBold },
  sideUserEmail: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontFamily: FONTS.sans },
  // Main + topbar
  main: { flex: 1, minWidth: 0 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: TINT15,
    minHeight: 76,
    paddingHorizontal: 24,
    paddingVertical: 12,
    zIndex: 5,
  },
  topTitle: { marginRight: 'auto' },
  topH1: { fontSize: 22, color: BRAND.text, fontFamily: FONTS.serifBold },
  topSub: { color: BRAND.brown, fontSize: 10, marginTop: 3, fontFamily: FONTS.sans },
  storefront: { color: BRAND.brown, fontSize: 12, fontWeight: '600', fontFamily: FONTS.sansSemi },
  topSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: TINT15,
    width: 250,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  topSearchInput: { flex: 1, fontSize: 12, color: BRAND.text, fontFamily: FONTS.sans },
  rangePicker: { height: 40, minWidth: 130 },
  bellDot: { position: 'absolute', top: 1, right: 1, width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND.ink },
  bellPop: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 240,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TINT15,
    borderRadius: 12,
    padding: 12,
    zIndex: 10,
    shadowColor: BRAND.ink,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  bellTitle: { fontSize: 12, fontWeight: '700', color: BRAND.text, marginBottom: 8, fontFamily: FONTS.sansBold },
  bellRow: { paddingVertical: 6 },
  bellText: { fontSize: 11, color: BRAND.text, fontFamily: FONTS.sans },
  content: { padding: 24, paddingBottom: 48 },
  // KPIs
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 18 },
  kpi: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TINT15,
    borderRadius: 17,
    padding: 17,
    minWidth: 150,
  },
  kpiInv: { backgroundColor: BRAND.ink, borderColor: BRAND.ink },
  kpiIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: TINT08, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  kpiLabel: { color: BRAND.brown, fontSize: 10, fontFamily: FONTS.sans },
  kpiLabelInv: { color: 'rgba(255,255,255,0.6)' },
  kpiValue: { fontSize: 24, color: BRAND.text, marginTop: 2, fontFamily: FONTS.serifBold },
  kpiValueInv: { color: '#fff' },
  kpiDelta: { color: BRAND.brown, backgroundColor: TINT08, borderRadius: 9, alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 7, paddingVertical: 4, fontSize: 8, fontFamily: FONTS.sans },
  kpiDeltaInv: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' },
  // Panels + rows
  row: { flexDirection: 'row', gap: 18, marginBottom: 18 },
  rowStack: { flexDirection: 'column' },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: TINT15, borderRadius: 18, padding: 19 },
  salesPanel: { flex: 1.9 },
  donutPanel: { flex: 1 },
  recentPanel: { flex: 1.9 },
  stockPanel: { flex: 1 },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  panelTitle: { fontSize: 17, color: BRAND.text, fontFamily: FONTS.serifSemi },
  panelSub: { color: BRAND.brown, marginTop: 4, fontSize: 9, fontFamily: FONTS.sans },
  viewAll: { color: BRAND.brown, fontSize: 11, fontWeight: '600', fontFamily: FONTS.sansSemi },
  toggle: { flexDirection: 'row', backgroundColor: TINT08, borderRadius: 9, padding: 3 },
  toggleBtn: { borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  toggleOn: { backgroundColor: '#fff' },
  toggleText: { color: BRAND.brown, fontSize: 9, fontFamily: FONTS.sans },
  toggleTextOn: { color: BRAND.text, fontWeight: '700' },
  chart: { height: 220, marginTop: 18, position: 'relative', paddingBottom: 22 },
  chartLine: { borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: TINT15, marginBottom: 52 },
  bars: { position: 'absolute', top: 0, bottom: 22, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barCol: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 7 },
  bar: { width: '100%', maxWidth: 23, borderRadius: 6, backgroundColor: BRAND.ink, opacity: 0.88 },
  barLabel: { color: BRAND.brown, fontSize: 8, fontFamily: FONTS.sans },
  donutWrap: { flexDirection: 'row', alignItems: 'center', gap: 22, minHeight: 220, marginTop: 8 },
  donut: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutTotal: { fontSize: 18, color: BRAND.text, fontFamily: FONTS.serifBold },
  donutCap: { color: BRAND.brown, fontSize: 8, fontFamily: FONTS.sans },
  legend: { flex: 1, minWidth: 100 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginVertical: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 9, color: BRAND.text, fontFamily: FONTS.sans },
  legendVal: { fontSize: 9, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  table: { marginTop: 15, marginHorizontal: -19 },
  tableWide: { minWidth: 620 },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: TINT15,
    minHeight: 47,
    paddingHorizontal: 16,
  },
  trHead: { backgroundColor: TINT08, minHeight: 34, borderTopWidth: 0 },
  thText: { flex: 1, color: BRAND.brown, fontSize: 9, fontFamily: FONTS.sans },
  tdBold: { flex: 1, fontWeight: '700', fontSize: 9, color: BRAND.text, fontFamily: FONTS.sansBold },
  td: { flex: 1, fontSize: 9, color: BRAND.text, fontFamily: FONTS.sans },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: TINT15, paddingVertical: 12 },
  stockThumb: { width: 35, height: 46, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  stockThumbText: { fontSize: 18, fontFamily: FONTS.serifBold },
  stockInfo: { flex: 1 },
  stockTitle: { fontSize: 10, color: BRAND.text, fontFamily: FONTS.serifSemi },
  stockSub: { color: BRAND.brown, fontSize: 8, fontWeight: '700', marginTop: 5, fontFamily: FONTS.sansBold },
  restock: { backgroundColor: BRAND.ink, borderRadius: 8, paddingHorizontal: 9, height: 29, alignItems: 'center', justifyContent: 'center' },
  restockText: { color: '#fff', fontSize: 8, fontWeight: '700', fontFamily: FONTS.sansBold },
  stockInput: { borderWidth: 1, borderColor: TINT25, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 56, textAlign: 'center', fontWeight: '700' },
  saveBtn: { backgroundColor: BRAND.text, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  // Books CRUD
  booksWrap: { gap: 8 },
  formCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: TINT15, borderRadius: 18, padding: 19, marginBottom: 8 },
  formTitle: { fontSize: 17, color: BRAND.text, marginBottom: 8, fontFamily: FONTS.serifSemi },
  formLabel: { fontWeight: '700', color: BRAND.text, marginTop: 10, marginBottom: 4, fontSize: 12, fontFamily: FONTS.sansBold },
  formInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: TINT25, borderRadius: 10, padding: 12, fontFamily: FONTS.sans },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 8 },
  formHalf: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderWidth: 1, borderColor: TINT25, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { backgroundColor: BRAND.text, borderColor: BRAND.text },
  chipText: { color: BRAND.text, fontWeight: '600', fontSize: 12 },
  chipTextOn: { color: '#fff' },
  formError: { color: '#B91C1C', fontWeight: '700', marginTop: 8, fontSize: 12 },
  btnPrimary: { backgroundColor: BRAND.text, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: FONTS.sansBold },
  disabled: { opacity: 0.5 },
  bookRow: { backgroundColor: '#fff', borderWidth: 1, borderColor: TINT15, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', gap: 12, alignItems: 'center' },
  bookInfo: { flex: 1 },
  bookTitle: { fontWeight: '700', color: BRAND.text, fontSize: 13, fontFamily: FONTS.sansBold },
  muted: { color: BRAND.muted, fontSize: 12, fontFamily: FONTS.sans },
  stockEdit: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  bookActions: { alignItems: 'flex-end', gap: 8 },
  viewText: { fontWeight: '700', color: BRAND.brown, fontSize: 12 },
  deleteText: { color: '#B91C1C', fontWeight: '700', fontSize: 12 },
  // Customers / categories / reports
  custRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: TINT15, paddingVertical: 12 },
  custInfo: { flex: 1 },
  custName: { fontSize: 13, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  custMeta: { fontSize: 11, color: BRAND.brown, fontFamily: FONTS.sans },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: TINT15, paddingVertical: 12 },
  catDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: BRAND.brown },
  catInfo: { flex: 1 },
  catName: { fontSize: 13, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  repRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: TINT15, paddingVertical: 10 },
  repBold: { fontSize: 11, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  repCust: { flex: 1, fontSize: 11, color: BRAND.text, fontFamily: FONTS.sans },
  // Drawer
  backdrop: { flex: 1, backgroundColor: 'rgba(37, 22, 5, 0.4)' },
  drawer: { width: 260, height: '100%' },
});
