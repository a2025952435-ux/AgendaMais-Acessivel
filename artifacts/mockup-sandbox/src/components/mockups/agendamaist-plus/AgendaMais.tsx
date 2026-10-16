import { useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  Heart,
  HelpCircle,
  Home,
  MapPin,
  Minus,
  Monitor,
  PhoneOff,
  Plus,
  Stethoscope,
  UserRound,
  Volume2,
  X,
} from "lucide-react";

type ScreenName =
  | "opening"
  | "home"
  | "type"
  | "provider"
  | "schedule"
  | "confirmation"
  | "success"
  | "appointments"
  | "online"
  | "help";
type VisitType = "online" | "presencial";
type Booking = { type: VisitType; day: string; time: string };
type SharedProps = {
  onGo: (screen: ScreenName) => void;
  onRead: (text: string) => void;
  booking: Booking | null;
};

const days = [
  { short: "TER", date: "18", full: "Terça-feira, 18 de junho" },
  { short: "QUA", date: "19", full: "Quarta-feira, 19 de junho" },
  { short: "QUI", date: "20", full: "Quinta-feira, 20 de junho" },
];
const times = ["09:00", "10:30", "14:00", "15:30"];
const typeName = (type: VisitType) =>
  type === "online" ? "Consulta online" : "Consulta presencial";
const bookingDate = (booking: Booking) =>
  `${days.find((day) => day.full === booking.day)?.full ?? booking.day} · ${booking.time}`;

function SpeakerControl({
  text,
  onRead,
  compact = false,
}: {
  text: string;
  onRead: (text: string) => void;
  compact?: boolean;
}) {
  return (
    <button
      className={`am-speaker${compact ? " am-speaker-compact" : ""}`}
      type="button"
      onClick={() => onRead(text)}
      aria-label={`Demonstração visual de leitura: ${text}`}
      title="Demonstração visual de leitura"
    >
      <Volume2 size={compact ? 19 : 21} strokeWidth={2.2} />
      <span>{compact ? "Ler" : "Ouvir explicação"}</span>
    </button>
  );
}

