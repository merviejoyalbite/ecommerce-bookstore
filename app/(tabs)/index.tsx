import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { BRAND, FONTS, coverTone } from '@/constants/theme';
import { CATEGORIES, FEATURED_BOOK_ID, formatPeso } from '@/data/books';
import { BookCard } from '@/components/BookCard';
import { LogoWord } from '@/components/Logo';
import { Icon } from '@/components/icons';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useShop } from '@/store/shop';

const PROOF_AVATARS = [
  { initials: 'AM', bg: '#D9C5AE' },
  { initials: 'JK', bg: '#B8916C' },
  { initials: 'RL', bg: '#FFFFFF' },
];

const NAV_LINKS = [
  { label: 'Home', to: '/(tabs)' as const },
  { label: 'Shop', to: '/(tabs)/catalog' as const },
  { label: 'Categories', to: '/(tabs)/catalog' as const },
  { label: 'About', to: '/(tabs)/catalog' as const },
  { label: 'Contact', to: '/(tabs)/account' as const },
];

function Logo() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoMark}>
        <Icon name="book" size={20} color="#fff" />
      </View>
      <LogoWord size={22} />
    </View>
  );
}

// Lamp from the prototype hero: trapezoid shade with trim, stem, base.
function Lamp() {
  return (
    <View style={styles.lamp}>
      <View style={styles.shade}>
        <View style={styles.shadeTrim} />
      </View>
      <View style={styles.stem} />
      <View style={styles.lampBase} />
    </View>
  );
}

function Spark({ top, left, scale = 1 }: { top: number; left: number; scale?: number }) {
  return (
    <View style={[styles.spark, { top, left, transform: [{ scale }] }]}>
      <View style={styles.sparkH} />
      <View style={styles.sparkV} />
    </View>
  );
}

