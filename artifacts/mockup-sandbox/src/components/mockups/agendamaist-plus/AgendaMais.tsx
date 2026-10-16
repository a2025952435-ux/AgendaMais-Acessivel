import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  Accessibility, ArrowLeft, ArrowRight, Bell, CalendarCheck, CalendarDays, Check, CheckCheck,
  CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3, Contrast, Eye, EyeOff, Heart,
  HelpCircle, Home, Info, LogOut, Mail, MapPin, MessageSquare, Monitor, Pencil, Phone,
  PhoneOff, Plus, RotateCcw, Search, Settings, ShieldCheck, Stethoscope, Trash2, Type, UserRound,
  Volume2, X,
} from "lucide-react";

type ScreenId =
  | "opening" | "welcome" | "login" | "register" | "recovery" | "accessibility"
  | "home" | "specialty" | "doctors" | "doctor" | "schedule" | "confirmation" | "success"
  | "appointments" | "appointment-detail" | "online" | "notifications" | "profile"
  | "edit-profile" | "settings" | "help" | "about";
type VisitType = "online" | "presencial";
type BookingStatus = "upcoming" | "completed" | "cancelled";
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
type Preferences = { font: "normal" | "grande" | "extragrande"; contrast: boolean; speed: "lenta" | "normal" | "rápida"; guidance: boolean; reminders: boolean; advance: string };
type Profile = { name: string; email: string; phone: string; birth: string };
type DemoSnapshot = { booking: Booking | null; preferences: Preferences; notices: Notice[] };
type DemoStorageRead = { snapshot: DemoSnapshot | null; available: boolean };

const specialties = ["Clínica geral", "Cardiologia", "Dermatologia", "Oftalmologia", "Ortopedia", "Geriatria"];
const providers = specialties.map((specialty, index) => ({
  specialty,
  name: `Profissional fictício de demonstração ${String.fromCharCode(65 + index)}`,
  clinic: "Local de atendimento ilustrativo",
}));
const times = ["09:00", "10:30", "14:00", "15:30"];
const typeLabel = (type: VisitType) => type === "online" ? "Online (demonstração)" : "Presencial (demonstração)";
const makeFutureWeekdays = () => {
  const found: { short: string; label: string; full: string }[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  while (found.length < 4) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      const full = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(cursor);
      found.push({
        short: new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(cursor).replace(".", "").toUpperCase(),
        label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(cursor).replace(".", ""),
        full: full.charAt(0).toUpperCase() + full.slice(1),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return found;
};

type AppContext = {
  go: (screen: ScreenId) => void;
  back: () => void;
  read: (text: string) => void;
  booking: Booking | null;
  draft: Booking;
  setDraft: (draft: Booking) => void;
  specialty: string;
  setSpecialty: (specialty: string) => void;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
  notices: Notice[];
  setNotices: (notices: Notice[]) => void;
  storageAvailable: boolean;
  selectedBooking: Booking;
  setSelectedBooking: (booking: Booking) => void;
  confirmBooking: () => void;
  beginReschedule: () => void;
  rescheduling: boolean;
  setRescheduling: (value: boolean) => void;
  cancelBooking: () => void;
  inCall: boolean;
  setInCall: (value: boolean) => void;
  resetDemo: () => void;
};

function AudioButton({ text, onRead, small = false }: { text: string; onRead: (text: string) => void; small?: boolean }) {
  return <button className={`am-audio${small ? " is-small" : ""}`} type="button" onClick={() => onRead(text)} aria-label={`Leitura demonstrativa: ${text}`}><Volume2 size={small ? 18 : 21} /><span>{small ? "Ler" : "Ouvir explicação"}</span></button>;
}

function PrimaryButton({ children, onClick, secondary = false, disabled = false, icon }: { children: ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean; icon?: ReactNode }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`am-button${secondary ? " secondary" : ""}`}>{icon}<span>{children}</span></button>;
}

function FeatureCard({ title, description, icon, onClick, read, tint = false }: { title: string; description: string; icon: ReactNode; onClick: () => void; read: (text: string) => void; tint?: boolean }) {
  return <article className={`am-feature${tint ? " tinted" : ""}`}><button className="am-feature-main" type="button" onClick={onClick}><span className="am-feature-icon">{icon}</span><span className="am-feature-copy"><strong>{title}</strong><span>{description}</span></span><ChevronRight size={22} /></button><div className="am-feature-audio"><AudioButton text={`${title}. ${description}`} onRead={read} small /></div></article>;
}

function Field({ label, hint, type = "text", value, onChange, read, placeholder, required = false }: { label: string; hint: string; type?: string; value: string; onChange: (value: string) => void; read: (text: string) => void; placeholder?: string; required?: boolean }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return <div className="am-field"><div className="am-field-label"><span>{label}{required ? " *" : ""}</span><AudioButton text={`${label}. ${hint}`} onRead={read} small /></div><span className="am-input-wrap"><input aria-label={label} type={isPassword && visible ? "text" : type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />{isPassword && <button type="button" className="am-eye" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button>}</span></div>;
}

function NoticeBox({ children, read, tone = "info" }: { children: ReactNode; read: (text: string) => void; tone?: "info" | "success" | "warning" }) {
  const text = typeof children === "string" ? children : "Informação importante sobre esta demonstração.";
  return <div className={`am-notice ${tone}`}><Info size={20} /><span>{children}</span><AudioButton text={text} onRead={read} small /></div>;
}

function BottomNav({ active, go, read }: { active: "home" | "appointments" | "notifications" | "profile"; go: (screen: ScreenId) => void; read: (text: string) => void }) {
  const items = [
    { id: "home" as const, screen: "home" as const, label: "Início", icon: <Home size={21} /> },
    { id: "appointments" as const, screen: "appointments" as const, label: "Consultas", icon: <CalendarDays size={21} /> },
    { id: "notifications" as const, screen: "notifications" as const, label: "Avisos", icon: <Bell size={21} /> },
    { id: "profile" as const, screen: "profile" as const, label: "Perfil", icon: <UserRound size={21} /> },
  ];
  return <nav className="am-bottom-nav" aria-label="Navegação principal">{items.map((item) => <button key={item.id} className={active === item.id ? "active" : ""} type="button" onClick={() => go(item.screen)} aria-current={active === item.id ? "page" : undefined} aria-label={item.label}><span>{item.icon}</span><small>{item.label}</small></button>)}<AudioButton text="Barra de navegação. Use Início, Consultas, Avisos e Perfil para trocar de área." onRead={read} small /></nav>;
}

function ScreenFrame({ title, description, ctx, children, step }: { title: string; description: string; ctx: AppContext; children: ReactNode; step?: string }) {
  return <main className="am-screen"><header className="am-topbar"><button className="am-back" type="button" onClick={ctx.back} aria-label="Voltar"><ArrowLeft size={21} /><span>Voltar</span></button><span className="am-wordmark">AgendaMais<span>+</span></span><span className="am-step">{step ?? "DEMO"}</span></header><header className="am-heading"><div className="am-title-row"><h1>{title}</h1><AudioButton text={`${title}. ${description}`} onRead={ctx.read} small /></div><p>{description}</p></header><div className="am-content">{children}</div></main>;
}

function AberturaScreen({ go, read }: AppContext) {
  return <section className="am-opening"><div className="am-opening-mark"><span className="am-orbit orbit-a" /><span className="am-orbit orbit-b" /><span className="am-mark-icon"><CalendarCheck size={46} /><Heart className="am-heart" size={22} /></span></div><span className="am-wordmark">AgendaMais<span>+</span></span><p className="am-slogan">Cuidar da saúde com mais autonomia, simplicidade e acessibilidade.</p><AudioButton text="AgendaMais+. Cuidar da saúde com mais autonomia, simplicidade e acessibilidade. Esta é uma demonstração visual." onRead={read} /><div className="am-opening-loader"><span /><span /><span /></div><PrimaryButton onClick={() => go("welcome")} icon={<ArrowRight size={20} />}>Começar demonstração</PrimaryButton><p className="am-opening-foot">Protótipo acadêmico · sem atendimento de saúde</p></section>;
}

function BoasVindasScreen(ctx: AppContext) {
  const { go, read } = ctx;
  return <ScreenFrame title="Bem-vindo ao AgendaMais+" description="Suas consultas médicas de um jeito mais simples." ctx={ctx}>
    <div className="am-welcome-hero"><span className="am-welcome-symbol"><Heart size={29} /></span><h2>Um passo de cada vez.</h2><p>Conheça um caminho mais claro para organizar um agendamento.</p><AudioButton text="Bem-vindo ao AgendaMais+. Suas consultas médicas de um jeito mais simples. Esta demonstração mostra como seria a navegação." onRead={read} /></div>
    <div className="am-benefit-list">{["Agende suas consultas com facilidade.", "Veja orientações durante a navegação.", "Conheça lembretes dos seus agendamentos."].map((benefit, i) => <div className="am-benefit" key={benefit}><span>{i + 1}</span><p>{benefit}</p><AudioButton text={benefit} onRead={read} small /></div>)}</div>
    <NoticeBox read={read}>Modo de demonstração: não cria conta nem envia dados.</NoticeBox>
    <PrimaryButton onClick={() => go("login")} icon={<ArrowRight size={20} />}>Entrar</PrimaryButton><PrimaryButton onClick={() => go("register")} secondary> Criar minha conta (demonstração)</PrimaryButton>
  </ScreenFrame>;
}

function LoginScreen(ctx: AppContext) {
  const { go, read } = ctx;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); if (!email.includes("@")) { setMessage("Confira o formato do e-mail para continuar."); return; } if (!password) { setMessage("Digite uma senha de exemplo para avançar."); return; } go("home"); };
  return <ScreenFrame title="Entrar" description="Use qualquer e-mail de exemplo e uma senha. Nada será enviado ou guardado." ctx={ctx}><form className="am-form" onSubmit={submit}><Field label="E-mail" hint="Digite um e-mail apenas para testar o formulário." type="email" value={email} onChange={setEmail} read={read} placeholder="voce@exemplo.com" required /><Field label="Senha" hint="A senha existe apenas neste campo enquanto testa." type="password" value={password} onChange={setPassword} read={read} placeholder="Digite uma senha de exemplo" required />{message && <p className="am-form-message" role="alert">{message}</p>}<button className="am-button" type="submit"><ArrowRight size={20} /><span>Entrar na demonstração</span></button><button className="am-text-link" type="button" onClick={() => go("recovery")}>Esqueci minha senha</button><button className="am-text-link" type="button" onClick={() => go("register")}>Criar conta de demonstração</button></form><NoticeBox read={read}>Login local de demonstração. Nenhuma conta é verificada ou criada.</NoticeBox></ScreenFrame>;
}

function CadastroScreen(ctx: AppContext) {
  const { go, read } = ctx;
  const [values, setValues] = useState({ name: "", birth: "", email: "", phone: "", password: "", confirmation: "" });
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); if (!accepted) { setMessage("Marque o aceite demonstrativo para conhecer a próxima etapa."); return; } if (values.password && values.password !== values.confirmation) { setMessage("As senhas de exemplo não conferem."); return; } go("accessibility"); };
  return <ScreenFrame title="Criar conta" description="Preencha os campos apenas para experimentar. Os dados não são enviados nem salvos." ctx={ctx}><form className="am-form" onSubmit={submit}><Field label="Nome completo" hint="Campo de exemplo; fica apenas nesta tela." value={values.name} onChange={(name) => setValues({ ...values, name })} read={read} placeholder="Seu nome (opcional)" /><Field label="Data de nascimento" hint="Campo de exemplo; não será guardado." type="date" value={values.birth} onChange={(birth) => setValues({ ...values, birth })} read={read} /><Field label="E-mail" hint="Campo de exemplo, sem envio." type="email" value={values.email} onChange={(email) => setValues({ ...values, email })} read={read} placeholder="voce@exemplo.com" /><Field label="Telefone" hint="Campo de exemplo, sem envio." type="tel" value={values.phone} onChange={(phone) => setValues({ ...values, phone })} read={read} placeholder="(00) 00000-0000" /><Field label="Senha" hint="A senha não é salva nem transmitida." type="password" value={values.password} onChange={(password) => setValues({ ...values, password })} read={read} placeholder="Crie uma senha de exemplo" /><Field label="Confirmar senha" hint="Confirme apenas para experimentar o formulário." type="password" value={values.confirmation} onChange={(confirmation) => setValues({ ...values, confirmation })} read={read} placeholder="Repita a senha de exemplo" /><div className="am-check"><label><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>Li os termos e a política de privacidade para esta demonstração.</span></label><AudioButton text="Aceite demonstrativo de termos e privacidade. Nenhum dado será enviado." onRead={read} small /></div>{message && <p className="am-form-message" role="alert">{message}</p>}<button className="am-button" type="submit"><ArrowRight size={20} /><span>Continuar para acessibilidade</span></button></form><NoticeBox read={read}>Não cria conta. Campos são somente locais e não ficam salvos.</NoticeBox></ScreenFrame>;
}