function ActionButton({
  children,
  onClick,
  secondary = false,
  icon,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`am-button${secondary ? " am-button-secondary" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function FunctionCard({
  title,
  description,
  icon,
  onClick,
  onRead,
  tint = "lavender",
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  onRead: (text: string) => void;
  tint?: "lavender" | "white";
}) {
  return (
    <article className={`am-function-card am-card-${tint}`}>
      <button
        type="button"
        className="am-function-main"
        onClick={onClick}
        aria-label={`${title}. ${description}`}
      >
        <span className="am-card-icon">{icon}</span>
        <span className="am-card-copy">
          <strong>{title}</strong>
          <span>{description}</span>
        </span>
        <ChevronRight className="am-chevron" size={22} aria-hidden="true" />
      </button>
      <div className="am-card-read">
        <SpeakerControl text={`${title}. ${description}`} onRead={onRead} compact />
      </div>
    </article>
  );
}

function ScreenShell({
  title,
  description,
  children,
  onRead,
  onBack,
  step,
  hideBack = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onRead: (text: string) => void;
  onBack: () => void;
  step?: string;
  hideBack?: boolean;
}) {
  return (
    <div className="am-screen">
      <div className="am-topbar">
        {hideBack ? (
          <span className="am-topbar-spacer" />
        ) : (
          <button className="am-back" onClick={onBack} aria-label="Voltar" type="button">
            <ArrowLeft size={21} />
            <span>Voltar</span>
          </button>
        )}
        <span className="am-wordmark">AgendaMais<span>+</span></span>
        {step ? <span className="am-step">{step}</span> : <span className="am-topbar-spacer" />}
      </div>
      <header className="am-heading">
        <div className="am-title-row">
          <h1>{title}</h1>
          <SpeakerControl
            text={description ? `${title}. ${description}` : title}
            onRead={onRead}
            compact
          />
        </div>
        {description && <p>{description}</p>}
      </header>
      <div className="am-screen-content">{children}</div>
    </div>
  );
}

function OpeningScreen({ onGo, onRead }: SharedProps) {
  return (
    <div className="am-opening">
      <div className="am-opening-top">
        <span className="am-wordmark">AgendaMais<span>+</span></span>
        <span className="am-demo-pill"><span /> Demonstração</span>
      </div>
      <div className="am-opening-art" aria-hidden="true">
        <div className="am-art-orbit am-orbit-one" />
        <div className="am-art-orbit am-orbit-two" />
        <div className="am-art-calendar"><CalendarDays size={43} /><span><Check size={21} /></span></div>
        <div className="am-art-heart"><Heart size={25} fill="currentColor" /></div>
        <div className="am-art-dot am-dot-one" />
        <div className="am-art-dot am-dot-two" />
      </div>
      <div className="am-opening-copy">
        <span className="am-eyebrow">UM PASSO DE CADA VEZ</span>
        <h1>Cuidar da sua saúde ficou mais fácil</h1>
        <p>Um jeito simples de conhecer o agendamento de consultas, no seu ritmo.</p>
        <SpeakerControl
          text="Cuidar da sua saúde ficou mais fácil. Um jeito simples de conhecer o agendamento de consultas, no seu ritmo."
          onRead={onRead}
        />
        <ActionButton onClick={() => onGo("home")} icon={<ArrowRight size={21} />}>
          Começar
        </ActionButton>
        <p className="am-opening-disclaimer">Este é um protótipo acadêmico. Não oferece atendimento de saúde.</p>
      </div>
    </div>
  );
}

function HomeScreen({ onGo, onRead, booking }: SharedProps) {
  return (
    <ScreenShell
      title="Olá, que bom ter você aqui"
      description="Escolha o que gostaria de fazer. Você pode voltar a qualquer momento."
      onRead={onRead}
      onBack={() => onGo("opening")}
      hideBack
    >
      <div className="am-welcome-band">
        <div className="am-welcome-icon"><Heart size={23} /></div>
        <div>
          <strong>Seu cuidado, no seu tempo.</strong>
          <span>{booking ? "Sua consulta de demonstração já está guardada aqui." : "Vamos conhecer cada etapa juntos."}</span>
        </div>
      </div>
      <div className="am-card-list">
        <FunctionCard title="Agendar consulta" description="Escolha o tipo e um horário ilustrativo" icon={<CalendarDays />} onClick={() => onGo("type")} onRead={onRead} />
        <FunctionCard title="Minhas consultas" description="Veja os detalhes da sua consulta de demonstração" icon={<ClipboardIcon />} onClick={() => onGo("appointments")} onRead={onRead} tint="white" />
        <FunctionCard title="Entrar na consulta" description="Conheça a tela de uma consulta online" icon={<Monitor />} onClick={() => onGo("online")} onRead={onRead} />
        <FunctionCard title="Ajuda e acessibilidade" description="Ajuste o texto e veja como usar" icon={<HelpCircle />} onClick={() => onGo("help")} onRead={onRead} tint="white" />
      </div>
      <div className="am-note"><span className="am-note-mark">i</span><span>Esta demonstração não realiza agendamentos reais.</span></div>
    </ScreenShell>
  );
}

function ClipboardIcon() {
  return <CalendarDays />;
}

function TypeScreen({ onGo, onRead, onChoose }: SharedProps & { onChoose: (type: VisitType) => void }) {
  const choose = (type: VisitType) => {
    onChoose(type);
    onGo("provider");
  };
  return (
    <ScreenShell title="Tipo de consulta" description="Como você prefere conhecer este agendamento?" onRead={onRead} onBack={() => onGo("home")} step="1 de 4">
      <p className="am-section-label">ESCOLHA UMA OPÇÃO</p>
      <div className="am-type-list">
        <FunctionCard title="Consulta online" description="Uma demonstração de atendimento por vídeo" icon={<Monitor />} onClick={() => choose("online")} onRead={onRead} />
        <FunctionCard title="Consulta presencial" description="Uma demonstração de consulta em local físico" icon={<MapPin />} onClick={() => choose("presencial")} onRead={onRead} tint="white" />
      </div>
      <div className="am-info-panel">
        <span className="am-info-icon"><HelpCircle size={20} /></span>
        <div><strong>Qual é a diferença?</strong><p>Online é uma simulação de chamada. Presencial é apenas um exemplo de agendamento. Nenhuma opção oferece atendimento real.</p></div>
        <SpeakerControl text="Online é uma simulação de chamada. Presencial é apenas um exemplo de agendamento. Nenhuma opção oferece atendimento real." onRead={onRead} compact />
      </div>
    </ScreenShell>
  );
}

function ProviderScreen({ onGo, onRead, selectedType }: SharedProps & { selectedType: VisitType }) {
  return (
    <ScreenShell title="Escolha um profissional" description="Este perfil foi criado somente para demonstrar o protótipo." onRead={onRead} onBack={() => onGo("type")} step="2 de 4">
      <article className="am-provider-card">
        <div className="am-provider-avatar"><UserRound size={36} /></div>
        <div className="am-provider-copy">
          <span className="am-profile-label">PERFIL DE EXEMPLO</span>
          <h2>Profissional de demonstração</h2>
          <p>Clínica geral · exemplo</p>
        </div>
        <SpeakerControl text="Profissional de demonstração. Especialidade: Clínica geral, exemplo." onRead={onRead} compact />
      </article>
      <div className="am-info-panel am-provider-info">
        <span className="am-info-icon"><Stethoscope size={20} /></span>
        <div><strong>Sobre este perfil</strong><p>Não representa uma pessoa profissional real e não está disponível para consultas.</p></div>
        <SpeakerControl text="Este perfil não representa uma pessoa profissional real e não está disponível para consultas." onRead={onRead} compact />
      </div>
      <div className="am-bottom-actions">
        <ActionButton onClick={() => onGo("schedule")} icon={<CalendarDays size={20} />}>Ver horários ilustrativos</ActionButton>
        <SpeakerControl text={`Ver horários ilustrativos para ${typeName(selectedType)}.`} onRead={onRead} />
      </div>
    </ScreenShell>
  );
}

function ScheduleScreen({
  onGo,
  onRead,
  selectedType,
  day,
  time,
  setDay,
  setTime,
}: SharedProps & {
  selectedType: VisitType;
  day: string;
  time: string;
  setDay: (day: string) => void;
  setTime: (time: string) => void;
}) {
  return (
    <ScreenShell title="Escolha dia e horário" description="Selecione uma opção para seguir com a demonstração." onRead={onRead} onBack={() => onGo("provider")} step="3 de 4">
      <div className="am-demo-alert"><CalendarDays size={20} /><span><strong>Horários ilustrativos</strong> — não são disponibilidade real.</span><SpeakerControl text="Horários ilustrativos — não são disponibilidade real." onRead={onRead} compact /></div>
      <p className="am-section-label">JUNHO · EXEMPLO</p>
      <div className="am-day-list" role="group" aria-label="Dias ilustrativos">
        {days.map((item) => (
          <button type="button" key={item.date} className={`am-day${day === item.full ? " am-day-selected" : ""}`} onClick={() => setDay(item.full)} aria-pressed={day === item.full} aria-label={`${item.full}, dia ilustrativo`}>
            <span>{item.short}</span><strong>{item.date}</strong>
            {day === item.full && <CheckCircle2 size={17} />}
          </button>
        ))}
      </div>
      <SpeakerControl text="Escolha um dia ilustrativo. Estes dias não correspondem à disponibilidade real de profissionais." onRead={onRead} />
      <div className="am-time-heading"><Clock3 size={20} /><strong>Horários para {day ? days.find((item) => item.full === day)?.short.toLowerCase() : "o dia escolhido"}</strong></div>
      <div className="am-time-grid" role="group" aria-label="Horários ilustrativos">
        {times.map((item) => (
          <button type="button" key={item} className={`am-time${time === item ? " am-time-selected" : ""}`} onClick={() => setTime(item)} aria-pressed={time === item}>{item}{time === item && <Check size={16} />}</button>
        ))}
      </div>
      <div className="am-bottom-actions">
        <ActionButton onClick={() => onGo("confirmation")} disabled={!day || !time} icon={<ArrowRight size={20} />}>Continuar</ActionButton>
        <SpeakerControl text="Depois de escolher um dia e horário ilustrativos, toque em Continuar." onRead={onRead} />
      </div>
      <p className="am-muted-small">Modalidade: {typeName(selectedType)} · somente para demonstração</p>
    </ScreenShell>
  );
}

function ConfirmationScreen({
  onGo,
  onRead,
  selectedType,
  day,
  time,
  onConfirm,
}: SharedProps & { selectedType: VisitType; day: string; time: string; onConfirm: () => void }) {
  return (
    <ScreenShell title="Revise sua consulta" description="Confira os dados ilustrativos antes de confirmar." onRead={onRead} onBack={() => onGo("schedule")} step="4 de 4">
      <div className="am-confirm-card">
        <div className="am-confirm-label"><span>RESUMO DO EXEMPLO</span><SpeakerControl text="Resumo do exemplo de agendamento." onRead={onRead} compact /></div>
        <div className="am-summary-provider"><div className="am-mini-avatar"><UserRound size={22} /></div><div><strong>Profissional de demonstração</strong><span>Clínica geral · exemplo</span></div></div>
        <div className="am-summary-row"><span><Monitor size={19} />Tipo de consulta</span><strong>{typeName(selectedType)}</strong></div>
        <div className="am-summary-row"><span><CalendarDays size={19} />Dia</span><strong>{day}</strong></div>
        <div className="am-summary-row"><span><Clock3 size={19} />Horário</span><strong>{time}</strong></div>
      </div>
      <div className="am-info-panel">
        <span className="am-info-icon"><HelpCircle size={20} /></span>
        <div><strong>Importante</strong><p>Ao confirmar, você cria apenas um registro demonstrativo neste protótipo. Não haverá consulta.</p></div>
        <SpeakerControl text="Ao confirmar, você cria apenas um registro demonstrativo neste protótipo. Não haverá consulta." onRead={onRead} compact />
      </div>
      <div className="am-bottom-actions">
        <ActionButton onClick={onConfirm} icon={<Check size={20} />}>Confirmar consulta</ActionButton>
        <ActionButton onClick={() => onGo("schedule")} secondary>Voltar e alterar</ActionButton>
        <SpeakerControl text="Confirme para guardar este agendamento de demonstração, ou volte e altere as escolhas." onRead={onRead} />
      </div>
    </ScreenShell>
  );
}

function SuccessScreen({ onGo, onRead, booking }: SharedProps) {
  return (
    <ScreenShell title="" onRead={onRead} onBack={() => onGo("home")} hideBack>
      <div className="am-success">
        <div className="am-success-mark"><Check size={38} strokeWidth={2.5} /></div>
        <span className="am-eyebrow">AGENDAMENTO DE DEMONSTRAÇÃO</span>
        <h1>Sua consulta foi agendada!</h1>
        <p>Este registro é apenas um exemplo e não representa uma consulta real.</p>
        <SpeakerControl text="Sua consulta foi agendada! Este registro é apenas um exemplo e não representa uma consulta real." onRead={onRead} />
      </div>
      {booking && <div className="am-success-summary">
        <div className="am-summary-provider"><div className="am-mini-avatar"><UserRound size={22} /></div><div><strong>Profissional de demonstração</strong><span>Clínica geral · exemplo</span></div></div>
        <div className="am-summary-row"><span>{booking.type === "online" ? <Monitor size={19} /> : <MapPin size={19} />}Tipo</span><strong>{typeName(booking.type)}</strong></div>
        <div className="am-summary-row"><span><CalendarDays size={19} />Quando</span><strong>{bookingDate(booking)}</strong></div>
      </div>}
      <div className="am-bottom-actions">
        <ActionButton onClick={() => onGo("home")} icon={<Home size={19} />}>Voltar ao início</ActionButton>
        <ActionButton onClick={() => onGo("appointments")} secondary>Ver minhas consultas</ActionButton>
      </div>
    </ScreenShell>
  );
}

function AppointmentsScreen({ onGo, onRead, booking }: SharedProps) {
  return (
    <ScreenShell title="Minhas consultas" description="Aqui ficam os registros criados nesta demonstração." onRead={onRead} onBack={() => onGo("home")}>
      {booking ? (
        <>
          <div className="am-next-label"><span className="am-live-dot" /> CONSULTA DE DEMONSTRAÇÃO</div>
          <article className="am-appointment-card">
            <div className="am-appointment-date"><CalendarDays size={21} /><strong>{booking.day}</strong><span>{booking.time}</span></div>
            <div className="am-appointment-content">
              <h2>Profissional de demonstração</h2>
              <p>Clínica geral · exemplo</p>
              <div className="am-appointment-type">{booking.type === "online" ? <Monitor size={17} /> : <MapPin size={17} />}{typeName(booking.type)}</div>
            </div>
            <SpeakerControl text={`Consulta de demonstração com Profissional de demonstração. ${typeName(booking.type)}. ${bookingDate(booking)}.`} onRead={onRead} compact />
          </article>
          <div className="am-info-panel">
            <span className="am-info-icon"><HelpCircle size={20} /></span>
            <div><strong>Este é um registro fictício</strong><p>Foi criado agora, somente dentro deste protótipo. Nenhuma consulta foi marcada.</p></div>
            <SpeakerControl text="Este é um registro fictício criado somente dentro deste protótipo. Nenhuma consulta foi marcada." onRead={onRead} compact />
          </div>
          {booking.type === "online" && <ActionButton onClick={() => onGo("online")} icon={<Monitor size={20} />}>Ver demonstração online</ActionButton>}
        </>
      ) : (
        <div className="am-empty-state">
          <div className="am-empty-icon"><CalendarDays size={31} /></div>
          <h2>Nenhuma consulta por aqui</h2>
          <p>Quando você fizer um agendamento de demonstração, ele aparecerá nesta lista.</p>
          <SpeakerControl text="Nenhuma consulta por aqui. Quando você fizer um agendamento de demonstração, ele aparecerá nesta lista." onRead={onRead} />
          <ActionButton onClick={() => onGo("type")} icon={<ArrowRight size={20} />}>Conhecer o agendamento</ActionButton>
        </div>
      )}
    </ScreenShell>
  );
}

function OnlineScreen({ onGo, onRead, booking, inCall, setInCall }: SharedProps & { inCall: boolean; setInCall: (value: boolean) => void }) {
  return (
    <ScreenShell title="Acesso à consulta online" description="Veja como seria a entrada em uma consulta por vídeo." onRead={onRead} onBack={() => onGo(booking ? "appointments" : "home")}>
      {booking?.type === "online" ? (
        <>
          <div className={`am-call-preview${inCall ? " am-call-active" : ""}`}>
            <div className="am-call-avatar"><UserRound size={52} /></div>
            <span>{inCall ? "Demonstração em andamento" : "Profissional de demonstração"}</span>
            <span className="am-call-status">{inCall ? "Sem transmissão de vídeo ou áudio" : "Prévia da chamada"}</span>
            <SpeakerControl text="Prévia visual da chamada com Profissional de demonstração. Nenhum vídeo ou áudio real é transmitido." onRead={onRead} />
          </div>
          <div className="am-call-info">
            <strong>{typeName(booking.type)}</strong>
            <span><CalendarDays size={17} />{bookingDate(booking)}</span>
            <span>Clínica geral · exemplo</span>
          </div>
          <div className="am-demo-alert am-alert-purple"><Monitor size={20} /><span>Chamada demonstrativa. Nenhum atendimento está acontecendo.</span><SpeakerControl text="Chamada demonstrativa. Nenhum atendimento está acontecendo." onRead={onRead} compact /></div>
          {!inCall ? (
            <ActionButton onClick={() => setInCall(true)} icon={<Monitor size={20} />}>Entrar na consulta</ActionButton>
          ) : (
            <ActionButton onClick={() => setInCall(false)} secondary icon={<PhoneOff size={20} />}>Encerrar demonstração</ActionButton>
          )}
        </>
      ) : (
        <div className="am-empty-state am-online-empty">
          <div className="am-empty-icon"><Monitor size={31} /></div>
          <h2>{booking ? "Sua consulta não é online" : "Ainda não há consulta online"}</h2>
          <p>{booking ? "O registro criado é presencial. Você pode conhecer a tela de chamada depois de criar um agendamento online de demonstração." : "Para conhecer esta tela, primeiro crie um agendamento online de demonstração."}</p>
          <SpeakerControl text={booking ? "O registro criado é presencial. Crie um agendamento online de demonstração para conhecer a tela de chamada." : "Ainda não há consulta online. Primeiro crie um agendamento online de demonstração."} onRead={onRead} />
          <ActionButton onClick={() => onGo("type")} icon={<ArrowRight size={20} />}>Agendar uma demonstração</ActionButton>
        </div>
      )}
    </ScreenShell>
  );
}

function HelpScreen({
  onGo,
  onRead,
  textSize,
  setTextSize,
  audioGuidance,
  setAudioGuidance,
}: SharedProps & {
  textSize: number;
  setTextSize: (size: number) => void;
  audioGuidance: boolean;
  setAudioGuidance: (value: boolean) => void;
}) {
  return (
    <ScreenShell title="Ajuda e acessibilidade" description="Ajuste a visualização e saiba como navegar pelo protótipo." onRead={onRead} onBack={() => onGo("home")}>
      <section className="am-setting-card">
        <div className="am-setting-title"><span className="am-settings-icon"><span>Aa</span></span><div><h2>Tamanho do texto</h2><p>Escolha o tamanho mais confortável.</p></div><SpeakerControl text="Tamanho do texto. Escolha o tamanho mais confortável." onRead={onRead} compact /></div>
        <div className="am-size-controls">
          <button type="button" aria-label="Diminuir tamanho do texto" onClick={() => setTextSize(Math.max(0.9, Number((textSize - 0.1).toFixed(1))))} disabled={textSize <= 0.9}><Minus size={22} /><span>Diminuir</span></button>
          <span className="am-size-indicator">{textSize === 1 ? "Padrão" : textSize < 1 ? "Menor" : textSize >= 1.3 ? "Maior" : "Grande"}</span>
          <button type="button" aria-label="Aumentar tamanho do texto" onClick={() => setTextSize(Math.min(1.5, Number((textSize + 0.1).toFixed(1))))} disabled={textSize >= 1.5}><Plus size={22} /><span>Aumentar</span></button>
        </div>
        <div className="am-text-preview">Exemplo do tamanho do texto</div>
      </section>
      <section className="am-setting-card">
        <div className="am-setting-title"><span className="am-settings-icon"><Volume2 size={23} /></span><div><h2>Orientação por áudio</h2><p>Preferência de orientação simulada.</p></div><SpeakerControl text="Orientação por áudio. Preferência de orientação simulada. Esta demonstração não reproduz áudio." onRead={onRead} compact /></div>
        <button type="button" className={`am-toggle-row${audioGuidance ? " am-toggle-on" : ""}`} onClick={() => setAudioGuidance(!audioGuidance)} aria-pressed={audioGuidance}>
          <span>{audioGuidance ? "Preferência ativada" : "Preferência desativada"}</span><span className="am-toggle"><span /></span>
        </button>
        <p className="am-setting-footnote">Mesmo ativada, esta opção não reproduz som. Os controles de leitura mostram apenas uma simulação visual.</p>
      </section>
      <section className="am-setting-card am-instructions">
        <div className="am-setting-title"><span className="am-settings-icon"><HelpCircle size={23} /></span><div><h2>Como usar</h2><p>Você está no controle de cada etapa.</p></div><SpeakerControl text="Como usar. Você está no controle de cada etapa." onRead={onRead} compact /></div>
        <ol>
          <li><span>1</span><p>Toque em uma opção para avançar.</p><SpeakerControl text="Toque em uma opção para avançar." onRead={onRead} compact /></li>
          <li><span>2</span><p>Use Voltar para retornar à etapa anterior.</p><SpeakerControl text="Use Voltar para retornar à etapa anterior." onRead={onRead} compact /></li>
          <li><span>3</span><p>Toque em “Ler” para ver uma simulação visual da explicação.</p><SpeakerControl text="Toque em Ler para ver uma simulação visual da explicação. Não há áudio real." onRead={onRead} compact /></li>
        </ol>
      </section>
      <div className="am-help-footer"><Headphones size={20} /><p>Esta é uma demonstração acadêmica e não oferece aconselhamento nem atendimento de saúde.</p><SpeakerControl text="Esta é uma demonstração acadêmica e não oferece aconselhamento nem atendimento de saúde." onRead={onRead} compact /></div>
    </ScreenShell>
  );
}

export function AgendaMais() {
  const [screen, setScreen] = useState<ScreenName>("opening");
  const [history, setHistory] = useState<ScreenName[]>([]);
  const [selectedType, setSelectedType] = useState<VisitType>("online");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [inCall, setInCall] = useState(false);
  const [activeReading, setActiveReading] = useState("");
  const [textSize, setTextSize] = useState(1);
  const [audioGuidance, setAudioGuidance] = useState(false);

  const go = (next: ScreenName) => {
    if (next === "provider" && screen === "type") {
      // The selected visit type is set by the explicit type cards below.
    }
    setHistory((previous) => [...previous, screen]);
    setScreen(next);
    setActiveReading("");
  };
  const back = () => {
    const previous = history[history.length - 1] ?? "home";
    setHistory((items) => items.slice(0, -1));
    setScreen(previous);
    setActiveReading("");
  };
  const read = (text: string) => setActiveReading(text);
  const confirm = () => {
    setBooking({ type: selectedType, day, time });
    setInCall(false);
    go("success");
  };
  const props: SharedProps = { onGo: go, onRead: read, booking };

  return (
    <div className="agendamais-app" style={{ "--am-scale": textSize } as CSSProperties}>
      <style>{styles}</style>
      <div className="am-phone">
        <div className="am-app-scroll">
          {screen === "opening" && <OpeningScreen {...props} />}
          {screen === "home" && <HomeScreen {...props} />}
          {screen === "type" && <TypeScreen {...props} onChoose={(type) => setSelectedType(type)} />}
          {screen === "provider" && <ProviderScreen {...props} selectedType={selectedType} />}
          {screen === "schedule" && <ScheduleScreen {...props} selectedType={selectedType} day={day} time={time} setDay={setDay} setTime={setTime} />}
          {screen === "confirmation" && <ConfirmationScreen {...props} selectedType={selectedType} day={day} time={time} onConfirm={confirm} />}
          {screen === "success" && <SuccessScreen {...props} />}
          {screen === "appointments" && <AppointmentsScreen {...props} />}
          {screen === "online" && <OnlineScreen {...props} inCall={inCall} setInCall={setInCall} />}
          {screen === "help" && <HelpScreen {...props} textSize={textSize} setTextSize={setTextSize} audioGuidance={audioGuidance} setAudioGuidance={setAudioGuidance} />}
        </div>
        {activeReading && (
          <div className="am-reading-demo" role="status" aria-live="polite">
            <div className="am-reading-heading"><Volume2 size={20} /><strong>Leitura demonstrativa</strong><button type="button" onClick={() => setActiveReading("")} aria-label="Parar leitura"><X size={21} /></button></div>
            <p>{activeReading}</p>
            <span>Simulação visual de leitura — sem áudio real</span>
            <button type="button" className="am-stop-reading" onClick={() => setActiveReading("")}>Parar leitura</button>
          </div>
        )}
        <div className="am-persistent-note"><span />Protótipo acadêmico · dados fictícios</div>
      </div>
    </div>
  );
}

const styles = `
  .agendamais-app{--purple:#35145B;--purple-mid:#573583;--lilac:#D8C5F0;--lilac-soft:#F2ECF9;--ink:#21172C;--muted:#655B70;--line:#E5DDEA;--cream:#FBF9FD;--mint:#E9F2EE;min-height:100dvh;background:#EDE8F2;color:var(--ink);font-family:"Atkinson Hyperlegible","Nunito Sans",ui-sans-serif,system-ui,sans-serif;font-size:calc(16px * var(--am-scale,1));line-height:1.45;display:flex;justify-content:center;align-items:stretch;padding:0;box-sizing:border-box}
  .agendamais-app *{box-sizing:border-box}
  .agendamais-app button{font:inherit;color:inherit}
  .am-phone{position:relative;display:flex;flex-direction:column;width:100%;max-width:480px;min-height:100dvh;background:#FCFAFD;overflow:hidden;box-shadow:0 10px 50px rgba(53,20,91,.10)}
  .am-app-scroll{flex:1;overflow-y:auto;padding-bottom:48px;scrollbar-width:thin;scrollbar-color:#C9B9D8 transparent}
  .am-persistent-note{position:absolute;bottom:0;left:0;right:0;min-height:35px;display:flex;align-items:center;justify-content:center;gap:8px;background:#F2ECF9;border-top:1px solid #E4D9EF;color:#443254;font-size:.72em;font-weight:700;letter-spacing:.015em;z-index:5}
  .am-persistent-note span{width:8px;height:8px;border-radius:50%;background:#74539A}
  .am-topbar{height:64px;padding:0 22px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;border-bottom:1px solid #F0EBF3;background:#FCFAFD}
  .am-wordmark{color:var(--purple);font-size:1.1em;letter-spacing:-.045em;font-weight:850;white-space:nowrap}
  .am-wordmark span{color:#7954A4}
  .am-back{min-height:44px;display:flex;align-items:center;gap:6px;padding:0 5px;border:0;background:none;color:var(--purple);font-size:.88em;font-weight:750;cursor:pointer}
  .am-step{justify-self:end;color:#72647F;font-size:.72em;font-weight:750;white-space:nowrap}
  .am-topbar-spacer{min-width:45px}
  .am-heading{padding:25px 23px 14px}
  .am-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  .am-heading h1{margin:0;color:var(--purple);font-size:1.65em;line-height:1.16;letter-spacing:-.035em;font-weight:850}
  .am-heading>p{margin:9px 0 0;color:#5C5265;font-size:.95em;line-height:1.5}
  .am-screen-content{padding:0 20px 26px}
  .am-speaker{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:9px 14px;border:1.5px solid #BBA8D0;border-radius:14px;background:#F7F2FB;color:var(--purple);font-size:.86em;font-weight:800;cursor:pointer;transition:background .16s,transform .16s}
  .am-speaker:hover{background:#EDE3F6}
  .am-speaker:active,.am-button:active,.am-function-main:active{transform:scale(.985)}
  .am-speaker-compact{min-height:42px;padding:8px 10px;gap:6px;border-radius:13px;font-size:.74em;white-space:nowrap;flex-shrink:0}
  .am-button{width:100%;min-height:56px;display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 18px;border:2px solid var(--purple);border-radius:16px;background:var(--purple);color:white!important;font-size:1em;font-weight:800;cursor:pointer;box-shadow:0 4px 0 rgba(53,20,91,.1);transition:background .16s,transform .16s}
  .am-button:hover{background:#48216F}
  .am-button:disabled{background:#B6A9C2;border-color:#B6A9C2;box-shadow:none;cursor:not-allowed}
  .am-button-secondary{background:#fff;color:var(--purple)!important;border-color:#BBA8D0;box-shadow:none}
  .am-button-secondary:hover{background:#F6F1FA}
  .am-button:focus-visible,.am-speaker:focus-visible,.am-back:focus-visible,.am-function-main:focus-visible,.am-day:focus-visible,.am-time:focus-visible,.am-toggle-row:focus-visible,.am-size-controls button:focus-visible{outline:3px solid #9777BC;outline-offset:3px}
  .am-opening{min-height:100dvh;padding:0 23px 55px;display:flex;flex-direction:column}
  .am-opening-top{height:68px;display:flex;align-items:center;justify-content:space-between}
  .am-demo-pill{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:100px;background:#F0E8F7;color:#51366C;font-size:.71em;font-weight:800}
  .am-demo-pill span{width:7px;height:7px;border-radius:50%;background:#7954A4}
  .am-opening-art{height:260px;margin:16px 0 5px;position:relative;display:flex;align-items:center;justify-content:center}
  .am-art-orbit{position:absolute;border:1px solid #D7C6E6;border-radius:50%;transform:rotate(-28deg)}
  .am-orbit-one{width:235px;height:175px}
  .am-orbit-two{width:282px;height:213px;border-color:#EBE2F1;transform:rotate(31deg)}
  .am-art-calendar{position:relative;width:116px;height:116px;border-radius:34px;background:var(--purple);color:white;display:grid;place-items:center;box-shadow:0 18px 36px rgba(53,20,91,.2);transform:rotate(-7deg)}
  .am-art-calendar:before{content:"";position:absolute;inset:13px;border:1px solid rgba(255,255,255,.32);border-radius:25px}
  .am-art-calendar>span{position:absolute;width:39px;height:39px;right:-14px;bottom:-10px;display:grid;place-items:center;border:4px solid #FCFAFD;border-radius:50%;background:#D8C5F0;color:var(--purple)}
  .am-art-heart{position:absolute;top:40px;right:48px;width:49px;height:49px;border-radius:17px;background:#E8DDF2;color:#624185;display:grid;place-items:center;transform:rotate(9deg)}
  .am-art-dot{position:absolute;width:10px;height:10px;border-radius:50%;background:#BCA5D4}
  .am-dot-one{left:44px;top:83px}.am-dot-two{right:68px;bottom:44px;width:7px;height:7px;background:#8D71A9}
  .am-opening-copy{padding:3px 1px 0}
  .am-eyebrow{color:#745992;font-size:.72em;font-weight:900;letter-spacing:.13em}
  .am-opening-copy h1{max-width:340px;margin:9px 0 12px;color:var(--purple);font-size:2.1em;letter-spacing:-.045em;line-height:1.08;font-weight:900}
  .am-opening-copy>p{margin:0 0 18px;color:#574E5E;font-size:1.01em;line-height:1.55}
  .am-opening-copy .am-speaker{margin-bottom:20px}
  .am-opening-disclaimer{margin:16px 0 0!important;text-align:center;color:#706779!important;font-size:.74em!important}
  .am-welcome-band{display:flex;align-items:flex-start;gap:13px;padding:16px;margin:4px 0 19px;border-radius:17px;background:#F0EAF6}
  .am-welcome-icon{width:43px;height:43px;display:grid;place-items:center;border-radius:14px;background:#E0D2EE;color:#553276;flex-shrink:0}
  .am-welcome-band strong,.am-welcome-band span{display:block}
  .am-welcome-band strong{font-size:.9em;color:var(--purple)}
  .am-welcome-band span{margin-top:3px;font-size:.79em;color:#64586D;line-height:1.4}
  .am-card-list,.am-type-list{display:flex;flex-direction:column;gap:11px}
  .am-function-card{border:1px solid #E7DEED;border-radius:18px;background:#F2ECF9;overflow:hidden}
  .am-card-white{background:white}
  .am-function-main{width:100%;min-height:90px;display:flex;align-items:center;gap:13px;padding:14px 15px;border:0;background:transparent;text-align:left;cursor:pointer}
  .am-card-icon{width:48px;height:48px;display:grid;place-items:center;flex:0 0 48px;border-radius:15px;background:#E4D7F0;color:var(--purple)}
  .am-card-icon svg{width:23px;height:23px;stroke-width:2}
  .am-card-white .am-card-icon{background:#F1ECF4}
  .am-card-copy{display:flex;flex:1;flex-direction:column;gap:3px}
  .am-card-copy strong{color:#2B2034;font-size:.96em;line-height:1.25;font-weight:850}
  .am-card-copy>span{color:#62596B;font-size:.78em;line-height:1.35}
  .am-chevron{flex-shrink:0;color:#71558C}
  .am-card-read{display:flex;justify-content:flex-end;padding:0 14px 11px}
  .am-note{display:flex;align-items:center;gap:9px;margin:15px 1px 4px;color:#5B5065;font-size:.78em}
  .am-note-mark{width:19px;height:19px;display:grid;place-items:center;border-radius:50%;border:1px solid #BBAACB;color:#594172;font-size:.8em;font-weight:800;flex-shrink:0}
  .am-section-label{margin:8px 0 11px;color:#756A7C;font-size:.72em;font-weight:850;letter-spacing:.1em}
  .am-type-list .am-function-main{min-height:94px}
  .am-info-panel{display:flex;align-items:flex-start;gap:10px;margin-top:18px;padding:14px 12px;border:1px solid #E8DFED;border-radius:16px;background:#F8F5FA}
  .am-info-icon{color:#67478B;flex-shrink:0;margin-top:1px}
  .am-info-panel>div{flex:1}
  .am-info-panel strong{font-size:.83em;color:var(--purple)}
  .am-info-panel p{margin:4px 0 0;font-size:.76em;color:#61576B;line-height:1.45}
  .am-info-panel .am-speaker{margin-left:auto}
  .am-provider-card{display:flex;align-items:center;gap:13px;padding:16px 13px;border:1px solid #E7DEED;border-radius:19px;background:#F4EFF8}
  .am-provider-avatar{width:64px;height:64px;display:grid;place-items:center;flex-shrink:0;border:2px solid white;border-radius:50%;background:#D8C5F0;color:#503072}
  .am-provider-copy{min-width:0;flex:1}
  .am-profile-label{font-size:.61em;font-weight:900;letter-spacing:.08em;color:#71578A}
  .am-provider-copy h2{margin:3px 0 2px;font-size:.97em;line-height:1.2;color:#271C31}
  .am-provider-copy p{margin:0;color:#655A6C;font-size:.78em}
  .am-provider-info{margin-top:14px}
  .am-bottom-actions{display:flex;flex-direction:column;gap:10px;margin-top:22px}
  .am-bottom-actions>.am-speaker{align-self:flex-start}
  .am-demo-alert{display:flex;align-items:center;gap:9px;padding:12px 11px;border:1px solid #E4D7EE;border-radius:14px;background:#F1EAF7;color:#4E3569;font-size:.77em;line-height:1.35}
  .am-demo-alert>svg{flex-shrink:0}
  .am-demo-alert>span{flex:1}
  .am-demo-alert strong{font-weight:900}
  .am-day-list{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .am-day{min-height:104px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:1.5px solid #DED3E8;border-radius:17px;background:white;color:#48365C;cursor:pointer}
  .am-day>span{font-size:.69em;font-weight:850;letter-spacing:.06em}
  .am-day>strong{font-size:1.65em;line-height:1.12}
  .am-day>svg{position:absolute;right:8px;top:8px;color:var(--purple)}
  .am-day-selected{border:2px solid var(--purple);background:#F4EFF9;color:var(--purple)}
  .am-screen-content>.am-speaker{margin-top:13px}
  .am-time-heading{display:flex;align-items:center;gap:9px;margin:20px 0 11px;color:#38254D}
  .am-time-heading svg{color:#74578D}
  .am-time-heading strong{font-size:.91em}
  .am-time-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
  .am-time{min-height:53px;display:flex;align-items:center;justify-content:center;gap:8px;border:1.5px solid #DED3E8;border-radius:14px;background:white;color:var(--purple);font-weight:850;cursor:pointer}
  .am-time-selected{background:var(--purple);border-color:var(--purple);color:white}
  .am-muted-small{margin:17px 0 0;text-align:center;font-size:.72em;color:#746A7B}
  .am-confirm-card,.am-success-summary{padding:16px 14px;border:1px solid #E6DDEB;border-radius:19px;background:#F8F5FA}
  .am-confirm-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;color:#786B82;font-size:.68em;font-weight:900;letter-spacing:.1em}
  .am-summary-provider{display:flex;align-items:center;gap:11px;padding-bottom:15px;border-bottom:1px solid #E8E0EC}
  .am-mini-avatar{width:44px;height:44px;display:grid;place-items:center;flex-shrink:0;border-radius:50%;background:#E2D6ED;color:#563876}
  .am-summary-provider strong,.am-summary-provider span{display:block}
  .am-summary-provider strong{font-size:.86em;line-height:1.28}
  .am-summary-provider span{margin-top:3px;color:#6D6276;font-size:.74em}
  .am-summary-row{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:12px 0 0}
  .am-summary-row>span{display:flex;align-items:center;gap:8px;color:#62566B;font-size:.78em}
  .am-summary-row>span svg{color:#755592;flex-shrink:0}
  .am-summary-row>strong{font-size:.77em;text-align:right;line-height:1.35;color:#30243A}
  .am-success{padding:40px 8px 23px;text-align:center}
  .am-success-mark{width:78px;height:78px;display:grid;place-items:center;margin:0 auto 18px;border-radius:50%;background:#E8F1EC;color:#315D48}
  .am-success h1{margin:8px 0 9px;color:var(--purple);font-size:1.8em;line-height:1.12;letter-spacing:-.04em}
  .am-success>p{margin:0 auto 15px;max-width:310px;color:#62576A;font-size:.87em}
  .am-success-summary{margin-bottom:18px}
  .am-success-summary .am-summary-provider{padding-bottom:14px}
  .am-next-label{display:flex;align-items:center;gap:8px;margin:4px 0 11px;color:#71598A;font-size:.68em;font-weight:900;letter-spacing:.08em}
  .am-live-dot{width:8px;height:8px;border-radius:50%;background:#76539A}
  .am-appointment-card{padding:15px 13px;border:1px solid #E4DAEA;border-radius:18px;background:white}
  .am-appointment-date{display:grid;grid-template-columns:23px 1fr auto;align-items:center;gap:6px;color:#62447E;font-size:.8em}
  .am-appointment-date strong{color:#352146;font-size:.9em}
  .am-appointment-content{padding:13px 0 9px}
  .am-appointment-content h2{margin:0;font-size:1em;color:#2C2037}
  .am-appointment-content p{margin:3px 0 11px;color:#6A5E72;font-size:.78em}
  .am-appointment-type{display:inline-flex;align-items:center;gap:7px;padding:6px 9px;border-radius:10px;background:#F2EDF7;color:#563A72;font-size:.76em;font-weight:750}
  .am-appointment-card>.am-speaker{width:100%;justify-content:center;margin-top:7px}
  .am-empty-state{padding:34px 8px 18px;text-align:center}
  .am-empty-icon{width:72px;height:72px;display:grid;place-items:center;margin:0 auto 15px;border-radius:23px;background:#EFE8F5;color:#5E3D7A}
  .am-empty-state h2{margin:0 0 8px;color:#39254F;font-size:1.23em;line-height:1.25}
  .am-empty-state>p{max-width:315px;margin:0 auto 17px;color:#62586A;font-size:.86em}
  .am-empty-state>.am-speaker{margin-bottom:20px}
  .am-call-preview{height:214px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border-radius:21px;background:#352150;color:white;position:relative;overflow:hidden}
  .am-call-preview:before,.am-call-preview:after{content:"";position:absolute;border:1px solid rgba(255,255,255,.12);border-radius:50%;width:250px;height:250px}
  .am-call-preview:after{width:340px;height:340px}
  .am-call-avatar{z-index:1;width:73px;height:73px;display:grid;place-items:center;border-radius:50%;background:#D8C5F0;color:#503072}
  .am-call-preview>span{z-index:1;font-size:.91em;font-weight:800}
  .am-call-preview .am-call-status{font-size:.7em;font-weight:600;color:#E2D5F0}
  .am-call-preview .am-speaker{z-index:1;min-height:37px;margin-top:3px;border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.12);color:white}
  .am-call-active{background:#49316A}
  .am-call-info{display:flex;flex-direction:column;gap:7px;padding:15px 3px;color:#493854;font-size:.83em}
  .am-call-info strong{font-size:.97em;color:#30203E}
  .am-call-info>span{display:flex;align-items:center;gap:8px;color:#665B6F}
  .am-alert-purple{margin:5px 0 18px;background:#F1EAF7}
  .am-screen-content>.am-button{margin-top:5px}
  .am-online-empty{padding-top:53px}
  .am-setting-card{margin-bottom:14px;padding:15px 13px;border:1px solid #E6DDEA;border-radius:18px;background:white}
  .am-setting-title{display:flex;align-items:center;gap:10px}
  .am-settings-icon{width:42px;height:42px;display:grid;place-items:center;flex-shrink:0;border-radius:14px;background:#F0E9F6;color:#563776;font-weight:900}
  .am-settings-icon>span{font-size:1.05em}
  .am-setting-title>div{min-width:0;flex:1}
  .am-setting-title h2{margin:0;color:#352346;font-size:.91em}
  .am-setting-title p{margin:3px 0 0;color:#6D6374;font-size:.73em;line-height:1.35}
  .am-size-controls{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:7px;margin-top:17px}
  .am-size-controls button{min-height:49px;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px;border:1px solid #DCD1E5;border-radius:13px;background:#F9F6FB;color:#4C3267;font-size:.75em;font-weight:800;cursor:pointer}
  .am-size-controls button:disabled{opacity:.48;cursor:not-allowed}
  .am-size-indicator{min-width:48px;text-align:center;font-size:.73em;font-weight:800;color:#65566F}
  .am-text-preview{padding:13px 0 0;text-align:center;color:#422C5D;font-weight:750}
  .am-toggle-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:16px;padding:11px 0 3px;border:0;border-top:1px solid #EFEAF2;background:none;text-align:left;color:#4D4157;font-size:.82em;font-weight:750;cursor:pointer}
  .am-toggle{width:49px;height:28px;padding:3px;border-radius:20px;background:#D8D0DE;transition:background .18s;flex-shrink:0}
  .am-toggle>span{display:block;width:22px;height:22px;border-radius:50%;background:white;box-shadow:0 1px 3px #0002;transition:transform .18s}
  .am-toggle-on .am-toggle{background:#654287}
  .am-toggle-on .am-toggle>span{transform:translateX(21px)}
  .am-setting-footnote{margin:11px 0 0;color:#6D6274;font-size:.71em;line-height:1.45}
  .am-instructions ol{display:flex;flex-direction:column;gap:9px;margin:16px 0 0;padding:0;list-style:none}
  .am-instructions li{display:grid;grid-template-columns:26px 1fr auto;align-items:center;gap:7px}
  .am-instructions li>span{width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#EFE7F5;color:#573776;font-size:.74em;font-weight:900}
  .am-instructions li p{margin:0;color:#51465B;font-size:.77em;line-height:1.35}
  .am-help-footer{display:flex;align-items:flex-start;gap:9px;margin:17px 1px;color:#61566C}
  .am-help-footer>svg{flex-shrink:0;color:#70538C}
  .am-help-footer p{flex:1;margin:0;font-size:.74em;line-height:1.45}
  .am-reading-demo{position:absolute;left:12px;right:12px;bottom:44px;z-index:9;padding:15px 16px 14px;border:2px solid #7D5AA0;border-radius:19px;background:#FFFEFF;box-shadow:0 10px 35px rgba(44,24,65,.24);animation:am-rise .18s ease-out}
  .am-reading-heading{display:flex;align-items:center;gap:8px;color:#482968}
  .am-reading-heading strong{flex:1;font-size:.9em}
  .am-reading-heading>button{width:38px;height:38px;display:grid;place-items:center;border:0;border-radius:12px;background:#F0EAF5;color:#4D306B;cursor:pointer}
  .am-reading-demo p{margin:9px 0;color:#2F2438;font-size:.92em;line-height:1.4;font-weight:700}
  .am-reading-demo>span{display:block;color:#685D70;font-size:.72em}
  .am-stop-reading{width:100%;min-height:44px;margin-top:10px;border:1.5px solid #8469A0;border-radius:12px;background:white;color:#482968;font-size:.82em;font-weight:850;cursor:pointer}
  @keyframes am-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @media(min-width:600px){.agendamais-app{padding:22px 0}.am-phone{min-height:calc(100dvh - 44px);border-radius:30px}.am-opening{min-height:calc(100dvh - 44px)}}
  @media(max-height:700px){.am-opening-art{height:205px}.am-art-calendar{width:94px;height:94px}.am-opening-copy h1{font-size:1.85em}.am-heading{padding-top:19px}.am-app-scroll{padding-bottom:52px}}
`;
