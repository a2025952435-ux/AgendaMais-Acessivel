import React, { createContext, useContext, type PropsWithChildren } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import colors, { highContrastColors, type ThemeTokens } from '@/constants/colors';

type TextVariant = 'hero' | 'brand' | 'title' | 'section' | 'body' | 'label' | 'caption' | 'button';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ThemeContext = createContext<ThemeTokens>(colors.light);
const FontScaleContext = createContext(1);
const ReadContext = createContext<(text: string) => void>(() => {});

export function UIProvider({
  theme,
  fontScale,
  onRead,
  children,
}: PropsWithChildren<{ theme: ThemeTokens; fontScale: number; onRead: (text: string) => void }>) {
  return (
    <ThemeContext.Provider value={theme}>
      <FontScaleContext.Provider value={fontScale}>
        <ReadContext.Provider value={onRead}>{children}</ReadContext.Provider>
      </FontScaleContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export function AppText({
  variant = 'body',
  style,
  ...props
}: TextProps & { variant?: TextVariant }) {
  const theme = useAppTheme();
  const fontScale = useContext(FontScaleContext);
  const fontSize: Record<TextVariant, number> = {
    hero: 38,
    brand: 29,
    title: 27,
    section: 21,
    body: 18,
    label: 17,
    caption: 15,
    button: 18,
  };
  const fontWeight: Record<TextVariant, '400' | '500' | '600' | '700'> = {
    hero: '700',
    brand: '700',
    title: '700',
    section: '700',
    body: '400',
    label: '600',
    caption: '500',
    button: '700',
  };

  return (
    <Text
      {...props}
      allowFontScaling
      style={[
        {
          color: variant === 'caption' ? theme.mutedForeground : theme.foreground,
          fontSize: fontSize[variant] * fontScale,
          fontWeight: fontWeight[variant],
          lineHeight: fontSize[variant] * fontScale * 1.35,
        },
        style,
      ]}
    />
  );
}

export function BrandLogo({
  size = 86,
  inverted = false,
  compact = false,
}: {
  size?: number;
  inverted?: boolean;
  compact?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.logoWrap, compact && styles.logoCompact]}>
      <Image
        source={require('../assets/images/icon.png')}
        style={{ width: size, height: size, borderRadius: Math.round(size * 0.24) }}
        accessibilityLabel="Símbolo de calendário e coração do AgendaMais+"
      />
      <AppText
        variant={compact ? 'section' : 'brand'}
        style={{ color: inverted ? theme.primaryForeground : theme.primary, textAlign: 'center' }}
      >
        AgendaMais+
      </AppText>
    </View>
  );
}

export function ActionButton({
  title,
  onPress,
  icon,
  kind = 'primary',
  disabled = false,
  accessibilityLabel,
  testID,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  kind?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const theme = useAppTheme();
  const tones = {
    primary: { backgroundColor: theme.primary, color: theme.primaryForeground, borderColor: theme.primary },
    secondary: { backgroundColor: theme.secondary, color: theme.secondaryForeground, borderColor: theme.secondary },
    outline: { backgroundColor: theme.card, color: theme.primary, borderColor: theme.border },
    danger: { backgroundColor: theme.destructive, color: theme.destructiveForeground, borderColor: theme.destructive },
  }[kind];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
      disabled={disabled}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: tones.backgroundColor, borderColor: tones.borderColor },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={23} color={tones.color} /> : null}
      <AppText variant="button" style={{ color: tones.color, textAlign: 'center', flexShrink: 1 }}>
        {title}
      </AppText>
    </Pressable>
  );
}