function RecuperacaoScreen(ctx: AppContext) {
  const { go, read } = ctx;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return <ScreenFrame title="Recuperação de senha" description="Experimente o formulário sem enviar uma mensagem ou alterar uma senha." ctx={ctx}><Field label="E-mail" hint="Informe um texto de exemplo para testar a tela." type="email" value={email} onChange={setEmail} read={read} placeholder="voce@exemplo.com" /><PrimaryButton onClick={() => setSent(true)} icon={<Mail size={20} />}>Ver mensagem de confirmação</PrimaryButton>{sent && <NoticeBox read={read} tone="success">Esta é apenas uma confirmação visual. Nenhum e-mail foi enviado e nenhuma senha foi alterada.</NoticeBox>}<PrimaryButton onClick={() => go("login")} secondary>Voltar ao login</PrimaryButton></ScreenFrame>;
}

function ConfiguracaoInicialScreen({ ctx }: { ctx: AppContext }) {
  return <AccessibilityControls ctx={ctx} initial />;
}

function AccessibilityControls({ ctx, initial = false }: { ctx: AppContext; initial?: boolean }) {
  const { preferences: p, setPreferences, read } = ctx;
  const set = (patch: Partial<Preferences>) => setPreferences({ ...p, ...patch });
  return <ScreenFrame title={initial ? "Acessibilidade" : "Configurações"} description="Escolha preferências visuais. As mudanças são somente nesta demonstração." ctx={ctx}><section className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon"><Type size={23} /></span><div><h2>Tamanho da fonte</h2><p>Escolha o tamanho confortável.</p></div><AudioButton text="Tamanho da fonte. Selecione normal, grande ou extragrande. Preferência visual desta demonstração." onRead={read} small /></div><div className="am-choice-row">{(["normal", "grande", "extragrande"] as const).map((font) => <button key={font} className={p.font === font ? "chosen" : ""} type="button" onClick={() => set({ font })}>{font === "normal" ? "Normal" : font === "grande" ? "Grande" : "Extragrande"}</button>)}</div><p className="am-preview-text">Exemplo de texto confortável.</p></section>
    <PreferenceToggle icon={<Contrast size={22} />} title="Alto contraste" description="Aumenta o contraste da interface." active={p.contrast} onClick={() => set({ contrast: !p.contrast })} read={read} />
    <section className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon"><Volume2 size={22} /></span><div><h2>Velocidade da orientação</h2><p>Apenas preferência visual; sem voz real.</p></div><AudioButton text="Velocidade da orientação visual. Nenhum áudio real será reproduzido." onRead={read} small /></div><div className="am-choice-row">{(["lenta", "normal", "rápida"] as const).map((speed) => <button key={speed} className={p.speed === speed ? "chosen" : ""} type="button" onClick={() => set({ speed })}>{speed[0].toUpperCase() + speed.slice(1)}</button>)}</div></section>
    <PreferenceToggle icon={<Accessibility size={22} />} title="Orientação automática" description="Preferência visual, sem áudio automático." active={p.guidance} onClick={() => set({ guidance: !p.guidance })} read={read} />
    <PreferenceToggle icon={<Bell size={22} />} title="Lembretes" description="Preferência de lembretes da demonstração." active={p.reminders} onClick={() => set({ reminders: !p.reminders })} read={read} />
    <div className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon"><Clock3 size={22} /></span><div><h2>Antecedência</h2><p>Preferência demonstrativa.</p></div><AudioButton text="Escolha com quanta antecedência prefere receber lembretes. É somente visual." onRead={read} small /></div><select value={p.advance} onChange={(e) => set({ advance: e.target.value })}><option>1 dia antes</option><option>2 dias antes</option><option>No mesmo dia</option></select></div>
    <NoticeBox read={read}>Botão de teste: demonstração visual de leitura, sem áudio real.</NoticeBox><PrimaryButton onClick={() => read("Teste de voz. Simulação visual de leitura — sem áudio real.")} icon={<Volume2 size={20} />}>Testar voz (visual)</PrimaryButton>{initial && <PrimaryButton onClick={() => ctx.go("home")} secondary icon={<ArrowRight size={20} />}>Ir para a página inicial</PrimaryButton>}</ScreenFrame>;
}
function PreferenceToggle({ icon, title, description, active, onClick, read }: { icon: ReactNode; title: string; description: string; active: boolean; onClick: () => void; read: (text: string) => void }) {
  return <section className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon">{icon}</span><div><h2>{title}</h2><p>{description}</p></div><AudioButton text={`${title}. ${description} A preferência altera somente esta demonstração.`} onRead={read} small /></div><button type="button" className={`am-toggle${active ? " active" : ""}`} aria-pressed={active} onClick={onClick}><span>{active ? "Ativado" : "Desativado"}</span><span className="am-switch"><i /></span></button></section>;
}

function PaginaInicialScreen({ ctx }: { ctx: AppContext }) {
  const upcoming = ctx.booking?.status === "upcoming" ? ctx.booking : null;
  return <main className="am-screen am-home"><header className="am-home-header"><div><span className="am-wordmark">AgendaMais<span>+</span></span><p>Olá, {ctx.profile.name.split(" ")[0]}!</p></div><div className="am-home-actions"><button type="button" onClick={() => ctx.go("notifications")} aria-label="Abrir notificações"><Bell size={23} /></button><button type="button" onClick={() => ctx.go("profile")} aria-label="Abrir perfil"><UserRound size={23} /></button></div><AudioButton text={`Página inicial. Olá, ${ctx.profile.name}. Escolha uma área para conhecer.`} onRead={ctx.read} small /></header><div className="am-home-intro"><span className="am-round-icon"><Heart size={22} /></span><div><strong>Seu cuidado, no seu tempo.</strong><p>Vamos conhecer cada etapa juntos.</p></div><AudioButton text="Seu cuidado, no seu tempo. Vamos conhecer cada etapa juntos." onRead={ctx.read} small /></div><h1 className="am-section-heading">O que você gostaria de fazer?</h1><div className="am-feature-list"><FeatureCard title="Agendar consulta" description="Encontre uma especialidade e veja o fluxo" icon={<CalendarDays />} onClick={() => ctx.go("specialty")} read={ctx.read} /><FeatureCard title="Minhas consultas" description="Acompanhe registros desta demonstração" icon={<CalendarCheck />} onClick={() => ctx.go("appointments")} read={ctx.read} tint /><FeatureCard title="Especialidades" description="Conheça profissionais fictícios" icon={<Stethoscope />} onClick={() => ctx.go("specialty")} read={ctx.read} /><FeatureCard title="Consultas online" description="Veja a tela demonstrativa sem transmissão" icon={<Monitor />} onClick={() => ctx.go("online")} read={ctx.read} tint /></div>{upcoming ? <article className="am-next-card"><button type="button" className="am-next-main" onClick={() => { ctx.setSelectedBooking(upcoming); ctx.go("appointment-detail"); }}><span className="am-overline">PRÓXIMO REGISTRO · FICTÍCIO</span><strong>{upcoming.day} · {upcoming.time}</strong><span>{upcoming.specialty} · exemplo</span></button><AudioButton text={`Próximo registro fictício: ${upcoming.day}, às ${upcoming.time}, ${upcoming.specialty}. Não é uma consulta real.`} onRead={ctx.read} small /></article> : <div className="am-next-card empty"><span className="am-overline">SEU PRÓXIMO PASSO</span><strong>Conheça o agendamento</strong><span>Os registros são apenas exemplos locais.</span><AudioButton text="Conheça o fluxo de agendamento. Os registros são apenas exemplos locais." onRead={ctx.read} small /></div>}<NoticeBox read={ctx.read}>Nenhum serviço, profissional ou horário real está conectado.</NoticeBox></main>;
}

function BuscarEspecialidadeScreen({ ctx }: { ctx: AppContext }) {
  const [query, setQuery] = useState("");
  const filtered = specialties.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  return <ScreenFrame title="Buscar especialidade" description="Toque em uma área para ver um perfil profissional fictício." ctx={ctx}><div className="am-search"><Search size={21} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar especialidade" aria-label="Buscar especialidade" /><AudioButton text="Campo de busca. Digite o nome de uma especialidade para filtrar os exemplos." onRead={ctx.read} small /></div><NoticeBox read={ctx.read}>Especialidades ilustrativas, sem clínicas ou profissionais reais.</NoticeBox><div className="am-feature-list">{filtered.map((item, index) => <FeatureCard key={item} title={item} description="Especialidade ilustrativa · sem disponibilidade real" icon={<Stethoscope />} onClick={() => { ctx.setSpecialty(item); ctx.setDraft({ ...ctx.draft, specialty: item, provider: providers.find((provider) => provider.specialty === item)?.name ?? providers[0].name }); ctx.go("doctors"); }} read={ctx.read} tint={index % 2 === 1} />)}{filtered.length === 0 && <EmptyState title="Nenhuma especialidade encontrada" text="Tente buscar por outro termo." read={ctx.read} />}</div></ScreenFrame>;
}

