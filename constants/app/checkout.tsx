import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BRAND, FONTS, coverTone } from '@/constants/theme';
import { formatPeso } from '@/data/books';
import { Icon, type IconName } from '@/components/icons';
import { PageTitle, Stepper, SummaryCard } from '@/components/checkout-ui';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useShop } from '@/store/shop';

type Method = 'standard' | 'express';
type Pay = 'card' | 'gcash' | 'cash';

const SHIP: Record<Method, { label: string; sub: string; price: number }> = {
  standard: { label: 'Standard delivery', sub: '3–5 business days', price: 120 },
  express: { label: 'Express delivery', sub: '1–2 business days', price: 250 },
};

const FREE_SHIP_AT = 1500;

const PAYS: { id: Pay; icon: IconName; title: string; sub: string }[] = [
  { id: 'card', icon: 'card', title: 'Credit or debit card', sub: 'Visa, Mastercard, or AMEX' },
  { id: 'gcash', icon: 'phone', title: 'GCash', sub: 'Pay securely with your GCash wallet' },
  { id: 'cash', icon: 'cash', title: 'Cash on delivery', sub: 'Pay when your books arrive' },
];

function Field({
  label,
  value,
  onChange,
  placeholder,
  full,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  full?: boolean;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
}) {
  return (
    <View style={[styles.field, full && styles.fieldFull]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(122, 84, 46, 0.65)"
        style={styles.input}
        keyboardType={keyboard ?? 'default'}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}

function CheckoutForm({ user }: { user: { id: string; name: string; email: string } | null }) {
  const cart = useCart();
  const { createOrder } = useShop();
  const { small, stacked } = useBreakpoint();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postal, setPostal] = useState('');
  const [country, setCountry] = useState('Philippines');
  const [saveAddr, setSaveAddr] = useState(false);
  const [method, setMethod] = useState<Method>('standard');
  const [pay, setPay] = useState<Pay>('card');
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const merchandise = cart.subtotal - cart.discount;
  const shipping = cart.lines.length === 0 || merchandise >= FREE_SHIP_AT ? 0 : SHIP[method].price;
  const total = merchandise + shipping;

  const place = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !street.trim() || !city.trim() || !province.trim() || !postal.trim() || !country.trim()) {
      setError('All fields required. Please complete the shipping address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (pay === 'card' && (!cardNum.trim() || !cardName.trim() || !expiry.trim() || !cvv.trim())) {
      setError('Please complete the card details.');
      return;
    }
    if (cart.lines.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setPlacing(true);
    try {
      const orderId = await createOrder({
        name: name.trim(),
        email: email.trim(),
        subtotal: cart.subtotal,
        shipping,
        total,
        discount: cart.discount,
        method: pay,
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        province: province.trim(),
        postal: postal.trim(),
        country: country.trim(),
        userId: user?.id ?? null,
        lines: cart.lines,
      });
      cart.clear();
      cart.clearPromo();
      router.replace({ pathname: '/order-success', params: { orderId: String(orderId) } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={[styles.grid, stacked && styles.gridSmall]}>
      <View style={styles.formCol}>
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.h2}>Shipping address</Text>
            <Text style={styles.required}>All fields required</Text>
          </View>
          <View style={[styles.formGrid, small && styles.formGridSmall]}>
            <Field label="Full name" value={name} onChange={setName} full />
            <Field label="Email address" value={email} onChange={setEmail} keyboard="email-address" />
            <Field label="Phone number" value={phone} onChange={setPhone} keyboard="phone-pad" />
            <Field label="Street address" value={street} onChange={setStreet} full />
            <Field label="City" value={city} onChange={setCity} />
            <Field label="Province" value={province} onChange={setProvince} />
            <Field label="Postal code" value={postal} onChange={setPostal} keyboard="number-pad" />
            <Field label="Country" value={country} onChange={setCountry} placeholder="Philippines" />
          </View>
          <Pressable style={styles.checkbox} onPress={() => setSaveAddr((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: saveAddr }}>
            <View style={[styles.checkboxBox, saveAddr && styles.checkboxOn]}>
              {saveAddr ? <Icon name="check" size={12} color="#fff" /> : null}
            </View>
            <Text style={styles.checkboxText}>Save this address for next time</Text>
          </Pressable>

          <Text style={[styles.h2, styles.gapTop]}>Delivery method</Text>
          <View style={[styles.radioList, small && styles.radioListSmall]}>
            {(Object.keys(SHIP) as Method[]).map((m) => (
              <Pressable
                key={m}
                style={[styles.radio, method === m && styles.radioOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected: method === m }}
                onPress={() => setMethod(m)}>
                <View style={[styles.dot, method === m && styles.dotOn]} />
                <View style={styles.radioCopy}>
                  <Text style={styles.radioTitle}>{SHIP[m].label}</Text>
                  <Text style={styles.radioSub}>{SHIP[m].sub}</Text>
                </View>
                <Text style={styles.radioPrice}>{formatPeso(SHIP[m].price)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, styles.payCard]}>
          <Text style={styles.h2}>Payment method</Text>
          <View style={styles.payList}>
            {PAYS.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.pay, pay === p.id && styles.radioOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected: pay === p.id }}
                onPress={() => setPay(p.id)}>
                <View style={[styles.dot, pay === p.id && styles.dotOn]} />
                <View style={styles.methodIcon}>
                  <Icon name={p.icon} size={18} color={BRAND.text} />
                </View>
                <View style={styles.radioCopy}>
                  <Text style={styles.radioTitle}>{p.title}</Text>
                  <Text style={styles.radioSub}>{p.sub}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {pay === 'card' ? (
            <View style={styles.cardBox}>
              <Field label="Card number" value={cardNum} onChange={setCardNum} placeholder="1234 5678 9012 3456" full keyboard="number-pad" />
              <Field label="Name on card" value={cardName} onChange={setCardName} full />
              <Field label="Expiry date" value={expiry} onChange={setExpiry} placeholder="MM / YY" />
              <Field label="CVV" value={cvv} onChange={setCvv} placeholder="123" keyboard="number-pad" />
              <View style={styles.lockNote}>
                <Icon name="lock" size={14} color={BRAND.brown} />
                <Text style={styles.lockText}>Your payment details are encrypted.</Text>
              </View>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.formActions}>
            {!small ? (
              <Pressable onPress={() => router.back()}>
                <Text style={styles.backLink}>← Back to cart</Text>
              </Pressable>
            ) : null}
            {!small ? (
              <Pressable
                style={[styles.place, placing && styles.disabled]}
                disabled={placing}
                onPress={place}>
                <Text style={styles.placeText}>{placing ? 'Placing…' : `Place order · ${formatPeso(total)}`}</Text>
              </Pressable>
            ) : null}
          </View>
          {small && error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>

      <View style={[styles.sideCol, stacked && styles.sideColSmall]}>
        <View style={styles.itemsBox}>
          {cart.lines.map((l) => {
            const tone = coverTone(l.book.tone);
            return (
              <View key={l.book.id} style={styles.sumItem}>
                <View style={[styles.sumThumb, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.sumThumbText, { color: tone.fg }]}>{l.book.title.charAt(0)}</Text>
                </View>
                <View style={styles.sumInfo}>
                  <Text style={styles.sumTitle} numberOfLines={1}>
                    {l.book.title}
                  </Text>
                  <Text style={styles.sumSub}>
                    {l.book.format} · Qty {l.qty}
                  </Text>
                </View>
                <Text style={styles.sumPrice}>{formatPeso(l.book.price * l.qty)}</Text>
              </View>
            );
          })}
        </View>
        <SummaryCard subtotal={cart.subtotal} shipping={shipping} discount={cart.discount} />
      </View>

      {small ? (
        <View style={styles.stickyBar}>
          <View>
            <Text style={styles.stickyCap}>Total</Text>
            <Text style={styles.stickyTotal}>{formatPeso(total)}</Text>
          </View>
          <Pressable style={[styles.place, styles.stickyBtn, placing && styles.disabled]} disabled={placing} onPress={place}>
            <Text style={styles.placeText}>{placing ? 'Placing…' : 'Place order'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function CheckoutScreen() {
  const { user } = useAuth();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SiteHeader />
      <ScrollView contentContainerStyle={styles.shell}>
        <View style={styles.body}>
          <Stepper step={2} />
          <PageTitle title="Checkout" sub={user ? `Ordering as ${user.name}` : 'Checking out as guest'} />
          <CheckoutForm key={user?.id ?? 'guest'} user={user} />
        </View>
        <SiteFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const TINT_15 = 'rgba(122, 84, 46, 0.15)';
const TINT_25 = 'rgba(122, 84, 46, 0.25)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  shell: { paddingBottom: 96 },
  body: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 48 },
  grid: { flexDirection: 'row', gap: 40, alignItems: 'flex-start' },
  gridSmall: { flexDirection: 'column' },
  formCol: { flex: 1.9, minWidth: 0, maxWidth: 700 },
  sideCol: { flex: 1, minWidth: 260, maxWidth: 380 },
  sideColSmall: { width: '100%', maxWidth: '100%', marginTop: 24 },
  card: { borderWidth: 1, borderColor: TINT_15, backgroundColor: '#fff', borderRadius: 24, padding: 32, marginBottom: 24 },
  payCard: { marginBottom: 0 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  h2: { fontSize: 21, color: BRAND.text, fontFamily: FONTS.serifBold },
  gapTop: { marginTop: 32, marginBottom: 16 },
  required: { color: BRAND.brown, fontSize: 11, fontFamily: FONTS.sans },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  formGridSmall: { flexDirection: 'column', gap: 0 },
  field: { width: '48%', gap: 7, marginBottom: 4 },
  fieldFull: { width: '100%' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
  input: {
    borderWidth: 1,
    borderColor: TINT_25,
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    color: BRAND.text,
    fontFamily: FONTS.sans,
  },
  checkbox: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  checkboxBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: BRAND.brown, marginRight: 9, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: BRAND.ink, borderColor: BRAND.ink },
  checkboxText: { fontSize: 12, color: BRAND.text, fontFamily: FONTS.sans },
  radioList: { flexDirection: 'row', gap: 12 },
  radioListSmall: { flexDirection: 'column' },
  radio: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: TINT_25,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 17,
  },
  radioOn: { borderWidth: 2, borderColor: BRAND.ink, backgroundColor: 'rgba(122, 84, 46, 0.08)', padding: 16 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: BRAND.brown },
  dotOn: { backgroundColor: BRAND.ink, borderColor: BRAND.ink },
  radioCopy: { flex: 1, gap: 5 },
  radioTitle: { fontSize: 12, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  radioSub: { fontSize: 10, color: BRAND.brown, fontFamily: FONTS.sans },
  radioPrice: { fontSize: 13, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  payList: { gap: 10 },
  pay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: TINT_25,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 15,
  },
  methodIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(122, 84, 46, 0.08)', alignItems: 'center', justifyContent: 'center' },
  cardBox: { backgroundColor: 'rgba(122, 84, 46, 0.08)', borderRadius: 16, marginTop: 20, padding: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  lockNote: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%' },
  lockText: { color: BRAND.brown, fontSize: 10, fontFamily: FONTS.sans },
  error: { color: '#B91C1C', fontSize: 12, fontWeight: '600', marginTop: 16, fontFamily: FONTS.sansSemi },
  formActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 34 },
  backLink: { color: BRAND.brown, fontSize: 12, fontWeight: '600', fontFamily: FONTS.sansSemi },
  place: { backgroundColor: BRAND.ink, borderRadius: 12, height: 52, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  placeText: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: FONTS.sansBold },
  disabled: { opacity: 0.45 },
  itemsBox: { borderBottomWidth: 1, borderBottomColor: TINT_15, marginBottom: 24, paddingBottom: 12 },
  sumItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sumThumb: { width: 34, height: 46, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  sumThumbText: { fontSize: 18, fontFamily: FONTS.serifBold },
  sumInfo: { flex: 1 },
  sumTitle: { fontSize: 11, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.serifSemi },
  sumSub: { fontSize: 8, color: BRAND.brown, marginTop: 3, fontFamily: FONTS.sans },
  sumPrice: { fontSize: 10, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: TINT_15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 76,
    marginHorizontal: -24,
    marginBottom: -96,
    marginTop: 24,
  },
  stickyCap: { color: BRAND.brown, fontSize: 9, fontFamily: FONTS.sans },
  stickyTotal: { fontSize: 18, color: BRAND.text, fontFamily: FONTS.serifBold },
  stickyBtn: { flex: 1 },
});
