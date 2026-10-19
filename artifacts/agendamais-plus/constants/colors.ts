export interface ThemeTokens {
  text: string;
  tint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
}

const colors: { light: ThemeTokens; radius: number } = {
  light: {
    text: '#241832',
    tint: '#35145B',
    background: '#FFFFFF',
    foreground: '#241832',
    card: '#FFFFFF',
    cardForeground: '#241832',
    primary: '#35145B',
    primaryForeground: '#FFFFFF',
    secondary: '#D8C5F0',
    secondaryForeground: '#241832',
    muted: '#F6F1FB',
    mutedForeground: '#62566D',
    accent: '#EEE5F8',
    accentForeground: '#35145B',
    destructive: '#A5273D',
    destructiveForeground: '#FFFFFF',
    border: '#DDD4E7',
    input: '#CFC3DB',
  },
  radius: 20,
};

export const highContrastColors: Partial<ThemeTokens> = {
  foreground: '#12091A',
  cardForeground: '#12091A',
  primary: '#35145B',
  primaryForeground: '#FFFFFF',
  secondary: '#D8C5F0',
  secondaryForeground: '#12091A',
  muted: '#F4EFF8',
  mutedForeground: '#302438',
  accent: '#E8DDF4',
  accentForeground: '#24103A',
  border: '#35145B',
  input: '#35145B',
};

export default colors;
