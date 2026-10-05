import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { BRAND, FONTS, coverTone } from '@/constants/theme';
import { CATEGORIES, FORMATS, formatPeso, type Book } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { Icon } from '@/components/icons';
import { SiteHeader } from '@/components/SiteHeader';
import { LogoWord } from '@/components/Logo';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useCart } from '@/store/cart';
import { useShop } from '@/store/shop';

type BadgeFilter = 'Best seller' | 'New' | null;

type Filters = {
  cats: string[];
  formats: string[];
  maxPrice: number;
  minRating: number;
  badge: BadgeFilter;
};

const DEFAULT_FILTERS: Filters = { cats: [], formats: [], maxPrice: 2500, minRating: 0, badge: null };
const PAGE_SIZE = 8;
const SORTS = ['Featured', 'Price low to high', 'Newest', 'Top rated'] as const;

function applyFilters(books: Book[], f: Filters, query: string): Book[] {
  const q = query.trim().toLowerCase();
  return books.filter((b) => {
    if (f.cats.length > 0 && !f.cats.includes(b.category)) return false;
    if (f.formats.length > 0 && !f.formats.includes(b.format)) return false;
    if (b.price > f.maxPrice) return false;
    if (f.minRating > 0 && b.rating < f.minRating) return false;
    if (f.badge && b.badge !== f.badge) return false;
    if (q && !b.title.toLowerCase().includes(q) && !b.author.toLowerCase().includes(q)) return false;
    return true;
  });
}

function sortBooks(books: Book[], sort: (typeof SORTS)[number]): Book[] {
  const arr = [...books];
  switch (sort) {
    case 'Price low to high':
      return arr.sort((a, b) => a.price - b.price);
    case 'Top rated':
      return arr.sort((a, b) => b.rating - a.rating);
    case 'Newest':
      return arr.sort((a, b) => {
        const an = a.id.startsWith('b-') ? 1 : 0;
        const bn = b.id.startsWith('b-') ? 1 : 0;
        if (an !== bn) return bn - an;
        return b.id.localeCompare(a.id);
      });
    default:
      return arr;
  }
}

function CheckRow({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable style={styles.checkRow} onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Icon name="check" size={12} color="#fff" /> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
      {count != null ? <Text style={styles.checkCount}>{count}</Text> : null}
    </Pressable>
  );
}

