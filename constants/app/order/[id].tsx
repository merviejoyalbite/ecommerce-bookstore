import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { BRAND, FONTS } from '@/constants/theme';
import { formatPeso } from '@/data/books';
import { deliveryDate, fmtDate, fmtDateTime } from '@/lib/dates';
import { Icon } from '@/components/icons';
import { OrdersFooter, OrdersHeader } from '@/components/OrdersChrome';
import { StatusPill, TRACK_STEPS, downloadInvoice, orderNumber, statusIndex } from '@/components/orders-ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useShop, type Order, type OrderItem } from '@/store/shop';

function eventDate(base: string, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const cart = useCart();
  const { getOrder, listOrderItems, getBook } = useShop();
  const { small, stacked } = useBreakpoint();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [denied, setDenied] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const found = await getOrder(Number(id)).catch(() => null);
        if (!found) {
          setOrder(null);
          setDenied(false);
          return;
        }
        if (!user?.isAdmin && found.userId != null && found.userId !== (user?.id ?? null)) {
          setOrder(null);
          setDenied(true);
          setItems([]);
          return;
        }
        setDenied(false);
        setOrder(found);
        setItems(await listOrderItems(found.id).catch(() => []));
      })();
    }, [id, getOrder, listOrderItems, user?.id, user?.isAdmin]),
  );

  const buyAgain = () => {
    if (!order) return;
    for (const it of items) {
      const book = getBook(it.bookId);
      if (book) cart.add(book, it.qty);
    }
    router.push('/(tabs)/cart');
  };

  const invoice = async () => {
    if (!order) return;
    setInvoiceMsg('');
    const res = await downloadInvoice(order, items);
    if (!res.ok) setInvoiceMsg(res.error);
  };

  if (denied) {
    return (
      <SafeAreaView style={styles.safe}>
        <OrdersHeader />
        <ScrollView contentContainerStyle={styles.shell}>
          <View style={styles.body}>
            <Text style={styles.h1}>Not allowed</Text>
            <Text style={styles.muted}>This order belongs to another account.</Text>
            <Pressable style={styles.primary} onPress={() => router.back()}>
              <Text style={styles.primaryText}>Go back</Text>
            </Pressable>
          </View>
          <OrdersFooter />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <OrdersHeader />
        <ScrollView contentContainerStyle={styles.shell}>
          <View style={styles.body}>
            <Text style={styles.h1}>Order not found</Text>
            <Pressable style={styles.primary} onPress={() => router.back()}>
              <Text style={styles.primaryText}>Go back</Text>
            </Pressable>
          </View>
          <OrdersFooter />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const idx = statusIndex(order.status);
  const events = [
    { title: 'Order placed', sub: `Order #${orderNumber(order.id)} confirmed`, date: eventDate(order.createdAt, 0), done: true },
    { title: 'Order handed to courier', sub: 'Chapter1 Fulfillment Center', date: eventDate(order.createdAt, 1), done: idx >= 1 },
    { title: 'Parcel received at sorting facility', sub: 'Quezon City Distribution Hub', date: eventDate(order.createdAt, 2), done: idx >= 2 },
    { title: 'Parcel departed the sorting facility', sub: 'Out for delivery', date: eventDate(order.createdAt, 3), done: idx >= 2 },
    ...(idx >= 3 ? [{ title: 'Delivered', sub: 'Left at the front door', date: eventDate(order.createdAt, 5), done: true }] : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <OrdersHeader />
      <ScrollView contentContainerStyle={styles.shell}>
        <View style={styles.body}>
          <Pressable onPress={() => router.push('/(tabs)/orders')}>
            <Text style={styles.back}>← Back to orders</Text>
          </Pressable>

          <View style={styles.heading}>
            <View>
              <Text style={styles.small}>Order placed {fmtDate(order.createdAt)}</Text>
              <Text style={[styles.h1, small && styles.h1Small]}>Order #{orderNumber(order.id)}</Text>
            </View>
            <StatusPill status={order.status} />
          </View>

          <View style={styles.bigTrack}>
            {TRACK_STEPS.map((label, i) => {
              const state = idx < 0 ? '' : i < idx ? 'done' : i === idx ? 'now' : '';
              return (
                <View key={label} style={styles.bigStep}>
                  <View style={[styles.bigIcon, state === 'done' && styles.bigDone, state === 'now' && styles.bigNow]}>
                    {state === 'done' ? (
                      <Icon name="check" size={16} color="#fff" />
                    ) : (
                      <Icon name={i === 0 ? 'box' : i === 3 ? 'check' : 'truck'} size={16} color={state === 'now' ? '#fff' : BRAND.brown} />
                    )}
                  </View>
                  <Text style={styles.bigLabel}>{label}</Text>
                  {i < TRACK_STEPS.length - 1 ? <View style={[styles.bigLine, state === 'done' && styles.bigLineDone]} /> : null}
                </View>
              );
            })}
          </View>

          <View style={[styles.grid, stacked && styles.gridSmall]}>
            <View style={styles.left}>
              <View style={styles.card}>
                <Text style={styles.h2}>Items in this order</Text>
                {items.map((it) => (
                  <View key={it.id} style={styles.line}>
                    <View style={styles.thumb}>
                      <Text style={styles.thumbText}>{it.title.charAt(0)}</Text>
                    </View>
                    <View style={styles.lineInfo}>
                      <Text style={styles.lineTitle} numberOfLines={2}>
                        {it.title}
                      </Text>
                      <Text style={styles.lineSub}>Qty {it.qty}</Text>
                    </View>
                    <Text style={styles.linePrice}>{formatPeso(it.price * it.qty)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.right}>
              <View style={styles.card}>
                <Text style={styles.h2}>Delivery updates</Text>
                <View style={styles.timeline}>
                  {events.map((e) => (
                    <View key={e.title} style={styles.event}>
                      <View style={styles.eventDot} />
                      <Text style={styles.eventTitle}>{e.title}</Text>
                      <Text style={styles.eventSub}>{e.sub}</Text>
                      <Text style={styles.eventSub}>{fmtDateTime(e.date)}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.sumRow}>
                  <Text style={styles.muted}>Subtotal</Text>
                  <Text style={styles.sumVal}>{formatPeso(order.subtotal)}</Text>
                </View>
                {order.discount > 0 ? (
                  <View style={styles.sumRow}>
                    <Text style={styles.muted}>Discount</Text>
                    <Text style={styles.sumVal}>−{formatPeso(order.discount)}</Text>
                  </View>
                ) : null}
                <View style={styles.sumRow}>
                  <Text style={styles.muted}>Shipping</Text>
                  <Text style={styles.sumVal}>{order.shipping === 0 ? 'Free' : formatPeso(order.shipping)}</Text>
                </View>
                <View style={styles.totalBar}>
                  <Text style={styles.totalText}>Total {formatPeso(order.total)}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.h2}>Shipping address</Text>
                <Text style={styles.addr}>
                  <Text style={styles.addrName}>{order.name}{'\n'}</Text>
                  {[order.street, `${order.city}, ${order.province} ${order.postal}`, order.country]
                    .filter((x) => x.replace(/[, ]/g, ''))
                    .join('\n') || '—'}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.h2}>Payment method</Text>
                <View style={styles.payRow}>
                  <View style={styles.payMark}>
                    <Text style={styles.payLetter}>{order.method.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.payName}>
                      {order.method === 'gcash' ? 'GCash' : order.method === 'cash' ? 'Cash on delivery' : 'Card'}
                    </Text>
                    <Text style={styles.muted}>
                      {order.method === 'gcash' ? 'Paid with GCash wallet' : order.method === 'cash' ? 'Pay when your books arrive' : 'Charged to card'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.h2}>Need help?</Text>
                <Text style={styles.muted}>We’re here for any questions about your order.</Text>
                <Pressable style={styles.helpBtn} onPress={() => void Linking.openURL('mailto:hello@booknook.com')}>
                  <Text style={styles.helpText}>Contact support</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.outline} onPress={invoice}>
              <Icon name="download" size={15} color={BRAND.text} />
              <Text style={styles.outlineText}>Download invoice</Text>
            </Pressable>
            <Pressable style={styles.primary} onPress={buyAgain}>
              <Text style={styles.primaryText}>Buy again</Text>
            </Pressable>
          </View>
          {invoiceMsg ? <Text style={styles.invoiceMsg}>{invoiceMsg}</Text> : null}

          <Text style={styles.estimate}>Estimated delivery: {deliveryDate(order.createdAt, order.method)}</Text>
        </View>
        <OrdersFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const TINT15 = 'rgba(122, 84, 46, 0.15)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  shell: { paddingBottom: 0 },
  body: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 64 },
  back: { color: BRAND.brown, fontSize: 13, marginBottom: 26, fontFamily: FONTS.sans },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  h1: { fontSize: 40, color: BRAND.text, letterSpacing: -0.5, lineHeight: 48, fontFamily: FONTS.serifBold },
  h1Small: { fontSize: 27 },
  small: { color: BRAND.brown, fontSize: 12, marginBottom: 7, fontFamily: FONTS.sans },
  muted: { color: BRAND.brown, fontSize: 11, fontFamily: FONTS.sans },
  bigTrack: { flexDirection: 'row', backgroundColor: 'rgba(122, 84, 46, 0.08)', borderRadius: 20, marginVertical: 40, paddingHorizontal: 62, paddingVertical: 30 },
  bigStep: { flex: 1, alignItems: 'center', position: 'relative' },
  bigIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(122, 84, 46, 0.25)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginBottom: 10,
  },
  bigDone: { borderColor: BRAND.ink, backgroundColor: BRAND.ink },
  bigNow: { borderColor: BRAND.brown, backgroundColor: BRAND.brown, borderWidth: 4 },
  bigLabel: { color: BRAND.brown, fontSize: 10, fontFamily: FONTS.sans },
  bigLine: { position: 'absolute', top: 19, left: '58%', width: '84%', height: 2, backgroundColor: 'rgba(122, 84, 46, 0.25)' },
  bigLineDone: { backgroundColor: BRAND.ink },
  grid: { flexDirection: 'row', gap: 40, alignItems: 'flex-start' },
  gridSmall: { flexDirection: 'column' },
  left: { flex: 1.9, minWidth: 0, maxWidth: 700 },
  right: { flex: 1, minWidth: 260, maxWidth: 380, gap: 16 },
  card: { borderWidth: 1, borderColor: TINT15, backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 16 },
  h2: { fontSize: 21, color: BRAND.text, marginBottom: 20, fontFamily: FONTS.serifBold },
  line: { flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderTopColor: TINT15, minHeight: 108, paddingVertical: 12 },
  thumb: { width: 52, height: 72, borderRadius: 7, backgroundColor: BRAND.paper, alignItems: 'center', justifyContent: 'center' },
  thumbText: { fontSize: 24, fontFamily: FONTS.serifBold, color: BRAND.brown },
  lineInfo: { flex: 1 },
  lineTitle: { fontSize: 15, color: BRAND.text, marginBottom: 4, fontFamily: FONTS.serifSemi },
  lineSub: { color: BRAND.brown, fontSize: 11, fontFamily: FONTS.sans },
  linePrice: { fontSize: 12, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  timeline: { marginLeft: 6 },
  event: { borderLeftWidth: 1, borderLeftColor: 'rgba(122, 84, 46, 0.25)', paddingLeft: 26, paddingBottom: 25, position: 'relative' },
  eventDot: { position: 'absolute', top: 2, left: -5, width: 9, height: 9, borderRadius: 5, backgroundColor: BRAND.brown },
  eventTitle: { fontSize: 12, fontWeight: '700', color: BRAND.text, marginBottom: 4, fontFamily: FONTS.sansBold },
  eventSub: { color: BRAND.brown, fontSize: 10, fontFamily: FONTS.sans },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  sumVal: { color: BRAND.text, fontWeight: '500', fontSize: 11, fontFamily: FONTS.sans },
  totalBar: { backgroundColor: 'rgba(122, 84, 46, 0.08)', borderRadius: 12, marginHorizontal: -24, marginBottom: -24, marginTop: 18, padding: 18 },
  totalText: { fontSize: 14, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  addr: { color: BRAND.brown, fontSize: 11, lineHeight: 20, fontFamily: FONTS.sans },
  addrName: { color: BRAND.text, fontWeight: '700' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payMark: { width: 36, height: 36, borderRadius: 18, backgroundColor: BRAND.brown, alignItems: 'center', justifyContent: 'center' },
  payLetter: { color: '#fff', fontWeight: '700', fontSize: 14 },
  payName: { fontSize: 11, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  helpBtn: { marginTop: 14, alignSelf: 'flex-start' },
  helpText: { color: BRAND.brown, fontSize: 12, fontWeight: '600', fontFamily: FONTS.sansSemi },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  primary: { backgroundColor: BRAND.ink, borderRadius: 11, height: 50, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: FONTS.sansBold },
  outline: { flexDirection: 'row', borderWidth: 1, borderColor: BRAND.ink, borderRadius: 11, height: 50, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', gap: 8 },
  outlineText: { fontSize: 12, fontWeight: '600', color: BRAND.text, fontFamily: FONTS.sansSemi },
  invoiceMsg: { color: '#B91C1C', fontSize: 12, marginTop: 8, textAlign: 'right', fontFamily: FONTS.sans },
  estimate: { color: BRAND.brown, fontSize: 11, marginTop: 16, textAlign: 'center', fontFamily: FONTS.sans },
});
