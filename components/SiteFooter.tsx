import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { BRAND, FONTS } from '@/constants/theme';
import { LogoWord } from '@/components/Logo';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export function SiteFooter() {
  const { small } = useBreakpoint();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const join = () => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) setDone(true);
  };

  return (
    <View style={styles.footer}>
      <View style={[styles.inner, small && styles.innerSmall]}>
        <View style={styles.brand}>
          <Text style={styles.logo}>
            <LogoWord size={27} />
          </Text>
          <Text style={styles.brandCopy}>Stories to keep, worlds to discover. Thoughtfully selected books delivered to your door.</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.head}>Explore</Text>
          <Pressable onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.link}>Catalog</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { badge: 'New' } })}>
            <Text style={styles.link}>New releases</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { badge: 'Best seller' } })}>
            <Text style={styles.link}>Best sellers</Text>
          </Pressable>
        </View>
        <View style={styles.col}>
          <Text style={styles.head}>Help</Text>
          <Pressable onPress={() => router.push('/(tabs)')}>
            <Text style={styles.link}>Shipping & returns</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.link}>FAQs</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.link}>Contact us</Text>
          </Pressable>
        </View>
        <View style={styles.news}>
          <Text style={styles.head}>Stay in the story</Text>
          <Text style={styles.newsCopy}>Bookish notes, new arrivals, and quiet recommendations.</Text>
          {done ? (
            <Text style={styles.newsDone}>Welcome to the reading list. Check your inbox soon.</Text>
          ) : (
            <View style={styles.newsForm}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={join}
                placeholder="Your email"
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={styles.newsInput}
                autoCapitalize="none"
                keyboardType="email-address"
                aria-label="Email for newsletter"
              />
              <Pressable onPress={join}>
                <Text style={styles.join}>Join</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.bottomText}>© 2025 Chapter1</Text>
        <Text style={styles.bottomText}>Privacy · Terms</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { backgroundColor: BRAND.ink, paddingTop: 60, paddingBottom: 20, marginTop: 0 },
  inner: { flexDirection: 'row', gap: 70, maxWidth: 1120, width: '100%', alignSelf: 'center', paddingHorizontal: 24 },
  innerSmall: { flexDirection: 'column', gap: 32 },
  brand: { flex: 2 },
  logo: { fontSize: 27, color: '#fff', fontFamily: FONTS.serifBold },
  logoText: { fontSize: 27, color: '#fff', fontFamily: FONTS.serifBold },
  logoAccent: { color: BRAND.brown },
  brandCopy: { color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 19, marginTop: 12, maxWidth: 260, fontFamily: FONTS.sans },
  col: { flex: 1, flexDirection: 'column', gap: 11 },
  head: { fontSize: 13, color: '#fff', marginBottom: 4, fontFamily: FONTS.serifSemi },
  link: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: FONTS.sans },
  news: { flex: 2, flexDirection: 'column', gap: 10 },
  newsCopy: { color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 19, fontFamily: FONTS.sans },
  newsForm: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.25)', height: 42 },
  newsInput: { flex: 1, color: '#fff', fontSize: 11, height: '100%', fontFamily: FONTS.sans },
  join: { color: '#fff', fontWeight: '700', fontSize: 12, fontFamily: FONTS.sansBold },
  newsDone: { color: '#fff', fontSize: 11, marginTop: 4, fontFamily: FONTS.sans },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    marginTop: 50,
    paddingTop: 18,
  },
  bottomText: { color: 'rgba(255,255,255,0.5)', fontSize: 8, fontFamily: FONTS.sans },
});