function ListaMedicosScreen({ ctx }: { ctx: AppContext }) {
  const matching = providers.filter((p) => p.specialty === ctx.specialty);
  return <ScreenFrame title="Lista de profissionais" description={`Exemplos fictícios para ${ctx.specialty}. Nenhum perfil está disponível para atendimento.`} ctx={ctx}><NoticeBox read={ctx.read}>Todos os profissionais e locais desta tela são fictícios.</NoticeBox>{matching.map((provider) => <article className="am-doctor-card" key={provider.name}><div className="am-avatar"><UserRound size={30} /></div><div className="am-doctor-copy"><span className="am-overline">PERFIL FICTÍCIO</span><h2>{provider.name}</h2><p>{provider.specialty}</p><span>{provider.clinic}</span><span>Modalidades ilustrativas: presencial ou online</span></div><AudioButton text={`${provider.name}. ${provider.specialty}. ${provider.clinic}. Perfil fictício de demonstração.`} onRead={ctx.read} small /><PrimaryButton onClick={() => ctx.go("doctor")} icon={<ArrowRight size={19} />}>Ver horários de exemplo</PrimaryButton></article>)}<PrimaryButton onClick={() => ctx.go("specialty")} secondary>Trocar especialidade</PrimaryButton></ScreenFrame>;
}

function PerfilMedicoScreen({ ctx }: { ctx: AppContext }) {
  const provider = providers.find((item) => item.specialty === ctx.specialty) ?? providers[0];
  return <ScreenFrame title="Perfil do profissional" description="Dados fictícios para demonstrar a etapa de escolha." ctx={ctx}><div className="am-doctor-profile"><span className="am-avatar large"><UserRound size={40} /></span><span className="am-overline">PROFISSIONAL FICTÍCIO</span><h2>{provider.name}</h2><p>{provider.specialty}</p><AudioButton text={`${provider.name}, ${provider.specialty}. Perfil inteiramente fictício.`} onRead={ctx.read} /></div><div className="am-detail-list"><DetailRow icon={<Stethoscope />} label="Registro profissional" value="Não informado — perfil fictício" read={ctx.read} /><DetailRow icon={<MapPin />} label="Local" value="Local de atendimento ilustrativo" read={ctx.read} /><DetailRow icon={<Monitor />} label="Modalidades" value="Presencial ou online (demonstração)" read={ctx.read} /><DetailRow icon={<CalendarDays />} label="Dias e horários" value="Exemplos futuros, sem disponibilidade real" read={ctx.read} /></div><p className="am-helper">Escolha uma modalidade para seguir. Nenhuma opção oferece atendimento real.</p><div className="am-choice-row"><button className={ctx.draft.type === "presencial" ? "chosen" : ""} type="button" onClick={() => ctx.setDraft({ ...ctx.draft, type: "presencial" })}><MapPin size={17} /> Presencial</button><button className={ctx.draft.type === "online" ? "chosen" : ""} type="button" onClick={() => ctx.setDraft({ ...ctx.draft, type: "online" })}><Monitor size={17} /> Online</button></div><AudioButton text="Escolha presencial ou online para este exemplo. Nenhuma modalidade oferece atendimento." onRead={ctx.read} /><PrimaryButton onClick={() => ctx.go("schedule")} icon={<CalendarDays size={20} />}>Escolher horário ilustrativo</PrimaryButton></ScreenFrame>;
}

function EscolherDataHorarioScreen({ ctx }: { ctx: AppContext }) {
  const days = useMemo(() => makeFutureWeekdays(), []);
  return <ScreenFrame title="Escolher data e horário" description="Selecione um exemplo futuro para seguir pelo fluxo." ctx={ctx} step="ETAPA 2"><NoticeBox read={ctx.read} tone="warning">Datas e horários ilustrativos — não são disponibilidade real.</NoticeBox><p className="am-section-label">DIAS FUTUROS DE EXEMPLO</p><div className="am-day-list">{days.map((day) => <button key={day.full} type="button" className={`am-day${ctx.draft.day === day.full ? " selected" : ""}`} onClick={() => ctx.setDraft({ ...ctx.draft, day: day.full })} aria-pressed={ctx.draft.day === day.full}><span>{day.short}</span><strong>{day.label}</strong>{ctx.draft.day === day.full && <CheckCircle2 size={17} />}</button>)}</div><AudioButton text="Escolha um dia futuro de exemplo. Estes dias não correspondem à agenda real." onRead={ctx.read} /><div className="am-time-heading"><Clock3 size={20} /><strong>Horários de exemplo</strong><AudioButton text="Horários ilustrativos. Nenhum horário representa uma vaga real." onRead={ctx.read} small /></div><div className="am-time-grid">{times.map((time) => <button key={time} className={`am-time${ctx.draft.time === time ? " selected" : ""}`} type="button" onClick={() => ctx.setDraft({ ...ctx.draft, time })} aria-pressed={ctx.draft.time === time}>{time}{ctx.draft.time === time && <Check size={16} />}</button>)}</div><p className="am-helper">Modalidade: {typeLabel(ctx.draft.type)}</p><PrimaryButton disabled={!ctx.draft.day || !ctx.draft.time} onClick={() => ctx.go("confirmation")} icon={<ArrowRight size={20} />}>Continuar</PrimaryButton></ScreenFrame>;
}

function ConfirmarAgendamentoScreen({ ctx }: { ctx: AppContext }) {
  const provider = providers.find((item) => item.specialty === ctx.draft.specialty) ?? providers[0];
  return <ScreenFrame title="Confirmar agendamento" description="Revise os dados fictícios antes de criar um registro local." ctx={ctx} step="ETAPA 3"><div className="am-setting-card"><span className="am-overline">RESUMO DE DEMONSTRAÇÃO</span><DetailRow icon={<UserRound />} label="Profissional" value={provider.name} read={ctx.read} /><DetailRow icon={<Stethoscope />} label="Especialidade" value={ctx.draft.specialty} read={ctx.read} /><DetailRow icon={<CalendarDays />} label="Data" value={ctx.draft.day || "Escolha um dia"} read={ctx.read} /><DetailRow icon={<Clock3 />} label="Horário" value={ctx.draft.time || "Escolha um horário"} read={ctx.read} /><DetailRow icon={ctx.draft.type === "online" ? <Monitor /> : <MapPin />} label="Modalidade" value={typeLabel(ctx.draft.type)} read={ctx.read} /><DetailRow icon={<MapPin />} label="Local" value="Informação ilustrativa, sem endereço real" read={ctx.read} /></div><NoticeBox read={ctx.read}>Confirmar cria somente um registro fictício nesta demonstração. Não haverá consulta.</NoticeBox><PrimaryButton onClick={ctx.confirmBooking} icon={<Check size={20} />}>{ctx.rescheduling ? "Atualizar este agendamento" : "Confirmar demonstração"}</PrimaryButton><PrimaryButton onClick={() => ctx.go("schedule")} secondary>Voltar e alterar</PrimaryButton></ScreenFrame>;
}

function AgendamentoConfirmadoScreen({ ctx }: { ctx: AppContext }) {
  return <ScreenFrame title="Agendamento confirmado" description="O registro foi adicionado apenas à demonstração." ctx={ctx}><div className="am-success-panel"><span className="am-success-mark"><Check size={35} /></span><span className="am-overline">REGISTRO FICTÍCIO CRIADO</span><h2>Etapa concluída.</h2><p>Este exemplo não representa uma consulta real nem atendimento agendado.</p><AudioButton text="Etapa concluída. Um registro fictício foi criado apenas nesta demonstração. Não há atendimento agendado." onRead={ctx.read} /></div>{ctx.booking && <div className="am-setting-card"><DetailRow icon={<CalendarDays />} label="Data e horário ilustrativos" value={`${ctx.booking.day} · ${ctx.booking.time}`} read={ctx.read} /><DetailRow icon={<Stethoscope />} label="Especialidade fictícia" value={ctx.booking.specialty} read={ctx.read} /><DetailRow icon={<Monitor />} label="Modalidade" value={typeLabel(ctx.booking.type)} read={ctx.read} /></div>}<PrimaryButton onClick={() => ctx.go("appointments")} icon={<CalendarDays size={20} />}>Ver minhas consultas</PrimaryButton><PrimaryButton onClick={() => ctx.go("home")} secondary icon={<Home size={19} />}>Voltar ao início</PrimaryButton></ScreenFrame>;
}

function MinhasConsultasScreen({ ctx }: { ctx: AppContext }) {
  const [tab, setTab] = useState<BookingStatus>("upcoming");
  const lists: Record<BookingStatus, Booking[]> = { upcoming: ctx.booking?.status === "upcoming" ? [ctx.booking] : [], completed: [], cancelled: ctx.booking?.status === "cancelled" ? [ctx.booking] : [] };
  const titles: Record<BookingStatus, string> = { upcoming: "Próximas", completed: "Realizadas", cancelled: "Canceladas" };
  const items = lists[tab];
  return <ScreenFrame title="Minhas consultas" description="Categorias de registros fictícios desta demonstração." ctx={ctx}><div className="am-tabs" role="tablist">{(["upcoming", "completed", "cancelled"] as const).map((item) => <button type="button" key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)} role="tab" aria-selected={tab === item}>{titles[item]}</button>)}</div><AudioButton text={`Categoria ${titles[tab]}. Registros desta tela são apenas exemplos fictícios.`} onRead={ctx.read} /><div className="am-list">{items.map((item) => <article className="am-appointment-row" key={item.id}><button type="button" className="am-appointment-main" onClick={() => { ctx.setSelectedBooking(item); ctx.go("appointment-detail"); }}><span className="am-date-chip"><CalendarDays size={20} /><strong>{item.day.split(",")[0]}</strong><small>{item.time}</small></span><span className="am-appointment-copy"><strong>{item.specialty}</strong><span>{item.provider}</span><small>{item.status === "upcoming" ? "Próxima · fictícia" : "Cancelada · fictícia"}</small></span><ChevronRight size={20} /></button><AudioButton text={`Registro fictício. ${item.specialty}, ${item.day}, ${item.time}. Toque para abrir detalhes.`} onRead={ctx.read} small /></article>)}{items.length === 0 && <EmptyState title={tab === "upcoming" ? "Nenhuma próxima consulta" : tab === "completed" ? "Nenhuma consulta realizada" : "Nenhuma consulta cancelada"} text={tab === "completed" ? "Não houve atendimento nesta demonstração." : "Quando houver registros de exemplo, eles aparecerão nesta categoria."} read={ctx.read} />}</div>{tab === "upcoming" && <PrimaryButton onClick={() => ctx.go("specialty")} icon={<Plus size={20} />}>Conhecer o agendamento</PrimaryButton>}<NoticeBox read={ctx.read}>Não houve atendimento médico nesta demonstração.</NoticeBox></ScreenFrame>;
}

