import { StyleSheet, Text, View } from 'react-native';
import { BRAND, FONTS } from '@/constants/theme';
import { formatPeso } from '@/data/books';
import { Icon } from '@/components/icons';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export const STEPS = ['Cart', 'Details', 'Payment', 'Confirmation'] as const;

export function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const { small } = useBreakpoint();
  if (small) {
    return (
      <View style={styles.wrapSmall}>
        <Text style={styles.mobileStepText}>
          Step {step} of {STEPS.length} <Text style={styles.mobileStepBold}>{STEPS[step - 1]}</Text>
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      <View style={styles.steps}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? 'complete' : n === step ? 'active' : '';
          return (
            <View key={label} style={styles.step}>
              <View style={[styles.circle, (state === 'active' || state === 'complete') && styles.circleOn]}>
                {state === 'complete' ? (
                  <Icon name="check" size={13} color="#fff" />
                ) : (
                  <Text style={[styles.num, state === 'active' && styles.numOn]}>{n}</Text>
                )}
              </View>
              <Text style={[styles.label, state === 'active' && styles.labelActive]}>{label}</Text>
              {n < STEPS.length ? <View style={[styles.line, state === 'complete' && styles.lineOn]} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={styles.titleWrap}>
      <Text style={styles.h1}>{title}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      <View style={styles.bar} />
    </View>
  );
}

export function TrustRow() {
  return (
    <View style={styles.trust}>
      {(
        [
          { icon: 'lock', label: 'Secure payment' },
          { icon: 'rotate', label: 'Easy returns' },
          { icon: 'truck', label: 'Fast delivery' },
        ] as const
      ).map((t) => (
        <View key={t.label} style={styles.trustItem}>
          <Icon name={t.icon} size={15} color={BRAND.brown} />
          <Text style={styles.trustText}>{t.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function SummaryCard({
  subtotal,
  shipping,
  discount,
  compact,
}: {
  subtotal: number;
  shipping: number;
  discount: number;
  compact?: boolean;
}) {
  const total = subtotal - discount + shipping;
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={styles.h2}>Order summary</Text>
      <View style={styles.row}>
        <Text style={styles.key}>Subtotal</Text>
        <Text style={styles.val}>{formatPeso(subtotal)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.key}>Shipping</Text>
        <Text style={styles.val}>{shipping === 0 ? 'Free' : formatPeso(shipping)}</Text>
      </View>
      {discount > 0 ? (
        <View style={styles.row}>
          <Text style={styles.key}>Discount</Text>
          <Text style={styles.val}>−{formatPeso(discount)}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <Text style={styles.key}>Estimated tax</Text>
        <Text style={styles.val}>{formatPeso(0)}</Text>
      </View>
      <View style={styles.hr} />
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalKey}>Total</Text>
        <Text style={styles.totalVal}>{formatPeso(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: 500, width: '100%', alignSelf: 'center', marginBottom: 40 },
  wrapSmall: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 84, 46, 0.15)',
    paddingBottom: 13,
    marginBottom: 26,
  },
  steps: { flexDirection: 'row' },
  step: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(122, 84, 46, 0.25)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: { backgroundColor: BRAND.ink, borderColor: BRAND.ink },
  num: { fontSize: 13, fontWeight: '700', color: BRAND.brown, fontFamily: FONTS.sansBold },
  numOn: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '600', color: BRAND.brown, fontFamily: FONTS.sansSemi },
  labelActive: { color: BRAND.text },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(122, 84, 46, 0.25)', marginHorizontal: 10 },
  lineOn: { backgroundColor: BRAND.ink },
  mobileStepText: { color: BRAND.brown, fontSize: 11, fontFamily: FONTS.sans },
  mobileStepBold: { color: BRAND.text, fontWeight: '700' },
  titleWrap: { marginBottom: 32, position: 'relative', paddingBottom: 12 },
  h1: { fontSize: 36, color: BRAND.text, fontFamily: FONTS.serifBold },
  sub: { color: BRAND.brown, fontSize: 13, marginTop: 6, fontFamily: FONTS.sans },
  bar: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 3, backgroundColor: BRAND.brown },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: BRAND.ink,
    shadowOpacity: 0.1,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 20 },
    elevation: 8,
  },
  cardCompact: { shadowOpacity: 0, elevation: 0, padding: 10 },
  h2: { fontSize: 22, color: BRAND.text, marginBottom: 24, fontFamily: FONTS.serifBold },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  key: { fontSize: 13, color: BRAND.brown, fontFamily: FONTS.sans },
  val: { fontSize: 13, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  hr: { borderTopWidth: 1, borderTopColor: 'rgba(122, 84, 46, 0.15)', marginVertical: 22 },
  totalRow: { alignItems: 'center', marginBottom: 0 },
  totalKey: { fontSize: 16, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  totalVal: { fontSize: 24, color: BRAND.text, fontFamily: FONTS.serifBold },
  trust: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  trustItem: { flexDirection: 'column', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 9, color: BRAND.brown, fontFamily: FONTS.sans },
});
