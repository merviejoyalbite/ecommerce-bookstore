import { StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BRAND, FONTS } from '@/constants/theme';
import { formatPeso } from '@/data/books';
import { fmtDate } from '@/lib/dates';
import type { Order, OrderItem } from '@/store/shop';

export const TRACK_STEPS = ['Ordered', 'Packed', 'Shipped', 'Delivered'] as const;

export function orderNumber(id: number): string {
  return `BN-${10000 + id}`;
}

export function statusIndex(status: string): number {
  const s = status.toLowerCase();
  if (s.startsWith('deliver')) return 3;
  if (s.startsWith('ship')) return 2;
  if (s.startsWith('cancel')) return -1;
  return 1;
}

export function StatusPill({ status, small }: { status: string; small?: boolean }) {
  const s = status.toLowerCase();
  const style = s.startsWith('deliver')
    ? styles.delivered
    : s.startsWith('ship')
      ? styles.shipped
      : s.startsWith('cancel')
        ? styles.cancelled
        : styles.processing;
  return (
    <View style={[styles.pill, small && styles.pillSmall, style]}>
      <Text style={[styles.pillText, small && styles.pillTextSmall, (s.startsWith('deliver') || s.startsWith('ship')) && styles.pillTextLight]}>
        {status}
      </Text>
    </View>
  );
}

export function Tracker({ status, compact }: { status: string; compact?: boolean }) {
  const idx = statusIndex(status);
  return (
    <View style={styles.tracker}>
      {TRACK_STEPS.map((label, i) => {
        const state = idx < 0 ? '' : i < idx ? 'done' : i === idx ? 'current' : '';
        return (
          <View key={label} style={styles.tstep}>
            <View style={[styles.dot, state === 'done' && styles.dotDone, state === 'current' && styles.dotCurrent]} />
            {!compact ? <Text style={[styles.tlabel, state === 'current' && styles.tlabelCurrent]}>{label}</Text> : null}
            {i < TRACK_STEPS.length - 1 ? <View style={[styles.tline, state === 'done' && styles.tlineDone]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

export function buildInvoice(order: Order, items: OrderItem[]): string {
  const lines = [
    'CHAPTER ONE SHOP — ORDER INVOICE',
    `Order #${orderNumber(order.id)}`,
    `Placed: ${fmtDate(order.createdAt)}`,
    `Customer: ${order.name} <${order.email}>`,
    '',
    ...items.map((it) => `${it.title} x${it.qty} — ${formatPeso(it.price * it.qty)}`),
    '',
    `Subtotal: ${formatPeso(order.subtotal)}`,
    ...(order.discount > 0 ? [`Discount: -${formatPeso(order.discount)}`] : []),
    `Shipping: ${order.shipping === 0 ? 'Free' : formatPeso(order.shipping)}`,
    `Total: ${formatPeso(order.total)}`,
    `Payment: ${order.method}`,
    `Status: ${order.status}`,
  ];
  return lines.join('\n');
}

export async function downloadInvoice(order: Order, items: OrderItem[]): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const available = await Sharing.isAvailableAsync().catch(() => false);
    if (!available) return { ok: false as const, error: 'Sharing is not available on this device.' };
    const path = `${FileSystem.cacheDirectory}invoice-${orderNumber(order.id)}.txt`;
    await FileSystem.writeAsStringAsync(path, buildInvoice(order, items));
    await Sharing.shareAsync(path, { dialogTitle: `Invoice ${orderNumber(order.id)}` });
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: 'Could not share the invoice.' };
  }
}

const styles = StyleSheet.create({
  pill: { borderRadius: 14, height: 28, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  pillSmall: { height: 25, paddingHorizontal: 9 },
  delivered: { backgroundColor: BRAND.ink },
  shipped: { backgroundColor: BRAND.brown },
  processing: { backgroundColor: 'rgba(122, 84, 46, 0.15)' },
  cancelled: { backgroundColor: '#fff', borderWidth: 1, borderColor: BRAND.brown },
  pillText: { fontSize: 11, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  pillTextSmall: { fontSize: 9 },
  pillTextLight: { color: '#fff' },
  tracker: { flexDirection: 'row' },
  tstep: { flex: 1, alignItems: 'center', position: 'relative' },
  dot: { width: 11, height: 11, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(122, 84, 46, 0.25)', backgroundColor: '#fff', zIndex: 1 },
  dotDone: { borderColor: BRAND.ink, backgroundColor: BRAND.ink },
  dotCurrent: { borderColor: BRAND.brown, backgroundColor: BRAND.brown, borderWidth: 3, width: 13, height: 13, borderRadius: 7 },
  tlabel: { color: BRAND.brown, fontSize: 10, marginTop: 7, fontFamily: FONTS.sans },
  tlabelCurrent: { color: BRAND.text, fontWeight: '600' },
  tline: { position: 'absolute', top: 5, left: '52%', right: '-45%', height: 1.5, backgroundColor: 'rgba(122, 84, 46, 0.25)' },
  tlineDone: { backgroundColor: BRAND.ink },
});