export function AudioAction({
  text,
  onRead,
  inverted = false,
  compact = false,
}: {
  text: string;
  onRead: (text: string) => void;
  inverted?: boolean;
  compact?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Leitura de demonstração: ${text}`}
      testID="audio-demo-button"
      onPress={() => onRead(text)}
      style={({ pressed }) => [
        styles.audioButton,
        compact && styles.audioCompact,
        {
          backgroundColor: inverted ? 'rgba(255,255,255,0.08)' : theme.card,
          borderColor: inverted ? theme.primaryForeground : theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="volume-high-outline"
        size={compact ? 23 : 21}
        color={inverted ? theme.primaryForeground : theme.primary}
      />
      {compact ? (
        <AppText variant="caption" style={{ color: inverted ? theme.primaryForeground : theme.primary }}>
          Ler
        </AppText>
      ) : (
        <AppText variant="label" style={{ color: inverted ? theme.primaryForeground : theme.primary }}>
          Ouvir explicação
        </AppText>
      )}
    </Pressable>
  );
}

export function FeatureCard({
  title,
  description,
  icon,
  onPress,
  onRead,
  tint = false,
}: {
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
  onRead: (text: string) => void;
  tint?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.featureCard, { backgroundColor: tint ? theme.accent : theme.card, borderColor: tint ? theme.accent : theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${description}`}
        onPress={onPress}
        style={({ pressed }) => [styles.featureMain, pressed && styles.pressed]}
      >
        <View style={[styles.featureIcon, { backgroundColor: theme.secondary }]}>
          <Ionicons name={icon} size={26} color={theme.primary} />
        </View>
        <View style={styles.featureText}>
          <AppText variant="section">{title}</AppText>
          <AppText variant="body" style={{ color: theme.mutedForeground }}>{description}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={22} color={theme.primary} />
      </Pressable>
      <View style={[styles.featureAudio, { borderTopColor: theme.border }]}>
        <AudioAction text={`${title}. ${description}`} onRead={onRead} compact />
        <AppText variant="caption" style={{ flex: 1 }}>Ouvir esta função</AppText>
      </View>
    </View>
  );
}

export function SelectionCard({
  title,
  description,
  icon,
  selected = false,
  onPress,
  onRead,
}: {
  title: string;
  description: string;
  icon: IconName;
  selected?: boolean;
  onPress: () => void;
  onRead: (text: string) => void;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.selectionCard,
        { backgroundColor: selected ? theme.accent : theme.card, borderColor: selected ? theme.primary : theme.border },
      ]}
    >
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${title}. ${description}`}
        onPress={onPress}
        style={({ pressed }) => [styles.selectionMain, pressed && styles.pressed]}
      >
        <Ionicons name={icon} size={28} color={theme.primary} />
        <View style={styles.featureText}>
          <AppText variant="label">{title}</AppText>
          <AppText variant="caption">{description}</AppText>
        </View>
        <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={theme.primary} />
      </Pressable>
      <View style={[styles.selectionAudio, { borderTopColor: theme.border }]}>
        <AudioAction text={`${title}. ${description}`} onRead={onRead} compact />
        <AppText variant="caption">Ouvir explicação</AppText>
      </View>
    </View>
  );
}

export function LabeledInput({
  label,
  readText,
  style,
  ...props
}: TextInputProps & { label: string; readText: string }) {
  const theme = useAppTheme();
  const onRead = useContext(ReadContext);
  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputLabelRow}>
        <AppText variant="label" style={{ flex: 1 }}>{label}</AppText>
        <AudioAction text={readText} onRead={onRead} compact />
      </View>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={theme.mutedForeground}
        style={[
          styles.textInput,
          { backgroundColor: theme.card, borderColor: theme.input, color: theme.foreground },
          style,
        ]}
      />
    </View>
  );
}

export function DemoNotice({
  children,
  onRead,
  tone = 'info',
}: PropsWithChildren<{ onRead: (text: string) => void; tone?: 'info' | 'success' | 'warning' }>) {
  const theme = useAppTheme();
  const message = typeof children === 'string' ? children : 'Informação importante sobre esta demonstração.';
  return (
    <View
        style={[styles.demoNotice, { backgroundColor: tone === 'success' ? theme.accent : tone === 'warning' ? theme.secondary : theme.muted }]}
    >
      <Ionicons
        name={tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'}
        size={23}
        color={theme.primary}
      />
      <AppText variant="body" style={{ flex: 1 }}>{children}</AppText>
      <AudioAction text={message} onRead={onRead} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: 'center', gap: 12 },
  logoCompact: { flexDirection: 'row', gap: 12, alignSelf: 'flex-start' },
  actionButton: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  audioButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  audioCompact: { minWidth: 54, paddingHorizontal: 10, gap: 5 },
  featureCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featureMain: { minHeight: 98, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  featureIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, gap: 4 },
  featureAudio: { minHeight: 60, borderTopWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectionCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  selectionMain: { minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 13 },
  selectionAudio: { minHeight: 56, borderTopWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputGroup: { gap: 8 },
  inputLabelRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  textInput: { minHeight: 58, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, fontSize: 18 },
  demoNotice: { borderRadius: 18, padding: 14, gap: 10, flexDirection: 'row', alignItems: 'center' },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