export default function HomeScreen() {
  const cart = useCart();
  const { user } = useAuth();
  const { books, getBook } = useShop();
  const { small, stacked } = useBreakpoint();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const featured = getBook(FEATURED_BOOK_ID) ?? books[0];
  const arrivals = books.slice(0, 4);
  // Prototype bestsellers shelf: catalogue slice(4), ranked 1–4.
  const bestsellers = books.slice(4, 8);
  const featuredTone = coverTone(featured?.tone);

  const goSearch = () => {
    router.push({ pathname: '/(tabs)/catalog', params: query.trim() ? { q: query.trim() } : {} });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Navbar ── */}
        <View style={[styles.nav, !small && styles.navRow]}>
          <View style={styles.navTop}>
            <Logo />
            {small ? (
              <Pressable
                style={styles.menuBtn}
                accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
                onPress={() => setMenuOpen((v) => !v)}>
                <Icon name="menu" size={22} color="#fff" />
              </Pressable>
            ) : null}
          </View>
          {!small ? (
            <View style={styles.search}>
              <Icon name="search" size={15} color={BRAND.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={goSearch}
                placeholder="Search by title, author, or ISBN"
                placeholderTextColor={BRAND.muted}
                style={styles.searchInput}
                returnKeyType="search"
              />
              <Pressable
                style={(s) => [styles.searchBtn, s.hovered && styles.lift, s.pressed && styles.press]}
                onPress={goSearch}>
                <Text style={styles.searchBtnText}>Search</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={[styles.navLinks, small && styles.navLinksRow, small && !menuOpen && styles.hidden]}>
            {NAV_LINKS.map((l, i) => (
              <Pressable
                key={l.label}
                style={(s) => [styles.navLinkPad, s.hovered && styles.navLinkHover]}
                onPress={() => {
                  setMenuOpen(false);
                  router.push(l.to);
                }}>
                <Text style={[styles.navLink, i === 0 && styles.navLinkFirst]}>{l.label}</Text>
              </Pressable>
            ))}
          </View>
          {small ? (
            <View style={styles.search}>
              <Icon name="search" size={15} color={BRAND.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={goSearch}
                placeholder="Search by title, author, or ISBN"
                placeholderTextColor={BRAND.muted}
                style={styles.searchInput}
                returnKeyType="search"
              />
              <Pressable
                style={(s) => [styles.searchBtn, s.hovered && styles.lift, s.pressed && styles.press]}
                onPress={goSearch}>
                <Text style={styles.searchBtnText}>Search</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.navActions}>
            <Pressable
              style={(s) => [styles.navAction, s.hovered && styles.navActionHover]}
              onPress={() => router.push('/(tabs)/account')}>
              <Icon name="user" size={16} color="#fff" />
              <Text style={styles.navActionText}>{user ? user.name.split(' ')[0] : 'Account'}</Text>
            </Pressable>
            <Pressable
              style={(s) => [styles.navAction, s.hovered && styles.navActionHover]}
              onPress={() => router.push('/(tabs)/cart')}>
              <View>
                <Icon name="bag" size={16} color="#fff" />
                {cart.count > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cart.count}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.navActionText}>Cart</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Hero ── */}
        <View style={[styles.hero, stacked ? undefined : styles.heroRow]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrowDark}>—  STORIES WORTH KEEPING</Text>
            <Text style={[styles.heroTitle, small && styles.heroTitleSmall]}>
              Find Your Next{'\n'}
              <Text style={styles.heroEm}>Great Read</Text>
            </Text>
            <Text style={styles.heroLede}>
              Thoughtfully curated books for curious minds, quiet evenings, and every chapter in between.
            </Text>
            <View style={styles.heroBtns}>
              <Pressable
                style={(s) => [styles.btnGold, s.hovered && styles.lift, s.pressed && styles.press]}
                onPress={() => router.push('/(tabs)/catalog')}>
                <Text style={styles.btnGoldText}>Shop now </Text>
                <Icon name="arrow" size={17} color="#fff" />
              </Pressable>
              <Pressable
                style={(s) => [styles.btnOutline, s.hovered && styles.lift, s.pressed && styles.press]}
                onPress={() => router.push('/(tabs)/catalog')}>
                <Text style={styles.btnOutlineText}>Browse categories</Text>
              </Pressable>
            </View>
            <View style={styles.proof}>
              <View style={styles.avatars}>
                {PROOF_AVATARS.map((a) => (
                  <View key={a.initials} style={[styles.avatar, { backgroundColor: a.bg }]}>
                    <Text style={styles.avatarText}>{a.initials}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.proofText}>
                <Text style={styles.proofStrong}>4.9 / 5{'\n'}</Text>
                Loved by 12,000+ readers
              </Text>
            </View>
          </View>
          {/* Arched cover art with lamp, stacked books, quote */}
          <View style={[styles.heroArt, small && styles.heroArtSmall, !small && styles.heroArtRow]}>
            <Spark top={60} left={58} />
            <Spark top={113} left={123} scale={0.55} />
            <Lamp />
            <View style={styles.shelf} />
            <View style={[styles.sceneBook, styles.sceneBookThree]}>
              <Text style={[styles.sceneBookText, { color: BRAND.ink }]}>Collected Essays</Text>
            </View>
            <View style={[styles.sceneBook, styles.sceneBookTwo]}>
              <Text style={styles.sceneBookText}>Poems</Text>
            </View>
            <View style={[styles.sceneBook, styles.sceneBookOne]}>
              <Text style={styles.sceneBookText}>Stories</Text>
            </View>
            <View style={styles.quoteCard}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.quoteText}>A reader lives a thousand lives before he dies.</Text>
              <Text style={styles.quoteBy}>— GEORGE R. R. MARTIN</Text>
            </View>
            <View style={styles.estBadge}>
              <Text style={styles.estText}>EST.{'\n'}2024</Text>
            </View>
          </View>
        </View>

        {/* ── Category bar ── */}
        <View style={styles.catBar}>
          <Text style={styles.explore}>Explore</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {CATEGORIES.filter((c) => c !== 'All').map((c) => (
              <Pressable
                key={c}
                style={(s) => [styles.chip, s.hovered && styles.chipHover]}
                onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { cat: c } })}>
                <Text style={styles.chipText}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Latest arrivals ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.eyebrow}>Fresh off the press</Text>
              <Text style={styles.h2}>Latest arrivals</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.textLink}>View all books →</Text>
            </Pressable>
          </View>
          <View style={styles.grid}>
            {arrivals.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </View>
        </View>

        {/* ── Featured / editor's choice ── */}
        {featured ? (
          <View style={styles.featured}>
            <View style={styles.featuredVisual}>
              <View style={styles.openBook}>
                <View style={styles.pageLeft}>
                  <Text style={styles.pageHead}>Chapter1 Edition</Text>
                  <View style={styles.pageLine} />
                  <View style={[styles.pageLine, { width: '86%' }]} />
                  <View style={[styles.pageLine, { width: '93%' }]} />
                  <View style={[styles.pageLine, { width: '68%' }]} />
                </View>
                <View style={styles.pageRight}>
                  <Text style={styles.pageHead}>Chapter1 Edition</Text>
                  <View style={styles.pageLine} />
                  <View style={[styles.pageLine, { width: '86%' }]} />
                  <View style={[styles.pageLine, { width: '93%' }]} />
                  <View style={[styles.pageLine, { width: '68%' }]} />
                </View>
              </View>
              <View style={[styles.featuredCover, { backgroundColor: featuredTone.bg }]}>
                <Text style={[styles.featuredCoverTitle, { color: featuredTone.fg }]} numberOfLines={3}>
                  {featured.title}
                </Text>
                <Text style={[styles.featuredCoverAuthor, { color: featuredTone.fg }]} numberOfLines={1}>
                  {featured.author}
                </Text>
              </View>
            </View>
            <View style={styles.featuredBody}>
              <Text style={styles.eyebrow}>Editor&apos;s choice · this month</Text>
              <Text style={styles.h2}>A book to return to, again and again.</Text>
              <Text style={styles.featuredMeta}>★ 4.9 · 1,284 reviews · Paperback</Text>
              <Text style={styles.featuredBlurb}>
                Virginia Woolf&apos;s landmark essay is a luminous argument for creative freedom. This
                beautifully bound keepsake edition includes an introduction from acclaimed author Elif Shafak.
              </Text>
              <Text style={styles.featuredQuote}>
                “Lock up your libraries if you like; but there is no gate, no lock, no bolt that you can set
                upon the freedom of my mind.”
              </Text>
              <View style={styles.buyRow}>
                <View>
                  <Text style={styles.priceLarge}>{formatPeso(featured.price)}</Text>
                  <Text style={styles.oldLarge}>{formatPeso(featured.oldPrice ?? 995)}</Text>
                </View>
                <Pressable style={styles.btnDark} onPress={() => router.push(`/book/${featured.id}`)}>
                  <Text style={styles.btnDarkText}>Buy now </Text>
                  <Icon name="arrow" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Bestsellers ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.eyebrow}>Reader favourites</Text>
              <Text style={styles.h2}>The bestsellers shelf</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.textLink}>See the full list</Text>
            </Pressable>
          </View>
          <View style={styles.grid}>
            {bestsellers.map((b, i) => (
              <BookCard key={b.id} book={b} ranked={i + 1} />
            ))}
          </View>
        </View>

        {/* ── Values ── */}
        <View style={styles.values}>
          <Text style={styles.eyebrowCenter}>The Chapter1 promise</Text>
          <Text style={styles.h2Center}>Good books, delivered well</Text>
          <View style={[styles.valueGrid, small && styles.valueGridSmall]}>
            {[
              { icon: 'truck', title: 'Free delivery', sub: 'On all orders over ₱1,500' },
              { icon: 'shield', title: 'Secure payment', sub: 'Protected and encrypted' },
              { icon: 'refresh', title: 'Easy returns', sub: '30-day return window' },
              { icon: 'headphones', title: 'Reader support', sub: 'Here whenever you need us' },
            ].map((v, i) => (
              <View
                key={v.title}
                style={[
                  styles.valueCard,
                  small ? styles.valueCardHalf : styles.valueCardQuarter,
                  !small && i < 3 && styles.valueDividerRight,
                  small && i % 2 === 0 && styles.valueDividerRight,
                  small && i < 2 && styles.valueDividerBottom,
                ]}>
                <View style={styles.valueIcon}>
                  <Icon name={v.icon as 'truck' | 'shield' | 'refresh' | 'headphones'} size={22} color={BRAND.brown} />
                </View>
                <View style={styles.valueText}>
                  <Text style={styles.valueTitle}>{v.title}</Text>
                  <Text style={styles.valueSub}>{v.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Newsletter ── */}
        <View style={styles.newsletter}>
          <View style={[styles.newsInner, small && styles.newsInnerSmall]}>
            <View style={styles.newsLeft}>
              <Text style={styles.newsEyebrow}>Notes from Chapter1</Text>
              <Text style={[styles.newsTitle, small && styles.newsTitleSmall]}>Make room for{'\n'}your next favourite.</Text>
            </View>
            <View style={styles.newsRight}>
              {subscribed ? (
                <Text style={styles.newsSuccess}>Welcome to the reading list. Check your inbox soon.</Text>
              ) : (
                <>
                  <Text style={styles.newsCopy}>
                    Join our reading list for new arrivals, thoughtful recommendations, and 10% off your first order.
                  </Text>
                  <View style={styles.newsForm}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Your email address"
                      placeholderTextColor={BRAND.muted}
                      style={styles.newsInput}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <Pressable
                      style={styles.newsBtn}
                      onPress={() => {
                        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) setSubscribed(true);
                      }}>
                      <Text style={styles.newsBtnText}>Subscribe →</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.newsSmall}>By subscribing, you agree to our privacy policy.</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={[styles.footerGrid, small && styles.footerGridSmall]}>
            <View style={styles.footerBrand}>
              <Logo />
              <Text style={styles.footerAbout}>
                An independent online bookstore for considered reads and beautifully made editions.
              </Text>
              <View style={styles.socials}>
                {(
                  [
                    { name: 'instagram', url: 'https://instagram.com' },
                    { name: 'facebook', url: 'https://facebook.com' },
                    { name: 'pinterest', url: 'https://pinterest.com' },
                  ] as const
                ).map((s) => (
                  <Pressable key={s.name} style={styles.social} onPress={() => void Linking.openURL(s.url)}>
                    <Icon name={s.name} size={17} color="rgba(255,255,255,0.7)" />
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHead}>Quick links</Text>
              {[
                { label: 'New arrivals', to: '/(tabs)/catalog' as const },
                { label: 'Best sellers', to: '/(tabs)/catalog' as const },
                { label: 'Our story', to: '/(tabs)/catalog' as const },
                { label: 'Contact us', to: '/(tabs)/account' as const },
              ].map((l) => (
                <Pressable key={l.label} onPress={() => router.push(l.to)}>
                  <Text style={styles.footerLink}>{l.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHead}>Categories</Text>
              {[
                { label: 'Fiction', cat: 'Fiction' },
                { label: 'Non-fiction', cat: 'Non-fiction' },
                { label: 'Kids', cat: 'Kids' },
                { label: 'Self-help', cat: 'Self-help' },
              ].map((c) => (
                <Pressable
                  key={c.label}
                  onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { cat: c.cat } })}>
                  <Text style={styles.footerLink}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHead}>Visit the shop</Text>
              <Text style={styles.footerLink}>118 Story Lane</Text>
              <Text style={styles.footerLink}>Portland, OR 97205</Text>
              <Text style={styles.footerLink}>hello@booknook.com</Text>
              <Text style={styles.footerLink}>(503) 555-0142</Text>
            </View>
          </View>
          <View style={[styles.footerBottom, small && styles.footerBottomSmall]}>
            <Text style={styles.copy}>© 2025 Chapter1. All rights reserved.</Text>
            <View style={styles.legal}>
              <Text style={styles.legalLink}>Terms</Text>
              <Text style={styles.legalLink}>Privacy</Text>
              <Text style={styles.legalLink}>Accessibility</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.background },
  scroll: { paddingBottom: 0 },
  // Navbar
  nav: { backgroundColor: BRAND.ink, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 28, minHeight: 88, paddingVertical: 10 },
  lift: { transform: [{ translateY: -1 }] },
  press: { transform: [{ translateY: 1 }], opacity: 0.9 },
  navTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuBtn: { padding: 6 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 39,
    height: 39,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 22, fontFamily: FONTS.serifBold, color: '#fff' },
  navLinks: { flexDirection: 'row', gap: 22 },
  navLinkPad: { paddingVertical: 8 },
  navLinkHover: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.7)' },
  navLinksRow: { flexDirection: 'column', gap: 0, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 8 },
  hidden: { display: 'none' },
  navLink: { color: '#fff', fontSize: 13, fontWeight: '500', fontFamily: FONTS.sansMedium, paddingVertical: 4 },
  navLinkFirst: { borderBottomWidth: 1, borderBottomColor: '#fff' },
  search: { flex: 1, maxWidth: 430, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, paddingLeft: 14, height: 46, alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: BRAND.text, fontFamily: FONTS.sans },
  searchBtn: { backgroundColor: BRAND.ink, borderRadius: 6, margin: 4, paddingHorizontal: 16, height: 38, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: FONTS.sansBold },
  navActions: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  navAction: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6 },
  navActionHover: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.7)' },
  navActionText: { color: '#fff', fontSize: 12, fontFamily: FONTS.sans },
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND.brown,
    borderWidth: 2,
    borderColor: BRAND.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  // Hero
  hero: { backgroundColor: BRAND.ink, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 32 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 60 },
  heroCopy: { flex: 1.02, minWidth: 0 },
  eyebrowDark: { color: 'rgba(255,255,255,0.72)', letterSpacing: 2, textTransform: 'uppercase', fontSize: 12, marginBottom: 16, fontFamily: FONTS.sansMedium },
  heroTitle: { fontSize: 44, lineHeight: 48, color: '#fff', fontFamily: FONTS.serifBold, letterSpacing: -1 },
  heroTitleSmall: { fontSize: 32, lineHeight: 36 },
  heroEm: { color: BRAND.cream, fontFamily: FONTS.serifItalic },
  heroLede: { color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 27, marginTop: 16, fontFamily: FONTS.sans },
  heroBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  btnGold: { flexDirection: 'row', backgroundColor: BRAND.brown, borderRadius: 8, minHeight: 48, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  btnGoldText: { color: '#fff', fontWeight: '600', fontFamily: FONTS.sansSemi },
  btnOutline: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', borderRadius: 8, minHeight: 48, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { color: '#fff', fontWeight: '600', fontFamily: FONTS.sansSemi },
  proof: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28 },
  avatars: { flexDirection: 'row' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BRAND.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -7,
  },
  avatarText: { fontSize: 9, fontWeight: '700', color: BRAND.ink },
  proofText: { color: 'rgba(255,255,255,0.58)', fontSize: 11, lineHeight: 16, fontFamily: FONTS.sans },
  proofStrong: { color: '#fff', fontSize: 12, fontFamily: FONTS.sansBold },
  // Hero art — arched scene
  heroArt: {
    marginTop: 28,
    backgroundColor: '#BDA181',
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    minHeight: 456,
    overflow: 'hidden',
  },
  heroArtSmall: { minHeight: 320, marginTop: 28, borderTopLeftRadius: 100, borderTopRightRadius: 100 },
  heroArtRow: { flex: 0.98, marginTop: 0, minHeight: 500 },
  shelf: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '27%', backgroundColor: BRAND.brown, borderTopWidth: 1, borderTopColor: 'rgba(37,22,5,0.25)' },
  lamp: { position: 'absolute', top: 55, right: 40, width: 150, height: 265, alignItems: 'center', zIndex: 2 },
  shade: {
    width: 118,
    height: 0,
    borderBottomWidth: 76,
    borderBottomColor: BRAND.ink,
    borderLeftWidth: 16,
    borderLeftColor: 'transparent',
    borderRightWidth: 16,
    borderRightColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shadeTrim: { width: 94, height: 4, backgroundColor: '#D7BEA1', marginBottom: 2 },
  stem: { width: 6, height: 150, backgroundColor: BRAND.ink },
  lampBase: { width: 72, height: 12, backgroundColor: BRAND.ink, borderTopLeftRadius: 36, borderTopRightRadius: 36 },
  spark: { position: 'absolute', width: 18, height: 18, opacity: 0.55, zIndex: 2 },
  sparkH: { position: 'absolute', top: 8.5, left: 0, width: 18, height: 1, backgroundColor: '#fff' },
  sparkV: { position: 'absolute', top: 0, left: 8.5, width: 1, height: 18, backgroundColor: '#fff' },
  sceneBook: {
    position: 'absolute',
    borderRadius: 4,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    paddingLeft: 26,
    zIndex: 3,
  },
  sceneBookOne: { backgroundColor: BRAND.ink, width: 300, height: 62, bottom: 60, left: 40, transform: [{ rotate: '-2deg' }] },
  sceneBookTwo: { backgroundColor: '#714331', width: 275, height: 52, bottom: 118, left: 70, transform: [{ rotate: '3deg' }] },
  sceneBookThree: { backgroundColor: '#D8C7AB', width: 250, height: 46, bottom: 169, left: 50, transform: [{ rotate: '-1deg' }] },
  sceneBookText: { fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,0.82)', fontFamily: FONTS.serifItalic },
  quoteCard: { position: 'absolute', bottom: 8, left: 10, width: 270, backgroundColor: BRAND.paper, borderRadius: 8, padding: 20, zIndex: 4 },
  quoteMark: { fontSize: 40, lineHeight: 32, color: BRAND.brown, fontFamily: FONTS.serifBold },
  quoteText: { fontSize: 15, lineHeight: 22, fontFamily: FONTS.serifBold, color: BRAND.text },
  quoteBy: { fontSize: 10, letterSpacing: 1, color: BRAND.brown, marginTop: 8, fontFamily: FONTS.sansMedium },
  estBadge: {
    position: 'absolute',
    bottom: 10,
    right: 8,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  estText: { color: 'rgba(255,255,255,0.7)', fontSize: 9, textAlign: 'center', letterSpacing: 1 },
  // Category bar
  catBar: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: BRAND.line, backgroundColor: '#fff' },
  explore: { fontStyle: 'italic', color: BRAND.brown, fontSize: 13, marginLeft: 16, marginBottom: 10, fontFamily: FONTS.serifItalic },
  chips: { gap: 10, paddingHorizontal: 16 },
  chip: { borderWidth: 1, borderColor: BRAND.line, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
  chipHover: { borderColor: BRAND.brown, backgroundColor: BRAND.paper, transform: [{ translateY: -1 }] },
  chipText: { fontSize: 13, color: BRAND.text, fontFamily: FONTS.sans },
  // Sections
  section: { paddingHorizontal: 16, paddingVertical: 48 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  eyebrow: { color: BRAND.brown, letterSpacing: 2, textTransform: 'uppercase', fontSize: 11, fontWeight: '700', marginBottom: 8, fontFamily: FONTS.sansBold },
  h2: { fontSize: 32, color: BRAND.text, fontFamily: FONTS.serifBold, letterSpacing: -0.5 },
  textLink: { color: BRAND.brown, fontSize: 13, fontWeight: '600', fontFamily: FONTS.sansSemi },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  // Featured
  featured: { backgroundColor: BRAND.paper },
  featuredVisual: { minHeight: 300, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#C9AD8D' },
  openBook: { flexDirection: 'row', width: 300, height: 200, transform: [{ rotate: '-7deg' }] },
  pageLeft: {
    flex: 1,
    backgroundColor: BRAND.paper,
    borderWidth: 1,
    borderColor: '#D1BEA9',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    padding: 24,
    gap: 12,
    transform: [{ perspective: 400 }, { rotateY: '9deg' }],
  },
  pageRight: {
    flex: 1,
    backgroundColor: BRAND.paper,
    borderWidth: 1,
    borderColor: '#D1BEA9',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    padding: 24,
    gap: 12,
    transform: [{ perspective: 400 }, { rotateY: '-9deg' }],
  },
  pageHead: { fontSize: 9, color: BRAND.brown, textAlign: 'center', letterSpacing: 1, fontFamily: FONTS.serifBold },
  pageLine: { height: 1, backgroundColor: '#D8CABB', width: '100%' },
  featuredCover: {
    position: 'absolute',
    width: 150,
    aspectRatio: 0.68,
    borderRadius: 3,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    transform: [{ rotate: '-3deg' }],
  },
  featuredCoverTitle: { fontSize: 16, textAlign: 'center', fontFamily: FONTS.serifBold },
  featuredCoverAuthor: { fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', marginTop: 8, fontFamily: FONTS.sansMedium },
  featuredBody: { paddingHorizontal: 20, paddingVertical: 36 },
  featuredMeta: { color: BRAND.muted, fontSize: 11, marginTop: 12, fontFamily: FONTS.sans },
  featuredBlurb: { color: BRAND.muted, fontSize: 14, lineHeight: 24, marginTop: 14, fontFamily: FONTS.sans },
  featuredQuote: {
    color: BRAND.brown,
    borderLeftWidth: 2,
    borderLeftColor: BRAND.brown,
    paddingLeft: 16,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 23,
    marginTop: 18,
    fontFamily: FONTS.serifItalic,
  },
  buyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  priceLarge: { fontSize: 28, color: BRAND.text, fontFamily: FONTS.serifBold },
  oldLarge: { fontSize: 12, color: BRAND.faint, textDecorationLine: 'line-through', fontFamily: FONTS.sans },
  btnDark: { flexDirection: 'row', backgroundColor: BRAND.ink, borderRadius: 8, minHeight: 48, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  btnDarkText: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sansBold },
  // Values
  values: { borderTopWidth: 1, borderTopColor: BRAND.line, paddingVertical: 48, paddingHorizontal: 16, backgroundColor: '#fff' },
  eyebrowCenter: { textAlign: 'center', color: BRAND.brown, letterSpacing: 2, textTransform: 'uppercase', fontSize: 11, fontWeight: '700', marginBottom: 8, fontFamily: FONTS.sansBold },
  h2Center: { textAlign: 'center', fontSize: 28, color: BRAND.text, fontFamily: FONTS.serifBold, marginBottom: 24 },
  valueGrid: { flexDirection: 'row', borderWidth: 1, borderColor: BRAND.line },
  valueGridSmall: { flexDirection: 'row', flexWrap: 'wrap' },
  valueCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  valueCardQuarter: { flex: 1 },
  valueCardHalf: { width: '50%' },
  valueDividerRight: { borderRightWidth: 1, borderRightColor: BRAND.line },
  valueDividerBottom: { borderBottomWidth: 1, borderBottomColor: BRAND.line },
  valueIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: BRAND.paper, alignItems: 'center', justifyContent: 'center' },
  valueText: { flex: 1 },
  valueTitle: { fontSize: 15, fontFamily: FONTS.serifBold, color: BRAND.text },
  valueSub: { fontSize: 11, color: BRAND.muted, fontFamily: FONTS.sans },
  // Newsletter
  newsletter: { backgroundColor: BRAND.brown, paddingHorizontal: 20, paddingVertical: 48 },
  newsInner: { flexDirection: 'row', gap: 40, alignItems: 'center' },
  newsInnerSmall: { flexDirection: 'column', gap: 24, alignItems: 'stretch' },
  newsLeft: { flex: 0.9 },
  newsRight: { flex: 1.1 },
  newsEyebrow: { color: 'rgba(255,255,255,0.68)', letterSpacing: 2, textTransform: 'uppercase', fontSize: 11, marginBottom: 12, fontFamily: FONTS.sansMedium },
  newsTitle: { fontSize: 42, color: '#fff', fontFamily: FONTS.serifBold, lineHeight: 50 },
  newsTitleSmall: { fontSize: 32, lineHeight: 38 },
  newsCopy: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 23, marginTop: 0, marginBottom: 18, fontFamily: FONTS.sans },
  newsForm: { backgroundColor: '#fff', borderRadius: 8, padding: 5, flexDirection: 'row', alignItems: 'center' },
  newsInput: { flex: 1, minHeight: 46, paddingHorizontal: 16, color: BRAND.text, fontFamily: FONTS.sans },
  newsBtn: { backgroundColor: BRAND.ink, borderRadius: 6, minHeight: 46, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  newsBtnText: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sansBold },
  newsSmall: { color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 10, fontFamily: FONTS.sans },
  newsSuccess: { backgroundColor: '#fff', borderRadius: 8, padding: 18, fontWeight: '600', color: BRAND.text, marginTop: 18, fontFamily: FONTS.sansSemi },
  // Footer
  footer: { backgroundColor: BRAND.ink, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24 },
  footerGrid: { flexDirection: 'row', gap: 32 },
  footerGridSmall: { flexDirection: 'column', gap: 0 },
  footerBrand: { flex: 1.7 },
  footerCol: { flex: 1 },
  footerAbout: { color: 'rgba(255,255,255,0.56)', fontSize: 12, lineHeight: 20, marginTop: 16, maxWidth: 300, fontFamily: FONTS.sans },
  socials: { flexDirection: 'row', gap: 10, marginTop: 18 },
  social: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHead: { fontSize: 15, color: '#fff', marginBottom: 12, fontFamily: FONTS.serifBold },
  footerLink: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginBottom: 10, fontFamily: FONTS.sans },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.11)',
    marginTop: 32,
    paddingTop: 20,
    minHeight: 72,
  },
  footerBottomSmall: { flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  copy: { color: 'rgba(255,255,255,0.38)', fontSize: 9, fontFamily: FONTS.sans },
  legal: { flexDirection: 'row', gap: 22 },
  legalLink: { color: 'rgba(255,255,255,0.38)', fontSize: 9, fontFamily: FONTS.sans },
});