function DetalhesConsultaScreen({ ctx }: { ctx: AppContext }) {
  const [showCancel, setShowCancel] = useState(false);
  const item = ctx.selectedBooking;
  return <ScreenFrame title="Detalhes da consulta" description="Informações do registro demonstrativo selecionado." ctx={ctx}><div className="am-setting-card"><span className="am-overline">REGISTRO FICTÍCIO</span><DetailRow icon={<UserRound />} label="Profissional" value={item.provider} read={ctx.read} /><DetailRow icon={<Stethoscope />} label="Especialidade" value={item.specialty} read={ctx.read} /><DetailRow icon={<CalendarDays />} label="Data" value={item.day} read={ctx.read} /><DetailRow icon={<Clock3 />} label="Horário" value={item.time} read={ctx.read} /><DetailRow icon={<Monitor />} label="Modalidade" value={typeLabel(item.type)} read={ctx.read} /><DetailRow icon={<CheckCircle2 />} label="Situação" value={item.status === "cancelled" ? "Cancelada (demonstração)" : "Próxima (demonstração)"} read={ctx.read} /></div><AudioButton text={`Detalhes do registro fictício: ${item.specialty}, ${item.day}, às ${item.time}. Não é uma consulta real.`} onRead={ctx.read} /><NoticeBox read={ctx.read}>Nenhuma consulta ou cuidado médico ocorreu.</NoticeBox>{item.status === "upcoming" && <><PrimaryButton onClick={ctx.beginReschedule} icon={<RotateCcw size={19} />}>Reagendar este registro</PrimaryButton><PrimaryButton onClick={() => setShowCancel(true)} secondary icon={<Trash2 size={19} />}>Cancelar registro</PrimaryButton></>}{item.status === "cancelled" && <p className="am-helper">Este registro demonstrativo já está cancelado.</p>}{showCancel && <div className="am-modal-backdrop" role="presentation"><section className="am-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cancel-title"><button type="button" className="am-dialog-close" onClick={() => setShowCancel(false)} aria-label="Fechar"><X size={22} /></button><span className="am-feature-icon"><CircleHelp size={24} /></span><h2 id="cancel-title">Cancelar este exemplo?</h2><p>O registro será movido para a categoria Canceladas. Nenhum serviço real será alterado.</p><AudioButton text="Confirme se deseja cancelar este registro fictício. Nenhum serviço real será alterado." onRead={ctx.read} /><PrimaryButton onClick={() => { ctx.cancelBooking(); setShowCancel(false); }}>Sim, cancelar registro</PrimaryButton><PrimaryButton secondary onClick={() => setShowCancel(false)}>Manter registro</PrimaryButton></section></div>}</ScreenFrame>;
}

function ConsultasOnlineScreen({ ctx }: { ctx: AppContext }) {
  const onlineBooking = ctx.booking?.type === "online" && ctx.booking.status === "upcoming" ? ctx.booking : null;
  return <ScreenFrame title="Consultas online" description="Conheça a área de chamada. Não existe transmissão nem atendimento." ctx={ctx}><div className="am-call-stage"><span className="am-avatar large"><UserRound size={42} /></span><h2>{ctx.inCall ? "Demonstração visual em andamento" : "Sala de demonstração"}</h2><p>Sem câmera, microfone, vídeo ou áudio real.</p><AudioButton text="Sala visual de demonstração. Nenhuma consulta está acontecendo e não há transmissão de vídeo ou áudio." onRead={ctx.read} /></div>{onlineBooking ? <div className="am-setting-card"><span className="am-overline">AGENDAMENTO FICTÍCIO</span><strong>{onlineBooking.specialty} · {onlineBooking.day} · {onlineBooking.time}</strong><AudioButton text={`Registro fictício de ${onlineBooking.specialty}, ${onlineBooking.day}, ${onlineBooking.time}. Não representa consulta real.`} onRead={ctx.read} small /></div> : <EmptyState title="Nenhum exemplo online próximo" text="Você pode conhecer a tela sem criar qualquer registro." read={ctx.read} />}<NoticeBox read={ctx.read}>Não há consulta acontecendo nesta tela, mesmo quando a demonstração está iniciada.</NoticeBox>{ctx.inCall ? <PrimaryButton onClick={() => ctx.setInCall(false)} secondary icon={<PhoneOff size={20} />}>Encerrar demonstração</PrimaryButton> : <PrimaryButton onClick={() => ctx.setInCall(true)} icon={<Monitor size={20} />}>Iniciar demonstração visual</PrimaryButton>}</ScreenFrame>;
}

function NotificacoesScreen({ ctx }: { ctx: AppContext }) {
  const markRead = (id: string) => ctx.setNotices(ctx.notices.map((notice) => notice.id === id ? { ...notice, read: true } : notice));
  return <ScreenFrame title="Notificações e lembretes" description="Mensagens ilustrativas. Não são avisos enviados por um serviço." ctx={ctx}><NoticeBox read={ctx.read}>Avisos locais e fictícios; nenhum serviço externo está conectado.</NoticeBox>{ctx.notices.length ? <div className="am-notice-list">{ctx.notices.map((notice) => <article className={`am-notification${notice.read ? " read" : ""}`} key={notice.id}><div className="am-notification-top"><span className="am-notification-icon"><Bell size={20} /></span><span className="am-notification-title">{notice.title}</span>{!notice.read && <span className="am-unread">Não lida</span>}</div><p>{notice.body}</p><div className="am-notification-bottom"><span>{notice.date} · exemplo</span><AudioButton text={`${notice.title}. ${notice.body} Aviso demonstrativo, sem envio real.`} onRead={ctx.read} small /></div>{!notice.read && <button type="button" className="am-text-link left" onClick={() => markRead(notice.id)}><CheckCheck size={17} /> Marcar como lida</button>}</article>)}</div> : <EmptyState title="Tudo em dia" text="Não há avisos nesta demonstração." read={ctx.read} />}<PrimaryButton secondary onClick={() => ctx.setNotices(ctx.notices.map((notice) => ({ ...notice, read: true })))} icon={<CheckCheck size={19} />}>Marcar todas como lidas</PrimaryButton></ScreenFrame>;
}

function PerfilUsuarioScreen({ ctx }: { ctx: AppContext }) {
  return <ScreenFrame title="Perfil do usuário" description="Perfil local e fictício. Não é uma conta conectada." ctx={ctx}><div className="am-profile-banner"><span className="am-avatar large"><UserRound size={40} /></span><div><span className="am-overline">PERFIL DE DEMONSTRAÇÃO</span><h2>{ctx.profile.name}</h2></div><AudioButton text={`Perfil de demonstração. ${ctx.profile.name}. Dados não conectados a uma conta real.`} onRead={ctx.read} small /></div><div className="am-detail-list"><DetailRow icon={<Mail />} label="E-mail" value={ctx.profile.email} read={ctx.read} /><DetailRow icon={<Phone />} label="Telefone" value={ctx.profile.phone} read={ctx.read} /><DetailRow icon={<CalendarDays />} label="Nascimento" value={ctx.profile.birth} read={ctx.read} /></div><PrimaryButton onClick={() => ctx.go("edit-profile")} icon={<Pencil size={19} />}>Editar meus dados</PrimaryButton><FeatureCard title="Configurações" description="Acessibilidade, lembretes e demonstração" icon={<Settings />} onClick={() => ctx.go("settings")} read={ctx.read} tint /><FeatureCard title="Ajuda e suporte" description="Perguntas frequentes e sugestões locais" icon={<HelpCircle />} onClick={() => ctx.go("help")} read={ctx.read} /><FeatureCard title="Sobre o AgendaMais+" description="Objetivos e integrantes do projeto" icon={<Info />} onClick={() => ctx.go("about")} read={ctx.read} tint /><PrimaryButton secondary onClick={() => ctx.go("welcome")} icon={<LogOut size={19} />}>Sair da demonstração</PrimaryButton></ScreenFrame>;
}

function EditarDadosScreen({ ctx }: { ctx: AppContext }) {
  const [draft, setDraft] = useState(ctx.profile);
  const [saved, setSaved] = useState(false);
  return <ScreenFrame title="Editar dados pessoais" description="Alterações ficam somente na memória desta demonstração." ctx={ctx}><div className="am-form"><Field label="Nome" hint="Atualize o nome demonstrativo." value={draft.name} onChange={(name) => setDraft({ ...draft, name })} read={ctx.read} /><Field label="Telefone" hint="O telefone não será salvo após fechar." type="tel" value={draft.phone} onChange={(phone) => setDraft({ ...draft, phone })} read={ctx.read} placeholder="Não informado" /><Field label="E-mail" hint="E-mail de demonstração, sem verificação." type="email" value={draft.email} onChange={(email) => setDraft({ ...draft, email })} read={ctx.read} /><p className="am-helper">Foto e data de nascimento não são coletadas nem alteradas nesta tela.</p><PrimaryButton onClick={() => { ctx.setProfile(draft); setSaved(true); }} icon={<Check size={19} />}>Salvar nesta demonstração</PrimaryButton><PrimaryButton onClick={() => ctx.go("profile")} secondary>Cancelar</PrimaryButton>{saved && <NoticeBox read={ctx.read} tone="success">Alterações atualizadas somente na memória desta demonstração.</NoticeBox>}</div></ScreenFrame>;
}

