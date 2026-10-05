import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BRAND, FONTS, coverTone } from '@/constants/theme';
import { formatPeso, type Book } from '@/data/books';
import { Icon } from '@/components/icons';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useShop } from '@/store/shop';
import { useBreakpoint } from '@/hooks/useBreakpoint';

type Props = {
  book: Book;
  ranked?: number;
  /** Catalog Make card: bordered frame, badge, review count, sold-out state. */
  framed?: boolean;
};

export function BookCard({ book, ranked, framed }: Props) {
  const { user } = useAuth();
  const { isWished, toggleWishlist } = useShop();
  const cart = useCart();
  const { small } = useBreakpoint();
  const wished = isWished(book.id);
  const tone = coverTone(book.tone);
  const soldOut = (book.stock ?? 1) <= 0;
  const circleAdd = framed && small;

  const goCart = () => {
    if (soldOut) return;
    cart.add(book, 1);
    router.push('/(tabs)/cart');
  };

  return (
    <View style={[styles.card, framed && styles.cardFramed]}>
      <Pressable
        style={(s) => [styles.visual, framed && styles.visualFramed, s.hovered && styles.visualHover, s.pressed && styles.visualPress]}
        onPress={() => router.push(`/book/${book.id}`)}>
        {ranked != null ? (
          <Text style={styles.rank}>0{ranked}</Text>
        ) : null}
        {framed && book.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{book.badge}</Text>
          </View>
        ) : null}
        <View style={[styles.cover, framed && styles.coverFramed, { backgroundColor: tone.bg }]}>
          <Text style={[styles.coverEyebrow, { color: tone.fg }]} numberOfLines={1}>
            {book.genre || book.category}
          </Text>
          <Text style={[styles.coverTitle, { color: tone.fg }]} numberOfLines={3}>
            {book.title}
          </Text>
          <View style={[styles.coverRule, { backgroundColor: tone.fg }]} />
          <Text style={[styles.coverAuthor, { color: tone.fg }]} numberOfLines={1}>
            {book.author}
          </Text>
        </View>
        {framed && soldOut ? (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        ) : null}
        <Pressable
          style={[styles.wish, framed && styles.wishFramed]}
          hitSlop={14}
          accessibilityLabel={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          onPress={() => {
            if (!user) {
              router.push('/(tabs)/account');
              return;
            }
            void toggleWishlist(user.id, book.id);
          }}>
          <Icon name="heart" size={framed ? 15 : 16} color={wished ? BRAND.brown : BRAND.text} filled={wished} />
        </Pressable>
      </Pressable>
      <View style={styles.body}>
        {!(framed && small) ? (
          <View style={styles.ratingRow}>
            <Icon name="star" size={11} color={BRAND.brown} />
            <Text style={styles.rating}>
              {book.rating.toFixed(1)}
              {framed && book.reviewCount ? ` (${book.reviewCount})` : ''}
            </Text>
          </View>
        ) : null}
        <Pressable onPress={() => router.push(`/book/${book.id}`)}>
          <Text style={[styles.title, framed && styles.titleFramed]} numberOfLines={2}>
            {book.title}
          </Text>
        </Pressable>
        <Text style={[styles.author, framed && styles.authorFramed]} numberOfLines={1}>
          {book.author}
        </Text>
        {!circleAdd ? (
          <View style={styles.footer}>
            <View style={styles.priceWrap}>
              <Text style={[styles.price, framed && styles.priceFramed]}>{formatPeso(book.price)}</Text>
              {book.oldPrice != null ? <Text style={styles.old}>{formatPeso(book.oldPrice)}</Text> : null}
            </View>
            {!framed ? (
              <Pressable
                style={(s) => [styles.addBtn, s.hovered && styles.addHover, s.pressed && styles.addPress]}
                accessibilityLabel={`Add ${book.title} to cart`}
                onPress={goCart}>
                <Icon name="bag" size={16} color="#fff" />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.priceWrap}>
            <Text style={[styles.price, styles.priceFramed]}>{formatPeso(book.price)}</Text>
            {book.oldPrice != null ? <Text style={styles.old}>{formatPeso(book.oldPrice)}</Text> : null}
          </View>
        )}
        {framed && !circleAdd ? (
          <Pressable
            style={(s) => [styles.addBar, soldOut && styles.disabled, s.hovered && !soldOut && styles.addHover, s.pressed && styles.addPress]}
            disabled={soldOut}
            accessibilityLabel={soldOut ? `${book.title} is out of stock` : `Add ${book.title} to cart`}
            onPress={goCart}>
            <Icon name="bag" size={14} color="#fff" />
            <Text style={styles.addBarText}>{soldOut ? 'Out of stock' : 'Add to cart'}</Text>
          </Pressable>
        ) : null}
      </View>
      {circleAdd ? (
        <Pressable
          style={(s) => [styles.addCircle, soldOut && styles.disabled, s.hovered && !soldOut && styles.addHover]}
          disabled={soldOut}
          accessibilityLabel={soldOut ? `${book.title} is out of stock` : `Add ${book.title} to cart`}
          onPress={goCart}>
          <Icon name="bag" size={15} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 150, position: 'relative' },
  cardFramed: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 18,
    padding: 12,
    paddingBottom: 14,
    minWidth: 0,
  },
  visual: {
    backgroundColor: BRAND.paper,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 230,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  visualFramed: {
    backgroundColor: 'rgba(122, 84, 46, 0.08)',
    borderWidth: 0,
    borderRadius: 9,
    aspectRatio: 3 / 4,
    minHeight: 0,
    padding: 0,
  },
  rank: {
    position: 'absolute',
    bottom: -14,
    left: 2,
    fontSize: 76,
    fontFamily: FONTS.serifBold,
    color: 'rgba(122, 84, 46, 0.12)',
    zIndex: 0,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 9,
    zIndex: 2,
    backgroundColor: BRAND.ink,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '700', fontFamily: FONTS.sansBold },
  soldOut: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -12 }],
    zIndex: 2,
    backgroundColor: BRAND.ink,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  soldOutText: { color: '#fff', fontSize: 10, fontWeight: '700', fontFamily: FONTS.sansBold },
  cover: {
    aspectRatio: 0.68,
    width: 130,
    borderRadius: 3,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1,
  },
  coverFramed: { width: '72%', aspectRatio: 0.68 },
  coverEyebrow: { fontSize: 7, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.8, marginBottom: 12, fontFamily: FONTS.sansMedium },
  coverTitle: { fontSize: 16, textAlign: 'center', fontFamily: FONTS.serifBold, lineHeight: 20 },
  coverRule: { width: 22, height: 1, opacity: 0.6, marginVertical: 10 },
  coverAuthor: { fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.9, fontFamily: FONTS.sansMedium },
  wish: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  wishFramed: { top: 9, right: 9, width: 31, height: 31 },
  body: { paddingTop: 12, paddingHorizontal: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rating: { fontSize: 11, color: BRAND.muted, fontFamily: FONTS.sans },
  title: { fontSize: 17, fontFamily: FONTS.serifBold, color: BRAND.text, marginTop: 6, lineHeight: 22 },
  titleFramed: { fontSize: 14, lineHeight: 18, minHeight: 35, marginTop: 12 },
  author: { fontSize: 12, color: BRAND.muted, marginTop: 2, fontFamily: FONTS.sans },
  authorFramed: { fontSize: 10, color: BRAND.brown, marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  priceWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1, marginTop: 8 },
  price: { fontSize: 16, fontWeight: '700', color: BRAND.brown, fontFamily: FONTS.sansBold },
  priceFramed: { fontSize: 15, color: BRAND.text },
  old: { fontSize: 9, color: BRAND.brown, textDecorationLine: 'line-through', fontFamily: FONTS.sans },
  addBtn: { backgroundColor: BRAND.ink, borderRadius: 8, minHeight: 36, width: 40, alignItems: 'center', justifyContent: 'center' },
  addHover: { backgroundColor: BRAND.brown, transform: [{ translateY: -1 }] },
  addPress: { transform: [{ translateY: 1 }], opacity: 0.92 },
  visualHover: {
    transform: [{ translateY: -4 }],
    shadowColor: BRAND.ink,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  visualPress: { transform: [{ translateY: 0 }], opacity: 0.97 },
  addBar: {
    flexDirection: 'row',
    backgroundColor: BRAND.ink,
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
  },
  addBarText: { color: '#fff', fontSize: 10, fontWeight: '700', fontFamily: FONTS.sansBold },
  addCircle: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
});
