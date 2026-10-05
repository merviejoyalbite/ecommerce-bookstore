import { StyleSheet, Text } from 'react-native';
import { FONTS } from '@/constants/theme';

// Brand wordmark: "Chapter" + oversized "1".
export function LogoWord({
  size = 22,
  color = '#fff',
  family = FONTS.serifBold,
}: {
  size?: number;
  color?: string;
  family?: string;
}) {
  return (
    <Text style={[styles.word, { fontSize: size, color, fontFamily: family }]}>
      Chapter<Text style={[styles.one, { fontSize: Math.round(size * 1.35), color, fontFamily: family }]}>1</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  word: {},
  one: { fontWeight: '800' },
});