function ConfiguracoesScreen({ ctx }: { ctx: AppContext }) {
  const [showReset, setShowReset] = useState(false);
  return <ScreenFrame title="Configurações" description="Preferências e registros fictícios salvos apenas neste navegador." ctx={ctx}><AccessibilityControlsInline ctx={ctx} /><section className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon"><ShieldCheck size={22} /></span><div><h2>Conta e privacidade</h2><p>Não há conta real conectada.</p></div><AudioButton text="Conta e privacidade. Login e cadastro não criam conta nem enviam dados." onRead={ctx.read} small /></div><p className="am-setting-note">Senha, e-mail, telefone e nascimento não são armazenados. Não coletamos informações de saúde.</p><PrimaryButton secondary onClick={() => ctx.read("Alterar senha está indisponível nesta demonstração. Nenhuma senha real existe ou será alterada.")}>Alterar senha (visual)</PrimaryButton><PrimaryButton secondary onClick={() => ctx.read("Solicitar exclusão de conta está indisponível: esta demonstração não cria uma conta.")}>Solicitar exclusão (visual)</PrimaryButton><PrimaryButton secondary onClick={() => ctx.read("Política de privacidade e termos. Este protótipo não coleta nem transmite seus dados.")}>Privacidade e termos (visual)</PrimaryButton></section><section className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon"><Info size={22} /></span><div><h2>Aplicativo</h2><p>AgendaMais+ · versão demonstrativa</p></div><AudioButton text="AgendaMais+, versão demonstrativa. Protótipo acadêmico." onRead={ctx.read} small /></div><PrimaryButton secondary onClick={() => ctx.go("about")}>Sobre o AgendaMais+</PrimaryButton></section><PrimaryButton secondary onClick={() => ctx.go("welcome")} icon={<LogOut size={19} />}>Sair da demonstração</PrimaryButton><PrimaryButton secondary onClick={() => setShowReset(true)} icon={<RotateCcw size={19} />}>Redefinir demonstração</PrimaryButton>{showReset && <div className="am-modal-backdrop"><section className="am-dialog" role="alertdialog" aria-modal="true"><button className="am-dialog-close" type="button" onClick={() => setShowReset(false)} aria-label="Fechar"><X size={21} /></button><h2>Redefinir os exemplos?</h2><p>Os registros e preferências fictícias serão reiniciados.</p><AudioButton text="Redefinir registros e preferências de demonstração salvos neste navegador." onRead={ctx.read} /><PrimaryButton onClick={() => { ctx.resetDemo(); setShowReset(false); }}>Redefinir agora</PrimaryButton><PrimaryButton secondary onClick={() => setShowReset(false)}>Manter como está</PrimaryButton></section></div>}</ScreenFrame>;
}
function AccessibilityControlsInline({ ctx }: { ctx: AppContext }) {
  const p = ctx.preferences;
  const set = (patch: Partial<Preferences>) => ctx.setPreferences({ ...p, ...patch });
  return <><section className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon"><Type size={22} /></span><div><h2>Tamanho do texto</h2><p>Normal, grande ou extragrande.</p></div><AudioButton text="Ajuste do tamanho do texto. Preferência visual." onRead={ctx.read} small /></div><div className="am-choice-row">{(["normal", "grande", "extragrande"] as const).map((font) => <button type="button" key={font} className={p.font === font ? "chosen" : ""} onClick={() => set({ font })}>{font}</button>)}</div></section><PreferenceToggle icon={<Contrast size={22} />} title="Alto contraste" description="Realça bordas e texto." active={p.contrast} onClick={() => set({ contrast: !p.contrast })} read={ctx.read} /><section className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon"><Volume2 size={22} /></span><div><h2>Velocidade da voz</h2><p>Preferência visual, sem áudio real.</p></div><AudioButton text="Velocidade da voz altera somente a preferência visual. Sem áudio real." onRead={ctx.read} small /></div><div className="am-choice-row">{(["lenta", "normal", "rápida"] as const).map((speed) => <button type="button" className={p.speed === speed ? "chosen" : ""} key={speed} onClick={() => set({ speed })}>{speed}</button>)}</div></section><PreferenceToggle icon={<Accessibility size={22} />} title="Orientação automática" description="Simulação visual, sem reprodução automática." active={p.guidance} onClick={() => set({ guidance: !p.guidance })} read={ctx.read} /><PreferenceToggle icon={<Bell size={22} />} title="Lembretes" description="Preferência local da demonstração." active={p.reminders} onClick={() => set({ reminders: !p.reminders })} read={ctx.read} /><section className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon"><Clock3 size={22} /></span><div><h2>Antecedência dos lembretes</h2><p>Escolha uma preferência de exemplo.</p></div><AudioButton text="Antecedência dos lembretes. Esta escolha é uma preferência visual local." onRead={ctx.read} small /></div><select value={p.advance} onChange={(event) => set({ advance: event.target.value })}><option>1 dia antes</option><option>2 dias antes</option><option>No mesmo dia</option></select></section><PrimaryButton onClick={() => ctx.read("Teste de voz. Simulação visual de leitura — sem áudio real.")} icon={<Volume2 size={19} />}>Testar voz (visual)</PrimaryButton><NoticeBox read={ctx.read}>{ctx.storageAvailable ? "Agendamento fictício, avisos e preferências ficam salvos somente neste navegador. Nada é enviado a um servidor." : "O navegador não permitiu salvar; os dados ficam somente nesta sessão."}</NoticeBox></>;
}

function AjudaSuporteScreen({ ctx }: { ctx: AppContext }) {
  const [open, setOpen] = useState<number | null>(0);
  const [sent, setSent] = useState(false);
  const faqs = [
    ["Como conhecer um agendamento?", "Na página inicial, toque em Agendar consulta e avance pelas especialidades fictícias, datas e horários de exemplo."],
    ["Como cancelar um registro?", "Abra Minhas consultas, selecione o registro futuro e toque em Cancelar. Uma confirmação será exibida."],
    ["Como usar o botão de leitura?", "Toque no alto-falante para ver o texto em uma janela. É uma simulação visual, sem áudio real."],
    ["Como alterar minha senha?", "A recuperação é somente visual. Nenhum e-mail é enviado e nenhuma senha é alterada."],
    ["Como acessar uma consulta online?", "Consultas Online mostra uma sala ilustrativa. Não há vídeo, áudio ou atendimento."],
  ];
  return <ScreenFrame title="Ajuda e suporte" description="Respostas simples para navegar nesta demonstração." ctx={ctx}><div className="am-faq-list">{faqs.map(([question, answer], index) => <section className="am-faq" key={question}><div className="am-faq-head"><button className="am-faq-toggle" type="button" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}><strong>{question}</strong><ChevronDown size={20} /></button><AudioButton text={`${question} ${answer}`} onRead={ctx.read} small /></div>{open === index && <div className="am-faq-answer"><p>{answer}</p><AudioButton text={answer} onRead={ctx.read} small /></div>}</section>)}</div><section className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon"><MessageSquare size={22} /></span><div><h2>Sugestão local</h2><p>Nada será enviado.</p></div><AudioButton text="Sugestão local. Escreva um comentário para experimentar o formulário; não será enviado." onRead={ctx.read} small /></div><textarea className="am-textarea" placeholder="Escreva uma sugestão (opcional)" aria-label="Sugestão local" /><PrimaryButton onClick={() => setSent(true)} icon={<Check size={19} />}>Confirmar sugestão local</PrimaryButton>{sent && <NoticeBox read={ctx.read} tone="success">Obrigado. Sua sugestão foi confirmada apenas nesta tela; nada foi enviado.</NoticeBox>}</section></ScreenFrame>;
}

function SobreAgendaMaisScreen({ ctx }: { ctx: AppContext }) {
  const objectives = ["Facilitar o acesso aos serviços de saúde.", "Promover inclusão digital.", "Reduzir dificuldades na utilização de aplicativos.", "Oferecer orientação por áudio.", "Incentivar a autonomia dos usuários."];
  return <ScreenFrame title="Sobre o AgendaMais+" description="Uma proposta acadêmica, apresentada em modo de demonstração." ctx={ctx}><div className="am-about-brand"><span className="am-about-mark"><CalendarCheck size={35} /></span><span className="am-wordmark">AgendaMais<span>+</span></span><AudioButton text="AgendaMais+. Proposta de plataforma digital com foco em acessibilidade, simplicidade e autonomia." onRead={ctx.read} /></div><p className="am-about-copy">O AgendaMais+ é uma proposta de plataforma digital desenvolvida para facilitar o agendamento e acompanhamento de consultas médicas, priorizando a acessibilidade, a simplicidade e a autonomia de pessoas idosas.</p><AudioButton text="O AgendaMais+ é uma proposta de plataforma digital desenvolvida para facilitar o agendamento e acompanhamento de consultas médicas, priorizando a acessibilidade, a simplicidade e a autonomia de pessoas idosas." onRead={ctx.read} /><section className="am-setting-card"><div className="am-setting-title"><span className="am-feature-icon"><Heart size={22} /></span><div><h2>Objetivos do projeto</h2><p>Uma experiência fácil de acompanhar.</p></div><AudioButton text="Objetivos do projeto AgendaMais+." onRead={ctx.read} small /></div>{objectives.map((objective) => <div className="am-objective" key={objective}><CheckCircle2 size={19} /><span>{objective}</span><AudioButton text={objective} onRead={ctx.read} small /></div>)}</section><div className="am-team-card"><span className="am-overline">INTEGRANTES DO PROJETO</span><p>Vitor <span>·</span> Francielle</p><AudioButton text="Integrantes do projeto: Vitor e Francielle." onRead={ctx.read} small /></div><NoticeBox read={ctx.read}>Protótipo acadêmico. Não oferece atendimento médico.</NoticeBox></ScreenFrame>;
}

function DetailRow({ icon, label, value, read }: { icon: ReactNode; label: string; value: string; read: (text: string) => void }) {
  return <div className="am-detail-row"><span className="am-detail-icon">{icon}</span><span className="am-detail-copy"><small>{label}</small><strong>{value}</strong></span><AudioButton text={`${label}: ${value}. Informação ilustrativa.`} onRead={read} small /></div>;
}
function EmptyState({ title, text, read }: { title: string; text: string; read: (text: string) => void }) {
  return <div className="am-empty-state"><span className="am-empty-icon"><CalendarDays size={29} /></span><h2>{title}</h2><p>{text}</p><AudioButton text={`${title}. ${text}`} onRead={read} /></div>;
}

const defaultPreferences: Preferences = { font: "normal", contrast: false, speed: "normal", guidance: false, reminders: true, advance: "1 dia antes" };
const blankProfile: Profile = { name: "Pessoa usuária de demonstração", email: "Não informado nesta demonstração", phone: "Não informado nesta demonstração", birth: "Não informado nesta demonstração" };
const initialNotices: Notice[] = [
  { id: "demo-welcome", title: "Aviso de demonstração", body: "Este mural mostra exemplos de notificações. Nenhuma mensagem foi enviada.", date: "Agora · exemplo", read: false },
  { id: "demo-reminder", title: "Exemplo de lembrete", body: "Um lembrete ilustrativo poderia aparecer aqui, sem representar um agendamento real.", date: "Exemplo local", read: true },
];
const demoStorageKey = "agendamaist-plus-demo-v1";

function readDemoSnapshot(): DemoStorageRead {
  try {
    const raw = window.localStorage.getItem(demoStorageKey);
    if (!raw) return { snapshot: null, available: true };
    const stored = JSON.parse(raw) as Partial<DemoSnapshot>;
    const booking = stored.booking;
    const validBooking = booking === null || (
      typeof booking === "object" &&
      typeof booking.id === "string" &&
      typeof booking.specialty === "string" &&
      typeof booking.provider === "string" &&
      typeof booking.day === "string" &&
      typeof booking.time === "string" &&
      (booking.type === "online" || booking.type === "presencial") &&
      (booking.status === "upcoming" || booking.status === "completed" || booking.status === "cancelled")
    );
    const preferences = stored.preferences;
    const validPreferences = !!preferences &&
      (preferences.font === "normal" || preferences.font === "grande" || preferences.font === "extragrande") &&
      typeof preferences.contrast === "boolean" &&
      (preferences.speed === "lenta" || preferences.speed === "normal" || preferences.speed === "rápida") &&
      typeof preferences.guidance === "boolean" &&
      typeof preferences.reminders === "boolean" &&
      typeof preferences.advance === "string";
    const validNotices = Array.isArray(stored.notices) && stored.notices.every((notice) =>
      notice &&
      typeof notice.id === "string" &&
      typeof notice.title === "string" &&
      typeof notice.body === "string" &&
      typeof notice.date === "string" &&
      typeof notice.read === "boolean"
    );

    return {
      snapshot: {
        booking: validBooking ? booking ?? null : null,
        preferences: validPreferences ? preferences : defaultPreferences,
        notices: validNotices ? stored.notices ?? initialNotices : initialNotices,
      },
      available: true,
    };
  } catch {
    return { snapshot: null, available: false };
  }
}

