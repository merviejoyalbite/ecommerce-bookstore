import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { printAsync, printToFileAsync } from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BRAND, FONTS, coverTone } from '@/constants/theme';
import { formatPeso } from '@/data/books';
import { deliveryDate, fmtDate } from '@/lib/dates';
import { Icon } from '@/components/icons';
import { LogoWord } from '@/components/Logo';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { StatusPill, Tracker, downloadInvoice, orderNumber } from '@/components/orders-ui';
import { Stepper } from '@/components/checkout-ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useShop, type Order, type OrderItem } from '@/store/shop';

type Tab = 'confirm' | 'receipt' | 'invoice' | 'email';
const TABS: { id: Tab; label: string }[] = [
  { id: 'confirm', label: 'Confirmation' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'email', label: 'Email' },
];

const QR: boolean[][] = [
  [true, true, true, false, true, false],
  [true, false, true, true, false, true],
  [true, true, true, false, true, true],
  [false, true, false, true, false, false],
  [true, false, true, true, true, false],
  [false, true, false, true, false, true],
];

function receiptHtml(order: Order, items: OrderItem[]): string {
  return `<html><body style="font-family:Georgia,serif;max-width:480px;margin:auto;padding:24px;color:#251605">
<h1 style="text-align:center">Chapter1</h1>
<p style="text-align:center;letter-spacing:3px;font-size:10px">OFFICIAL RECEIPT</p>
<hr/>
<p>Order no. #${orderNumber(order.id)}<br/>Issue date: ${fmtDate(order.createdAt)}<br/>${order.name} &lt;${order.email}&gt;</p>
<hr/>
${items.map((it) => `<p>${it.qty} × ${it.title} — ${formatPeso(it.price * it.qty)}</p>`).join('')}
<hr/>
<p>Subtotal: ${formatPeso(order.subtotal)}<br/>Shipping: ${order.shipping === 0 ? 'Free' : formatPeso(order.shipping)}<br/><b>Total: ${formatPeso(order.total)}</b></p>
<p style="text-align:center">Thank you for shopping at Chapter1!</p>
</body></html>`;
}

function invoiceHtml(order: Order, items: OrderItem[]): string {
  const rows = items
    .map(
      (it, i) =>
        `<tr><td>${i + 1}</td><td>${it.title}</td><td>${it.qty}</td><td>${formatPeso(it.price)}</td><td style="text-align:right">${formatPeso(it.price * it.qty)}</td></tr>`,
    )
    .join('');
  return `<html><body style="font-family:Arial,sans-serif;max-width:794px;margin:auto;padding:56px;color:#251605">
<h1>INVOICE</h1>
<p>Invoice no. INV-${orderNumber(order.id)}<br/>Issue date: ${fmtDate(order.createdAt)}<br/>Due date: ${fmtDate(order.createdAt)}</p>
<p><b>BILL TO</b><br/>${order.name}<br/>${order.email}<br/>${order.street}, ${order.city}</p>
<table width="100%" cellpadding="8" cellspacing="0" border="1"><tr><th>NO</th><th>DESCRIPTION</th><th>QTY</th><th>UNIT</th><th>AMOUNT</th></tr>${rows}</table>
<p>Subtotal: ${formatPeso(order.subtotal)}<br/>Shipping: ${order.shipping === 0 ? 'Free' : formatPeso(order.shipping)}<br/><b>Total due: ${formatPeso(order.total)}</b></p>
<p><b>NOTES & TERMS</b><br/>Thank you for your purchase. Returns accepted within 7 days of delivery. Items must be unused and in their original condition.</p>
</body></html>`;
}

