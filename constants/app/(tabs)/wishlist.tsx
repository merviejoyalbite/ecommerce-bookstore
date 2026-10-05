import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { BRAND, FONTS, coverTone } from '@/constants/theme';
import { formatPeso, type Book } from '@/data/books';
import { Icon, type IconName } from '@/components/icons';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useShop } from '@/store/shop';

const SORTS = ['Recently added', 'Price low to high', 'Price high to low', 'Title A to Z'] as const;

type Toast = { msg: string; action: string; onAction: () => void } | null;

function stockLabel(book: Book): string {
  const s = book.stock ?? 20;
  if (s <= 0) return 'Out of stock';
  if (s <= 10) return 'Low stock';
  return 'In stock';
}

function badgeOf(book: Book): string | null {
  if ((book.stock ?? 1) <= 0) return 'Sold out';
  if (book.badge) return book.badge;
  if (book.oldPrice != null) return 'On sale';
  return null;
}

export default function WishlistScreen() {
  const { user } = useAuth();
  const cart = useCart();
  const { books, wishlist, refreshWishlist, toggleWishlist } = useShop();
  const { small } = useBreakpoint();
  const [chip, setChip] = useState('All');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Recently added');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      void refreshWishlist(user?.id ?? null);
    }, [refreshWishlist, user?.id]),
  );

  const showToast = useCallback((msg: string, action: string, onAction: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, action, onAction });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const saved = useMemo(() => books.filter((b) => wishlist.includes(b.id)), [books, wishlist]);

  const chips = useMemo(() => {
    const cats = [...new Set(saved.map((b) => b.category))];
    return ['All', 'On sale', ...cats];
  }, [saved]);

  const visible = useMemo(() => {
    let t = chip === 'All' ? saved : chip === 'On sale' ? saved.filter((b) => b.oldPrice != null) : saved.filter((b) => b.category === chip);
    t = [...t];
    if (sort === 'Price low to high') t.sort((a, b) => a.price - b.price);
    else if (sort === 'Price high to low') t.sort((a, b) => b.price - a.price);
    else if (sort === 'Title A to Z') t.sort((a, b) => a.title.localeCompare(b.title));
    return t;
  }, [saved, chip, sort]);

  const combined = saved.reduce((a, b) => a + b.price, 0);
  const onSale = saved.filter((b) => b.oldPrice != null).length;

  const recs = useMemo(() => {
    const cats = new Set(saved.map((b) => b.category));
    return books.filter((b) => !wishlist.includes(b.id) && cats.has(b.category)).sort((a, b) => b.rating - a.rating).slice(0, 8);
  }, [books, saved, wishlist]);

  const remove = (b: Book) => {
    if (!user) return;
    void toggleWishlist(user.id, b.id);
    showToast('Removed from wishlist', 'Undo', () => {
      if (user) void toggleWishlist(user.id, b.id);
    });
  };

  const addToCart = (b: Book) => {
    if ((b.stock ?? 1) <= 0) return;
    cart.add(b, 1);
    showToast('Added to cart', 'View cart →', () => router.push('/(tabs)/cart'));
  };

  const addAll = (move: boolean) => {
    const available = visible.filter((b) => (b.stock ?? 1) > 0);
    for (const b of available) cart.add(b, 1);
    if (move && user) for (const b of available) void toggleWishlist(user.id, b.id);
    showToast(`Added ${available.length} book${available.length === 1 ? '' : 's'} to cart`, 'View cart →', () =>
      router.push('/(tabs)/cart'),
    );
  };

  const wishCard = (b: Book) => {
    const tone = coverTone(b.tone);
    const badge = badgeOf(b);
    const soldOut = (b.stock ?? 1) <= 0;
    return (
      <View key={b.id} style={[styles.card, small && styles.cardSmall, soldOut && styles.cardDim]}>
        <Pressable style={styles.coverWrap} onPress={() => router.push(`/book/${b.id}`)}>
          <View style={[styles.cover, { backgroundColor: tone.bg }]}>
            <Text style={[styles.coverTitle, { color: tone.fg }]} numberOfLines={3}>
              {b.title}
            </Text>
            <Text style={[styles.coverAuthor, { color: tone.fg }]} numberOfLines={1}>
              {b.author}
            </Text>
            <Text style={[styles.coverOrn, { color: tone.fg }]}>❦</Text>
          </View>
          {badge && !soldOut ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
          {soldOut ? (
            <View style={styles.soldBadge}>
              <Text style={styles.badgeText}>Sold out</Text>
            </View>
          ) : null}
          <Pressable
            style={styles.heart}
            hitSlop={14}
            accessibilityLabel={`Remove ${b.title} from wishlist`}
            onPress={() => remove(b)}>
            <Icon name="heart" size={18} color={BRAND.brown} filled />
          </Pressable>
        </Pressable>
        <View style={styles.copy}>
          <Pressable onPress={() => router.push(`/book/${b.id}`)}>
            <Text style={[styles.cardTitle, small && styles.cardTitleSmall]} numberOfLines={2}>
              {b.title}
            </Text>
          </Pressable>
          <Text style={styles.cardAuthor} numberOfLines={1}>
            {b.author}
          </Text>
          {!(small) ? (
            <View style={styles.ratingRow}>
              <Icon name="star" size={11} color={BRAND.brown} />
              <Text style={styles.ratingText}>
                {b.rating.toFixed(1)}
                {b.reviewCount ? ` (${b.reviewCount})` : ''}
              </Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPeso(b.price)}</Text>
            {b.oldPrice != null ? <Text style={styles.old}>{formatPeso(b.oldPrice)}</Text> : null}
          </View>
          {!(small) ? <Text style={styles.stock}>{stockLabel(b)}</Text> : null}
          <View style={styles.cardActions}>
            <Pressable
              style={[styles.addBtn, small && styles.addBtnSmall, soldOut && styles.disabled]}
              disabled={soldOut}
              accessibilityLabel={`Add ${b.title} to cart`}
              onPress={() => addToCart(b)}>
              <Icon name="bag" size={small ? 16 : 14} color="#fff" />
              {!small ? <Text style={styles.addText}>Add to cart</Text> : null}
            </Pressable>
            {!small ? (
              <Pressable style={styles.trashBtn} accessibilityLabel={`Remove ${b.title} from wishlist`} onPress={() => remove(b)}>
                <Icon name="trash" size={16} color={BRAND.brown} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const wishRow = (b: Book) => {
    const tone = coverTone(b.tone);
    const soldOut = (b.stock ?? 1) <= 0;
    const avail = stockLabel(b);
    return (
      <View key={b.id} style={[styles.row, small && styles.rowSmall]}>
        <Pressable onPress={() => router.push(`/book/${b.id}`)}>
          <View style={[styles.rowCover, { backgroundColor: tone.bg }]}>
            <Text style={[styles.rowCoverTitle, { color: tone.fg }]} numberOfLines={2}>
              {b.title}
            </Text>
          </View>
        </Pressable>
        <View style={styles.rowInfo}>
          <Pressable onPress={() => router.push(`/book/${b.id}`)}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {b.title}
            </Text>
          </Pressable>
          <Text style={styles.rowAuthor} numberOfLines={1}>
            {b.author}
          </Text>
        </View>
        {!small ? (
          <View style={styles.avail}>
            <View style={[styles.dot, soldOut && styles.dotOff]} />
            <Text style={styles.availText}>{avail}</Text>
          </View>
        ) : null}
        {!small ? <Text style={styles.rowPrice}>{formatPeso(b.price)}</Text> : null}
        <Pressable
          style={[styles.rowAdd, soldOut && styles.disabled]}
          disabled={soldOut}
          accessibilityLabel={`Add ${b.title} to cart`}
          onPress={() => addToCart(b)}>
          <Icon name="bag" size={15} color="#fff" />
          {!small ? <Text style={styles.addText}>Add</Text> : null}
        </Pressable>
        {!small ? (
          <Pressable style={styles.trashBtn} accessibilityLabel={`Remove ${b.title} from wishlist`} onPress={() => remove(b)}>
            <Icon name="trash" size={16} color={BRAND.brown} />
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SiteHeader />
      <ScrollView contentContainerStyle={styles.shell}>
        <View style={styles.body}>
        <Text style={styles.crumb}>
          Home <Text style={styles.crumbDim}>/ </Text>
          <Text style={styles.crumbHere}>My wishlist</Text>
        </Text>

        <View style={styles.heading}>
          <View>
            <Text style={[styles.h1, small && styles.h1Small]}>My wishlist</Text>
            <View style={styles.accent} />
            <Text style={styles.sub}>
              {saved.length} book{saved.length === 1 ? '' : 's'} saved
            </Text>
          </View>
          <View style={styles.tools}>
            {!small ? (
              <View style={styles.sortWrap}>
                <Text style={styles.sortLabel}>Sort by</Text>
                <Picker
                  selectedValue={sort}
                  onValueChange={(v) => setSort(v)}
                  style={styles.picker}
                  accessibilityLabel="Sort by">
                  {SORTS.map((s) => (
                    <Picker.Item key={s} label={s} value={s} />
                  ))}
                </Picker>
              </View>
            ) : null}
            {!small ? (
              <View style={styles.viewToggle}>
                <Pressable
                  style={[styles.viewBtn, view === 'grid' && styles.viewOn]}
                  accessibilityLabel="Grid view"
                  onPress={() => setView('grid')}>
                  <Icon name="grid" size={15} color={BRAND.text} />
                </Pressable>
                <Pressable
                  style={[styles.viewBtn, view === 'list' && styles.viewOn]}
                  accessibilityLabel="List view"
                  onPress={() => setView('list')}>
                  <Icon name="list" size={15} color={BRAND.text} />
                </Pressable>
              </View>
            ) : null}
            {saved.length > 0 ? (
              <Pressable style={[styles.primary, small && styles.addAllSmall]} onPress={() => addAll(false)}>
                <Icon name="bag" size={14} color="#fff" />
                <Text style={styles.primaryText}>Add all to cart</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        {small ? (
          <View style={styles.sortWrapFull}>
            <Text style={styles.sortLabel}>Sort & filter</Text>
            <Picker selectedValue={sort} onValueChange={(v) => setSort(v)} style={styles.pickerFull} accessibilityLabel="Sort and filter">
              {SORTS.map((s) => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>
        ) : null}

        {!user ? (
          <View style={styles.signin}>
            <Text style={styles.signinTitle}>Sign in to sync your wishlist</Text>
            <Text style={styles.signinCopy}>Saved books live here once you have an account.</Text>
            <Pressable style={styles.primary} onPress={() => router.push('/(tabs)/account')}>
              <Text style={styles.primaryText}>Go to account</Text>
            </Pressable>
          </View>
        ) : saved.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No saved books here</Text>
            <Text style={styles.emptyCopy}>Tap the heart on any book to keep it here.</Text>
            <Pressable style={styles.primary} onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.primaryText}>Browse catalog</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.strip, small && styles.stripSmall]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripStats}>
                {(
                  [
                    { icon: 'book', small: 'Saved titles', strong: `${saved.length} book${saved.length === 1 ? '' : 's'}` },
                    { icon: 'bag', small: 'Combined price', strong: `Total ${formatPeso(combined)}` },
                    { icon: 'calendar', small: 'Special offers', strong: `${onSale} on sale` },
                  ] as { icon: IconName; small: string; strong: string }[]
                ).map((s) => (
                  <View key={s.small} style={styles.stat}>
                    <View style={styles.statIcon}>
                      <Icon name={s.icon} size={17} color={BRAND.brown} />
                    </View>
                    <View>
                      <Text style={styles.statSmall}>{s.small}</Text>
                      <Text style={styles.statStrong}>{s.strong}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <Pressable style={styles.primary} onPress={() => addAll(true)}>
                <Icon name="bag" size={14} color="#fff" />
                <Text style={styles.primaryText}>Move all to cart</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {chips.map((c) => (
                <Pressable key={c} style={[styles.chip, chip === c && styles.chipOn]} onPress={() => setChip(c)}>
                  <Text style={[styles.chipText, chip === c && styles.chipTextOn]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {view === 'grid' || small ? (
              <View style={[styles.grid, small && styles.gridSmall]}>{visible.map(wishCard)}</View>
            ) : (
              <View style={styles.list}>{visible.map(wishRow)}</View>
            )}
            {visible.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Nothing under this filter</Text>
                <Pressable style={styles.primary} onPress={() => setChip('All')}>
                  <Text style={styles.primaryText}>Show everything</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}

        {recs.length > 0 ? (
          <View style={styles.recs}>
            <View style={styles.recHead}>
              <View>
                <Text style={styles.recEyebrow}>Handpicked for you</Text>
                <Text style={[styles.recTitle, small && styles.recTitleSmall]}>Because you saved these</Text>
              </View>
              <View style={styles.recNav}>
                {!small ? (
                  <>
                    <Pressable style={styles.arrow} accessibilityLabel="Scroll recommendations back" onPress={() => recRef.current?.scrollTo({ x: 0, animated: true })}>
                      <Icon name="chevron" size={16} color={BRAND.text} />
                    </Pressable>
                    <Pressable style={styles.arrow} accessibilityLabel="Scroll recommendations forward" onPress={() => recRef.current?.scrollToEnd({ animated: true })}>
                      <View style={styles.flip}>
                        <Icon name="chevron" size={16} color={BRAND.text} />
                      </View>
                    </Pressable>
                  </>
                ) : null}
                <Pressable onPress={() => router.push('/(tabs)/catalog')}>
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              </View>
            </View>
            <ScrollView ref={recRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recGrid}>
              {recs.map((b) => {
                const tone = coverTone(b.tone);
                return (
                  <Pressable key={b.id} style={[styles.recCard, small && styles.recCardSmall]} onPress={() => router.push(`/book/${b.id}`)}>
                    <View style={[styles.recCover, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.recCoverTitle, { color: tone.fg }]} numberOfLines={2}>
                        {b.title}
                      </Text>
                    </View>
                    <Text style={styles.recName} numberOfLines={1}>
                      {b.title}
                    </Text>
                    <Text style={styles.recAuthor} numberOfLines={1}>
                      {b.author}
                    </Text>
                    <Text style={styles.recPrice}>{formatPeso(b.price)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
        </View>
        <SiteFooter />
      </ScrollView>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastMsg} numberOfLines={1}>
            {toast.msg}
          </Text>
          <Pressable
            onPress={() => {
              toast.onAction();
              if (toastTimer.current) clearTimeout(toastTimer.current);
              setToast(null);
            }}>
            <Text style={styles.toastAction}>{toast.action}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const TINT = 'rgba(122, 84, 46, 0.08)';
const LINE = 'rgba(122, 84, 46, 0.15)';
const MID = 'rgba(122, 84, 46, 0.25)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  shell: { paddingBottom: 0 },
  body: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 30, paddingBottom: 48 },
  crumb: { color: BRAND.brown, fontSize: 13, marginBottom: 26, fontFamily: FONTS.sans },
  crumbDim: { opacity: 0.55 },
  crumbHere: { color: BRAND.text, fontWeight: '500' },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  h1: { fontSize: 40, color: BRAND.text, letterSpacing: -0.4, fontFamily: FONTS.serifBold, lineHeight: 44 },
  h1Small: { fontSize: 34 },
  accent: { backgroundColor: BRAND.brown, borderRadius: 2, width: 48, height: 3, marginTop: 11, marginBottom: 12 },
  sub: { color: BRAND.brown, fontSize: 14, fontFamily: FONTS.sans },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sortWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: MID, borderRadius: 12, height: 44, paddingLeft: 11, paddingRight: 4 },
  sortWrapFull: { borderWidth: 1, borderColor: MID, borderRadius: 12, height: 44, paddingLeft: 11, paddingRight: 4, marginBottom: 16 },
  sortLabel: { fontSize: 12, color: BRAND.brown, fontFamily: FONTS.sans },
  picker: { width: 150, height: 44, fontSize: 12 },
  pickerFull: { flex: 1, height: 44, fontSize: 12 },
  viewToggle: { flexDirection: 'row', backgroundColor: TINT, borderRadius: 12, height: 44, padding: 3 },
  viewBtn: { width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  viewOn: { backgroundColor: '#fff' },
  primary: { flexDirection: 'row', backgroundColor: BRAND.ink, borderRadius: 12, height: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '600', fontFamily: FONTS.sansSemi },
  addAllSmall: { width: '100%', marginTop: 12 },
  // Summary strip
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 38,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: TINT,
    borderRadius: 16,
    minHeight: 96,
    padding: 20,
    marginBottom: 24,
  },
  stripSmall: { flexDirection: 'column', alignItems: 'stretch', gap: 16, borderLeftWidth: 0, borderRightWidth: 0, borderRadius: 0, marginHorizontal: -24, paddingHorizontal: 24 },
  stripStats: { flexDirection: 'row', gap: 28, flex: 1 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 150 },
  statIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  statSmall: { color: BRAND.brown, fontSize: 11, fontFamily: FONTS.sans },
  statStrong: { fontSize: 14, color: BRAND.text, fontFamily: FONTS.serifSemi },
  // Chips
  chips: { gap: 8, marginBottom: 24, paddingRight: 16 },
  chip: { backgroundColor: TINT, borderRadius: 18, height: 36, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: BRAND.ink },
  chipText: { fontSize: 12, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
  chipTextOn: { color: '#fff' },
  // Grid cards
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  gridSmall: { gap: 12 },
  card: { width: '31%', backgroundColor: '#fff', borderWidth: 1, borderColor: LINE, borderRadius: 20, padding: 16 },
  cardSmall: { width: '48%', borderRadius: 15, padding: 8 },
  cardDim: { opacity: 1 },
  coverWrap: { aspectRatio: 3 / 4, backgroundColor: TINT, borderRadius: 10, position: 'relative', overflow: 'hidden' },
  cover: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 16 },
  coverTitle: { fontSize: 15, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONTS.serifBold, lineHeight: 18 },
  coverAuthor: { fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 14, fontFamily: FONTS.sans },
  coverOrn: { position: 'absolute', bottom: '11%', fontSize: 18 },
  badge: { position: 'absolute', top: 12, left: 12, backgroundColor: BRAND.ink, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600', fontFamily: FONTS.sansSemi },
  soldBadge: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -32 }, { translateY: -12 }], backgroundColor: BRAND.ink, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  heart: { position: 'absolute', top: 11, right: 11, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  copy: {},
  cardTitle: { fontSize: 17, color: BRAND.text, minHeight: 44, marginTop: 16, marginBottom: 5, lineHeight: 22, fontFamily: FONTS.serifBold },
  cardTitleSmall: { fontSize: 14, minHeight: 37, marginTop: 10, marginBottom: 3 },
  cardAuthor: { color: BRAND.brown, fontSize: 13, marginBottom: 9, fontFamily: FONTS.sans },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  ratingText: { color: BRAND.brown, fontSize: 11, fontFamily: FONTS.sans },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 5 },
  price: { fontSize: 18, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  old: { color: BRAND.brown, fontSize: 12, textDecorationLine: 'line-through', fontFamily: FONTS.sans },
  stock: { color: BRAND.brown, fontSize: 11, fontFamily: FONTS.sans },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  addBtn: { flex: 1, flexDirection: 'row', backgroundColor: BRAND.ink, borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnSmall: { flex: 0, width: 36, height: 36, borderRadius: 18, marginLeft: 'auto', paddingHorizontal: 0 },
  addText: { color: '#fff', fontSize: 13, fontWeight: '600', fontFamily: FONTS.sansSemi },
  trashBtn: { width: 44, height: 44, borderWidth: 1, borderColor: MID, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
  // List rows
  list: { borderWidth: 1, borderColor: LINE, borderRadius: 20, paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 22, minHeight: 132, borderBottomWidth: 1, borderBottomColor: LINE },
  rowSmall: { minHeight: 104, gap: 12 },
  rowCover: { width: 72, height: 100, borderRadius: 8, alignItems: 'center', justifyContent: 'center', padding: 8 },
  rowCoverTitle: { fontSize: 7, textAlign: 'center', fontFamily: FONTS.serifBold },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, color: BRAND.text, fontFamily: FONTS.serifBold },
  rowAuthor: { color: BRAND.brown, fontSize: 12, marginTop: 4, fontFamily: FONTS.sans },
  avail: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 120 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BRAND.brown },
  dotOff: { backgroundColor: BRAND.faint },
  availText: { color: BRAND.brown, fontSize: 12, fontFamily: FONTS.sans },
  rowPrice: { width: 90, fontSize: 14, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  rowAdd: { flexDirection: 'row', width: 130, backgroundColor: BRAND.ink, borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', gap: 8 },
  // Empty / signin
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 22, color: BRAND.text, fontFamily: FONTS.serifBold },
  emptyCopy: { color: BRAND.brown, fontSize: 13, fontFamily: FONTS.sans },
  signin: { alignItems: 'flex-start', gap: 10, backgroundColor: TINT, borderRadius: 20, padding: 24, marginBottom: 8 },
  signinTitle: { fontSize: 20, color: BRAND.text, fontFamily: FONTS.serifBold },
  signinCopy: { color: BRAND.brown, fontSize: 13, fontFamily: FONTS.sans },
  // Recommendations
  recs: { borderTopWidth: 1, borderTopColor: LINE, marginTop: 72, paddingTop: 52, paddingBottom: 32 },
  recHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  recEyebrow: { textTransform: 'uppercase', color: BRAND.brown, letterSpacing: 2, fontSize: 10, fontWeight: '700', marginBottom: 5, fontFamily: FONTS.sansBold },
  recTitle: { fontSize: 28, color: BRAND.text, fontFamily: FONTS.serifBold },
  recTitleSmall: { fontSize: 23 },
  recNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: { width: 34, height: 34, borderWidth: 1, borderColor: MID, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  flip: { transform: [{ rotate: '180deg' }] },
  seeAll: { color: BRAND.brown, fontSize: 12, textDecorationLine: 'underline', marginLeft: 8, fontFamily: FONTS.sans },
  recGrid: { gap: 18 },
  recCard: { width: 200, borderWidth: 1, borderColor: LINE, borderRadius: 14, padding: 10 },
  recCardSmall: { width: 160 },
  recCover: { borderRadius: 6, width: 64, height: 88, alignItems: 'center', justifyContent: 'center', padding: 5 },
  recCoverTitle: { fontSize: 6, textAlign: 'center', fontFamily: FONTS.serifBold },
  recName: { fontSize: 13, color: BRAND.text, marginTop: 8, lineHeight: 17, fontFamily: FONTS.serifBold },
  recAuthor: { color: BRAND.brown, fontSize: 10, marginTop: 4, fontFamily: FONTS.sans },
  recPrice: { fontSize: 12, fontWeight: '700', color: BRAND.text, marginTop: 8, fontFamily: FONTS.sansBold },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BRAND.ink,
    borderRadius: 25,
    minWidth: 310,
    maxWidth: '90%',
    height: 50,
    paddingHorizontal: 18,
  },
  toastMsg: { color: '#fff', fontSize: 13, flex: 1, fontFamily: FONTS.sans },
  toastAction: { color: '#fff', fontWeight: '600', textDecorationLine: 'underline', fontSize: 13, fontFamily: FONTS.sansSemi },
});
