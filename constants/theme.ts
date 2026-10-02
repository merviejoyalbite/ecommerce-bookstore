// BookNook theme — extracted from the Figma Make prototype
// (https://query-gush-01955823.figma.site)
// Type: Playfair Display (serif headings) + Inter (sans body)
export const BRAND = {
  background: '#FFFFFF',
  paper: '#F7F2ED',
  card: '#FFFFFF',
  text: '#251605', // ink
  ink: '#251605',
  brown: '#7A542E',
  brownDark: '#694726',
  muted: '#6C6259',
  faint: '#9B9188',
  border: '#E5DBD1', // line
  line: '#E5DBD1',
  tint: '#F7F2ED',
  accent: '#7A542E',
  accentDark: '#7A542E',
  gold: '#C7A56C',
  cream: '#CFB99F', // hero em accent
  green: '#15803D',
  shadow: 'rgba(37, 22, 5, 0.08)',
};

export const FONTS = {
  serif: 'PlayfairDisplay_600SemiBold',
  serifSemi: 'PlayfairDisplay_600SemiBold',
  serifBold: 'PlayfairDisplay_700Bold',
  serifItalic: 'PlayfairDisplay_600SemiBold_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

// Cover tones from the prototype (.book-cover--*)
export const COVER_TONES: Record<string, { bg: string; fg: string }> = {
  sage: { bg: '#68705A', fg: '#F7F2ED' },
  clay: { bg: '#9C684B', fg: '#F7F2ED' },
  cream: { bg: '#D8C7AB', fg: '#251605' },
  forest: { bg: '#3B5140', fg: '#F7F2ED' },
  umber: { bg: '#714331', fg: '#F7F2ED' },
  gold: { bg: '#C7A56C', fg: '#251605' },
  night: { bg: '#251605', fg: '#F7F2ED' },
  moss: { bg: '#5F6644', fg: '#F7F2ED' },
  brown: { bg: '#7A542E', fg: '#F7F2ED' },
};

export function coverTone(tone: string | undefined): { bg: string; fg: string } {
  return COVER_TONES[tone ?? ''] ?? COVER_TONES.brown;
}
