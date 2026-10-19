import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { highContrastColors, type ThemeTokens } from '@/constants/colors';
import {
  ActionButton,
  AppText,
  AudioAction,
  BrandLogo,
  DemoNotice,
  FeatureCard,
  LabeledInput,
  SelectionCard,
  UIProvider,
  useAppTheme,
} from '@/components/AgendaMaisUI';

type ScreenId =
  | 'opening' | 'welcome' | 'login' | 'register' | 'recovery' | 'accessibility'
  | 'home' | 'specialty' | 'doctors' | 'doctor' | 'schedule' | 'confirmation' | 'success'
  | 'appointments' | 'appointment-detail' | 'online' | 'notifications' | 'profile'
  | 'edit-profile' | 'settings' | 'help' | 'about';
type VisitType = 'online' | 'presencial';
type BookingStatus = 'upcoming' | 'completed' | 'cancelled';
type Booking = {
  id: string;
  specialty: string;
  provider: string;
  day: string;
  time: string;
  type: VisitType;
  status: BookingStatus;
};
type Notice = { id: string; title: string; body: string; date: string; read: boolean };
type Preferences = {
  font: 'normal' | 'grande' | 'extragrande';
  contrast: boolean;
  speed: 'lenta' | 'normal' | 'rápida';
  guidance: boolean;
  reminders: boolean;
  advance: string;
};
type DemoSnapshot = { bookings: Booking[]; preferences: Preferences; notices: Notice[] };
type DemoDay = { id: string; label: string; full: string };

const STORAGE_KEY = '@agendamais-plus/demo-v1';
const specialties = ['Clínica geral', 'Cardiologia', 'Dermatologia', 'Oftalmologia', 'Ortopedia', 'Geriatria'];
const exampleTimes = ['09:00', '10:30', '14:00', '15:30'];
const initialPreferences: Preferences = {
  font: 'normal',
  contrast: false,
  speed: 'normal',
  guidance: false,
  reminders: true,
  advance: '1 dia antes',
};
const initialNotices: Notice[] = [
  {
    id: 'demo-welcome',
    title: 'Aviso de demonstração',
    body: 'Este mural mostra exemplos. Nenhuma mensagem foi enviada.',
    date: 'Exemplo local',
    read: false,
  },
  {
    id: 'demo-reminder',
    title: 'Exemplo de lembrete',
    body: 'Um lembrete ilustrativo apareceria aqui. Ele não representa uma consulta real.',
    date: 'Exemplo',
    read: true,
  },
];
const titles: Record<ScreenId, string> = {
  opening: 'Abertura',
  welcome: 'Boas-vindas',
  login: 'Entrar',
  register: 'Criar cadastro de demonstração',
  recovery: 'Recuperar acesso',
  accessibility: 'Acessibilidade inicial',
  home: 'Início',
  specialty: 'Tipo e especialidade',
  doctors: 'Profissionais de demonstração',
  doctor: 'Perfil do profissional',
  schedule: 'Data e horário',
  confirmation: 'Confirmar agendamento',
  success: 'Agendamento confirmado',
  appointments: 'Minhas consultas',
  'appointment-detail': 'Detalhes da consulta',
  online: 'Consulta online demonstrativa',
  notifications: 'Notificações e lembretes',
  profile: 'Perfil do usuário',
  'edit-profile': 'Editar dados pessoais',
  settings: 'Configurações',
  help: 'Ajuda e suporte',
  about: 'Sobre o AgendaMais+',
};
const descriptions: Partial<Record<ScreenId, string>> = {
  welcome: 'Escolha como deseja conhecer o aplicativo.',
  login: 'O acesso é apenas uma demonstração, sem conta real.',
  register: 'Os dados digitados não são enviados nem guardados.',
  recovery: 'Não enviamos mensagens nesta demonstração.',
  accessibility: 'Ajuste o texto e o contraste para facilitar a leitura.',
  specialty: 'Escolha uma modalidade e uma especialidade de exemplo.',
  doctors: 'Os profissionais exibidos são fictícios.',
  doctor: 'Veja os dados ilustrativos antes de escolher um horário.',
  schedule: 'Datas e horários são exemplos, não disponibilidade real.',
  confirmation: 'Revise os dados fictícios antes de confirmar.',
  success: 'O registro fica salvo somente neste dispositivo.',
  appointments: 'Consulte os agendamentos guardados nesta demonstração.',
  'appointment-detail': 'Veja ou altere o registro de demonstração.',
  online: 'A chamada de vídeo não está conectada.',
  notifications: 'Avisos locais de exemplo, sem envio externo.',
  profile: 'Este perfil não é uma conta real.',
  'edit-profile': 'As alterações permanecem somente nesta sessão.',
  settings: 'Preferências e registros fictícios ficam neste dispositivo.',
  help: 'Orientações simples para usar a demonstração.',
  about: 'Um protótipo acadêmico com foco em autonomia e acessibilidade.',
};