export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { getOrder, listOrderItems, books, getBook } = useShop();
  const { small, stacked } = useBreakpoint();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [tab, setTab] = useState<Tab>('confirm');
  const [copied, setCopied] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(!small);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!orderId) return;
        const found = await getOrder(Number(orderId)).catch(() => null);
        setOrder(found);
        if (found) setItems(await listOrderItems(found.id).catch(() => []));
      })();
    }, [orderId, getOrder, listOrderItems]),
  );

  const flash = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  };

  const copyNo = async () => {
    if (!order) return;
    await Clipboard.setStringAsync(`Order #${orderNumber(order.id)}`).catch(() => {});
    setCopied(true);
    flash('Order number copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const doPrint = async (html: string) => {
    try {
      await printAsync({ html });
    } catch {
      flash('Printing is not available here');
    }
  };

  const doPdf = async (html: string, name: string) => {
    setBusy(true);
    try {
      const { uri } = await printToFileAsync({ html });
      const ok = await Sharing.isAvailableAsync().catch(() => false);
      if (!ok) {
        flash('Sharing is not available here');
        return;
      }
      await Sharing.shareAsync(uri, { dialogTitle: name });
    } catch {
      flash('Could not create the PDF');
    } finally {
      setBusy(false);
    }
  };

  const recs = (() => {
    if (!order) return [];
    const boughtCats = new Set(items.map((it) => getBook(it.bookId)?.category).filter(Boolean));
    const boughtIds = new Set(items.map((it) => it.bookId));
    const same = books.filter((b) => !boughtIds.has(b.id) && boughtCats.has(b.category));
    const rest = books.filter((b) => !boughtIds.has(b.id) && !boughtCats.has(b.category));
    return [...same.sort((a, b) => b.rating - a.rating), ...rest.sort((a, b) => b.rating - a.rating)].slice(0, 4);
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <SiteHeader />
      <View style={styles.switcher}>
        {TABS.map((t) => (
          <Pressable key={t.id} style={[styles.switchBtn, tab === t.id && styles.switchOn]} onPress={() => setTab(t.id)}>
            <Text style={[styles.switchText, tab === t.id && styles.switchTextOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.shell}>
        <View style={styles.body}>
          <Stepper step={4} />

          {tab === 'confirm' ? (
            <>
              <View style={styles.hero}>
                <View style={styles.celebration}>
                  <Text style={[styles.twinkle, styles.s1]}>★</Text>
                  <Text style={[styles.twinkle, styles.s2]}>★</Text>
                  <Text style={[styles.twinkle, styles.s3]}>★</Text>
                  <View style={[styles.tinyBook, styles.b1]} />
                  <View style={[styles.tinyBook, styles.b2]} />
                  <View style={styles.ringOuter}>
                    <View style={styles.ring}>
                      <Icon name="check" size={38} color={BRAND.text} />
                    </View>
                  </View>
                </View>
                <Text style={styles.eyebrow}>ORDER CONFIRMED</Text>
                <Text style={[styles.h1, small && styles.h1Small]}>Thank you for your order!</Text>
                <Text style={styles.heroCopy}>
                  Hi {order?.name.split(' ')[0] ?? 'reader'}, thanks for your order. We&apos;ve sent a confirmation
                  email to {order?.email ?? 'your inbox'}.
                </Text>
                {order ? (
                  <Pressable
                    style={[styles.chip, copied && styles.chipOn]}
                    accessibilityLabel="Copy order number"
                    onPress={copyNo}>
                    <Text style={[styles.chipText, copied && styles.chipTextOn]}>
                      {copied ? 'Copied!' : `ORDER #${orderNumber(order.id)}`}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={[styles.grid, stacked && styles.gridSmall]}>
                <View style={styles.left}>
                  <View style={styles.card}>
                    <View style={styles.cardHead}>
                      <Text style={styles.h2}>Delivery status</Text>
                      {order ? <StatusPill status={order.status} small /> : null}
                    </View>
                    {order ? (
                      <>
                        <Tracker status={order.status} />
                        <View style={styles.dateBox}>
                          <Icon name="truck" size={20} color={BRAND.text} />
                          <View>
                            <Text style={styles.dateCap}>Estimated delivery</Text>
                            <Text style={styles.dateVal}>{deliveryDate(order.createdAt, order.method)}</Text>
                          </View>
                        </View>
                      </>
                    ) : null}
                  </View>

                  <View style={styles.card}>
                    <Pressable
                      style={styles.itemsHead}
                      onPress={() => setItemsOpen((v) => !v)}
                      accessibilityLabel={itemsOpen ? 'Hide items' : 'Show items'}>
                      <Text style={styles.h2}>
                        Your books{' '}
                        <Text style={styles.itemsCount}>
                          {items.length} item{items.length === 1 ? '' : 's'}
                          {small ? ' · tap to view' : ''}
                        </Text>
                      </Text>
                      {small ? <Icon name="chevron" size={16} color={BRAND.brown} /> : null}
                    </Pressable>
                    {(itemsOpen || !small) &&
                      items.map((it) => {
                        const b = getBook(it.bookId);
                        const tone = coverTone(b?.tone);
                        return (
                          <View key={it.id} style={styles.itemRow}>
                            <View style={[styles.mini, { backgroundColor: tone.bg }]}>
                              <Text style={[styles.miniText, { color: tone.fg }]}>{it.title.charAt(0)}</Text>
                            </View>
                            <View style={styles.itemCopy}>
                              <Text style={styles.itemTitle} numberOfLines={2}>
                                {it.title}
                              </Text>
                              <Text style={styles.itemSub}>
                                {b?.format ?? 'Paperback'} · Qty {it.qty}
                              </Text>
                            </View>
                            <Text style={styles.itemPrice}>{formatPeso(it.price * it.qty)}</Text>
                          </View>
                        );
                      })}
                  </View>

                  {order ? (
                    <View style={styles.infoGrid}>
                      <View style={styles.infoBox}>
                        <Text style={styles.eyebrow}>SHIPPING ADDRESS</Text>
                        <Text style={styles.infoTitle}>{order.name}</Text>
                        <Text style={styles.infoSub}>
                          {[order.street, `${order.city}, ${order.province} ${order.postal}`, order.country]
                            .filter((x) => x.replace(/[, ]/g, ''))
                            .join('\n') || '—'}
                        </Text>
                      </View>
                      <View style={styles.infoBox}>
                        <Text style={styles.eyebrow}>PAYMENT METHOD</Text>
                        <Text style={styles.infoTitle}>
                          {order.method === 'gcash' ? 'GCash' : order.method === 'cash' ? 'Cash on delivery' : 'Card'}
                        </Text>
                        <Text style={styles.infoSub}>
                          {order.method === 'gcash' ? 'Paid with GCash wallet' : order.method === 'cash' ? 'Pay when your books arrive' : 'Charged to card'}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={styles.side}>
                  {order ? (
                    <View style={styles.summary}>
                      <Text style={styles.h2}>Order summary</Text>
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
                      <View style={styles.sumTotal}>
                        <Text style={styles.muted}>Total</Text>
                        <Text style={styles.grand}>{formatPeso(order.total)}</Text>
                      </View>
                      <Pressable style={styles.btnPrimary} onPress={() => router.push(`/order/${order.id}`)}>
                        <Text style={styles.btnPrimaryText}>Track my order</Text>
                      </Pressable>
                      <Pressable style={styles.btnOutline} onPress={() => downloadInvoice(order, items).then((r) => !r.ok && flash(r.error))}>
                        <Text style={styles.btnOutlineText}>Download receipt</Text>
                      </Pressable>
                      <View style={styles.help}>
                        <Icon name="help" size={16} color={BRAND.brown} />
                        <View>
                          <Text style={styles.helpTitle}>Need help with your order?</Text>
                          <Text style={styles.muted}>We reply within a day.</Text>
                        </View>
                      </View>
                      <Pressable onPress={() => router.push('/(tabs)/account')}>
                        <Text style={styles.helpLink}>Contact support →</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.bottomActions}>
                <Pressable style={styles.btnOutlineWide} onPress={() => router.replace('/(tabs)/catalog')}>
                  <Text style={styles.btnOutlineText}>Continue shopping</Text>
                </Pressable>
                <Pressable style={styles.btnPrimaryWide} onPress={() => router.replace('/(tabs)/orders')}>
                  <Text style={styles.btnPrimaryText}>View my orders</Text>
                </Pressable>
              </View>

              {recs.length > 0 ? (
                <View style={styles.recs}>
                  <View style={styles.recHead}>
                    <View>
                      <Text style={styles.eyebrow}>HANDPICKED FOR YOU</Text>
                      <Text style={[styles.recTitle, small && styles.recTitleSmall]}>You might also like</Text>
                    </View>
                    <View style={styles.recNav}>
                      {!small ? (
                        <>
                          <Pressable style={styles.arrow} accessibilityLabel="Scroll back" onPress={() => recRef.current?.scrollTo({ x: 0, animated: true })}>
                            <Icon name="chevron" size={16} color={BRAND.text} />
                          </Pressable>
                          <Pressable style={styles.arrow} accessibilityLabel="Scroll forward" onPress={() => recRef.current?.scrollToEnd({ animated: true })}>
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
                        <Pressable key={b.id} style={styles.recCard} onPress={() => router.push(`/book/${b.id}`)}>
                          <View style={[styles.recCover, { backgroundColor: tone.bg }]}>
                            <Text style={[styles.recCoverTitle, { color: tone.fg }]} numberOfLines={2}>
                              {b.title}
                            </Text>
                          </View>
                          <View style={styles.recInfo}>
                            <Text style={styles.recName} numberOfLines={2}>
                              {b.title}
                            </Text>
                            <Text style={styles.recAuthor} numberOfLines={1}>
                              {b.author}
                            </Text>
                            <Text style={styles.recPrice}>{formatPeso(b.price)}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </>
          ) : null}

          {tab === 'receipt' && order ? (
            <View style={styles.receiptPage}>
              <View style={styles.paper}>
                <View style={styles.paperHead}>
                  <Text style={styles.paperLogo}>
                    <LogoWord size={24} color={BRAND.text} />
                  </Text>
                  <Text style={styles.paperEyebrow}>OFFICIAL RECEIPT</Text>
                </View>
                <View style={styles.dash} />
                <View style={styles.metaRows}>
                  <Text style={styles.metaRow}>
                    <Text style={styles.muted}>Order no.</Text> #{orderNumber(order.id)}
                  </Text>
                  <Text style={styles.metaRow}>
                    <Text style={styles.muted}>Issue date</Text> {fmtDate(order.createdAt)}
                  </Text>
                  <Text style={styles.metaRow}>
                    <Text style={styles.muted}>Customer</Text> {order.name}
                  </Text>
                </View>
                <View style={styles.dash} />
                <View style={[styles.rTableHead, styles.rTable]}>
                  <Text style={styles.rHead}>QTY</Text>
                  <Text style={styles.rHead}>DESCRIPTION</Text>
                  <Text style={[styles.rHead, styles.rRight]}>AMOUNT</Text>
                </View>
                {items.map((it) => (
                  <View key={it.id} style={styles.rTable}>
                    <Text style={styles.rCell}>{it.qty}</Text>
                    <Text style={styles.rCell}>
                      {it.title}
                      {'\n'}
                      <Text style={styles.muted}>{formatPeso(it.price)} each</Text>
                    </Text>
                    <Text style={[styles.rCell, styles.rRight]}>{formatPeso(it.price * it.qty)}</Text>
                  </View>
                ))}
                <View style={styles.dash} />
                <View style={styles.metaRows}>
                  <Text style={styles.metaRow}>
                    <Text style={styles.muted}>Subtotal</Text> {formatPeso(order.subtotal)}
                  </Text>
                  {order.discount > 0 ? (
                    <Text style={styles.metaRow}>
                      <Text style={styles.muted}>Discount</Text> −{formatPeso(order.discount)}
                    </Text>
                  ) : null}
                  <Text style={styles.metaRow}>
                    <Text style={styles.muted}>Shipping</Text> {order.shipping === 0 ? 'Free' : formatPeso(order.shipping)}
                  </Text>
                </View>
                <View style={styles.rTotal}>
                  <Text style={styles.muted}>Total paid</Text>
                  <Text style={styles.grand}>{formatPeso(order.total)}</Text>
                  <View style={styles.paid}>
                    <Text style={styles.paidText}>PAID</Text>
                  </View>
                </View>
                <View style={styles.qr}>
                  {QR.map((row, i) => (
                    <View key={i} style={styles.qrRow}>
                      {row.map((on, j) => (
                        <View key={j} style={[styles.qrCell, on && styles.qrOn]} />
                      ))}
                    </View>
                  ))}
                </View>
                <Text style={styles.qrCap}>Scan to track your order</Text>
                <Text style={styles.paperThanks}>Thank you for shopping at Chapter1!</Text>
                <Text style={styles.muted}>Questions? Reply to your confirmation email.</Text>
              </View>
              <View style={styles.paperActions}>
                <Pressable style={styles.btnOutlineWide} onPress={() => downloadInvoice(order, items).then((r) => flash(r.ok ? 'Receipt downloaded' : r.error))}>
                  <Text style={styles.btnOutlineText}>Download receipt</Text>
                </Pressable>
                <Pressable style={styles.btnPrimaryWide} onPress={() => void doPrint(receiptHtml(order, items))}>
                  <Text style={styles.btnPrimaryText}>Print</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => setTab('confirm')}>
                <Text style={styles.backLink}>← Back to order confirmation</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === 'invoice' && order ? (
            <View style={styles.invoicePage}>
              <View style={styles.invoiceBar}>
                <Text style={styles.muted}>A4 · Print-ready · Page 1 of 1</Text>
                <Pressable style={styles.btnOutlineWide} onPress={() => void doPrint(invoiceHtml(order, items))}>
                  <Text style={styles.btnOutlineText}>Print invoice</Text>
                </Pressable>
                <Pressable
                  style={[styles.btnPrimaryWide, busy && styles.disabled]}
                  disabled={busy}
                  onPress={() => void doPdf(invoiceHtml(order, items), `Invoice-${orderNumber(order.id)}`)}>
                  <Text style={styles.btnPrimaryText}>{busy ? 'Working…' : 'Download PDF'}</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sheet}>
                  <View style={styles.sheetHead}>
                    <View>
                      <Text style={styles.sheetLogo}>
                        <LogoWord size={24} color={BRAND.text} />
                      </Text>
                      <Text style={styles.sheetSub}>
                        hello@booknook.com{'\n'}118 Story Lane, Portland, OR 97205
                      </Text>
                    </View>
                    <View style={styles.sheetRight}>
                      <Text style={styles.sheetH1}>INVOICE</Text>
                      <Text style={styles.sheetMeta}>Invoice no. INV-{orderNumber(order.id)}</Text>
                      <Text style={styles.sheetMeta}>Issue date: {fmtDate(order.createdAt)}</Text>
                      <Text style={styles.sheetMeta}>Due date: {fmtDate(order.createdAt)}</Text>
                    </View>
                  </View>
                  <View style={styles.sheetRule} />
                  <View style={styles.parties}>
                    <View style={styles.party}>
                      <Text style={styles.partyHead}>BILL TO</Text>
                      <Text style={styles.partyText}>
                        {order.name}
                        {'\n'}
                        {order.email}
                      </Text>
                    </View>
                    <View style={styles.party}>
                      <Text style={styles.partyHead}>SHIP TO</Text>
                      <Text style={styles.partyText}>
                        {[order.street, `${order.city}, ${order.province} ${order.postal}`, order.country]
                          .filter((x) => x.replace(/[, ]/g, ''))
                          .join('\n') || '—'}
                      </Text>
                    </View>
                    <View style={styles.party}>
                      <Text style={styles.partyHead}>DELIVERY STATUS</Text>
                      <Text style={styles.partyText}>{order.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.watermark}>CHAPTER1</Text>
                  <View style={styles.iTable}>
                    <View style={[styles.iRow, styles.iHead]}>
                      <Text style={styles.iCell}>NO</Text>
                      <Text style={styles.iCell}>DESCRIPTION</Text>
                      <Text style={styles.iCell}>QTY</Text>
                      <Text style={styles.iCell}>UNIT</Text>
                      <Text style={[styles.iCell, styles.rRight]}>AMOUNT</Text>
                    </View>
                    {items.map((it, i) => (
                      <View key={it.id} style={[styles.iRow, i % 2 === 0 && styles.iAlt]}>
                        <Text style={styles.iCell}>{i + 1}</Text>
                        <Text style={styles.iCell}>
                          {it.title}
                          {'\n'}
                          <Text style={styles.muted}>{formatPeso(it.price)} each</Text>
                        </Text>
                        <Text style={styles.iCell}>{it.qty}</Text>
                        <Text style={styles.iCell}>{formatPeso(it.price)}</Text>
                        <Text style={[styles.iCell, styles.rRight]}>{formatPeso(it.price * it.qty)}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.iLower}>
                    <View>
                      <Text style={styles.partyHead}>NOTES & TERMS</Text>
                      <Text style={styles.partyText}>
                        Thank you for your purchase. Returns accepted within 7 days of delivery. Items must be unused
                        and in their original condition. See chapter1.ph/returns.
                      </Text>
                    </View>
                    <View style={styles.iTotals}>
                      <Text style={styles.metaRow}>
                        <Text style={styles.muted}>Subtotal</Text> {formatPeso(order.subtotal)}
                      </Text>
                      {order.discount > 0 ? (
                        <Text style={styles.metaRow}>
                          <Text style={styles.muted}>Discount</Text> −{formatPeso(order.discount)}
                        </Text>
                      ) : null}
                      <Text style={styles.metaRow}>
                        <Text style={styles.muted}>Shipping</Text> {order.shipping === 0 ? 'Free' : formatPeso(order.shipping)}
                      </Text>
                      <View style={styles.iGrand}>
                        <Text style={styles.iGrandLabel}>Total due</Text>
                        <Text style={styles.iGrandVal}>{formatPeso(order.total)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.sheetFoot}>
                    <Text style={styles.muted}>Chapter1 · hello@booknook.com</Text>
                    <Text style={styles.muted}>Page 1 of 1</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          ) : null}

          {tab === 'email' && order ? (
            <View style={styles.emailPage}>
              <View style={styles.emailShell}>
                <View style={styles.emailBand}>
                  <Text style={styles.emailLogo}>
                    <LogoWord size={22} color="#fff" />
                  </Text>
                </View>
                <View style={styles.emailBody}>
                  <View style={styles.emailCheck}>
                    <Icon name="check" size={26} color={BRAND.brown} />
                  </View>
                  <Text style={styles.eyebrow}>ORDER CONFIRMED</Text>
                  <Text style={styles.emailH1}>Thank you for your order!</Text>
                  <Text style={styles.emailCopy}>
                    Hi {order.name.split(' ')[0]}, we&apos;ve sent a confirmation email to {order.email}. Your books
                    are on the way.
                  </Text>
                  <View style={styles.emailSummary}>
                    {items.map((it) => (
                      <Text key={it.id} style={styles.emailLine}>
                        {it.qty} × {it.title} <Text style={styles.emailPrice}>{formatPeso(it.price * it.qty)}</Text>
                      </Text>
                    ))}
                    <View style={styles.emailTotal}>
                      <Text style={styles.emailTotalText}>Total paid {formatPeso(order.total)}</Text>
                    </View>
                  </View>
                  <Text style={styles.emailHelp}>Estimated delivery: {deliveryDate(order.createdAt, order.method)}</Text>
                  <Pressable
                    style={styles.btnOutlineWide}
                    onPress={() =>
                      Clipboard.setStringAsync(
                        `Chapter1 — Order #${orderNumber(order.id)}\nTotal paid ${formatPeso(order.total)}\nEstimated delivery: ${deliveryDate(order.createdAt, order.method)}`,
                      )
                        .then(() => flash('Email text copied'))
                        .catch(() => flash('Could not copy'))
                    }>
                    <Text style={styles.btnOutlineText}>Copy email text</Text>
                  </Pressable>
                </View>
                <View style={styles.emailFoot}>
                  <Text style={styles.muted}>Questions? Reply to this email or contact hello@booknook.com</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
        <SiteFooter />
      </ScrollView>

      {small && tab === 'confirm' ? (
        <View style={styles.stickyBar}>
          <Pressable style={[styles.btnOutlineWide, styles.stickyBtn]} onPress={() => router.replace('/(tabs)/orders')}>
            <Text style={styles.btnOutlineText}>View my orders</Text>
          </Pressable>
          <Pressable style={[styles.btnPrimaryWide, styles.stickyBtn]} onPress={() => router.replace('/(tabs)/catalog')}>
            <Text style={styles.btnPrimaryText}>Continue shopping</Text>
          </Pressable>
        </View>
      ) : null}

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastMsg}>{toast}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const TINT08 = 'rgba(122, 84, 46, 0.08)';
const TINT15 = 'rgba(122, 84, 46, 0.15)';
const TINT25 = 'rgba(122, 84, 46, 0.25)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  shell: { paddingBottom: 0 },
  body: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 24 },
  // Switcher
  switcher: { flexDirection: 'row', justifyContent: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: TINT15, backgroundColor: 'rgba(122, 84, 46, 0.03)', height: 50, alignItems: 'flex-end' },
  switchBtn: { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  switchOn: { borderBottomColor: BRAND.ink },
  switchText: { fontSize: 12, fontWeight: '700', color: BRAND.brown, fontFamily: FONTS.sansBold },
  switchTextOn: { color: BRAND.text },
  // Hero
  hero: { alignItems: 'center', maxWidth: 720, width: '100%', alignSelf: 'center', marginBottom: 64 },
  celebration: { width: 360, maxWidth: '100%', height: 126, alignItems: 'center', justifyContent: 'center' },
  ringOuter: { width: 116, height: 116, borderRadius: 58, backgroundColor: 'rgba(122, 84, 46, 0.05)', alignItems: 'center', justifyContent: 'center' },
  ring: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(122, 84, 46, 0.1)', borderWidth: 1, borderColor: TINT15, alignItems: 'center', justifyContent: 'center' },
  twinkle: { position: 'absolute', color: BRAND.brown, opacity: 0.35, fontSize: 22 },
  s1: { top: 28, left: 30, transform: [{ rotate: '14deg' }] },
  s2: { top: 25, right: 38, fontSize: 14 },
  s3: { bottom: 12, right: 4, fontSize: 20 },
  tinyBook: { position: 'absolute', width: 22, height: 30, borderRadius: 3, backgroundColor: BRAND.brown, opacity: 0.35 },
  b1: { bottom: 5, left: 82, transform: [{ rotate: '-20deg' }] },
  b2: { bottom: 16, right: 82, transform: [{ rotate: '25deg' }] },
  eyebrow: { color: BRAND.brown, letterSpacing: 2, fontSize: 10, fontWeight: '700', marginBottom: 8, fontFamily: FONTS.sansBold },
  h1: { fontSize: 40, color: BRAND.text, textAlign: 'center', lineHeight: 46, fontFamily: FONTS.serifBold },
  h1Small: { fontSize: 30, lineHeight: 36 },
  heroCopy: { color: BRAND.brown, fontSize: 14, lineHeight: 24, textAlign: 'center', marginTop: 12, fontFamily: FONTS.sans },
  chip: { borderWidth: 1, borderStyle: 'dashed', borderColor: BRAND.brown, backgroundColor: TINT08, borderRadius: 10, marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 },
  chipOn: { backgroundColor: BRAND.ink, borderColor: BRAND.ink, borderStyle: 'solid' },
  chipText: { fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  chipTextOn: { color: '#fff' },
  // Grid + cards
  grid: { flexDirection: 'row', gap: 32, alignItems: 'flex-start' },
  gridSmall: { flexDirection: 'column' },
  left: { flex: 1.9, minWidth: 0, maxWidth: 700, gap: 20 },
  side: { flex: 1, minWidth: 260, maxWidth: 380 },
  card: { borderWidth: 1, borderColor: TINT15, backgroundColor: '#fff', borderRadius: 20, padding: 28 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  h2: { fontSize: 23, color: BRAND.text, fontFamily: FONTS.serifBold },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: TINT08, borderRadius: 12, padding: 15, marginTop: 28 },
  dateCap: { color: BRAND.brown, fontSize: 12, marginBottom: 3, fontFamily: FONTS.sans },
  dateVal: { fontSize: 12, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  itemsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemsCount: { fontSize: 11, color: BRAND.brown, fontFamily: FONTS.sans },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 18, borderTopWidth: 1, borderTopColor: TINT15, minHeight: 118, paddingVertical: 15 },
  mini: { width: 64, height: 88, borderRadius: 6, alignItems: 'center', justifyContent: 'center', padding: 7 },
  miniText: { fontSize: 22, fontFamily: FONTS.serifBold },
  itemCopy: { flex: 1 },
  itemTitle: { fontSize: 16, color: BRAND.text, marginBottom: 4, fontFamily: FONTS.serifSemi },
  itemSub: { color: BRAND.brown, fontSize: 11, fontFamily: FONTS.sans },
  itemPrice: { fontSize: 12, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  infoGrid: { flexDirection: 'row', gap: 32 },
  infoBox: { flex: 1 },
  infoTitle: { fontSize: 15, color: BRAND.text, marginTop: 8, marginBottom: 5, fontFamily: FONTS.serifSemi },
  infoSub: { color: BRAND.brown, fontSize: 11, lineHeight: 19, fontFamily: FONTS.sans },
  summary: { borderRadius: 24, padding: 28, backgroundColor: '#fff', shadowColor: BRAND.ink, shadowOpacity: 0.1, shadowRadius: 50, shadowOffset: { width: 0, height: 20 }, elevation: 8 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  muted: { color: BRAND.brown, fontSize: 12, fontFamily: FONTS.sans },
  sumVal: { fontSize: 12, fontWeight: '700', color: BRAND.text, fontFamily: FONTS.sansBold },
  sumTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 19, borderTopWidth: 1, borderTopColor: TINT15, marginTop: 6 },
  grand: { fontSize: 23, color: BRAND.text, fontFamily: FONTS.serifBold },
  btnPrimary: { backgroundColor: BRAND.ink, borderRadius: 10, minHeight: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  btnPrimaryText: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: FONTS.sansBold },
  btnOutline: { borderWidth: 1, borderColor: BRAND.ink, borderRadius: 10, minHeight: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 8, backgroundColor: '#fff' },
  btnOutlineText: { color: BRAND.text, fontSize: 11, fontWeight: '700', fontFamily: FONTS.sansBold },
  btnPrimaryWide: { backgroundColor: BRAND.ink, borderRadius: 10, minHeight: 44, minWidth: 180, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnOutlineWide: { borderWidth: 1, borderColor: BRAND.ink, borderRadius: 10, minHeight: 44, minWidth: 180, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  help: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: TINT08, borderRadius: 16, marginTop: 15, padding: 18 },
  helpTitle: { fontSize: 11, color: BRAND.text, fontWeight: '700', fontFamily: FONTS.sansBold },
  helpLink: { color: BRAND.brown, fontSize: 10, fontWeight: '700', marginTop: 13, marginLeft: 34, fontFamily: FONTS.sansBold },
  bottomActions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 50 },
  // Recs
  recs: { marginBottom: 32 },
  recHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 },
  recTitle: { fontSize: 28, color: BRAND.text, fontFamily: FONTS.serifBold },
  recTitleSmall: { fontSize: 23 },
  recNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: { width: 34, height: 34, borderWidth: 1, borderColor: TINT25, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  flip: { transform: [{ rotate: '180deg' }] },
  seeAll: { color: BRAND.brown, fontSize: 12, textDecorationLine: 'underline', marginLeft: 8, fontFamily: FONTS.sans },
  recGrid: { gap: 16 },
  recCard: { width: 200, borderWidth: 1, borderColor: TINT15, backgroundColor: '#fff', borderRadius: 14, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center' },
  recCover: { width: 64, height: 88, borderRadius: 6, alignItems: 'center', justifyContent: 'center', padding: 5 },
  recCoverTitle: { fontSize: 7, textAlign: 'center', fontFamily: FONTS.serifBold },
  recInfo: { flex: 1 },
  recName: { fontSize: 13, color: BRAND.text, lineHeight: 17, fontFamily: FONTS.serifBold },
  recAuthor: { color: BRAND.brown, fontSize: 10, marginTop: 4, fontFamily: FONTS.sans },
  recPrice: { fontSize: 12, fontWeight: '700', color: BRAND.text, marginTop: 8, fontFamily: FONTS.sansBold },
  // Receipt
  receiptPage: { alignItems: 'center', backgroundColor: TINT08, marginHorizontal: -24, paddingVertical: 58, paddingHorizontal: 20 },
  paper: { backgroundColor: '#fff', width: 480, maxWidth: '100%', paddingHorizontal: 34, paddingVertical: 38 },
  paperHead: { alignItems: 'center' },
  paperLogo: { fontSize: 24, color: BRAND.text, fontFamily: FONTS.serifBold },
  brown: { color: BRAND.brown },
  paperEyebrow: { color: BRAND.brown, letterSpacing: 3, fontSize: 9, fontWeight: '700', marginTop: 12, fontFamily: FONTS.sansBold },
  dash: { borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: TINT25, marginVertical: 24 },
  metaRows: { gap: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 10, color: BRAND.text, fontFamily: FONTS.sans },
  rTableHead: { marginBottom: 6 },
  rTable: { flexDirection: 'row', gap: 8, minHeight: 46, alignItems: 'center' },
  rHead: { color: BRAND.brown, letterSpacing: 1, fontSize: 8, flex: 1, fontFamily: FONTS.sans },
  rCell: { flex: 1, fontSize: 10, color: BRAND.text, fontFamily: FONTS.sans },
  rRight: { textAlign: 'right', flex: 0, minWidth: 80 },
  rTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderTopWidth: 1, borderTopColor: TINT15, marginTop: 6, paddingTop: 15 },
  paid: {
    alignSelf: 'flex-start',
    borderWidth: 3,
    borderColor: TINT25,
    paddingHorizontal: 12,
    paddingVertical: 7,
    transform: [{ rotate: '-12deg' }],
    marginTop: 8,
  },
  paidText: {
    color: 'rgba(122, 84, 46, 0.45)',
    fontWeight: '800',
  },
  qr: { width: 96, height: 96, borderWidth: 4, borderColor: BRAND.ink, padding: 7, alignSelf: 'center', marginTop: 18 },
  qrRow: { flex: 1, flexDirection: 'row', gap: 2 },
  qrCell: { flex: 1 },
  qrOn: { backgroundColor: BRAND.ink },
  qrCap: { textAlign: 'center', color: BRAND.brown, fontSize: 9, marginTop: 8, fontFamily: FONTS.sans },
  paperThanks: { textAlign: 'center', fontSize: 15, color: BRAND.text, marginTop: 18, fontFamily: FONTS.serifBold },
  paperActions: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 32, maxWidth: 480, width: '100%' },
  backLink: { color: BRAND.brown, fontSize: 11, fontWeight: '600', marginTop: 18, textAlign: 'center', fontFamily: FONTS.sansSemi },
  // Invoice
  invoicePage: { backgroundColor: TINT08, marginHorizontal: -24, paddingVertical: 32, paddingHorizontal: 20 },
  invoiceBar: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 794, width: '100%', alignSelf: 'center', marginBottom: 18 },
  sheet: { width: 794, maxWidth: '100%', backgroundColor: '#fff', padding: 40, alignSelf: 'center', position: 'relative', overflow: 'hidden' },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between' },
  sheetLogo: { fontSize: 24, color: BRAND.text, fontFamily: FONTS.serifBold },
  sheetSub: { color: BRAND.brown, fontSize: 10, lineHeight: 17, marginTop: 14, fontFamily: FONTS.sans },
  sheetRight: { alignItems: 'flex-end' },
  sheetH1: { fontSize: 36, color: BRAND.text, fontFamily: FONTS.serifBold },
  sheetMeta: { color: BRAND.brown, fontSize: 10, marginTop: 6, fontFamily: FONTS.sans },
  sheetRule: { height: 3, backgroundColor: BRAND.ink, marginVertical: 25 },
  parties: { flexDirection: 'row', gap: 30 },
  party: { flex: 1 },
  partyHead: { color: BRAND.brown, letterSpacing: 2, fontSize: 9, fontFamily: FONTS.sans },
  partyText: { fontSize: 11, lineHeight: 18, marginTop: 9, color: BRAND.text, fontFamily: FONTS.sans },
  watermark: { position: 'absolute', top: 400, left: 0, right: 0, textAlign: 'center', color: 'rgba(122, 84, 46, 0.05)', fontSize: 64, fontWeight: '800' },
  iTable: { marginTop: 34, zIndex: 1 },
  iRow: { flexDirection: 'row', gap: 8, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: TINT15, minHeight: 56, paddingVertical: 10, paddingHorizontal: 12 },
  iAlt: { backgroundColor: 'rgba(122, 84, 46, 0.05)' },
  iHead: { backgroundColor: BRAND.ink, borderBottomWidth: 0, minHeight: 38 },
  iCell: { flex: 1, fontSize: 9, color: BRAND.text, fontFamily: FONTS.sans },
  iLower: { flexDirection: 'row', gap: 40, marginTop: 28 },
  iTotals: { width: 280, maxWidth: '100%', gap: 10 },
  iGrand: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: BRAND.ink, borderRadius: 12, padding: 13 },
  iGrandLabel: { color: '#fff', fontSize: 11, fontFamily: FONTS.sans },
  iGrandVal: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: FONTS.sansBold },
  sheetFoot: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: TINT25, marginTop: 28, paddingTop: 13 },
  // Email
  emailPage: { alignItems: 'center', backgroundColor: TINT08, marginHorizontal: -24, paddingVertical: 55, paddingHorizontal: 20 },
  emailShell: { width: 600, maxWidth: '100%', backgroundColor: '#fff', marginBottom: 22 },
  emailBand: { backgroundColor: BRAND.ink, padding: 22 },
  emailLogo: { fontSize: 22, fontFamily: FONTS.serifBold },
  white: { color: '#fff' },
  emailBody: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 44 },
  emailCheck: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(122, 84, 46, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  emailH1: { fontSize: 32, color: BRAND.text, textAlign: 'center', marginTop: 7, marginBottom: 12, fontFamily: FONTS.serifBold },
  emailCopy: { color: BRAND.brown, fontSize: 12, lineHeight: 20, textAlign: 'center', fontFamily: FONTS.sans },
  emailSummary: { alignSelf: 'stretch', borderTopWidth: 1, borderTopColor: TINT15, marginTop: 28 },
  emailLine: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: TINT15, paddingVertical: 13, fontSize: 10, color: BRAND.text, fontFamily: FONTS.sans },
  emailPrice: { fontWeight: '700' },
  emailTotal: { borderBottomWidth: 1, borderBottomColor: TINT15, paddingVertical: 13, alignItems: 'flex-end' },
  emailTotalText: { fontSize: 16, color: BRAND.text, fontFamily: FONTS.serifBold },
  emailHelp: { marginTop: 24, fontSize: 10, color: BRAND.brown, fontFamily: FONTS.sans },
  emailFoot: { backgroundColor: TINT08, padding: 24, alignItems: 'center' },
  // Sticky + toast
  stickyBar: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: TINT15,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stickyBtn: { flex: 1, minWidth: 0 },
  toast: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    backgroundColor: BRAND.ink,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
    maxWidth: '90%',
  },
  toastMsg: { color: '#fff', fontSize: 11, fontFamily: FONTS.sans },
  disabled: { opacity: 0.45 },
});
