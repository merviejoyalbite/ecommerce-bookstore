import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { BRAND, FONTS, coverTone } from '@/constants/theme';
import { formatPeso } from '@/data/books';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useShop, type Review } from '@/store/shop';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cart = useCart();
  const { user } = useAuth();
  const { getBook, toggleWishlist, isWished, listReviews, addReview } = useShop();
  const book = getBook(id ?? '');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const wished = book ? isWished(book.id) : false;

  useFocusEffect(
    useCallback(() => {
      if (id) listReviews(String(id)).then(setReviews).catch(() => setReviews([]));
    }, [id, listReviews]),
  );

  if (!book) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Text style={styles.title}>Book not found</Text>
          <Pressable style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const outOfStock = (book.stock ?? 20) <= 0;
  const tone = coverTone(book.tone);

  const submitReview = async () => {
    if (!user) {
      setError('Sign in to write a review.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await addReview(book.id, user.id, user.name, rating, comment);
      setComment('');
      setRating(5);
      setReviews(await listReviews(book.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post review.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SiteHeader />
      <ScrollView contentContainerStyle={styles.shell}>
        <View style={styles.body}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <View style={[styles.cover, { backgroundColor: tone.bg }]}>
          <Text style={[styles.coverEyebrow, { color: tone.fg }]}>{book.genre || book.category}</Text>
          <Text style={[styles.coverTitle, { color: tone.fg }]}>{book.title}</Text>
          <View style={[styles.coverRule, { backgroundColor: tone.fg }]} />
          <Text style={[styles.coverAuthor, { color: tone.fg }]}>{book.author}</Text>
        </View>
        <Text style={styles.category}>{book.category}</Text>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>
          {book.author} • ★ {book.rating.toFixed(1)} • {reviews.length} review(s)
        </Text>
        <Text style={styles.stock}>{outOfStock ? 'Out of stock' : `${book.stock ?? 20} in stock`}</Text>
        <Text style={styles.blurb}>{book.blurb}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPeso(book.price)}</Text>
          {book.oldPrice != null ? <Text style={styles.old}>{formatPeso(book.oldPrice)}</Text> : null}
        </View>
        <View style={styles.btnRow}>
          <Pressable
            style={[styles.btn, styles.btnMain, outOfStock && styles.btnDisabled]}
            disabled={outOfStock}
            onPress={() => {
              cart.add(book, 1);
              router.push('/(tabs)/cart');
            }}>
            <Text style={styles.btnText}>{outOfStock ? 'Out of stock' : 'Add to cart'}</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.wishBtn, wished && styles.wishActive]}
            onPress={() => {
              if (!user) {
                router.push('/(tabs)/account');
                return;
              }
              void toggleWishlist(user.id, book.id);
            }}>
            <Text style={[styles.wishText, wished && styles.wishTextActive]}>{wished ? '♥ Saved' : '♡ Save'}</Text>
          </Pressable>
        </View>
        {user?.isAdmin ? (
          <Pressable style={styles.adminBtn} onPress={() => router.push('/(tabs)/admin')}>
            <Text style={styles.adminText}>Manage in admin panel</Text>
          </Pressable>
        ) : null}

        <Text style={styles.section}>Reviews ({reviews.length})</Text>
        {reviews.length === 0 ? (
          <Text style={styles.muted}>No reviews yet. Be the first to share your thoughts.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              <Text style={styles.reviewHead}>
                {r.userName} • {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
              </Text>
              <Text style={styles.reviewComment}>{r.comment}</Text>
              <Text style={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
            </View>
          ))
        )}

        <View style={styles.reviewForm}>
          <Text style={styles.formTitle}>{user ? `Review as ${user.name}` : 'Write a review'}</Text>
          {!user ? (
            <Pressable style={styles.secondary} onPress={() => router.push('/(tabs)/account')}>
              <Text style={styles.secondaryText}>Sign in to review</Text>
            </Pressable>
          ) : (
            <>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Pressable key={s} onPress={() => setRating(s)}>
                    <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="What did you think of this book?"
                style={[styles.input, styles.multiline]}
                multiline
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable style={[styles.btn, styles.btnMain, sending && styles.btnDisabled]} disabled={sending} onPress={submitReview}>
                <Text style={styles.btnText}>{sending ? 'Posting…' : 'Post review'}</Text>
              </Pressable>
            </>
          )}
        </View>
        </View>
        <SiteFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.background },
  shell: { paddingBottom: 0 },
  body: { padding: 16, paddingBottom: 32, maxWidth: 700, width: '100%', alignSelf: 'center' },
  back: { color: BRAND.muted, marginBottom: 12 },
  cover: { borderRadius: 12, backgroundColor: BRAND.tint, alignItems: 'center', justifyContent: 'center', marginBottom: 16, paddingVertical: 48, paddingHorizontal: 32 },
  coverEyebrow: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8, marginBottom: 14, fontFamily: FONTS.sansMedium },
  coverTitle: { fontSize: 24, textAlign: 'center', fontFamily: FONTS.serifBold, lineHeight: 30 },
  coverRule: { width: 26, height: 1, opacity: 0.6, marginVertical: 12 },
  coverAuthor: { fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: FONTS.sansMedium },
  category: { color: BRAND.muted, fontSize: 12, fontFamily: FONTS.sans },
  title: { fontSize: 30, color: BRAND.text, marginTop: 4, fontFamily: FONTS.serifBold },
  author: { color: BRAND.muted, marginTop: 4, fontFamily: FONTS.sans },
  stock: { color: BRAND.green, fontWeight: '700', marginTop: 4, fontFamily: FONTS.sansBold },
  blurb: { color: BRAND.text, marginTop: 12, lineHeight: 22, fontFamily: FONTS.sans },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 16 },
  price: { fontSize: 22, color: BRAND.brown, fontFamily: FONTS.sansBold },
  old: { fontSize: 13, color: BRAND.faint, textDecorationLine: 'line-through', fontFamily: FONTS.sans },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnMain: { flex: 2, backgroundColor: BRAND.text },
  btnText: { color: '#fff', fontWeight: '800' },
  btnDisabled: { opacity: 0.4 },
  wishBtn: { flex: 1, borderWidth: 1, borderColor: BRAND.border, backgroundColor: '#fff' },
  wishActive: { borderColor: BRAND.accentDark, backgroundColor: BRAND.tint },
  wishText: { fontWeight: '800', color: BRAND.text },
  wishTextActive: { color: BRAND.accentDark },
  adminBtn: { marginTop: 8, paddingVertical: 10, alignItems: 'center' },
  adminText: { fontWeight: '700', color: BRAND.accentDark },
  section: { fontSize: 18, fontWeight: '800', color: BRAND.text, marginTop: 24, marginBottom: 8 },
  muted: { color: BRAND.muted },
  review: { backgroundColor: '#fff', borderWidth: 1, borderColor: BRAND.border, borderRadius: 10, padding: 10, marginBottom: 8 },
  reviewHead: { fontWeight: '800', color: BRAND.text },
  reviewComment: { color: BRAND.text, marginTop: 4 },
  reviewDate: { color: BRAND.muted, fontSize: 12, marginTop: 4 },
  reviewForm: { backgroundColor: '#fff', borderWidth: 1, borderColor: BRAND.border, borderRadius: 12, padding: 12, marginTop: 8 },
  formTitle: { fontWeight: '800', color: BRAND.text, marginBottom: 8 },
  stars: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  star: { fontSize: 28, color: BRAND.border },
  starActive: { color: BRAND.accent },
  input: { backgroundColor: BRAND.background, borderWidth: 1, borderColor: BRAND.border, borderRadius: 10, padding: 12 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  error: { color: '#B91C1C', fontWeight: '700', marginTop: 8 },
  secondary: { borderWidth: 1, borderColor: BRAND.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontWeight: '700', color: BRAND.text },
});