function createDemoDays(): DemoDay[] {
  const days: DemoDay[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  while (days.length < 5) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const day = String(cursor.getDate()).padStart(2, '0');
      const id = `${year}-${month}-${day}`;
      const label = cursor.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
      const full = cursor.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
      days.push({ id, label, full: full.charAt(0).toUpperCase() + full.slice(1) });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBooking(value: unknown): value is Booking {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' &&
    typeof value.specialty === 'string' &&
    typeof value.provider === 'string' &&
    typeof value.day === 'string' &&
    typeof value.time === 'string' &&
    (value.type === 'online' || value.type === 'presencial') &&
    (value.status === 'upcoming' || value.status === 'completed' || value.status === 'cancelled');
}

function isNotice(value: unknown): value is Notice {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    typeof value.date === 'string' &&
    typeof value.read === 'boolean';
}

function isPreferences(value: unknown): value is Preferences {
  if (!isRecord(value)) return false;
  return (value.font === 'normal' || value.font === 'grande' || value.font === 'extragrande') &&
    typeof value.contrast === 'boolean' &&
    (value.speed === 'lenta' || value.speed === 'normal' || value.speed === 'rápida') &&
    typeof value.guidance === 'boolean' &&
    typeof value.reminders === 'boolean' &&
    typeof value.advance === 'string';
}

function formatDay(day: string) {
  const date = new Date(`${day}T12:00:00`);
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function visitLabel(type: VisitType) {
  return type === 'online' ? 'Consulta online (demonstração)' : 'Consulta presencial (demonstração)';
}

function StatusText({ status }: { status: BookingStatus }) {
  const theme = useAppTheme();
  const label = status === 'upcoming' ? 'Agendada · exemplo' : status === 'cancelled' ? 'Cancelada · exemplo' : 'Concluída · exemplo';
  return (
    <View style={[styles.statusPill, { backgroundColor: status === 'upcoming' ? theme.accent : theme.muted }]}>
      <AppText variant="caption" style={{ color: status === 'cancelled' ? theme.mutedForeground : theme.primary }}>{label}</AppText>
    </View>
  );
}

function SelectionPill({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionPill,
        {
          backgroundColor: selected ? theme.primary : theme.card,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="label" style={{ color: selected ? theme.primaryForeground : theme.foreground, textAlign: 'center' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function SectionHeading({
  title,
  read,
}: {
  title: string;
  read: (text: string) => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <AppText variant="section" style={{ flex: 1 }}>{title}</AppText>
      <AudioAction text={title} onRead={read} compact />
    </View>
  );
}

function AgendaMaisApp() {
  const baseTheme = useColors();
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<ScreenId>('opening');
  const [history, setHistory] = useState<ScreenId[]>([]);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [activeReading, setActiveReading] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [visitType, setVisitType] = useState<VisitType>('online');
  const [specialty, setSpecialty] = useState(specialties[0]);
  const [provider, setProvider] = useState('Profissional de demonstração A');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [inCall, setInCall] = useState(false);
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [resetPrompt, setResetPrompt] = useState(false);
  const [search, setSearch] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmation, setRegisterConfirmation] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [profileName, setProfileName] = useState('Pessoa usuária de demonstração');
  const [draftProfileName, setDraftProfileName] = useState('');
  const [draftProfileEmail, setDraftProfileEmail] = useState('');
  const [draftProfilePhone, setDraftProfilePhone] = useState('');
  const [demoDays] = useState(createDemoDays);

  const fontScale = preferences.font === 'extragrande' ? 1.24 : preferences.font === 'grande' ? 1.12 : 1;
  const theme = useMemo(
    () => ({ ...baseTheme, ...(preferences.contrast ? highContrastColors : {}) }) as ThemeTokens,
    [baseTheme, preferences.contrast],
  );
  const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId) ?? null;
  const activeOnlineBooking = bookings.find((booking) => booking.status === 'upcoming' && booking.type === 'online') ?? null;
  const demoProviders = useMemo(
    () => [
      { name: 'Profissional de demonstração A', specialty },
      { name: 'Profissional de demonstração B', specialty },
    ],
    [specialty],
  );
  const matchingProviders = demoProviders.filter((item) =>
    `${item.name} ${item.specialty}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')),
  );
  const mainTabs: ScreenId[] = ['home', 'appointments', 'notifications', 'profile'];
  const showBottomNav = mainTabs.includes(screen);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (isRecord(parsed)) {
              if (Array.isArray(parsed.bookings)) setBookings(parsed.bookings.filter(isBooking));
              if (isPreferences(parsed.preferences)) setPreferences(parsed.preferences);
              if (Array.isArray(parsed.notices)) setNotices(parsed.notices.filter(isNotice));
            }
          } catch {
            setStorageAvailable(false);
          }
        }
        setReady(true);
      })
      .catch(() => {
        if (active) {
          setStorageAvailable(false);
          setReady(true);
        }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const snapshot: DemoSnapshot = { bookings, preferences, notices };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
      .then(() => setStorageAvailable(true))
      .catch(() => setStorageAvailable(false));
  }, [bookings, preferences, notices, ready]);

  const go = (next: ScreenId) => {
    Keyboard.dismiss();
    setHistory((items) => [...items, screen]);
    setScreen(next);
    setActiveReading(null);
    setFormMessage('');
  };
  const back = () => {
    Keyboard.dismiss();
    const previous = history.length ? history[history.length - 1] : 'home';
    setHistory((items) => items.slice(0, -1));
    setScreen(previous);
    setActiveReading(null);
  };
  const openTab = (next: ScreenId) => {
    setHistory([]);
    setScreen(next);
    setActiveReading(null);
    setFormMessage('');
  };
  const read = (text: string) => setActiveReading(text);
  const resetDemo = () => {
    setBookings([]);
    setNotices(initialNotices);
    setPreferences(initialPreferences);
    setHistory([]);
    setSelectedBookingId(null);
    setReschedulingId(null);
    setResetPrompt(false);
    setScreen('opening');
    setActiveReading(null);
    void AsyncStorage.removeItem(STORAGE_KEY).catch(() => setStorageAvailable(false));
  };

  const proceedToBooking = () => {
    setSelectedDate('');
    setSelectedTime('');
    setReschedulingId(null);
    go('specialty');
  };

  const saveBooking = () => {
    if (!selectedDate || !selectedTime) return;
    const id = reschedulingId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const nextBooking: Booking = {
      id,
      specialty,
      provider,
      day: selectedDate,
      time: selectedTime,
      type: visitType,
      status: 'upcoming',
    };
    setBookings((items) =>
      reschedulingId ? items.map((item) => item.id === reschedulingId ? nextBooking : item) : [nextBooking, ...items],
    );
    setSelectedBookingId(id);
    setReschedulingId(null);
    setNotices((items) => [
      {
        id: `demo-booking-${id}`,
        title: 'Registro de demonstração atualizado',
        body: 'Uma consulta fictícia foi adicionada neste dispositivo. Nenhum serviço de saúde foi contatado.',
        date: 'Agora · exemplo',
        read: false,
      },
      ...items,
    ]);
    go('success');
  };

  const beginReschedule = (booking: Booking) => {
    setVisitType(booking.type);
    setSpecialty(booking.specialty);
    setProvider(booking.provider);
    setSelectedDate(booking.day);
    setSelectedTime(booking.time);
    setReschedulingId(booking.id);
    setCancelPrompt(false);
    go('specialty');
  };

  const submitLogin = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail) || loginPassword.length < 4) {
      setFormMessage('Digite um e-mail de exemplo válido e uma senha com pelo menos 4 caracteres.');
      return;
    }
    setLoginEmail('');
    setLoginPassword('');
    setFormMessage('');
    openTab('home');
  };

  const submitRegistration = () => {
    if (!registerName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) {
      setFormMessage('Preencha o nome de demonstração e um e-mail em formato válido.');
      return;
    }
    if (registerPassword.length < 6 || registerPassword !== registerConfirmation) {
      setFormMessage('Use uma senha de 6 caracteres ou mais e confirme-a corretamente.');
      return;
    }
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterConfirmation('');
    setFormMessage('Cadastro de demonstração concluído. Nenhuma conta foi criada.');
    go('accessibility');
  };

  const submitRecovery = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
      setFormMessage('Digite um e-mail de exemplo em formato válido.');
      return;
    }
    setRecoveryEmail('');
    setFormMessage('Nenhum e-mail foi enviado. Esta tela serve somente para demonstrar o fluxo.');
  };

  const cancelBooking = () => {
    if (!selectedBooking) return;
    setBookings((items) => items.map((item) =>
      item.id === selectedBooking.id ? { ...item, status: 'cancelled' } : item,
    ));
    setNotices((items) => [
      {
        id: `demo-cancel-${selectedBooking.id}`,
        title: 'Exemplo de cancelamento',
        body: 'O registro fictício foi marcado como cancelado neste dispositivo.',
        date: 'Agora · exemplo',
        read: false,
      },
      ...items,
    ]);
    setCancelPrompt(false);
    openTab('appointments');
  };

  const changeFont = (font: Preferences['font']) => setPreferences((current) => ({ ...current, font }));
  const togglePreference = (key: 'contrast' | 'guidance' | 'reminders') =>
    setPreferences((current) => ({ ...current, [key]: !current[key] }));

  const renderOpening = () => (
    <View style={[styles.opening, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 18) }]}>
      <View style={styles.openingMain}>
        <View style={styles.orbitArtwork} accessibilityElementsHidden>
          <View style={[styles.orbit, styles.orbitOne, { borderColor: 'rgba(255,255,255,0.22)' }]} />
          <View style={[styles.orbit, styles.orbitTwo, { borderColor: 'rgba(255,255,255,0.22)' }]} />
          <View style={[styles.orbit, styles.orbitThree, { borderColor: 'rgba(255,255,255,0.22)' }]} />
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.openingIcon}
            accessibilityLabel="Logo do AgendaMais+, com calendário e coração"
          />
        </View>
        <AppText variant="brand" style={{ color: theme.primaryForeground, textAlign: 'center', marginTop: 7 }}>
          AgendaMais+
        </AppText>
        <AppText variant="body" style={{ color: theme.primaryForeground, textAlign: 'center', maxWidth: 330, marginTop: 11 }}>
          Cuidar da sua saúde ficou mais fácil
        </AppText>
        <AppText variant="body" style={{ color: theme.primaryForeground, textAlign: 'center', opacity: 0.9, maxWidth: 330 }}>
          Com mais autonomia, simplicidade e acessibilidade.
        </AppText>
        <AudioAction
          inverted
          text="Cuidar da sua saúde ficou mais fácil. O AgendaMais+ é uma demonstração com foco em autonomia e acessibilidade."
          onRead={read}
        />
        <View style={styles.openingDots} accessibilityLabel="Tela 1 de 3">
      <View style={[styles.dot, styles.dotActive, { backgroundColor: theme.secondary }]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
      <View style={styles.openingFooter}>
        <ActionButton title="Começar demonstração" icon="arrow-forward" onPress={() => go('welcome')} kind="outline" />
        <AppText variant="caption" style={{ color: theme.primaryForeground, textAlign: 'center', opacity: 0.8 }}>
          Protótipo acadêmico · sem atendimento de saúde
        </AppText>
      </View>
    </View>
  );

  const renderScreen = (): ReactNode => {
    if (screen === 'welcome') {
      return (
        <>
          <View style={styles.centerBlock}>
            <BrandLogo size={78} />
            <AppText variant="title" style={styles.centerText}>Olá! Vamos começar?</AppText>
            <AppText variant="body" style={styles.centerText}>
              Você pode conhecer o AgendaMais+ sem criar uma conta. Todas as consultas desta versão são exemplos.
            </AppText>
          </View>
          <DemoNotice onRead={read}>Nenhum serviço médico real está conectado a esta demonstração.</DemoNotice>
          <ActionButton title="Começar sem conta" icon="arrow-forward" onPress={() => go('accessibility')} />
          <ActionButton title="Entrar na demonstração" icon="log-in-outline" kind="secondary" onPress={() => go('login')} />
          <ActionButton title="Criar cadastro de demonstração" icon="person-add-outline" kind="outline" onPress={() => go('register')} />
        </>
      );
    }

    if (screen === 'login') {
      return (
        <>
          <DemoNotice onRead={read}>Não use sua senha real. O acesso é local e não cria uma conta.</DemoNotice>
          <LabeledInput
            label="E-mail de exemplo"
            readText="Digite um e-mail fictício para demonstrar o formulário. Ele não será guardado."
            value={loginEmail}
            onChangeText={setLoginEmail}
            placeholder="voce@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
            testID="login-email"
          />
          <LabeledInput
            label="Senha de demonstração"
            readText="Digite qualquer senha fictícia com pelo menos 4 caracteres. Não use sua senha real."
            value={loginPassword}
            onChangeText={setLoginPassword}
            placeholder="Não use sua senha real"
            secureTextEntry
            autoComplete="off"
            testID="login-password"
          />
          {formMessage ? <DemoNotice tone="warning" onRead={read}>{formMessage}</DemoNotice> : null}
          <ActionButton title="Continuar demonstração" icon="arrow-forward" onPress={submitLogin} testID="login-submit" />
          <ActionButton title="Esqueci minha senha" icon="help-circle-outline" kind="outline" onPress={() => go('recovery')} />
          <ActionButton title="Criar cadastro de demonstração" icon="person-add-outline" kind="secondary" onPress={() => go('register')} />
          <ActionButton title="Entrar sem conta" icon="home-outline" kind="outline" onPress={() => openTab('home')} />
        </>
      );
    }

    if (screen === 'register') {
      return (
        <>
          <DemoNotice onRead={read}>Os campos são temporários. Nenhum dado será enviado ou salvo no perfil.</DemoNotice>
          <LabeledInput label="Nome de demonstração" readText="Digite um nome fictício para preencher o exemplo." value={registerName} onChangeText={setRegisterName} placeholder="Nome para o exemplo" autoComplete="off" />
          <LabeledInput label="E-mail de exemplo" readText="Digite um e-mail fictício. Ele não será guardado." value={registerEmail} onChangeText={setRegisterEmail} placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="off" />
          <LabeledInput label="Senha de demonstração" readText="Use uma senha fictícia de 6 caracteres ou mais." value={registerPassword} onChangeText={setRegisterPassword} placeholder="Não use sua senha real" secureTextEntry autoComplete="off" />
          <LabeledInput label="Confirme a senha" readText="Digite novamente a senha fictícia." value={registerConfirmation} onChangeText={setRegisterConfirmation} placeholder="Repita a senha de exemplo" secureTextEntry autoComplete="off" />
          {formMessage ? <DemoNotice tone="warning" onRead={read}>{formMessage}</DemoNotice> : null}
          <ActionButton title="Continuar" icon="arrow-forward" onPress={submitRegistration} />
          <ActionButton title="Voltar ao acesso" icon="arrow-back" kind="outline" onPress={() => go('login')} />
        </>
      );
    }

    if (screen === 'recovery') {
      return (
        <>
          <DemoNotice onRead={read}>A demonstração não envia e-mails. Use qualquer endereço fictício em formato válido.</DemoNotice>
          <LabeledInput label="E-mail de exemplo" readText="O e-mail será usado somente para mostrar a validação desta tela." value={recoveryEmail} onChangeText={setRecoveryEmail} placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="off" />
          {formMessage ? <DemoNotice tone="warning" onRead={read}>{formMessage}</DemoNotice> : null}
          <ActionButton title="Mostrar instrução" icon="mail-outline" onPress={submitRecovery} />
          <ActionButton title="Voltar para entrar" icon="arrow-back" kind="outline" onPress={() => go('login')} />
        </>
      );
    }

    if (screen === 'accessibility') {
      return (
        <>
          <AppText variant="body">Escolha o tamanho do texto e o contraste que deixam a demonstração mais confortável.</AppText>
          <SectionHeading title="Tamanho do texto" read={read} />
          <View style={styles.wrapRow}>
            {(['normal', 'grande', 'extragrande'] as const).map((font) => (
              <SelectionPill key={font} label={font === 'extragrande' ? 'Extra grande' : font[0].toUpperCase() + font.slice(1)} selected={preferences.font === font} onPress={() => changeFont(font)} testID={`font-${font}`} />
            ))}
          </View>
          <PreferenceSwitch title="Alto contraste" description="Deixa bordas e textos mais destacados." value={preferences.contrast} onChange={() => togglePreference('contrast')} read={read} />
          <PreferenceSwitch title="Orientação automática" description="Preferência demonstrativa, sem leitura automática real." value={preferences.guidance} onChange={() => togglePreference('guidance')} read={read} />
          <DemoNotice onRead={read}>O botão de alto-falante mostra uma simulação visual. Não há reprodução de áudio.</DemoNotice>
          <ActionButton title="Salvar e ir ao início" icon="arrow-forward" onPress={() => openTab('home')} />
          <ActionButton title="Ajustar depois" icon="settings-outline" kind="outline" onPress={() => openTab('home')} />
        </>
      );
    }

    if (screen === 'home') {
      return (
        <>
          <View style={styles.homeGreeting}>
            <View style={{ flex: 1 }}>
              <AppText variant="title">Olá, {profileName.split(' ')[0]}!</AppText>
              <AppText variant="body">Como podemos ajudar com sua saúde hoje?</AppText>
            </View>
            <AudioAction text={`Olá, ${profileName}. Escolha uma das funções para continuar na demonstração.`} onRead={read} compact />
          </View>
          <DemoNotice onRead={read}>Demonstração acadêmica. Médicos, horários e consultas são exemplos.</DemoNotice>
          <FeatureCard title="Agendar consulta" description="Escolha o tipo, o profissional, a data e um horário ilustrativo." icon="calendar-outline" onPress={proceedToBooking} onRead={read} tint />
          <FeatureCard title="Minhas consultas" description={`${bookings.filter((booking) => booking.status === 'upcoming').length} agendamento(s) de exemplo neste aparelho.`} icon="clipboard-outline" onPress={() => openTab('appointments')} onRead={read} />
          <FeatureCard title="Entrar na consulta" description="Veja a demonstração de uma consulta online." icon="videocam-outline" onPress={() => go('online')} onRead={read} />
          <FeatureCard title="Ajuda e acessibilidade" description="Ajuste a leitura e consulte instruções simples." icon="accessibility-outline" onPress={() => go('help')} onRead={read} tint />
          <ActionButton title="Ajustar acessibilidade" icon="eye-outline" kind="outline" onPress={() => go('accessibility')} />
        </>
      );
    }

    if (screen === 'specialty') {
      return (
        <>
          <SectionHeading title="Tipo de consulta" read={read} />
          <SelectionCard title="Consulta online" description="Acesso em vídeo apenas demonstrativo." icon="videocam-outline" selected={visitType === 'online'} onPress={() => setVisitType('online')} onRead={read} />
          <SelectionCard title="Consulta presencial" description="Local de atendimento não informado nesta demonstração." icon="location-outline" selected={visitType === 'presencial'} onPress={() => setVisitType('presencial')} onRead={read} />
          <SectionHeading title="Escolha uma especialidade" read={read} />
          <View style={styles.wrapRow}>
            {specialties.map((item) => (
              <SelectionPill key={item} label={item} selected={specialty === item} onPress={() => setSpecialty(item)} testID={`specialty-${item}`} />
            ))}
          </View>
          <DemoNotice onRead={read}>A lista é fictícia. Não representa médicos ou vagas reais.</DemoNotice>
          <ActionButton title="Ver profissionais de exemplo" icon="arrow-forward" onPress={() => { setSearch(''); go('doctors'); }} />
        </>
      );
    }

    if (screen === 'doctors') {
      return (
        <>
          <DemoNotice onRead={read}>Profissionais e horários são fictícios e servem somente para percorrer as telas.</DemoNotice>
          <LabeledInput label="Buscar nesta lista de exemplo" readText="Digite parte do nome fictício ou da especialidade." value={search} onChangeText={setSearch} placeholder="Buscar profissional" autoCapitalize="none" />
          {matchingProviders.map((item) => (
            <View key={item.name} style={[styles.personCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>
                <Ionicons name="person-outline" size={30} color={theme.primary} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="section">{item.name}</AppText>
                <AppText variant="body">{item.specialty}</AppText>
                <AppText variant="caption">Perfil fictício · sem clínica associada</AppText>
              </View>
              <AudioAction text={`${item.name}. Especialidade: ${item.specialty}. Profissional fictício de demonstração.`} onRead={read} compact />
              <ActionButton title="Ver perfil" icon="chevron-forward" kind="secondary" onPress={() => { setProvider(item.name); go('doctor'); }} />
            </View>
          ))}
          {matchingProviders.length === 0 ? (
            <EmptyState title="Nenhum exemplo encontrado" description="Tente buscar por outra palavra." icon="search-outline" />
          ) : null}
          <ActionButton title="Escolher outra especialidade" icon="arrow-back" kind="outline" onPress={() => go('specialty')} />
        </>
      );
    }

    if (screen === 'doctor') {
      return (
        <>
          <View style={styles.profileHero}>
            <View style={[styles.avatar, styles.avatarLarge, { backgroundColor: theme.secondary }]}>
              <Ionicons name="person-outline" size={42} color={theme.primary} />
            </View>
            <AppText variant="title" style={styles.centerText}>{provider}</AppText>
            <AppText variant="body" style={styles.centerText}>{specialty}</AppText>
            <AudioAction text={`Perfil de ${provider}, da especialidade ${specialty}. Os dados são fictícios.`} onRead={read} />
          </View>
          <InfoCard title="Sobre este perfil" value="Informações ilustrativas para a apresentação acadêmica." icon="information-circle-outline" onRead={read} />
          <InfoCard title="Atendimento" value={visitLabel(visitType)} icon={visitType === 'online' ? 'videocam-outline' : 'location-outline'} onRead={read} />
          <DemoNotice onRead={read}>Não há cadastro profissional, clínica ou disponibilidade real.</DemoNotice>
          <ActionButton title="Ver horários de exemplo" icon="time-outline" onPress={() => go('schedule')} />
          <ActionButton title="Escolher outro profissional" icon="arrow-back" kind="outline" onPress={() => go('doctors')} />
        </>
      );
    }

    if (screen === 'schedule') {
      return (
        <>
          <DemoNotice onRead={read}>As datas e os horários abaixo são apenas ilustrativos. Nenhuma vaga real está sendo consultada.</DemoNotice>
          <SectionHeading title="Escolha um dia de exemplo" read={read} />
          <View style={styles.wrapRow}>
            {demoDays.map((day) => (
              <SelectionPill key={day.id} label={day.label} selected={selectedDate === day.id} onPress={() => setSelectedDate(day.id)} testID={`day-${day.id}`} />
            ))}
          </View>
          <SectionHeading title="Escolha um horário de exemplo" read={read} />
          <View style={styles.wrapRow}>
            {exampleTimes.map((time) => (
              <SelectionPill key={time} label={time} selected={selectedTime === time} onPress={() => setSelectedTime(time)} testID={`time-${time}`} />
            ))}
          </View>
          <AudioAction text={`Seleção de dia e horário. ${selectedDate ? formatDay(selectedDate) : 'Escolha um dia.'} ${selectedTime ? `Às ${selectedTime}.` : 'Escolha um horário.'} Todos são exemplos fictícios.`} onRead={read} />
          <ActionButton title="Revisar agendamento" icon="arrow-forward" disabled={!selectedDate || !selectedTime} onPress={() => go('confirmation')} />
          <ActionButton title="Voltar ao profissional" icon="arrow-back" kind="outline" onPress={() => go('doctor')} />
        </>
      );
    }

    if (screen === 'confirmation') {
      return (
        <>
          <InfoCard title="Profissional" value={provider} icon="person-outline" onRead={read} />
          <InfoCard title="Especialidade" value={specialty} icon="medical-outline" onRead={read} />
          <InfoCard title="Tipo de consulta" value={visitLabel(visitType)} icon={visitType === 'online' ? 'videocam-outline' : 'location-outline'} onRead={read} />
          <InfoCard title="Data" value={selectedDate ? formatDay(selectedDate) : 'Não selecionada'} icon="calendar-outline" onRead={read} />
          <InfoCard title="Horário" value={selectedTime || 'Não selecionado'} icon="time-outline" onRead={read} />
          <DemoNotice onRead={read}>Ao confirmar, somente um registro fictício será salvo neste dispositivo. Nenhum serviço médico será contatado.</DemoNotice>
          <ActionButton title="Confirmar consulta" icon="checkmark-circle-outline" onPress={saveBooking} testID="confirm-booking" />
          <ActionButton title="Voltar e alterar" icon="arrow-back" kind="outline" onPress={() => go('schedule')} />
        </>
      );
    }

    if (screen === 'success') {
      const booked = bookings.find((item) => item.id === selectedBookingId);
      return (
        <>
          <View style={[styles.successMark, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark" size={58} color={theme.primaryForeground} />
          </View>
          <AppText variant="title" style={styles.centerText}>Sua consulta foi agendada!</AppText>
          <AppText variant="body" style={styles.centerText}>Este é um agendamento fictício para a demonstração.</AppText>
          {booked ? (
            <View style={styles.summaryCard}>
              <InfoCard title="Profissional" value={booked.provider} icon="person-outline" onRead={read} />
              <InfoCard title="Tipo de consulta" value={visitLabel(booked.type)} icon={booked.type === 'online' ? 'videocam-outline' : 'location-outline'} onRead={read} />
              <InfoCard title="Data" value={formatDay(booked.day)} icon="calendar-outline" onRead={read} />
              <InfoCard title="Horário" value={booked.time} icon="time-outline" onRead={read} />
            </View>
          ) : null}
          <ActionButton title="Voltar ao início" icon="home-outline" onPress={() => openTab('home')} />
          <ActionButton title="Visualizar consultas" icon="clipboard-outline" kind="secondary" onPress={() => openTab('appointments')} />
        </>
      );
    }

    if (screen === 'appointments') {
      return (
        <>
          <DemoNotice onRead={read}>Os registros ficam neste aparelho. Não são consultas médicas reais.</DemoNotice>
          <SectionHeading title="Próximos agendamentos de exemplo" read={read} />
          {bookings.length === 0 ? (
            <EmptyState title="Nenhum agendamento de exemplo" description="Quando você concluir o fluxo, ele aparecerá aqui." icon="calendar-outline" />
          ) : (
            bookings.map((booking) => (
              <View key={booking.id} style={[styles.bookingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.bookingHeading}>
                  <View style={[styles.featureIcon, { backgroundColor: theme.secondary }]}>
                    <Ionicons name={booking.type === 'online' ? 'videocam-outline' : 'location-outline'} size={25} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <AppText variant="section">{booking.specialty}</AppText>
                    <AppText variant="body">{booking.provider}</AppText>
                  </View>
                  <AudioAction text={`${booking.specialty}. ${booking.provider}. ${visitLabel(booking.type)}. ${formatDay(booking.day)}, às ${booking.time}.`} onRead={read} compact />
                </View>
                <StatusText status={booking.status} />
                <AppText variant="body">{formatDay(booking.day)} · {booking.time}</AppText>
                <ActionButton title="Ver detalhes" icon="chevron-forward" kind="secondary" onPress={() => { setSelectedBookingId(booking.id); go('appointment-detail'); }} />
                {booking.status === 'upcoming' && booking.type === 'online' ? (
                  <ActionButton title="Entrar na consulta" icon="videocam-outline" onPress={() => { setSelectedBookingId(booking.id); setInCall(false); go('online'); }} />
                ) : null}
              </View>
            ))
          )}
          <ActionButton title="Agendar um exemplo" icon="add" kind="outline" onPress={proceedToBooking} />
        </>
      );
    }

    if (screen === 'appointment-detail') {
      if (!selectedBooking) {
        return (
          <>
            <EmptyState title="Selecione um agendamento" description="Volte para Minhas consultas para escolher um registro." icon="calendar-outline" />
            <ActionButton title="Ver minhas consultas" icon="arrow-back" kind="outline" onPress={() => openTab('appointments')} />
          </>
        );
      }
      return (
        <>
          <StatusText status={selectedBooking.status} />
          <InfoCard title="Profissional" value={selectedBooking.provider} icon="person-outline" onRead={read} />
          <InfoCard title="Especialidade" value={selectedBooking.specialty} icon="medical-outline" onRead={read} />
          <InfoCard title="Tipo" value={visitLabel(selectedBooking.type)} icon={selectedBooking.type === 'online' ? 'videocam-outline' : 'location-outline'} onRead={read} />
          <InfoCard title="Data e horário" value={`${formatDay(selectedBooking.day)} · ${selectedBooking.time}`} icon="calendar-outline" onRead={read} />
          {selectedBooking.status === 'upcoming' && selectedBooking.type === 'online' ? (
            <ActionButton title="Entrar na consulta" icon="videocam-outline" onPress={() => { setInCall(false); go('online'); }} />
          ) : null}
          {selectedBooking.status === 'upcoming' ? (
            <ActionButton title="Voltar e reagendar" icon="create-outline" kind="secondary" onPress={() => beginReschedule(selectedBooking)} />
          ) : null}
          {selectedBooking.status === 'upcoming' && !cancelPrompt ? (
            <ActionButton title="Cancelar exemplo" icon="close-circle-outline" kind="outline" onPress={() => setCancelPrompt(true)} />
          ) : null}
          {selectedBooking.status === 'upcoming' && cancelPrompt ? (
            <DemoNotice tone="warning" onRead={read}>Deseja marcar este registro fictício como cancelado?</DemoNotice>
          ) : null}
          {cancelPrompt ? (
            <>
              <ActionButton title="Sim, cancelar exemplo" icon="checkmark" kind="danger" onPress={cancelBooking} />
              <ActionButton title="Manter agendamento" icon="arrow-back" kind="outline" onPress={() => setCancelPrompt(false)} />
            </>
          ) : null}
          <ActionButton title="Voltar às consultas" icon="arrow-back" kind="outline" onPress={() => openTab('appointments')} />
        </>
      );
    }

    if (screen === 'online') {
      const booking = selectedBooking?.type === 'online' ? selectedBooking : activeOnlineBooking;
      if (inCall) {
        return (
          <>
            <View style={[styles.callPanel, { backgroundColor: theme.muted }]}>
              <Ionicons name="videocam-off-outline" size={52} color={theme.primary} />
              <AppText variant="title" style={styles.centerText}>Consulta de demonstração</AppText>
              <AppText variant="body" style={styles.centerText}>Esta tela não inicia vídeo, áudio ou contato com um profissional.</AppText>
              <View style={styles.callControls}>
                <View style={[styles.callControl, { backgroundColor: theme.card }]}><Ionicons name="videocam-off-outline" size={26} color={theme.primary} /><AppText variant="caption">Vídeo desligado</AppText></View>
                <View style={[styles.callControl, { backgroundColor: theme.card }]}><Ionicons name="mic-off-outline" size={26} color={theme.primary} /><AppText variant="caption">Áudio desligado</AppText></View>
              </View>
            </View>
            <DemoNotice onRead={read}>Videochamada ilustrativa. Nenhum microfone ou câmera foi ativado.</DemoNotice>
            <ActionButton title="Encerrar demonstração" icon="call-outline" kind="danger" onPress={() => setInCall(false)} />
            <ActionButton title="Voltar às consultas" icon="arrow-back" kind="outline" onPress={() => { setInCall(false); openTab('appointments'); }} />
          </>
        );
      }
      if (!booking) {
        return (
          <>
            <EmptyState title="Nenhuma consulta online de exemplo" description="Conclua um agendamento fictício online para ver este resumo." icon="videocam-outline" />
            <DemoNotice onRead={read}>A entrada não conecta a uma videochamada real.</DemoNotice>
            <ActionButton title="Agendar uma consulta de exemplo" icon="calendar-outline" onPress={proceedToBooking} />
            <ActionButton title="Ver minhas consultas" icon="clipboard-outline" kind="outline" onPress={() => openTab('appointments')} />
          </>
        );
      }
      if (booking.type !== 'online') {
        return (
          <>
            <InfoCard title="Agendamento selecionado" value="Este exemplo está marcado como presencial." icon="location-outline" onRead={read} />
            <DemoNotice onRead={read}>Nenhuma chamada está disponível nesta demonstração.</DemoNotice>
            <ActionButton title="Ver detalhes do agendamento" icon="chevron-forward" onPress={() => { setSelectedBookingId(booking.id); go('appointment-detail'); }} />
          </>
        );
      }
      return (
        <>
          <DemoNotice onRead={read}>A consulta e o profissional são fictícios. Este botão não inicia uma chamada real.</DemoNotice>
          <InfoCard title="Profissional" value={booking.provider} icon="person-outline" onRead={read} />
          <InfoCard title="Especialidade" value={booking.specialty} icon="medical-outline" onRead={read} />
          <InfoCard title="Data e horário" value={`${formatDay(booking.day)} · ${booking.time}`} icon="calendar-outline" onRead={read} />
          <ActionButton title="Entrar na consulta" icon="videocam-outline" onPress={() => setInCall(true)} />
          <AppText variant="caption" style={styles.centerText}>A chamada de vídeo é somente demonstrativa.</AppText>
          <ActionButton title="Voltar às consultas" icon="arrow-back" kind="outline" onPress={() => openTab('appointments')} />
        </>
      );
    }

    if (screen === 'notifications') {
      const unread = notices.filter((notice) => !notice.read).length;
      return (
        <>
          <DemoNotice onRead={read}>Não há envio de mensagens ou notificações push.</DemoNotice>
          <View style={styles.sectionHeading}>
            <AppText variant="section" style={{ flex: 1 }}>{unread} aviso(s) não lido(s)</AppText>
            <AudioAction text={`${unread} avisos não lidos. Os avisos são exemplos locais.`} onRead={read} compact />
          </View>
          {notices.map((notice) => (
            <Pressable
              key={notice.id}
              accessibilityRole="button"
              accessibilityLabel={`${notice.title}. ${notice.body}`}
              onPress={() => setNotices((items) => items.map((item) => item.id === notice.id ? { ...item, read: true } : item))}
              style={[styles.noticeCard, { backgroundColor: notice.read ? theme.card : theme.accent, borderColor: theme.border }]}
            >
              <View style={styles.noticeHead}>
                <Ionicons name={notice.read ? 'mail-open-outline' : 'mail-unread-outline'} size={24} color={theme.primary} />
                <AppText variant="section" style={{ flex: 1 }}>{notice.title}</AppText>
                <AudioAction text={`${notice.title}. ${notice.body}`} onRead={read} compact />
              </View>
              <AppText variant="body">{notice.body}</AppText>
              <AppText variant="caption">{notice.date} · toque para marcar como lido</AppText>
            </Pressable>
          ))}
          <ActionButton title="Marcar todos como lidos" icon="checkmark-done-outline" kind="outline" onPress={() => setNotices((items) => items.map((item) => ({ ...item, read: true })))} />
        </>
      );
    }

    if (screen === 'profile') {
      return (
        <>
          <View style={styles.profileHero}>
            <View style={[styles.avatar, styles.avatarLarge]}><Ionicons name="person-outline" size={42} color={theme.primary} /></View>
            <AppText variant="title" style={styles.centerText}>{profileName}</AppText>
            <AppText variant="body" style={styles.centerText}>Perfil local de demonstração</AppText>
            <AudioAction text={`${profileName}. Perfil fictício, sem conta real.`} onRead={read} />
          </View>
          <DemoNotice onRead={read}>Não há conta real. Os dados de perfil não são guardados depois de fechar o app.</DemoNotice>
          <ActionButton title="Editar dados pessoais" icon="create-outline" onPress={() => { setDraftProfileName(''); setDraftProfileEmail(''); setDraftProfilePhone(''); go('edit-profile'); }} />
          <ActionButton title="Configurações" icon="settings-outline" kind="secondary" onPress={() => go('settings')} />
          <ActionButton title="Ajuda e suporte" icon="help-circle-outline" kind="outline" onPress={() => go('help')} />
          <ActionButton title="Sobre o AgendaMais+" icon="information-circle-outline" kind="outline" onPress={() => go('about')} />
          <ActionButton title="Sair da demonstração" icon="log-out-outline" kind="outline" onPress={() => openTab('home')} />
        </>
      );
    }

    if (screen === 'edit-profile') {
      return (
        <>
          <DemoNotice onRead={read}>Não digite dados sensíveis. O que preencher fica apenas na memória desta sessão.</DemoNotice>
          <LabeledInput label="Nome para esta sessão" readText="O nome não será salvo depois que você fechar o aplicativo." value={draftProfileName} onChangeText={setDraftProfileName} placeholder="Nome de exemplo" autoComplete="off" />
          <LabeledInput label="E-mail (opcional)" readText="O endereço é temporário e não será salvo nem enviado." value={draftProfileEmail} onChangeText={setDraftProfileEmail} placeholder="Não informe seu e-mail real" keyboardType="email-address" autoCapitalize="none" autoComplete="off" />
          <LabeledInput label="Telefone (opcional)" readText="O número é temporário e não será salvo nem enviado." value={draftProfilePhone} onChangeText={setDraftProfilePhone} placeholder="Não informe seu telefone real" keyboardType="phone-pad" autoComplete="off" />
          {formMessage ? <DemoNotice tone="warning" onRead={read}>{formMessage}</DemoNotice> : null}
          <ActionButton title="Salvar só nesta sessão" icon="checkmark" onPress={() => {
            if (!draftProfileName.trim()) {
              setFormMessage('Digite um nome de exemplo para continuar.');
              return;
            }
            setProfileName(draftProfileName.trim());
            setDraftProfileEmail('');
            setDraftProfilePhone('');
            setFormMessage('');
            go('profile');
          }} />
          <ActionButton title="Descartar alterações" icon="close" kind="outline" onPress={() => go('profile')} />
        </>
      );
    }

    if (screen === 'settings') {
      return (
        <>
          <DemoNotice onRead={read}>
            {storageAvailable
              ? 'Agendamentos fictícios, avisos e preferências ficam somente neste dispositivo. Nada é enviado a um servidor.'
              : 'Não foi possível salvar nesta sessão. As alterações serão perdidas ao fechar o app.'}
          </DemoNotice>
          <SectionHeading title="Tamanho do texto" read={read} />
          <View style={styles.wrapRow}>
            {(['normal', 'grande', 'extragrande'] as const).map((font) => (
              <SelectionPill key={font} label={font === 'extragrande' ? 'Extra grande' : font[0].toUpperCase() + font.slice(1)} selected={preferences.font === font} onPress={() => changeFont(font)} />
            ))}
          </View>
          <PreferenceSwitch title="Alto contraste" description="Realça texto, botões e contornos." value={preferences.contrast} onChange={() => togglePreference('contrast')} read={read} />
          <SectionHeading title="Orientações visuais" read={read} />
          <PreferenceSwitch title="Orientação automática" description="Preferência demonstrativa; não inicia áudio." value={preferences.guidance} onChange={() => togglePreference('guidance')} read={read} />
          <PreferenceSwitch title="Lembretes de demonstração" description="Ajusta somente os avisos locais do exemplo." value={preferences.reminders} onChange={() => togglePreference('reminders')} read={read} />
          <View style={[styles.settingCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <View style={styles.sectionHeading}>
              <AppText variant="section" style={{ flex: 1 }}>Velocidade da leitura</AppText>
              <AudioAction text="Velocidade de leitura é uma preferência visual. Nenhum áudio é reproduzido." onRead={read} compact />
            </View>
            <View style={styles.wrapRow}>
              {(['lenta', 'normal', 'rápida'] as const).map((speed) => (
                <SelectionPill key={speed} label={speed[0].toUpperCase() + speed.slice(1)} selected={preferences.speed === speed} onPress={() => setPreferences((current) => ({ ...current, speed }))} />
              ))}
            </View>
            <AppText variant="caption">A preferência não altera a simulação de leitura.</AppText>
          </View>
          <View style={[styles.settingCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <View style={styles.sectionHeading}>
              <AppText variant="section" style={{ flex: 1 }}>Antecedência dos lembretes</AppText>
              <AudioAction text={`Antecedência selecionada: ${preferences.advance}. É apenas uma preferência demonstrativa.`} onRead={read} compact />
            </View>
            <View style={styles.wrapRow}>
              {['No mesmo dia', '1 dia antes', '2 dias antes'].map((advance) => (
                <SelectionPill key={advance} label={advance} selected={preferences.advance === advance} onPress={() => setPreferences((current) => ({ ...current, advance }))} />
              ))}
            </View>
          </View>
          <ActionButton title="Testar orientação (visual)" icon="volume-high-outline" onPress={() => read('Teste de voz. Esta é uma simulação visual de leitura, sem áudio real.')} />
          <ActionButton title="Redefinir demonstração" icon="refresh-outline" kind="outline" onPress={() => setResetPrompt(true)} />
          {resetPrompt ? (
            <View style={[styles.settingCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <AppText variant="section">Redefinir os exemplos?</AppText>
              <AppText variant="body">Agendamentos, avisos e preferências voltarão ao início neste dispositivo.</AppText>
              <AudioAction text="Redefinir registros e preferências fictícios deste dispositivo." onRead={read} />
              <ActionButton title="Sim, redefinir" icon="refresh-outline" kind="danger" onPress={resetDemo} />
              <ActionButton title="Manter os exemplos" icon="close" kind="outline" onPress={() => setResetPrompt(false)} />
            </View>
          ) : null}
        </>
      );
    }

    if (screen === 'help') {
      return (
        <>
          <DemoNotice onRead={read}>Esta ajuda ensina a navegar na demonstração. Não substitui orientação de saúde.</DemoNotice>
          <InfoCard title="Como agendar" value="Toque em Agendar consulta, escolha um tipo, uma especialidade, um profissional fictício e uma data e horário de exemplo." icon="calendar-outline" onRead={read} />
          <InfoCard title="Como ver seus registros" value="Abra Minhas consultas para revisar, reagendar ou cancelar exemplos." icon="clipboard-outline" onRead={read} />
          <InfoCard title="Como usar a leitura" value="Toque em Ouvir explicação. Uma faixa mostrará o texto simulado. Toque em Interromper para fechá-la." icon="volume-high-outline" onRead={read} />
          <InfoCard title="Precisa de ajuda agora?" value="Este protótipo não tem atendimento humano ou serviço de suporte conectado." icon="help-circle-outline" onRead={read} />
          <ActionButton title="Abrir acessibilidade" icon="accessibility-outline" onPress={() => go('accessibility')} />
          <ActionButton title="Voltar ao início" icon="home-outline" kind="outline" onPress={() => openTab('home')} />
        </>
      );
    }

    if (screen === 'about') {
      return (
        <>
          <View style={styles.centerBlock}>
            <BrandLogo size={86} />
            <AppText variant="title" style={styles.centerText}>Cuidar da saúde com mais autonomia</AppText>
            <AppText variant="body" style={styles.centerText}>
              Um protótipo acadêmico de consultas online, pensado para facilitar a navegação de pessoas idosas.
            </AppText>
          </View>
          <InfoCard title="Versão" value="Demonstração acadêmica AgendaMais+" icon="information-circle-outline" onRead={read} />
          <DemoNotice onRead={read}>Não oferece atendimento de saúde, consulta médica, vídeo, disponibilidade real ou leitura de voz.</DemoNotice>
          <ActionButton title="Voltar ao início" icon="home-outline" onPress={() => openTab('home')} />
        </>
      );
    }

    return null;
  };

  const appBody = screen === 'opening' ? renderOpening() : (
    <>
      {screen === 'home' ? (
        <View style={styles.homeBrand}>
          <BrandLogo size={50} compact />
        </View>
      ) : (
        <View style={styles.pageHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
            onPress={back}
            style={({ pressed }) => [styles.backButton, { backgroundColor: theme.muted }, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={25} color={theme.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="title">{titles[screen]}</AppText>
            {descriptions[screen] ? <AppText variant="caption">{descriptions[screen]}</AppText> : null}
          </View>
          <AudioAction
            compact
            text={`${titles[screen]}. ${descriptions[screen] ?? 'Tela de demonstração do AgendaMais+.'}`}
            onRead={read}
          />
        </View>
      )}
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: showBottomNav ? 122 + insets.bottom : 38 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={24}
      >
        {renderScreen()}
      </KeyboardAwareScrollViewCompat>
      {showBottomNav ? (
        <View style={[styles.bottomNav, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom }]}>
          {([
            { id: 'home' as const, label: 'Início', icon: 'home-outline' as const },
            { id: 'appointments' as const, label: 'Consultas', icon: 'calendar-outline' as const },
            { id: 'notifications' as const, label: 'Avisos', icon: 'notifications-outline' as const },
            { id: 'profile' as const, label: 'Perfil', icon: 'person-outline' as const },
          ]).map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: screen === item.id }}
              onPress={() => openTab(item.id)}
              style={styles.navItem}
            >
              <Ionicons name={item.icon} size={24} color={screen === item.id ? theme.primary : theme.mutedForeground} />
              <AppText variant="caption" style={{ color: screen === item.id ? theme.primary : theme.mutedForeground, textAlign: 'center' }}>
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </>
  );

  const backgroundColor = screen === 'opening' ? theme.primary : theme.background;
  return (
    <UIProvider theme={theme} fontScale={fontScale} onRead={read}>
      <StatusBar barStyle={screen === 'opening' ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
      <View style={[styles.root, { backgroundColor, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        {!ready ? (
          <View style={styles.loading}>
            <BrandLogo size={92} inverted={screen === 'opening'} />
            <ActivityIndicator color={screen === 'opening' ? theme.primaryForeground : theme.primary} />
            <AppText variant="caption" style={{ color: screen === 'opening' ? theme.primaryForeground : theme.mutedForeground }}>
              Preparando a demonstração…
            </AppText>
          </View>
        ) : (
          <>
            {appBody}
            {activeReading ? (
              <View style={[styles.readingBar, { backgroundColor: theme.primary, bottom: showBottomNav ? 82 + insets.bottom : 14 + insets.bottom }]}>
                <View style={styles.readingText}>
                  <Ionicons name="volume-high-outline" size={24} color={theme.primaryForeground} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="caption" style={{ color: theme.primaryForeground, fontWeight: '700' }}>Leitura de demonstração</AppText>
                    <AppText variant="caption" numberOfLines={2} style={{ color: theme.primaryForeground }}>{activeReading}</AppText>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Interromper simulação de leitura"
                  onPress={() => setActiveReading(null)}
                  style={({ pressed }) => [styles.stopReading, pressed && styles.pressed]}
                >
                  <Ionicons name="close" size={23} color={theme.primaryForeground} />
                  <AppText variant="caption" style={{ color: theme.primaryForeground }}>Interromper</AppText>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </View>
    </UIProvider>
  );
}

function PreferenceSwitch({
  title,
  description,
  value,
  onChange,
  read,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: () => void;
  read: (text: string) => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.settingCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="section">{title}</AppText>
        <AppText variant="body">{description}</AppText>
      </View>
      <AudioAction text={`${title}. ${description} ${value ? 'Ativado.' : 'Desativado.'}`} onRead={read} compact />
      <Switch
        accessibilityLabel={`${title}, ${value ? 'ativado' : 'desativado'}`}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={theme.primaryForeground}
      />
    </View>
  );
}

function InfoCard({
  title,
  value,
  icon,
  onRead,
}: {
  title: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onRead: (text: string) => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: theme.secondary }]}>
        <Ionicons name={icon} size={23} color={theme.primary} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText variant="caption">{title}</AppText>
        <AppText variant="label">{value}</AppText>
      </View>
      <AudioAction text={`${title}. ${value}`} onRead={onRead} compact />
    </View>
  );
}

function EmptyState({ title, description, icon }: { title: string; description: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.emptyState, { backgroundColor: theme.muted }]}>
      <Ionicons name={icon} size={42} color={theme.primary} />
      <AppText variant="section" style={styles.centerText}>{title}</AppText>
      <AppText variant="body" style={styles.centerText}>{description}</AppText>
    </View>
  );
}

export default AgendaMaisApp;

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  opening: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  openingMain: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8 },
  orbitArtwork: { width: 290, height: 270, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  orbit: { position: 'absolute', width: 238, height: 238, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 999 },
  orbitOne: { transform: [{ rotate: '-18deg' }, { scaleX: 1.2 }] },
  orbitTwo: { transform: [{ rotate: '22deg' }, { scaleX: 0.9 }, { scaleY: 1.1 }] },
  orbitThree: { transform: [{ rotate: '54deg' }, { scaleX: 1.05 }, { scaleY: 0.88 }] },
  openingIcon: { width: 126, height: 126, borderRadius: 32 },
  openingDots: { flexDirection: 'row', gap: 8, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(216,197,240,0.46)' },
  dotActive: {},
  openingFooter: { width: '100%', gap: 13 },
  pageHeader: { minHeight: 82, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 11 },
  backButton: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, gap: 15 },
  homeBrand: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  homeGreeting: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  centerBlock: { alignItems: 'center', gap: 13, paddingVertical: 10 },
  centerText: { textAlign: 'center' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
  selectionPill: { minHeight: 54, minWidth: 92, maxWidth: '100%', paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center', borderWidth: 1, borderRadius: 17 },
  personCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 12 },
  featureIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  avatarLarge: { width: 96, height: 96, borderRadius: 48 },
  profileHero: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  settingCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 12, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  infoCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bookingCard: { borderWidth: 1, borderRadius: 21, padding: 16, gap: 12 },
  bookingHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  successMark: { width: 88, height: 88, borderRadius: 44, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  summaryCard: { gap: 10 },
  emptyState: { borderRadius: 20, padding: 22, alignItems: 'center', gap: 10 },
  noticeCard: { borderWidth: 1, borderRadius: 19, padding: 15, gap: 10 },
  noticeHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  callPanel: { minHeight: 300, borderRadius: 22, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  callControls: { flexDirection: 'row', gap: 14, marginTop: 12 },
  callControl: { width: 130, minHeight: 86, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 8 },
  bottomNav: { minHeight: 68, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 8 },
  navItem: { minWidth: 62, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2 },
  readingBar: { position: 'absolute', left: 12, right: 12, minHeight: 100, borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 8 },
  readingText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopReading: { minHeight: 54, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