export default function CatalogScreen() {
  const { books, getBook } = useShop();
  const cart = useCart();
  const { small, medium, compactNav, stacked } = useBreakpoint();
  const params = useLocalSearchParams<{ q?: string; cat?: string; badge?: string }>();
  const paramKey = `${params.q ?? ''}|${params.cat ?? ''}|${params.badge ?? ''}`;
  const filtersFromParams = (): Filters => ({
    ...DEFAULT_FILTERS,
    cats: params.cat && (CATEGORIES as readonly string[]).includes(params.cat) && params.cat !== 'All' ? [params.cat] : [],
    badge: params.badge === 'New' || params.badge === 'Best seller' ? params.badge : null,
  });
  const [query, setQuery] = useState(params.q ?? '');
  const [applied, setApplied] = useState<Filters>(filtersFromParams);
  const [draft, setDraft] = useState<Filters>(applied);
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Featured');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  // Re-sync when arriving with new link params (same route doesn't remount).
  const [seenKey, setSeenKey] = useState(paramKey);
  if (paramKey !== seenKey) {
    const next = filtersFromParams();
    setSeenKey(paramKey);
    setQuery(params.q ?? '');
    setApplied(next);
    setDraft(next);
    setPage(1);
  }
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ cat: true, format: true, price: true, rating: true });
  const [newsEmail, setNewsEmail] = useState('');
  const [newsDone, setNewsDone] = useState(false);

  const catCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of books) map[b.category] = (map[b.category] ?? 0) + 1;
    return map;
  }, [books]);

  const results = useMemo(() => sortBooks(applyFilters(books, applied, query), sort), [books, applied, query, sort]);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const pageItems = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const commit = (f: Filters) => {
    setApplied(f);
    setDraft(f);
    setPage(1);
  };
  const clearAll = () => commit({ ...DEFAULT_FILTERS });
  const toggleList = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const minis = ['10', '11', '12'].map((id) => getBook(id)).filter((b): b is Book => Boolean(b));
  const cols = small ? 2 : medium ? 3 : 4;

  const filtersBody = (f: Filters, setF: (f: Filters) => void) => (
    <>
      <View style={styles.filterTop}>
        <Text style={styles.filterTitle}>Filters</Text>
        <Pressable onPress={() => { setF({ ...DEFAULT_FILTERS }); }}>
          <Text style={styles.clearTop}>Clear all filters</Text>
        </Pressable>
      </View>

      <View style={styles.filterSection}>
        <Pressable style={styles.filterHeading} onPress={() => setOpenSections((s) => ({ ...s, cat: !s.cat }))}>
          <Text style={styles.filterHeadingText}>Category</Text>
          <Icon name="chevron" size={15} color={BRAND.text} />
        </Pressable>
        {openSections.cat
          ? CATEGORIES.filter((c) => c !== 'All').map((c) => (
              <CheckRow
                key={c}
                label={c}
                count={catCounts[c] ?? 0}
                checked={f.cats.includes(c)}
                onToggle={() => setF({ ...f, cats: toggleList(f.cats, c) })}
              />
            ))
          : null}
      </View>

      <View style={styles.filterSection}>
        <Pressable style={styles.filterHeading} onPress={() => setOpenSections((s) => ({ ...s, format: !s.format }))}>
          <Text style={styles.filterHeadingText}>Format</Text>
          <Icon name="chevron" size={15} color={BRAND.text} />
        </Pressable>
        {openSections.format
          ? FORMATS.map((o) => (
              <CheckRow
                key={o}
                label={o}
                checked={f.formats.includes(o)}
                onToggle={() => setF({ ...f, formats: toggleList(f.formats, o) })}
              />
            ))
          : null}
      </View>

      <View style={styles.filterSection}>
        <Pressable style={styles.filterHeading} onPress={() => setOpenSections((s) => ({ ...s, price: !s.price }))}>
          <Text style={styles.filterHeadingText}>Price range</Text>
          <Icon name="chevron" size={15} color={BRAND.text} />
        </Pressable>
        {openSections.price ? (
          <>
            <Slider
              minimumValue={200}
              maximumValue={2500}
              step={50}
              value={f.maxPrice}
              onValueChange={(v) => setF({ ...f, maxPrice: Math.round(v) })}
              minimumTrackTintColor={BRAND.brown}
              maximumTrackTintColor={BRAND.border}
              style={styles.slider}
              aria-label="Maximum price"
            />
            <View style={styles.rangeRow}>
              <Text style={styles.rangeText}>{formatPeso(200)}</Text>
              <Text style={styles.rangeText}>{formatPeso(f.maxPrice)}</Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.filterSectionLast}>
        <Pressable style={styles.filterHeading} onPress={() => setOpenSections((s) => ({ ...s, rating: !s.rating }))}>
          <Text style={styles.filterHeadingText}>Rating</Text>
          <Icon name="chevron" size={15} color={BRAND.text} />
        </Pressable>
        {openSections.rating
          ? [4, 3].map((r) => (
              <CheckRow
                key={r}
                label={`${r}★ & up`}
                checked={f.minRating === r}
                onToggle={() => setF({ ...f, minRating: f.minRating === r ? 0 : r })}
              />
            ))
          : null}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SiteHeader />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.wrap, small && styles.wrapSmall]}>
          {/* ── Hero ── */}
          <LinearGradient colors={[BRAND.ink, BRAND.ink, BRAND.brown]} locations={[0, 0.54, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.hero, small && styles.heroSmall]}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>YOUR NEXT CHAPTER AWAITS</Text>
              <Text style={[styles.heroTitle, small && styles.heroTitleSmall]}>Find your next{'\n'}favorite read.</Text>
              <Text style={[styles.heroSub, small && styles.heroSubSmall]}>
                Stories to get lost in, ideas to grow with,{'\n'}and beautiful books worth keeping.
              </Text>
              <View style={styles.heroBtns}>
                <Pressable style={styles.heroPrimary} onPress={() => { setQuery(''); clearAll(); }}>
                  <Text style={styles.heroPrimaryText}>Shop new arrivals</Text>
                </Pressable>
                <Pressable
                  style={styles.heroLink}
                  onPress={() => commit({ ...DEFAULT_FILTERS, minRating: 4 })}>
                  <Text style={styles.heroLinkText}>Browse bestsellers</Text>
                  <Icon name="arrow" size={15} color="#fff" />
                </Pressable>
              </View>
            </View>
            <View style={[styles.heroArt, small && styles.heroArtSmall]} pointerEvents="none">
              {['9', '13', '16'].map((id, i) => {
                const b = getBook(id);
                if (!b) return null;
                const t = coverTone(b.tone);
                return (
                  <View key={id} style={[styles.heroBook, { backgroundColor: t.bg, transform: [{ rotate: `${(i - 1) * 8}deg` }] }]}>
                    <Text style={[styles.heroBookTitle, { color: t.fg }]} numberOfLines={2}>
                      {b.title}
                    </Text>
                  </View>
                );
              })}
            </View>
          </LinearGradient>

          {/* ── Category pills ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
            {CATEGORIES.map((c) => {
              const active = c === 'All' ? applied.cats.length === 0 : applied.cats.includes(c);
              return (
                <Pressable
                  key={c}
                  style={(s) => [styles.pill, active && styles.pillActive, s.hovered && !active && styles.pillHover]}
                  onPress={() => commit({ ...applied, cats: c === 'All' ? [] : [c] })}>
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{c}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── Layout ── */}
          <View style={[styles.layout, stacked && styles.layoutSmall]}>
            {!compactNav ? (
              <View style={styles.sidebar}>
                {filtersBody(draft, setDraft)}
                <Pressable style={styles.apply} onPress={() => commit(draft)}>
                  <Text style={styles.applyText}>Apply filters</Text>
                </Pressable>
                <Pressable onPress={clearAll}>
                  <Text style={styles.clear}>Clear all filters</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.main}>
              <View style={styles.toolbar}>
                <Text style={styles.count}>
                  Showing <Text style={styles.countBold}>{results.length} book{results.length === 1 ? '' : 's'}</Text>
                </Text>
                <View style={styles.toolRight}>
                  {compactNav ? (
                    <Pressable style={styles.filterBtn} onPress={() => { setDraft(applied); setSheetOpen(true); }}>
                      <Icon name="menu" size={14} color={BRAND.text} />
                      <Text style={styles.filterBtnText}>Filters</Text>
                    </Pressable>
                  ) : null}
                  <View style={styles.sortWrap}>
                    <Text style={styles.sortLabel}>Sort by</Text>
                    <Picker
                      selectedValue={sort}
                      onValueChange={(v) => { setSort(v); setPage(1); }}
                      style={styles.picker}
                      accessibilityLabel="Sort by">
                      {SORTS.map((s) => (
                        <Picker.Item key={s} label={s} value={s} />
                      ))}
                    </Picker>
                  </View>
                  {!small ? (
                    <View style={styles.viewToggle}>
                      <Pressable
                        style={[styles.viewBtn, view === 'grid' && styles.viewActive]}
                        accessibilityLabel="Grid view"
                        onPress={() => setView('grid')}>
                        <Icon name="grid" size={15} color={BRAND.text} />
                      </Pressable>
                      <Pressable
                        style={[styles.viewBtn, view === 'list' && styles.viewActive]}
                        accessibilityLabel="List view"
                        onPress={() => setView('list')}>
                        <Icon name="list" size={15} color={BRAND.text} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>

              {applied.badge ? (
                <Pressable style={styles.badgeFilter} onPress={() => commit({ ...applied, badge: null })}>
                  <Text style={styles.badgeFilterText}>{applied.badge} ✕</Text>
                </Pressable>
              ) : null}

              {view === 'grid' || small ? (
                <View style={[styles.grid, { gap: small ? 10 : 16 }]}>
                  {pageItems.map((b) => (
                    <View key={b.id} style={{ width: small ? '48%' : medium ? '31%' : `${100 / cols - 2}%`, minWidth: small ? 0 : 150 }}>
                      <BookCard book={b} framed />
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.list}>
                  {pageItems.map((b) => {
                    const t = coverTone(b.tone);
                    const soldOut = (b.stock ?? 1) <= 0;
                    return (
                      <View key={b.id} style={styles.row}>
                        <Pressable onPress={() => router.push(`/book/${b.id}`)}>
                          <View style={[styles.thumb, { backgroundColor: t.bg }]}>
                            <Text style={[styles.thumbText, { color: t.fg }]}>{b.title.charAt(0)}</Text>
                          </View>
                        </Pressable>
                        <Pressable style={styles.rowInfo} onPress={() => router.push(`/book/${b.id}`)}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {b.title}
                          </Text>
                          <Text style={styles.rowAuthor} numberOfLines={1}>
                            {b.author} • ★ {b.rating.toFixed(1)}
                          </Text>
                          <Text style={styles.rowPrice}>{formatPeso(b.price)}</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.rowAdd, soldOut && styles.disabled]}
                          disabled={soldOut}
                          accessibilityLabel={`Add ${b.title} to cart`}
                          onPress={() => {
                            cart.add(b, 1);
                            router.push('/(tabs)/cart');
                          }}>
                          <Icon name="bag" size={15} color="#fff" />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}

              {results.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No books match those filters</Text>
                  <Pressable style={styles.apply} onPress={clearAll}>
                    <Text style={styles.applyText}>Clear all filters</Text>
                  </Pressable>
                </View>
              ) : null}

              {pages > 1 ? (
                <View style={styles.pagination}>
                  <Pressable
                    style={[styles.pageBtn, safePage === 1 && styles.disabled]}
                    disabled={safePage === 1}
                    accessibilityLabel="Previous page"
                    onPress={() => setPage((p) => Math.max(1, p - 1))}>
                    <Text style={styles.pageText}>←</Text>
                  </Pressable>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <Pressable
                      key={n}
                      style={[styles.pageBtn, n === safePage && styles.pageActive]}
                      onPress={() => setPage(n)}>
                      <Text style={[styles.pageText, n === safePage && styles.pageTextActive]}>{n}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    style={[styles.pageBtn, safePage === pages && styles.disabled]}
                    disabled={safePage === pages}
                    accessibilityLabel="Next page"
                    onPress={() => setPage((p) => Math.min(pages, p + 1))}>
                    <Text style={styles.pageText}>→</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* ── Featured strip ── */}
              <View style={[styles.featured, small && styles.featuredSmall]}>
                <View>
                  <Text style={styles.featEyebrow}>HANDPICKED FOR YOU</Text>
                  <Text style={[styles.featTitle, small && styles.featTitleSmall]}>Staff picks</Text>
                  <Text style={styles.featCopy}>The books we cannot stop talking about this month.</Text>
                  <Pressable
                    style={styles.featLink}
                    onPress={() => commit({ ...DEFAULT_FILTERS, minRating: 4 })}>
                    <Text style={styles.featLinkText}>See all picks</Text>
                    <Icon name="arrow" size={15} color={BRAND.brown} />
                  </Pressable>
                </View>
                <View style={styles.minis}>
                  {minis.map((b) => {
                    const t = coverTone(b.tone);
                    return (
                      <Pressable key={b.id} style={styles.mini} onPress={() => router.push(`/book/${b.id}`)}>
                        <View style={[styles.miniCover, { backgroundColor: t.bg }]}>
                          <Text style={[styles.miniTitle, { color: t.fg }]} numberOfLines={2}>
                            {b.title}
                          </Text>
                        </View>
                        <Text style={styles.miniName} numberOfLines={1}>
                          {b.title}
                        </Text>
                        <Text style={styles.miniAuthor} numberOfLines={1}>
                          {b.author}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={[styles.footer, small && styles.footerSmall]}>
            <View style={[styles.footerGrid, small && styles.footerGridSmall]}>
              <View style={styles.footerBrand}>
                <View style={styles.logoRow}>
                  <View style={styles.logoMark}>
                    <Icon name="book" size={15} color={BRAND.text} />
                  </View>
                  <LogoWord size={21} family={FONTS.serifSemi} />
                </View>
                <Text style={styles.footerCopy}>Thoughtfully chosen books{'\n'}for curious minds.</Text>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerHead}>Explore</Text>
                <Pressable onPress={() => { setQuery(''); clearAll(); }}>
                  <Text style={styles.footerLink}>New arrivals</Text>
                </Pressable>
                <Pressable onPress={() => commit({ ...DEFAULT_FILTERS, minRating: 4 })}>
                  <Text style={styles.footerLink}>Best sellers</Text>
                </Pressable>
                <Pressable onPress={() => commit({ ...DEFAULT_FILTERS, badge: 'New' })}>
                  <Text style={styles.footerLink}>Gift cards</Text>
                </Pressable>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerHead}>Help</Text>
                <Pressable onPress={() => router.push('/(tabs)')}>
                  <Text style={styles.footerLink}>Shipping & returns</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/(tabs)/account')}>
                  <Text style={styles.footerLink}>Contact us</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/(tabs)/account')}>
                  <Text style={styles.footerLink}>FAQs</Text>
                </Pressable>
              </View>
              <View style={styles.footerNews}>
                <Text style={styles.footerHead}>Get new releases in your inbox</Text>
                <Text style={styles.footerCopy}>A considered letter, sent twice a month.</Text>
                {newsDone ? (
                  <Text style={styles.newsDone}>Welcome to the reading list. Check your inbox soon.</Text>
                ) : (
                  <View style={styles.newsForm}>
                    <TextInput
                      value={newsEmail}
                      onChangeText={setNewsEmail}
                      placeholder="Your email address"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      style={styles.newsInput}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      aria-label="Newsletter email"
                    />
                    <Pressable
                      style={styles.newsBtn}
                      onPress={() => {
                        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsEmail.trim())) setNewsDone(true);
                      }}>
                      <Text style={styles.newsBtnText}>Subscribe</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.footerBottom}>
              <Text style={styles.bottomText}>© 2025 Chapter1</Text>
              <Text style={styles.bottomText}>Privacy · Terms · Instagram</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Mobile filter sheet ── */}
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <ScrollView>
              {filtersBody(draft, setDraft)}
              <Pressable
                style={styles.apply}
                onPress={() => {
                  commit(draft);
                  setSheetOpen(false);
                }}>
                <Text style={styles.applyText}>Apply filters</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const TINT_08 = 'rgba(122, 84, 46, 0.08)';
const TINT_15 = 'rgba(122, 84, 46, 0.15)';
const TINT_25 = 'rgba(122, 84, 46, 0.25)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 0 },
  wrap: { maxWidth: 1200, width: '100%', alignSelf: 'center', paddingHorizontal: 40, paddingTop: 40, paddingBottom: 80 },
  wrapSmall: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 55 },
  // Hero
  hero: { borderRadius: 24, minHeight: 280, paddingHorizontal: 64, paddingVertical: 44, overflow: 'hidden' },
  heroSmall: { borderRadius: 18, minHeight: 200, padding: 24 },
  heroCopy: { zIndex: 2, maxWidth: 560 },
  heroEyebrow: { letterSpacing: 2.1, opacity: 0.7, color: '#fff', fontSize: 10, fontWeight: '600', marginBottom: 10, fontFamily: FONTS.sansSemi },
  heroTitle: { color: '#fff', fontSize: 43, lineHeight: 45, fontFamily: FONTS.serifSemi, letterSpacing: -0.7 },
  heroTitleSmall: { fontSize: 30, lineHeight: 32 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 21, marginTop: 13, fontFamily: FONTS.sans },
  heroSubSmall: { fontSize: 10, maxWidth: 220 },
  heroBtns: { flexDirection: 'row', alignItems: 'center', gap: 27, marginTop: 21 },
  heroPrimary: { backgroundColor: '#fff', borderRadius: 10, height: 40, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  heroPrimaryText: { fontSize: 12, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
  heroLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLinkText: { color: '#fff', fontSize: 12, fontFamily: FONTS.sans },
  heroArt: { position: 'absolute', top: 25, right: 70, width: 260, height: 220, zIndex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.9 },
  heroArtSmall: { width: 135, right: -25, top: 13, opacity: 0.5 },
  heroBook: { width: 72, height: 150, borderRadius: 4, alignItems: 'center', justifyContent: 'center', padding: 6 },
  heroBookTitle: { fontSize: 9, textAlign: 'center', fontFamily: FONTS.serifBold },
  // Pills
  pills: { gap: 9, paddingVertical: 28, paddingRight: 16 },
  pill: { backgroundColor: TINT_08, borderRadius: 20, height: 38, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  pillHover: { borderWidth: 1, borderColor: BRAND.brown },
  pillActive: { backgroundColor: BRAND.ink },
  pillText: { fontSize: 12, color: BRAND.text, fontFamily: FONTS.sans },
  pillTextActive: { color: '#fff' },
  // Layout
  layout: { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  layoutSmall: { flexDirection: 'column' },
  sidebar: { width: 230, borderWidth: 1, borderColor: TINT_15, borderRadius: 20, padding: 20, backgroundColor: '#fff' },
  main: { flex: 1, minWidth: 0 },
  filterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { fontSize: 19, fontFamily: FONTS.serifSemi, color: BRAND.text },
  clearTop: { color: BRAND.brown, fontSize: 12, textDecorationLine: 'underline', fontFamily: FONTS.sans },
  filterSection: { borderBottomWidth: 1, borderBottomColor: TINT_15, paddingVertical: 17 },
  filterSectionLast: { paddingVertical: 17 },
  filterHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 },
  filterHeadingText: { fontSize: 12, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 27 },
  checkbox: { width: 17, height: 17, borderRadius: 4, borderWidth: 1, borderColor: TINT_25, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: BRAND.ink, borderColor: BRAND.ink },
  checkLabel: { fontSize: 11, color: BRAND.text, fontFamily: FONTS.sans },
  checkCount: { color: BRAND.brown, fontSize: 11, marginLeft: 'auto', fontFamily: FONTS.sans },
  slider: { width: '100%', height: 32 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeText: { color: BRAND.brown, fontSize: 10, fontFamily: FONTS.sans },
  apply: { backgroundColor: BRAND.ink, borderRadius: 11, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  applyText: { color: '#fff', fontSize: 12, fontWeight: '600', fontFamily: FONTS.sansSemi },
  clear: { color: BRAND.brown, fontSize: 11, textDecorationLine: 'underline', textAlign: 'center', paddingTop: 13, fontFamily: FONTS.sans },
  // Toolbar
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: 46, marginBottom: 8 },
  count: { color: BRAND.brown, fontSize: 11, fontFamily: FONTS.sans, paddingTop: 8 },
  countBold: { fontWeight: '700', color: BRAND.text },
  toolRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: TINT_25, borderRadius: 9, height: 32, paddingHorizontal: 12 },
  filterBtnText: { fontSize: 10, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
  sortWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: TINT_15, borderRadius: 9, height: 34, paddingLeft: 11, paddingRight: 4 },
  sortLabel: { fontSize: 10, color: BRAND.brown, fontFamily: FONTS.sans },
  picker: { width: 130, height: 34, fontSize: 10 },
  viewToggle: { flexDirection: 'row', gap: 6 },
  viewBtn: { width: 34, height: 34, borderWidth: 1, borderColor: TINT_15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  viewActive: { backgroundColor: TINT_08 },
  badgeFilter: { alignSelf: 'flex-start', backgroundColor: BRAND.ink, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 },
  badgeFilterText: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: FONTS.sansBold },
  // Grid / list
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: TINT_15, borderRadius: 14, padding: 10 },
  thumb: { width: 52, height: 68, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  thumbText: { fontSize: 24, fontFamily: FONTS.serifBold },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontFamily: FONTS.serifSemi, color: BRAND.text },
  rowAuthor: { fontSize: 11, color: BRAND.muted, marginTop: 2, fontFamily: FONTS.sans },
  rowPrice: { fontSize: 14, fontWeight: '700', color: BRAND.brown, marginTop: 4, fontFamily: FONTS.sansBold },
  rowAdd: { width: 38, height: 38, borderRadius: 19, backgroundColor: BRAND.ink, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: FONTS.serifSemi, color: BRAND.text },
  // Pagination
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 45 },
  pageBtn: { minWidth: 34, height: 34, borderWidth: 1, borderColor: TINT_25, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  pageActive: { backgroundColor: BRAND.ink, borderColor: BRAND.ink },
  pageText: { fontSize: 10, color: BRAND.text, fontFamily: FONTS.sans },
  pageTextActive: { color: '#fff' },
  disabled: { opacity: 0.35 },
  // Featured strip
  featured: {
    backgroundColor: 'rgba(122, 84, 46, 0.1)',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 55,
    minHeight: 270,
    marginTop: 54,
    paddingHorizontal: 48,
    paddingVertical: 37,
  },
  featuredSmall: { flexDirection: 'column', alignItems: 'stretch', gap: 26, padding: 22, marginTop: 35 },
  featEyebrow: { letterSpacing: 2.1, opacity: 0.7, color: BRAND.text, fontSize: 10, fontWeight: '600', marginBottom: 10, fontFamily: FONTS.sansSemi },
  featTitle: { fontSize: 33, color: BRAND.text, fontFamily: FONTS.serifSemi },
  featTitleSmall: { fontSize: 28 },
  featCopy: { color: BRAND.brown, fontSize: 11, lineHeight: 18, marginTop: 10, marginBottom: 23, fontFamily: FONTS.sans },
  featLink: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featLinkText: { color: BRAND.brown, fontSize: 11, fontWeight: '600', fontFamily: FONTS.sansSemi },
  minis: { flex: 1, flexDirection: 'row', gap: 16 },
  mini: { flex: 1, minWidth: 0 },
  miniCover: { borderRadius: 7, height: 155, alignItems: 'center', justifyContent: 'center', padding: 10 },
  miniTitle: { fontSize: 12, textAlign: 'center', fontFamily: FONTS.serifBold },
  miniName: { fontSize: 11, fontFamily: FONTS.serifSemi, color: BRAND.text, marginTop: 8 },
  miniAuthor: { fontSize: 8, color: BRAND.brown, fontFamily: FONTS.sans },
  // Footer
  footer: { backgroundColor: BRAND.ink, borderRadius: 24, marginTop: 54, paddingHorizontal: 48, paddingTop: 55, paddingBottom: 22 },
  footerSmall: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 30 },
  footerGrid: { flexDirection: 'row', gap: 55 },
  footerGridSmall: { flexDirection: 'row', flexWrap: 'wrap', gap: 35 },
  footerBrand: { flex: 1.4, minWidth: 160 },
  footerCol: { flex: 0.7, minWidth: 110 },
  footerNews: { flex: 1.5, minWidth: 200 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoMark: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 21, color: '#fff', fontFamily: FONTS.serifSemi, letterSpacing: -0.4 },
  footerCopy: { color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 19, marginTop: 17, fontFamily: FONTS.sans },
  footerHead: { color: '#fff', fontSize: 14, marginBottom: 16, fontFamily: FONTS.serifSemi },
  footerLink: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 8, fontFamily: FONTS.sans },
  newsForm: { flexDirection: 'row', height: 42, marginTop: 15 },
  newsInput: { flex: 1, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRightWidth: 0, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, paddingHorizontal: 13, fontSize: 10, fontFamily: FONTS.sans, minWidth: 0 },
  newsBtn: { backgroundColor: '#fff', borderTopRightRadius: 8, borderBottomRightRadius: 8, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  newsBtnText: { fontSize: 10, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
  newsDone: { color: '#fff', fontSize: 11, marginTop: 15, fontFamily: FONTS.sans },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    marginTop: 45,
    paddingTop: 18,
  },
  bottomText: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: FONTS.sans },
  // Mobile filter sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(37, 22, 5, 0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingHorizontal: 18, paddingTop: 9, paddingBottom: 30 },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: TINT_25, alignSelf: 'center', marginBottom: 10 },
});