const screenNames: Record<ScreenId, string> = {
  opening: "Abertura", welcome: "Boas-vindas", login: "Login", register: "Cadastro", recovery: "Recuperação de Senha",
  accessibility: "Configuração Inicial de Acessibilidade", home: "Página Inicial", specialty: "Buscar Especialidade",
  doctors: "Lista de Médicos", doctor: "Perfil do Médico", schedule: "Escolher Data e Horário",
  confirmation: "Confirmar Agendamento", success: "Agendamento Confirmado", appointments: "Minhas Consultas",
  "appointment-detail": "Detalhes da Consulta", online: "Consultas Online", notifications: "Notificações e Lembretes",
  profile: "Perfil do Usuário", "edit-profile": "Editar Dados Pessoais", settings: "Configurações",
  help: "Ajuda e Suporte", about: "Sobre o AgendaMais+",
};

export function AgendaMais() {
  const [screen, setScreen] = useState<ScreenId>("opening");
  const [history, setHistory] = useState<ScreenId[]>([]);
  const [activeReading, setActiveReading] = useState("");
  const [initialDemo] = useState(readDemoSnapshot);
  const [booking, setBooking] = useState<Booking | null>(initialDemo.snapshot?.booking ?? null);
  const [draft, setDraft] = useState<Booking>({ id: "", specialty: specialties[0], provider: providers[0].name, day: "", time: "", type: "online", status: "upcoming" });
  const [specialty, setSpecialty] = useState(specialties[0]);
  const [profile, setProfile] = useState(blankProfile);
  const [preferences, setPreferences] = useState(initialDemo.snapshot?.preferences ?? defaultPreferences);
  const [notices, setNotices] = useState(initialDemo.snapshot?.notices ?? initialNotices);
  const [storageAvailable, setStorageAvailable] = useState(initialDemo.available);
  const [selectedBooking, setSelectedBooking] = useState<Booking>({ id: "", specialty: specialties[0], provider: providers[0].name, day: "Exemplo sem data real", time: "—", type: "online", status: "upcoming" });
  const [rescheduling, setRescheduling] = useState(false);
  const [inCall, setInCall] = useState(false);
  const go = (next: ScreenId) => { setHistory((items) => [...items, screen]); setScreen(next); setActiveReading(""); };
  const back = () => { const prior = history[history.length - 1] ?? "home"; setHistory((items) => items.slice(0, -1)); setScreen(prior); setActiveReading(""); };
  const confirmBooking = () => {
    const next: Booking = { ...draft, id: rescheduling && booking ? booking.id : `demo-${Date.now()}`, specialty, provider: providers.find((item) => item.specialty === specialty)?.name ?? providers[0].name, status: "upcoming" };
    setBooking(next); setSelectedBooking(next); setRescheduling(false); setInCall(false);
    setNotices((items) => [{ id: `notice-${Date.now()}`, title: rescheduling ? "Exemplo de reagendamento" : "Exemplo de registro criado", body: "Uma atualização local foi feita nesta demonstração. Nenhuma consulta real foi agendada.", date: "Agora · exemplo", read: false }, ...items]);
    go("success");
  };
  const beginReschedule = () => {
    if (!booking) return;
    setSpecialty(booking.specialty); setDraft({ ...booking, day: "", time: "" }); setRescheduling(true); go("schedule");
  };
  const cancelBooking = () => {
    if (!booking) return;
    const cancelled = { ...booking, status: "cancelled" as const };
    setBooking(cancelled); setSelectedBooking(cancelled);
    setNotices((items) => [{ id: `cancel-${Date.now()}`, title: "Exemplo de cancelamento", body: "O registro fictício foi movido para Canceladas. Nenhum serviço foi alterado.", date: "Agora · exemplo", read: false }, ...items]);
  };
  const resetDemo = () => { setBooking(null); setDraft({ id: "", specialty: specialties[0], provider: providers[0].name, day: "", time: "", type: "online", status: "upcoming" }); setProfile(blankProfile); setPreferences(defaultPreferences); setNotices(initialNotices); setHistory([]); setScreen("opening"); };
  useEffect(() => {
    try {
      window.localStorage.setItem(demoStorageKey, JSON.stringify({ booking, preferences, notices } satisfies DemoSnapshot));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [booking, preferences, notices]);
  const ctx: AppContext = { go, back, read: setActiveReading, booking, draft, setDraft, specialty, setSpecialty, profile, setProfile, preferences, setPreferences, notices, setNotices, storageAvailable, selectedBooking, setSelectedBooking, confirmBooking, beginReschedule, rescheduling, setRescheduling, cancelBooking, inCall, setInCall, resetDemo };
  const mainNav = screen === "home" ? "home" : screen === "appointments" ? "appointments" : screen === "notifications" ? "notifications" : screen === "profile" ? "profile" : null;
  const view: Record<ScreenId, ReactNode> = {
    opening: <AberturaScreen {...ctx} />,
    welcome: <BoasVindasScreen {...ctx} />,
    login: <LoginScreen {...ctx} />,
    register: <CadastroScreen {...ctx} />,
    recovery: <RecuperacaoScreen {...ctx} />,
    accessibility: <ConfiguracaoInicialScreen ctx={ctx} />,
    home: <PaginaInicialScreen ctx={ctx} />,
    specialty: <BuscarEspecialidadeScreen ctx={ctx} />,
    doctors: <ListaMedicosScreen ctx={ctx} />,
    doctor: <PerfilMedicoScreen ctx={ctx} />,
    schedule: <EscolherDataHorarioScreen ctx={ctx} />,
    confirmation: <ConfirmarAgendamentoScreen ctx={ctx} />,
    success: <AgendamentoConfirmadoScreen ctx={ctx} />,
    appointments: <MinhasConsultasScreen ctx={ctx} />,
    "appointment-detail": <DetalhesConsultaScreen ctx={ctx} />,
    online: <ConsultasOnlineScreen ctx={ctx} />,
    notifications: <NotificacoesScreen ctx={ctx} />,
    profile: <PerfilUsuarioScreen ctx={ctx} />,
    "edit-profile": <EditarDadosScreen ctx={ctx} />,
    settings: <ConfiguracoesScreen ctx={ctx} />,
    help: <AjudaSuporteScreen ctx={ctx} />,
    about: <SobreAgendaMaisScreen ctx={ctx} />,
  };
  return <div className={`agendamais-app${preferences.contrast ? " am-high-contrast" : ""}`} style={{ "--am-scale": preferences.font === "normal" ? 1 : preferences.font === "grande" ? 1.12 : 1.24 } as CSSProperties}><style>{styles}</style><div className="am-phone"><div className={`am-app-scroll${mainNav ? " has-nav" : ""}`} key={screen} aria-label={screenNames[screen]}>{view[screen]}</div>{mainNav && <BottomNav active={mainNav} go={go} read={setActiveReading} />}{activeReading && <div className="am-reading-demo" role="status" aria-live="polite"><div className="am-reading-heading"><Volume2 size={21} /><strong>Leitura demonstrativa</strong><button type="button" onClick={() => setActiveReading("")} aria-label="Parar leitura"><X size={21} /></button></div><p>{activeReading}</p><span>Simulação visual de leitura — sem áudio real</span><button type="button" className="am-stop-reading" onClick={() => setActiveReading("")}>Parar leitura</button></div>}<div className="am-persistent-note"><span />Demonstração · dados fictícios · sem áudio real</div></div></div>;
}

const styles = `
.agendamais-app{--am-purple:#35145F;--am-mid:#65439B;--am-lilac:#B69CE5;--am-soft:#F2ECFA;--am-ink:#261A33;--am-muted:#62576D;--am-line:#E4D9EF;--am-paper:#FFFEFF;--am-green:#27845D;--am-red:#A72F3D;min-height:100dvh;background:#EDE7F4;color:var(--am-ink);font-family:"Atkinson Hyperlegible","Nunito Sans",system-ui,sans-serif;font-size:calc(16px * var(--am-scale,1));line-height:1.45;display:flex;justify-content:center;box-sizing:border-box}
.agendamais-app *{box-sizing:border-box}
.agendamais-app button,.agendamais-app input,.agendamais-app textarea,.agendamais-app select{font:inherit}
.agendamais-app button{color:inherit}
.agendamais-app button:focus-visible,.agendamais-app input:focus-visible,.agendamais-app textarea:focus-visible,.agendamais-app select:focus-visible{outline:3px solid #8C6BC0;outline-offset:3px}
.am-phone{position:relative;width:100%;max-width:480px;min-height:100dvh;background:var(--am-paper);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 12px 52px rgba(53,20,95,.1)}
.am-app-scroll{flex:1;overflow-y:auto;min-height:100dvh;padding-bottom:46px;scrollbar-width:thin;scrollbar-color:#C7B4DF transparent;animation:am-enter .24s ease-out}
.am-app-scroll.has-nav{padding-bottom:122px}
@keyframes am-enter{from{opacity:.82;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.am-persistent-note{position:absolute;bottom:0;left:0;right:0;min-height:34px;display:flex;align-items:center;justify-content:center;gap:8px;background:#F2ECFA;border-top:1px solid var(--am-line);color:#443254;font-size:.72em;font-weight:700;z-index:6}
.am-persistent-note span{width:8px;height:8px;border-radius:50%;background:#74539A}
.am-wordmark{font-family:"Nunito Sans",sans-serif;font-size:1.16em;letter-spacing:-.04em;font-weight:900;color:var(--am-purple);white-space:nowrap}
.am-wordmark>span{color:var(--am-mid)}
.am-screen{padding:18px 20px 28px}
.am-topbar{height:38px;display:flex;align-items:center;justify-content:space-between;margin-bottom:23px}
.am-back{border:0;background:transparent;color:var(--am-purple);display:flex;align-items:center;gap:4px;padding:8px 4px;font-weight:800;cursor:pointer}
.am-step{font-size:.68em;color:var(--am-muted);font-weight:800;letter-spacing:.08em;min-width:35px;text-align:right}
.am-heading{margin:0 0 21px}
.am-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.am-heading h1{font-family:"Nunito Sans",sans-serif;color:var(--am-purple);font-size:1.55em;line-height:1.15;letter-spacing:-.035em;margin:0}
.am-heading>p{margin:8px 0 0;color:var(--am-muted);font-size:.94em;max-width:38ch}
.am-content{display:flex;flex-direction:column;gap:14px}
.am-audio{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:8px 12px;border:1px solid #D7C6EA;background:#F8F4FC;color:var(--am-purple);border-radius:13px;font-weight:800;font-size:.82em;cursor:pointer;flex:none}
.am-audio svg{color:var(--am-mid);flex:none}
.am-audio.is-small{min-height:38px;padding:5px 9px;font-size:.75em;border-radius:12px}
.am-button{width:100%;min-height:54px;border:0;border-radius:16px;background:var(--am-purple);color:#fff!important;font-weight:800;display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 17px;cursor:pointer;margin-top:2px;box-shadow:0 5px 13px rgba(53,20,95,.12);transition:transform .18s ease,opacity .18s ease}
.am-button:active{transform:translateY(1px)}
.am-button:disabled{opacity:.48;cursor:not-allowed}
.am-button.secondary{background:#F4EFF9;color:var(--am-purple)!important;border:1px solid #DCCEEA;box-shadow:none}
.am-feature-list{display:grid;gap:11px}
.am-feature{border:1px solid var(--am-line);background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 3px 11px rgba(53,20,95,.035)}
.am-feature.tinted{background:#F7F2FC}
.am-feature-main{display:flex;width:100%;align-items:center;gap:13px;text-align:left;padding:15px 14px 10px;border:0;background:transparent;cursor:pointer}
.am-feature-icon{width:46px;height:46px;display:grid;place-items:center;flex:none;border-radius:15px;background:#EEE5F8;color:var(--am-mid)}
.am-feature-icon svg{width:22px;height:22px}
.am-feature-copy{display:flex;flex:1;flex-direction:column;gap:3px}
.am-feature-copy strong{font-size:1em;color:var(--am-purple)}
.am-feature-copy>span{font-size:.82em;color:var(--am-muted);line-height:1.35}
.am-feature-main>svg:last-child{color:#9079AC;flex:none}
.am-feature-audio{display:flex;justify-content:flex-end;padding:0 12px 10px}
.am-notice{display:flex;align-items:center;gap:9px;padding:12px;border-radius:15px;background:#F3EFF8;border:1px solid #E4DAED;color:#49375D;font-size:.86em}
.am-notice>svg:first-child{flex:none;color:var(--am-mid)}
.am-notice>span{flex:1}
.am-notice.success{background:#ECF6F0;border-color:#C9E4D4;color:#285E43}
.am-notice.warning{background:#FBF4E9;border-color:#ECDCBF;color:#604B22}
.am-opening{min-height:100dvh;background:var(--am-purple);color:#fff;padding:56px 25px 52px;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;overflow:hidden}
.am-opening:before{content:"";position:absolute;width:340px;height:340px;border:1px solid rgba(182,156,229,.2);border-radius:50%;top:52px;left:50%;transform:translateX(-50%);pointer-events:none}
.am-opening .am-wordmark{font-size:1.65em;color:#fff;position:relative}
.am-opening .am-wordmark>span{color:#D4C0F2}
.am-opening-mark{height:260px;display:grid;place-items:center;position:relative;width:100%;margin:18px auto 9px}
.am-orbit{position:absolute;border:1px solid rgba(220,200,247,.36);border-radius:50%;transform:rotate(-22deg)}
.orbit-a{width:250px;height:155px}
.orbit-b{width:190px;height:235px;transform:rotate(38deg)}
.am-mark-icon{width:108px;height:108px;border-radius:32px;background:#6E4B9C;color:#fff;display:grid;place-items:center;position:relative;box-shadow:0 14px 45px rgba(16,5,31,.25)}
.am-heart{position:absolute;right:-8px;top:8px;color:#DCC9F5;fill:#DCC9F5}
.am-slogan{max-width:290px;font-size:1.18em;line-height:1.4;margin:14px 0 16px;color:#F6F1FC}
.am-opening .am-audio{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3);color:#fff}
.am-opening .am-audio svg{color:#E2D3F5}
.am-opening-loader{display:flex;gap:7px;margin:24px 0 22px}
.am-opening-loader span{width:7px;height:7px;border-radius:50%;background:#CBB4EC;opacity:.7}
.am-opening .am-button{background:#fff;color:var(--am-purple)!important;margin-top:auto;max-width:350px}
.am-opening-foot{font-size:.75em;color:#E4D9F3;margin:16px 0 0}
.am-welcome-hero{border-radius:22px;background:#F2ECFA;padding:18px;position:relative}
.am-welcome-symbol{width:52px;height:52px;border-radius:17px;background:#E0D2F2;color:var(--am-mid);display:grid;place-items:center}
.am-welcome-hero h2{font-family:"Nunito Sans",sans-serif;color:var(--am-purple);font-size:1.35em;margin:14px 0 4px}
.am-welcome-hero p{margin:0 0 13px;color:var(--am-muted)}
.am-benefit-list{display:grid;gap:9px}
.am-benefit{display:flex;align-items:center;gap:11px;border-bottom:1px solid var(--am-line);padding:7px 2px}
.am-benefit>span{width:29px;height:29px;display:grid;place-items:center;background:#EEE5F8;color:var(--am-purple);border-radius:50%;font-weight:800;flex:none}
.am-benefit p{margin:0;flex:1;font-size:.92em}
.am-form{display:flex;flex-direction:column;gap:14px}
.am-field{display:flex;flex-direction:column;gap:6px}
.am-field-label{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--am-purple);font-weight:800}
.am-input-wrap{display:flex;position:relative}
.am-field input,.am-search input{width:100%;height:52px;border-radius:14px;border:1px solid #D7C9E5;background:#fff;padding:0 14px;color:var(--am-ink)}
.am-field input::placeholder,.am-search input::placeholder{color:#80758B}
.am-eye{position:absolute;right:6px;top:5px;width:42px;height:42px;border:0;background:transparent;color:var(--am-mid);display:grid;place-items:center;cursor:pointer}
.am-check{display:flex;align-items:center;gap:9px;padding:9px 2px;font-size:.86em}
.am-check label{display:flex;align-items:center;gap:9px;flex:1}
.am-check input{width:22px;height:22px;accent-color:var(--am-purple);flex:none}
.am-check span{flex:1}
.am-text-link{border:0;background:transparent;color:var(--am-mid);font-weight:800;text-decoration:underline;text-underline-offset:3px;padding:8px;cursor:pointer}
.am-text-link.left{display:flex;align-items:center;gap:6px;padding-left:0}
.am-form-message{color:#A12B39;background:#FFF1F1;border-radius:10px;padding:9px 11px;margin:0;font-weight:700}
.am-setting-card{border:1px solid var(--am-line);border-radius:18px;background:#fff;padding:15px;display:flex;flex-direction:column;gap:12px}
.am-setting-title{display:flex;align-items:center;gap:11px}
.am-setting-title>div{flex:1}
.am-setting-title h2{font-size:1em;color:var(--am-purple);margin:0}
.am-setting-title p{margin:3px 0 0;color:var(--am-muted);font-size:.82em}
.am-choice-row{display:flex;gap:8px;flex-wrap:wrap}
.am-choice-row button{min-height:43px;flex:1;border:1px solid #DCCFEA;background:#fff;border-radius:12px;color:var(--am-purple);font-weight:800;padding:8px;cursor:pointer}
.am-choice-row button.chosen{background:var(--am-purple);color:#fff;border-color:var(--am-purple)}
.am-preview-text{background:#F7F2FC;border-radius:12px;padding:12px;margin:0;color:var(--am-purple);font-size:1.1em}
.am-toggle{border:0;background:transparent;padding:7px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer;color:var(--am-purple);font-weight:800}
.am-switch{width:53px;height:31px;border-radius:30px;background:#D4CCD9;padding:4px;display:flex;align-items:center;transition:background .18s ease}
.am-switch i{width:23px;height:23px;border-radius:50%;background:#fff;box-shadow:0 1px 4px #7775;transition:transform .18s ease}
.am-toggle.active .am-switch{background:var(--am-mid)}
.am-toggle.active .am-switch i{transform:translateX(22px)}
.am-setting-card select{height:46px;border:1px solid #D7C9E5;border-radius:12px;padding:0 11px;background:white;color:var(--am-ink)}
.am-setting-note{margin:0;color:var(--am-muted);font-size:.85em}
.am-home{padding:20px 18px 24px}
.am-home-header{display:flex;align-items:center;gap:11px;margin-bottom:16px}
.am-home-header>div:first-child{flex:1}
.am-home-header p{margin:3px 0 0;color:var(--am-muted);font-size:.9em}
.am-home-actions{display:flex;gap:5px}
.am-home-actions button{border:1px solid var(--am-line);border-radius:13px;background:#F8F4FC;color:var(--am-purple);width:43px;height:43px;display:grid;place-items:center}
.am-home-intro{display:flex;gap:10px;align-items:center;padding:13px;background:#F2ECFA;border-radius:17px;margin-bottom:19px}
.am-round-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:13px;background:#E4D8F2;color:var(--am-mid);flex:none}
.am-home-intro>div{flex:1}
.am-home-intro strong{color:var(--am-purple);font-size:.9em}
.am-home-intro p{margin:2px 0 0;color:var(--am-muted);font-size:.8em}
.am-section-heading{font:800 1.12em "Nunito Sans",sans-serif;color:var(--am-purple);margin:0 0 11px}
.am-home .am-feature-list{gap:9px}
.am-home .am-feature-main{padding:11px 12px 7px}
.am-home .am-feature-icon{width:40px;height:40px;border-radius:13px}
.am-home .am-feature-audio{padding-bottom:7px}
.am-next-card{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:4px;padding:15px;border-radius:17px;background:#F4EFF9;border:1px solid #DED1EC;color:var(--am-ink);cursor:pointer}
.am-next-main{width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:4px;border:0;background:transparent;text-align:left;padding:0;cursor:pointer}
.am-next-card strong{color:var(--am-purple);font-size:1.05em}
.am-next-card>span:not(.am-overline){font-size:.86em;color:var(--am-muted)}
.am-next-card .am-audio{align-self:flex-end}
.am-next-card.empty{background:#fff}
.am-overline{font-size:.69em;font-weight:900;letter-spacing:.07em;color:#74569B}
.am-bottom-nav{position:absolute;bottom:34px;left:0;right:0;background:#fff;border-top:1px solid var(--am-line);padding:8px 8px 7px;display:flex;justify-content:space-around;align-items:center;z-index:4}
.am-bottom-nav>button:not(.am-audio){border:0;background:transparent;min-width:53px;min-height:53px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;color:#746A7D;cursor:pointer;border-radius:12px}
.am-bottom-nav>button.active{background:#F2ECFA;color:var(--am-purple)}
.am-bottom-nav small{font-size:.68em;font-weight:800}
.am-bottom-nav>.am-audio{width:43px;padding:4px;min-width:43px}
.am-search{display:flex;align-items:center;gap:8px;padding:5px 8px 5px 13px;border:1px solid #D7C9E5;border-radius:15px;background:#fff;color:var(--am-mid)}
.am-search input{border:0;padding:0;height:44px;min-width:0;outline:none!important}
.am-search .am-audio{flex:none}
.am-doctor-card{display:grid;grid-template-columns:50px 1fr;gap:10px;padding:14px;border:1px solid var(--am-line);border-radius:18px;background:#fff}
.am-avatar{width:49px;height:49px;border-radius:17px;background:#EEE5F8;color:var(--am-mid);display:grid;place-items:center;grid-row:span 2}
.am-avatar.large{width:76px;height:76px;border-radius:25px}
.am-doctor-copy{display:flex;flex-direction:column;align-items:flex-start;gap:3px}
.am-doctor-copy h2{font:800 1em "Nunito Sans",sans-serif;color:var(--am-purple);margin:0}
.am-doctor-copy p{margin:0;font-weight:700}
.am-doctor-copy>span:last-child{font-size:.78em;color:var(--am-muted)}
.am-doctor-card>.am-audio{grid-column:2;justify-self:end}
.am-doctor-card>.am-button{grid-column:1/-1}
.am-doctor-profile{text-align:center;padding:17px 12px;background:#F5F0FA;border-radius:19px;display:flex;align-items:center;flex-direction:column;gap:8px}
.am-doctor-profile h2{margin:0;color:var(--am-purple);font:800 1.16em "Nunito Sans",sans-serif}
.am-doctor-profile p{margin:0}
.am-detail-list{border:1px solid var(--am-line);border-radius:17px;background:#fff;padding:2px 13px}
.am-detail-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #EEE8F3;min-width:0}
.am-detail-row:last-child{border-bottom:0}
.am-detail-icon{width:34px;height:34px;border-radius:11px;background:#F2ECFA;display:grid;place-items:center;color:var(--am-mid);flex:none}
.am-detail-icon svg{width:18px;height:18px}
.am-detail-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:2px}
.am-detail-copy small{font-size:.73em;color:var(--am-muted)}
.am-detail-copy strong{font-size:.84em;line-height:1.3;overflow-wrap:anywhere}
.am-helper{font-size:.82em;color:var(--am-muted);margin:0}
.am-section-label{font-size:.73em;font-weight:900;letter-spacing:.08em;color:#725694;margin:4px 0 0}
.am-day-list{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.am-day{position:relative;min-height:78px;border:1px solid #DCCFEA;border-radius:14px;background:#fff;color:var(--am-purple);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;padding:7px 2px}
.am-day>span{font-size:.7em;font-weight:800}
.am-day>strong{font-size:.88em}
.am-day.selected{border:2px solid var(--am-mid);background:#F2ECFA}
.am-day>svg{position:absolute;right:4px;top:4px;color:var(--am-mid)}
.am-time-heading{display:flex;align-items:center;gap:8px;color:var(--am-purple)}
.am-time-heading strong{flex:1}
.am-time-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
.am-time{display:flex;align-items:center;justify-content:center;gap:7px;min-height:48px;border:1px solid #DCCFEA;border-radius:13px;background:#fff;color:var(--am-purple);font-weight:800;cursor:pointer}
.am-time.selected{background:#EEE5F8;border:2px solid var(--am-mid)}
.am-success-panel{display:flex;align-items:center;flex-direction:column;text-align:center;padding:21px 14px;background:#F2ECFA;border-radius:22px;gap:9px}
.am-success-mark{width:67px;height:67px;background:#E1F1E8;color:#27845D;border-radius:50%;display:grid;place-items:center}
.am-success-panel h2{font:800 1.4em "Nunito Sans",sans-serif;color:var(--am-purple);margin:0}
.am-success-panel p{margin:0 0 6px;color:var(--am-muted)}
.am-tabs{display:flex;gap:6px;padding:4px;background:#F1ECF5;border-radius:14px}
.am-tabs button{flex:1;border:0;border-radius:11px;background:transparent;min-height:43px;color:#645770;font-weight:800;padding:5px;cursor:pointer;font-size:.82em}
.am-tabs button.selected{background:#fff;color:var(--am-purple);box-shadow:0 1px 5px #35145f18}
.am-list{display:flex;flex-direction:column;gap:10px}
.am-appointment-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;text-align:left;border:1px solid var(--am-line);border-radius:16px;background:white;padding:11px}
.am-appointment-main{width:100%;grid-column:1/-1;display:grid;grid-template-columns:58px 1fr auto;align-items:center;gap:10px;text-align:left;border:0;background:transparent;padding:0;cursor:pointer}
.am-date-chip{min-height:60px;border-radius:12px;background:#F2ECFA;color:var(--am-purple);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:.76em}
.am-date-chip small{font-weight:800}
.am-appointment-copy{display:flex;flex-direction:column;gap:3px}
.am-appointment-copy strong{font-size:.9em;color:var(--am-purple)}
.am-appointment-copy>span,.am-appointment-copy small{font-size:.75em;color:var(--am-muted)}
.am-appointment-row>.am-audio{grid-column:1/-1;justify-self:end}
.am-empty-state{border:1px dashed #CBBADC;border-radius:18px;background:#FBF9FD;padding:23px 16px;display:flex;align-items:center;flex-direction:column;text-align:center;gap:8px}
.am-empty-icon{width:57px;height:57px;background:#F0E9F7;color:var(--am-mid);display:grid;place-items:center;border-radius:18px}
.am-empty-state h2{font:800 1.06em "Nunito Sans",sans-serif;color:var(--am-purple);margin:2px 0 0}
.am-empty-state p{font-size:.86em;color:var(--am-muted);margin:0 0 5px}
.am-call-stage{min-height:250px;border-radius:23px;background:#F2ECFA;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:20px;gap:10px;border:1px solid #E0D4EF}
.am-call-stage h2{color:var(--am-purple);font:800 1.2em "Nunito Sans",sans-serif;margin:0}
.am-call-stage p{color:var(--am-muted);margin:0}
.am-notice-list{display:grid;gap:11px}
.am-notification{border:1px solid #DCCFEA;border-radius:17px;background:#F8F4FC;padding:13px}
.am-notification.read{background:#fff;border-color:var(--am-line)}
.am-notification-top{display:flex;align-items:center;gap:9px}
.am-notification-icon{width:35px;height:35px;border-radius:11px;background:#E9DFF4;color:var(--am-mid);display:grid;place-items:center}
.am-notification-title{font-weight:800;color:var(--am-purple);flex:1}
.am-unread{font-size:.68em;font-weight:800;color:#664095;background:#EBDDFA;border-radius:20px;padding:4px 7px}
.am-notification p{font-size:.86em;color:var(--am-muted);margin:9px 0}
.am-notification-bottom{display:flex;justify-content:space-between;align-items:center;gap:6px}
.am-notification-bottom>span{font-size:.72em;color:var(--am-muted)}
.am-profile-banner{display:flex;align-items:center;gap:11px;background:#F3EDF9;padding:14px;border-radius:18px}
.am-profile-banner>div{flex:1}
.am-profile-banner h2{font:800 1.05em "Nunito Sans",sans-serif;color:var(--am-purple);margin:3px 0 0}
.am-profile-banner .am-avatar{grid-row:auto}
.am-about-brand{display:flex;align-items:center;flex-direction:column;gap:10px;padding:18px;border-radius:20px;background:#F2ECFA}
.am-about-mark{width:72px;height:72px;display:grid;place-items:center;color:white;background:var(--am-purple);border-radius:23px}
.am-about-brand .am-wordmark{font-size:1.4em}
.am-about-copy{font-size:.93em;line-height:1.58;color:#443A4D;margin:0}
.am-objective{display:flex;align-items:center;gap:9px;padding:8px 0;border-top:1px solid #EEE8F3}
.am-objective>svg{color:var(--am-green);flex:none}
.am-objective>span{flex:1;font-size:.87em}
.am-team-card{padding:15px;border:1px solid var(--am-line);border-radius:17px;background:#fff}
.am-team-card p{font:800 1.15em "Nunito Sans",sans-serif;color:var(--am-purple);margin:6px 0}
.am-team-card p span{color:#A591BD}
.am-faq-list{display:grid;gap:9px}
.am-faq{border:1px solid var(--am-line);border-radius:15px;background:white;overflow:hidden}
.am-faq-head{display:flex;align-items:center;gap:6px;padding:5px 9px 5px 11px}
.am-faq-toggle{flex:1;min-width:0;display:flex;align-items:center;gap:8px;padding:7px 0;background:transparent;border:0;text-align:left;color:var(--am-purple)}
.am-faq-toggle strong{flex:1;font-size:.9em}
.am-faq-toggle>svg{flex:none}
.am-faq-answer{padding:0 12px 12px}
.am-faq-answer p{margin:0 0 8px;font-size:.88em;color:var(--am-muted)}
.am-textarea{width:100%;min-height:95px;border:1px solid #D7C9E5;border-radius:13px;padding:11px;resize:vertical;color:var(--am-ink)}
.am-modal-backdrop{position:fixed;inset:0;z-index:10;background:rgba(32,17,48,.45);display:flex;align-items:center;justify-content:center;padding:18px}
.am-dialog{position:relative;width:min(100%,390px);background:#fff;border-radius:22px;padding:22px;box-shadow:0 18px 55px #1b0e2b55;display:flex;flex-direction:column;gap:11px}
.am-dialog h2{margin:0;font:800 1.3em "Nunito Sans",sans-serif;color:var(--am-purple)}
.am-dialog p{margin:0;color:var(--am-muted)}
.am-dialog-close{position:absolute;right:13px;top:13px;border:0;border-radius:50%;width:39px;height:39px;background:#F2ECFA;color:var(--am-purple);display:grid;place-items:center}
.am-reading-demo{position:absolute;left:12px;right:12px;bottom:79px;z-index:8;border:1px solid #CEBCE3;border-radius:19px;background:#fff;padding:14px 15px;box-shadow:0 11px 32px rgba(39,23,56,.2);animation:am-enter .18s ease-out}
.am-reading-heading{display:flex;align-items:center;gap:8px;color:var(--am-purple)}
.am-reading-heading strong{flex:1}
.am-reading-heading button{border:0;width:35px;height:35px;border-radius:50%;display:grid;place-items:center;background:#F2ECFA;color:var(--am-purple)}
.am-reading-demo p{margin:10px 0;color:#342840;max-height:130px;overflow:auto}
.am-reading-demo>span{font-size:.74em;color:var(--am-muted)}
.am-stop-reading{display:block;width:100%;margin-top:9px;border:0;border-radius:12px;min-height:43px;background:var(--am-purple);color:#fff;font-weight:800}
.am-high-contrast{--am-ink:#160D20;--am-muted:#3F3548;--am-line:#71598B}
.am-high-contrast .am-screen,.am-high-contrast .am-phone{background:#fff}
.am-high-contrast .am-feature,.am-high-contrast .am-setting-card,.am-high-contrast .am-detail-list,.am-high-contrast .am-notification{border-width:2px}
.am-high-contrast .am-heading>p,.am-high-contrast .am-helper,.am-high-contrast .am-feature-copy>span{color:#3F3548}
@media(max-width:380px){.am-screen{padding-left:15px;padding-right:15px}.am-home{padding-left:14px;padding-right:14px}.am-day-list{gap:5px}.am-day{min-height:72px}.am-bottom-nav{padding-left:4px;padding-right:4px}.am-bottom-nav>button:not(.am-audio){min-width:49px}}
@media(prefers-reduced-motion:reduce){.am-app-scroll,.am-reading-demo{animation:none}.am-button,.am-switch,.am-switch i{transition:none}}
`;
