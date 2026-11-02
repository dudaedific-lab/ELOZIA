import {
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock3,
  Files,
  Wallet,
  MessageSquare,
  ClipboardList,
  Settings,
  LogOut,
  Search,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Check,
  CheckCircle2,
  X,
  Download,
  Upload,
  MoreHorizontal,
  Sparkles,
  Send,
  Bell,
  Menu,
  ShieldCheck,
  CalendarDays,
  Building2,
  Filter,
  FileText,
  AlertCircle,
  Loader2,
  Sun,
  LifeBuoy,
  Briefcase,
  PanelLeftClose,
} from "lucide-react";
import {
  api,
  initials,
  formatDate,
  formatTime,
  today,
  requestText,
} from "./api";
import type {
  User,
  Company,
  Employee,
  RequestItem,
  DocumentItem,
  Message,
  Data,
  Health,
  Admission,
} from "./types";
const roleNames = {
  admin: "Administradora de RH",
  manager: "Gestor de equipe",
  employee: "Funcionário",
};
const statusNames: Record<string, string> = {
  active: "Ativo",
  onboarding: "Em admissão",
  away: "Afastado",
  inactive: "Inativo",
  pending: "Aguardando análise",
  approved: "Aprovada",
  rejected: "Devolvida",
  draft: "Em conferência",
  published: "Publicado",
  invited: "A iniciar",
  collecting: "Coleta de dados",
  review: "Em conferência",
  completed: "Concluída",
};
const kindNames: Record<string, string> = {
  vacation: "Férias",
  adjustment: "Ajuste de ponto",
  document: "Documento",
  registration: "Cadastro",
  other: "Outros",
  contract: "Contrato",
  identity: "Identificação",
  certificate: "Certificado",
  payslip: "Holerite",
  entry: "Entrada",
  break_start: "Saída para intervalo",
  break_end: "Retorno do intervalo",
  exit: "Saída",
};
const stageNames = ["invited", "collecting", "review", "completed"];
const empty: Data = {
  employees: [],
  punches: [],
  requests: [],
  documents: [],
  messages: [],
  admissions: [],
  audit: [],
};
const links = [
  { id: "inicio", label: "Visão geral", icon: LayoutDashboard },
  { id: "pessoas", label: "Pessoas", icon: Users },
  { id: "admissoes", label: "Admissões", icon: UserPlus, admin: true },
  { id: "ponto", label: "Jornada e ponto", icon: Clock3 },
  { id: "solicitacoes", label: "Solicitações", icon: ClipboardList },
  { id: "documentos", label: "Documentos", icon: Files },
  { id: "holerites", label: "Holerites", icon: Wallet },
  { id: "mensagens", label: "Comunicação", icon: MessageSquare },
  { id: "auditoria", label: "Histórico", icon: ShieldCheck, admin: true },
  { id: "configuracoes", label: "Configurações", icon: Settings, admin: true },
];
function Mark({ small = false }: { small?: boolean }) {
  return (
    <div className={"brand " + (small ? "small" : "")}>
      <span className="brand-icon">
        <span />
        <span />
        <span />
      </span>
      <span>
        elozia<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
function Avatar({
  name,
  color,
  size = "",
}: {
  name: string;
  color?: string;
  size?: string;
}) {
  return (
    <span
      className={"avatar " + size}
      style={{ background: color ?? "#e6eee7" }}
    >
      {initials(name)}
    </span>
  );
}
function Badge({ status }: { status: string }) {
  return (
    <span className={"badge " + status}>
      <i />
      {statusNames[status] ?? status}
    </span>
  );
}
function EmptyState({
  icon: Icon = Files,
  title,
  body,
  action,
}: {
  icon?: typeof Files;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={25} />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
function Button({
  children,
  onClick,
  variant = "",
  disabled = false,
  type = "button",
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  [key: string]: unknown;
}) {
  return (
    <button
      {...rest}
      type={type}
      className={"button " + variant}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const elements = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,[tabindex="0"]',
        ) ?? [],
      );
    elements()[0]?.focus();
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const el = elements();
        if (e.shiftKey && document.activeElement === el[0]) {
          e.preventDefault();
          el.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === el.at(-1)) {
          e.preventDefault();
          el[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" aria-label="Fechar" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Form({
  children,
  onSubmit,
  submit = "Salvar",
  onClose,
}: {
  children: ReactNode;
  onSubmit: (f: FormData) => Promise<void>;
  submit?: string;
  onClose?: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await onSubmit(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={handle}>
      {children}
      {error && (
        <div role="alert" className="form-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <div className="form-actions">
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 size={16} className="spin" /> : <Check size={16} />}{" "}
          {busy ? "Salvando…" : submit}
        </Button>
      </div>
    </form>
  );
}
function Login({
  onLogin,
  health,
}: {
  onLogin: () => Promise<void>;
  health: Health | null;
}) {
  const [signup, setSignup] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function demo(email: string) {
    setBusy(true);
    setError("");
    try {
      await api("/auth/login", "POST", { email, password: "Elozia@2026" });
      await onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-screen">
      <section className="login-story">
        <Mark />
        <div>
          <span className="eyebrow">MAIS TEMPO PARA O QUE IMPORTA</span>
          <h1>
            Gente bem cuidada.
            <br />
            Rotina mais leve.
          </h1>
          <p>
            Conecte pessoas, simplifique processos e transforme a rotina do seu
            RH.
          </p>
          <div className="story-visual">
            <div className="story-card">
              <span className="round-icon">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <strong>Tudo no seu ritmo</strong>
                <small>Pessoas, documentos e jornada.</small>
              </div>
            </div>
            <div className="story-leaf l1" />
            <div className="story-leaf l2" />
            <div className="story-leaf l3" />
            <div className="story-chip">
              <Sparkles size={16} /> Menos tarefas. Mais pessoas.
            </div>
          </div>
        </div>
        <span className="story-footer">Elozia · Seu RH, mais próximo.</span>
      </section>
      <section className="login-main">
        <div className="login-box">
          <span className="eyebrow">BEM-VINDO À ELOZIA</span>
          <h2>{signup ? "Vamos começar?" : "Bom ter você aqui."}</h2>
          <p>
            {signup
              ? "Crie o ambiente da sua empresa."
              : "Entre para acompanhar o que acontece por aqui."}
          </p>
          <Form
            submit={signup ? "Criar minha empresa" : "Entrar na minha conta"}
            onSubmit={async (f) => {
              await api(
                "/auth/" + (signup ? "signup" : "login"),
                "POST",
                Object.fromEntries(f),
              );
              await onLogin();
            }}
          >
            {signup && (
              <>
                <Field label="Nome da empresa">
                  <input
                    name="company"
                    required
                    placeholder="Como sua empresa se chama?"
                  />
                </Field>
                <Field label="Seu nome">
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Nome completo"
                  />
                </Field>
              </>
            )}
            <Field label="E-mail">
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@empresa.com.br"
              />
            </Field>
            <Field label="Senha">
              <input
                name="password"
                type="password"
                required
                minLength={signup ? 10 : 1}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={signup ? "Pelo menos 10 caracteres" : "Sua senha"}
              />
            </Field>
          </Form>
          <p className="login-toggle">
            {signup ? "Já tem uma conta?" : "Primeira vez por aqui?"}{" "}
            <button onClick={() => setSignup(!signup)}>
              {signup ? "Entrar" : "Criar empresa"}
            </button>
          </p>
          {health?.demo && (
            <div className="demo-box">
              <strong>Conheça com dados fictícios</strong>
              <p>
                Explore cada experiência. As alterações ficam salvas neste
                ambiente de demonstração.
              </p>
              <div>
                {[
                  ["RH", "marina@exemplo.test"],
                  ["Gestor", "lucas@exemplo.test"],
                  ["Funcionário", "beatriz@exemplo.test"],
                ].map(([label, email]) => (
                  <button
                    key={email}
                    disabled={busy}
                    onClick={() => demo(email)}
                  >
                    {label}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
              {error && <p role="alert">{error}</p>}
            </div>
          )}
          <small className="login-foot">
            <ShieldCheck size={13} /> Seus dados em um ambiente protegido por
            acesso.
          </small>
        </div>
      </section>
    </div>
  );
}
export function App() {
  const [user, setUser] = useState<User | null>(null),
    [company, setCompany] = useState<Company | null>(null),
    [health, setHealth] = useState<Health | null>(null),
    [data, setData] = useState<Data>(empty),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [page, setPage] = useState(location.hash.slice(2) || "inicio"),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(""),
    [assistant, setAssistant] = useState(false),
    [modal, setModal] = useState<string | null>(null),
    [selected, setSelected] = useState<any>(null),
    [toast, setToast] = useState("");
  const navigate = (id: string) => {
    setPage(id);
    location.hash = "/" + id;
    setSearch("");
    setMobile(false);
  };
  async function refresh(u = user) {
    if (!u) return;
    const [
      employees,
      punches,
      requests,
      documents,
      messages,
      admissions,
      audit,
    ] = await Promise.all([
      api<Data["employees"]>("/employees"),
      api<Data["punches"]>("/punches"),
      api<Data["requests"]>("/requests"),
      api<Data["documents"]>("/documents"),
      api<Data["messages"]>("/messages"),
      u.role === "admin" ? api<Data["admissions"]>("/admissions") : [],
      u.role === "admin" ? api<Data["audit"]>("/audit") : [],
    ]);
    setData({
      employees,
      punches,
      requests,
      documents,
      messages,
      admissions,
      audit,
    });
  }
  async function bootstrap() {
    try {
      const me = await api<{ user: User; company: Company }>("/me");
      setUser(me.user);
      setCompany(me.company);
      await refresh(me.user);
    } catch (e) {
      if ((e as Error).message.includes("Entre na sua conta")) {
        setUser(null);
        setData(empty);
      } else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    api<Health>("/health")
      .then(setHealth)
      .catch(() =>
        setError(
          "O servidor não está disponível. Tente novamente em instantes.",
        ),
      );
    bootstrap();
    const change = () => setPage(location.hash.slice(2) || "inicio");
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const notify = (text: string) => setToast(text);
  async function mutate(
    path: string,
    method: string,
    payload: unknown,
    message: string,
  ) {
    await api(path, method, payload);
    await refresh();
    setModal(null);
    setSelected(null);
    notify(message);
  }
  const open = (kind: string, item?: unknown) => {
    setSelected(item ?? null);
    setModal(kind);
  };
  if (page.startsWith("convite/"))
    return (
      <Invitation
        token={page.slice("convite/".length)}
        onExit={() => navigate("inicio")}
      />
    );
  if (loading)
    return (
      <div className="app-loading">
        <Mark />
        <Loader2 className="spin" />
        <p>Preparando seu espaço…</p>
      </div>
    );
  if (!user)
    return (
      <>
        {error && (
          <div className="global-error" role="alert">
            {error}
          </div>
        )}
        <Login
          health={health}
          onLogin={async () => {
            setError("");
            await bootstrap();
            navigate("inicio");
          }}
        />
      </>
    );
  const me = data.employees.find((e) => e.id === user.employee_id),
    pending = data.requests.filter((r) => r.status === "pending"),
    todayPunches = data.punches.filter((p) => p.day === today()),
    isAdmin = user.role === "admin",
    isEmployee = user.role === "employee";
  const current = links.find((l) => l.id === page),
    validPage = current && (!current.admin || isAdmin) ? page : "inicio";
  const employeeResults = search
    ? data.employees
        .filter((e) =>
          (e.name + " " + e.job_title + " " + e.department)
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .slice(0, 5)
    : [];
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <div className="sidebar-brand">
          <Mark small />
          <button
            className="icon-button mobile-only"
            onClick={() => setMobile(false)}
            aria-label="Fechar menu"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>
        <button
          className="company-switch"
          onClick={() =>
            isAdmin ? navigate("configuracoes") : navigate("inicio")
          }
        >
          <span className="company-symbol">{company?.name.slice(0, 1)}</span>
          <span>
            <strong>{company?.name}</strong>
            <small>{isEmployee ? "Meu espaço" : "Espaço da empresa"}</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <span className="nav-label">SEU DIA A DIA</span>
        <nav>
          {links
            .filter((l) => !l.admin || isAdmin)
            .map((l) => (
              <button
                key={l.id}
                aria-label={
                  isEmployee && l.id === "pessoas"
                    ? "Meu cadastro"
                    : isEmployee && l.id === "ponto"
                      ? "Meu ponto"
                      : l.label
                }
                className={"nav-link " + (validPage === l.id ? "active" : "")}
                onClick={() => navigate(l.id)}
              >
                <l.icon size={19} />
                <span>
                  {isEmployee && l.id === "pessoas"
                    ? "Meu cadastro"
                    : isEmployee && l.id === "ponto"
                      ? "Meu ponto"
                      : l.label}
                </span>
                {l.id === "solicitacoes" && pending.length > 0 && (
                  <b>{pending.length}</b>
                )}
                {l.id === "mensagens" &&
                  data.messages.some((m) => !m.read_at) && (
                    <i className="unread-dot" />
                  )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="assistant-teaser">
            <span className="sparkle-box">
              <Sparkles size={18} />
            </span>
            <strong>Uma ajuda na sua rotina</strong>
            <p>Encontre suas prioridades sem procurar em cada tela.</p>
            <button onClick={() => setAssistant(true)}>
              Abrir assistente <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="help-link" onClick={() => open("help")}>
            <LifeBuoy size={17} /> Precisa de uma mão?
          </button>
          <button className="profile" onClick={() => open("profile")}>
            <Avatar name={user.name} />
            <span>
              <strong>{user.name}</strong>
              <small>{roleNames[user.role]}</small>
            </span>
            <MoreHorizontal size={17} />
          </button>
        </div>
      </aside>
      {mobile && (
        <div className="sidebar-scrim" onClick={() => setMobile(false)} />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-only"
              onClick={() => setMobile(true)}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <span>Meu espaço</span>
            <ChevronRight size={13} />
            <strong>{links.find((l) => l.id === validPage)?.label}</strong>
          </div>
          <div className="topbar-tools">
            <div className="global-search">
              <Search size={16} />
              <input
                aria-label="Buscar pessoas"
                placeholder="Buscar pessoas…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌕</kbd>
              {search && (
                <div className="search-results">
                  {employeeResults.length ? (
                    employeeResults.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => {
                          setSearch("");
                          open("employee", e);
                        }}
                      >
                        <Avatar name={e.name} />
                        <span>
                          {e.name}
                          <small>{e.job_title}</small>
                        </span>
                        <ArrowUpRight size={14} />
                      </button>
                    ))
                  ) : (
                    <p>Nenhuma pessoa encontrada.</p>
                  )}
                </div>
              )}
            </div>
            <span className="environment-label">
              {health?.demo ? "Demonstração" : "Meu ambiente"}
            </span>
            <button
              className="icon-button notification-bell"
              aria-label="Abrir mensagens"
              onClick={() => navigate("mensagens")}
            >
              <Bell size={19} />
              {data.messages.some((m) => !m.read_at) && <i />}
            </button>
            <Avatar name={user.name} size="sm" />
          </div>
        </header>
        <main className="page-content">
          {error && (
            <div className="form-error" role="alert">
              {error}
              <button
                onClick={() => {
                  setError("");
                  refresh().catch((e) => setError(e.message));
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}
          {validPage === "inicio" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow greeting">
                    <Sun size={15} />{" "}
                    {formatDate(new Date().toISOString(), {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <h1>
                    Olá, {user.name.split(" ")[0]}
                    <span className="wave">✺</span>
                  </h1>
                  <p>Um olhar para as pessoas. Um respiro para a sua rotina.</p>
                </div>
                <div className="heading-actions">
                  <Button variant="secondary" onClick={() => navigate("ponto")}>
                    <CalendarDays size={16} /> Ver jornada
                  </Button>
                  {isAdmin ? (
                    <Button onClick={() => open("new-employee")}>
                      <Plus size={17} /> Novo funcionário
                    </Button>
                  ) : (
                    <Button onClick={() => open("new-request")}>
                      <Plus size={17} /> Nova solicitação
                    </Button>
                  )}
                </div>
              </div>
              <div className="overview-banner">
                <div>
                  <span className="banner-eyebrow">
                    <span /> SEU RH, MAIS PRÓXIMO
                  </span>
                  <h2>Mais tempo para cuidar de gente.</h2>
                  <p>
                    {pending.length
                      ? `Você tem ${pending.length} ${pending.length > 1 ? "solicitações" : "solicitação"} para acompanhar. Vamos dar o próximo passo?`
                      : "Tudo começa com uma rotina bem organizada. Seu espaço está pronto."}
                  </p>
                  <button onClick={() => navigate("solicitacoes")}>
                    Organizar meu dia <ArrowRight size={16} />
                  </button>
                </div>
                <div className="banner-art" aria-hidden="true">
                  <span className="art-ring" />
                  <span className="art-leaf leaf-a" />
                  <span className="art-leaf leaf-b" />
                  <span className="art-leaf leaf-c" />
                  <span className="art-dot" />
                  <span className="art-spark">✳</span>
                </div>
              </div>
              <div className="stats-grid">
                {[
                  {
                    label: isEmployee ? "Meu vínculo" : "Pessoas na empresa",
                    value: isEmployee ? "Ativo" : data.employees.length,
                    detail: isEmployee
                      ? me?.job_title
                      : `${data.employees.filter((e) => e.status === "active").length} com vínculo ativo`,
                    icon: Users,
                    color: "green",
                    page: "pessoas",
                  },
                  {
                    label: "Admissões em andamento",
                    value: isAdmin
                      ? data.admissions.filter((a) => a.stage !== "completed")
                          .length
                      : data.employees.filter((e) => e.status === "onboarding")
                          .length,
                    detail: "Um novo começo por aqui",
                    icon: UserPlus,
                    color: "peach",
                    page: isAdmin ? "admissoes" : "pessoas",
                  },
                  {
                    label: "Solicitações pendentes",
                    value: pending.length,
                    detail: isEmployee
                      ? "Acompanhe seus pedidos"
                      : "Pessoas esperando sua atenção",
                    icon: ClipboardList,
                    color: "purple",
                    page: "solicitacoes",
                  },
                  {
                    label: "Marcações de hoje",
                    value: todayPunches.length,
                    detail: "Registros recebidos no ambiente",
                    icon: Clock3,
                    color: "blue",
                    page: "ponto",
                  },
                ].map((s) => (
                  <button
                    className="stat-card"
                    key={s.label}
                    onClick={() => navigate(s.page)}
                  >
                    <span className="stat-top">
                      {s.label}
                      <span className={"stat-icon " + s.color}>
                        <s.icon size={18} />
                      </span>
                    </span>
                    <strong className="stat-value">{s.value}</strong>
                    <span className="stat-detail">
                      {s.detail}
                      <ArrowUpRight size={14} />
                    </span>
                  </button>
                ))}
              </div>
              <div className="dashboard-grid">
                <section className="card attention-card">
                  <div className="card-title">
                    <div>
                      <h2>
                        O que precisa de atenção{" "}
                        <span className="count-pill">{pending.length}</span>
                      </h2>
                      <p>Pequenos passos que fazem a rotina andar.</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => navigate("solicitacoes")}
                    >
                      Ver tudo <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div className="attention-list">
                    {pending.length ? (
                      pending.slice(0, 4).map((r, i) => (
                        <button
                          className="attention-row"
                          key={r.id}
                          onClick={() => open("request-detail", r)}
                        >
                          <span
                            className={
                              "task-icon " +
                              ["peach", "purple", "blue", "green"][i % 4]
                            }
                          >
                            {r.kind === "vacation" ? (
                              <CalendarDays size={18} />
                            ) : r.kind === "adjustment" ? (
                              <Clock3 size={18} />
                            ) : (
                              <FileText size={18} />
                            )}
                          </span>
                          <span className="attention-text">
                            <strong>{r.title}</strong>
                            <small>
                              {r.employee_name} <span>·</span>{" "}
                              {kindNames[r.kind]}
                            </small>
                          </span>
                          <span className="attention-date">
                            {formatDate(r.created_at, {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))
                    ) : (
                      <EmptyState
                        icon={CheckCircle2}
                        title="Tudo em dia por aqui"
                        body="As novas solicitações aparecerão neste espaço."
                      />
                    )}
                  </div>
                  <div className="card-foot">
                    <ShieldCheck size={14} /> Cada decisão tem responsável e
                    histórico.
                  </div>
                </section>
                <section className="card quick-card">
                  <div className="card-title">
                    <div>
                      <h2>Um atalho para facilitar</h2>
                      <p>O que você mais precisa, por perto.</p>
                    </div>
                  </div>
                  <div className="quick-grid">
                    {[
                      {
                        label: isAdmin ? "Adicionar pessoa" : "Meu cadastro",
                        icon: UserPlus,
                        action: () =>
                          isAdmin ? open("new-employee") : navigate("pessoas"),
                      },
                      {
                        label: "Registrar ponto",
                        icon: Clock3,
                        action: () => navigate("ponto"),
                      },
                      {
                        label: "Enviar documento",
                        icon: Upload,
                        action: () => open("new-document"),
                      },
                      {
                        label: "Nova solicitação",
                        icon: ClipboardList,
                        action: () => open("new-request"),
                      },
                    ].map((q) => (
                      <button key={q.label} onClick={q.action}>
                        <q.icon size={21} />
                        <span>{q.label}</span>
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                  </div>
                  <div className="quick-note">
                    <Sparkles size={20} />
                    <div>
                      <strong>Conte com uma ajuda extra</strong>
                      <p>Um resumo do que importa no seu dia.</p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Abrir assistente"
                      onClick={() => setAssistant(true)}
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </section>
              </div>
              <section className="card team-card">
                <div className="card-title">
                  <div>
                    <h2>
                      {isEmployee
                        ? "Seu espaço na equipe"
                        : "Gente que faz acontecer"}
                    </h2>
                    <p>
                      {isEmployee
                        ? "Seu cadastro e vínculo com a empresa."
                        : "Uma equipe, muitas histórias."}
                    </p>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => navigate("pessoas")}
                  >
                    Ver pessoas <ArrowUpRight size={14} />
                  </button>
                </div>
                <div className="team-preview">
                  {data.employees.slice(0, 5).map((e) => (
                    <button key={e.id} onClick={() => open("employee", e)}>
                      <Avatar name={e.name} color={e.avatar_color} size="lg" />
                      <strong>{e.name}</strong>
                      <span>{e.job_title}</span>
                      <small>{e.department}</small>
                    </button>
                  ))}
                </div>
              </section>
              <footer className="page-footer">
                <span>Elozia · Feita para aproximar.</span>
                <span>
                  <span className="status-dot" /> Dados atualizados nesta sessão
                </span>
              </footer>
            </>
          )}
          {validPage === "pessoas" && (
            <People
              employees={data.employees}
              isAdmin={isAdmin}
              open={open}
              mutate={mutate}
            />
          )}
          {validPage === "admissoes" && (
            <>
              <PageHeading
                eyebrow="NOVOS COMEÇOS"
                title="Admissões"
                description="Acompanhe cada pessoa, da preparação ao novo vínculo."
                action={
                  <Button onClick={() => open("new-admission")}>
                    <Plus size={17} /> Preparar admissão
                  </Button>
                }
              />
              <div className="info-strip">
                <UserPlus size={18} /> Prepare o vínculo, gere um convite seguro
                e confira os dados enviados pela pessoa antes de concluir.
              </div>
              <div className="kanban">
                {stageNames.map((stage) => (
                  <section className="kanban-column" key={stage}>
                    <h3>
                      <span className={"stage-dot " + stage} />
                      {statusNames[stage]}
                      <span>
                        {
                          data.admissions.filter((a) => a.stage === stage)
                            .length
                        }
                      </span>
                    </h3>
                    {data.admissions
                      .filter((a) => a.stage === stage)
                      .map((a) => (
                        <div className="admission-card" key={a.id}>
                          <Avatar name={a.name} />
                          <h4>{a.name}</h4>
                          <p>{a.job_title}</p>
                          <small>
                            <CalendarDays size={13} /> Início:{" "}
                            {formatDate(a.start_date)}
                          </small>
                          <div>
                            {stage !== "completed" ? (
                              <>
                                <button
                                  onClick={() => open("advance-admission", a)}
                                >
                                  Avançar etapa <ArrowRight size={14} />
                                </button>
                                <button
                                  style={{ marginTop: 12 }}
                                  onClick={async () => {
                                    try {
                                      const invite = await api<{
                                        token: string;
                                        expires_at: string;
                                      }>(
                                        "/admissions/" + a.id + "/invitation",
                                        "POST",
                                        {},
                                      );
                                      await refresh();
                                      open("invitation-link", {
                                        ...invite,
                                        name: a.name,
                                      });
                                    } catch (e) {
                                      notify((e as Error).message);
                                    }
                                  }}
                                >
                                  Gerar convite <ArrowUpRight size={14} />
                                </button>
                              </>
                            ) : (
                              <Badge status="completed" />
                            )}
                          </div>
                        </div>
                      ))}
                    {!data.admissions.some((a) => a.stage === stage) && (
                      <p className="kanban-empty">
                        Nenhuma pessoa nesta etapa.
                      </p>
                    )}
                  </section>
                ))}
              </div>
            </>
          )}
          {validPage === "ponto" && (
            <TimePage
              data={data}
              user={user}
              notify={notify}
              refresh={refresh}
              open={open}
            />
          )}
          {validPage === "solicitacoes" && (
            <Requests data={data} user={user} open={open} />
          )}
          {(validPage === "documentos" || validPage === "holerites") && (
            <Documents
              data={data}
              isAdmin={isAdmin}
              payslips={validPage === "holerites"}
              open={open}
            />
          )}
          {validPage === "mensagens" && (
            <>
              <PageHeading
                eyebrow="CONVERSAS QUE APROXIMAM"
                title="Comunicação"
                description="Avisos, orientações e conversas com histórico."
                action={
                  <Button onClick={() => open("new-message")}>
                    <Plus size={17} /> Nova mensagem
                  </Button>
                }
              />
              <div className="messages-grid">
                {data.messages.length ? (
                  data.messages.map((m) => (
                    <article
                      className={
                        "card message-card " + (!m.read_at ? "unread" : "")
                      }
                      key={m.id}
                    >
                      <div className="message-meta">
                        <Avatar name={m.sender_name} />
                        <span>
                          <strong>{m.sender_name}</strong>
                          <small>
                            {m.employee_id
                              ? "Conversa com o RH"
                              : "Comunicado para a empresa"}
                          </small>
                        </span>
                        <time>{formatDate(m.created_at)}</time>
                      </div>
                      <h2>{m.title}</h2>
                      <p className="message-body">{m.body}</p>
                      <div className="message-foot">
                        {m.read_at ? (
                          <span>
                            <CheckCircle2 size={14} /> Leitura registrada
                          </span>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              mutate(
                                "/messages/" + m.id + "/read",
                                "POST",
                                {},
                                "Leitura registrada.",
                              ).catch((e) => notify(e.message))
                            }
                          >
                            <Check size={14} /> Marcar como lida
                          </Button>
                        )}
                        <button
                          className="text-link"
                          onClick={() => open("new-message", m)}
                        >
                          Responder <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <section className="card">
                    <EmptyState
                      icon={MessageSquare}
                      title="Vamos começar uma conversa?"
                      body="As mensagens da sua empresa e as conversas com o RH ficam aqui."
                    />
                  </section>
                )}
              </div>
            </>
          )}
          {validPage === "auditoria" && (
            <>
              <PageHeading
                eyebrow="CONFIANÇA EM CADA ETAPA"
                title="Histórico de atividades"
                description="Quem fez, o que mudou e quando aconteceu."
              />
              <section className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Responsável</th>
                        <th>Atividade</th>
                        <th>Detalhe</th>
                        <th>Data e hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.audit.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div className="person-cell">
                              <Avatar name={a.actor_name} />
                              <strong>{a.actor_name}</strong>
                            </div>
                          </td>
                          <td>{actionLabel(a.action)}</td>
                          <td className="muted">
                            {a.detail || "Registro de acesso"}
                          </td>
                          <td>
                            {formatDate(a.created_at)} ·{" "}
                            {formatTime(a.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!data.audit.length && (
                  <EmptyState
                    title="Seu histórico começa aqui"
                    body="As próximas ações serão registradas automaticamente."
                  />
                )}
              </section>
            </>
          )}
          {validPage === "configuracoes" && (
            <>
              <PageHeading
                eyebrow="DO SEU JEITO"
                title="Configurações"
                description="O espaço da sua empresa, com cada coisa no lugar."
              />
              <div className="settings-grid">
                <section className="card settings-card">
                  <div className="section-icon">
                    <Building2 size={22} />
                  </div>
                  <h2>Dados da empresa</h2>
                  <p>Informações exibidas para sua equipe.</p>
                  <Form
                    submit="Salvar dados da empresa"
                    onSubmit={async (f) => {
                      await api("/company", "PATCH", Object.fromEntries(f));
                      await bootstrap();
                      notify("Dados da empresa atualizados.");
                    }}
                  >
                    <Field label="Nome de exibição">
                      <input
                        name="name"
                        defaultValue={company?.name}
                        required
                      />
                    </Field>
                    <Field label="Razão social">
                      <input
                        name="legal_name"
                        defaultValue={company?.legal_name}
                        required
                      />
                    </Field>
                    <Field label="CNPJ">
                      <input
                        name="tax_id"
                        defaultValue={company?.tax_id}
                        placeholder="00.000.000/0000-00"
                      />
                    </Field>
                  </Form>
                </section>
                <section className="card settings-card">
                  <div className="section-icon">
                    <Sparkles size={22} />
                  </div>
                  <h2>Assistência na sua rotina</h2>
                  <p>
                    {health?.ai
                      ? "Assistente com provedor de IA conectado."
                      : "O resumo operacional usa os dados e as regras do seu ambiente. O provedor de IA ainda não está conectado."}
                  </p>
                  <div className="setting-line">
                    <span>Ações que alteram dados</span>
                    <Badge status="Confirmação obrigatória" />
                  </div>
                  <div className="setting-line">
                    <span>Acesso às informações</span>
                    <span>Conforme seu perfil</span>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setAssistant(true)}
                  >
                    <Sparkles size={16} /> Conhecer assistente
                  </Button>
                  <hr />
                  <h3>Integrações</h3>
                  <div className="integration">
                    <span className="integration-logo">T</span>
                    <div>
                      <strong>Thirdia</strong>
                      <p>TST e conformidade · Integração futura</p>
                    </div>
                    <span className="tag">Em breve</span>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
      <button
        className="assistant-fab"
        aria-label="Abrir assistente Elozia"
        onClick={() => setAssistant(true)}
      >
        <Sparkles size={22} />
      </button>
      {assistant && (
        <Assistant
          health={health}
          onClose={() => setAssistant(false)}
          navigate={navigate}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button aria-label="Fechar aviso" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          title={modalTitle(modal, selected)}
          subtitle={modalSubtitle(modal)}
          onClose={() => setModal(null)}
        >
          {modal === "new-employee" && (
            <Form
              submit="Cadastrar funcionário"
              onClose={() => setModal(null)}
              onSubmit={async (f) => {
                const v = Object.fromEntries(f);
                await mutate(
                  "/employees",
                  "POST",
                  { ...v, create_access: v.create_access === "on" },
                  "Funcionário cadastrado.",
                );
              }}
            >
              <div className="form-grid">
                <Field label="Nome completo">
                  <input name="name" required placeholder="Nome e sobrenome" />
                </Field>
                <Field label="E-mail">
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="pessoa@empresa.com.br"
                  />
                </Field>
                <Field label="Cargo">
                  <input
                    name="job_title"
                    required
                    placeholder="Ex.: Analista de projetos"
                  />
                </Field>
                <Field label="Departamento">
                  <input
                    name="department"
                    required
                    placeholder="Ex.: Operações"
                    list="departments"
                  />
                  <datalist id="departments">
                    {[...new Set(data.employees.map((e) => e.department))].map(
                      (d) => (
                        <option key={d}>{d}</option>
                      ),
                    )}
                  </datalist>
                </Field>
                <Field label="Unidade">
                  <input name="unit" required defaultValue="Matriz" />
                </Field>
                <Field label="Data de admissão">
                  <input
                    name="admission_date"
                    type="date"
                    required
                    defaultValue={today()}
                  />
                </Field>
              </div>
              <Field label="Situação">
                <select name="status">
                  <option value="active">Ativo</option>
                  <option value="onboarding">Em admissão</option>
                </select>
              </Field>
              <label className="checkbox-line">
                <input type="checkbox" name="create_access" /> Criar acesso ao
                portal do funcionário
              </label>
              <Field label="Senha inicial para o portal (se habilitado)">
                <input
                  type="password"
                  name="password"
                  minLength={10}
                  autoComplete="new-password"
                  placeholder="Pelo menos 10 caracteres"
                />
              </Field>
            </Form>
          )}
          {modal === "employee" && selected && (
            <>
              <div className="employee-detail">
                <Avatar
                  name={selected.name}
                  color={selected.avatar_color}
                  size="xl"
                />
                <div>
                  <h3>{selected.name}</h3>
                  <p>{selected.job_title}</p>
                  <Badge status={selected.status} />
                </div>
              </div>
              <dl className="detail-grid">
                {[
                  ["E-mail", selected.email],
                  ["Departamento", selected.department],
                  ["Unidade", selected.unit],
                  ["Admissão", formatDate(selected.admission_date)],
                  [
                    "Jornada de referência",
                    `${selected.work_start} às ${selected.work_end}`,
                  ],
                  [
                    "Intervalo de referência",
                    `${selected.break_minutes} minutos`,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {isAdmin && selected.id !== user.employee_id && (
                <div className="form-actions">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelected(selected);
                      setModal("employee-status");
                    }}
                  >
                    Alterar situação
                  </Button>
                </div>
              )}
            </>
          )}
          {modal === "employee-status" && (
            <Form
              onClose={() => setModal(null)}
              onSubmit={async (f) =>
                mutate(
                  "/employees/" + selected.id,
                  "PATCH",
                  Object.fromEntries(f),
                  "Situação atualizada.",
                )
              }
            >
              <p className="modal-description">
                Alterar para inativo encerra as sessões de acesso deste
                funcionário. O histórico permanece preservado.
              </p>
              <Field label="Nova situação">
                <select name="status" defaultValue={selected.status}>
                  {["active", "away", "inactive"].map((s) => (
                    <option key={s} value={s}>
                      {statusNames[s]}
                    </option>
                  ))}
                </select>
              </Field>
            </Form>
          )}
          {modal === "new-request" && (
            <RequestForm
              employees={data.employees}
              user={user}
              onClose={() => setModal(null)}
              onSubmit={(f) =>
                mutate(
                  "/requests",
                  "POST",
                  f,
                  "Solicitação enviada para acompanhamento.",
                )
              }
            />
          )}
          {modal === "request-detail" && (
            <>
              <div className="request-owner">
                <Avatar name={selected.employee_name} />
                <div>
                  <strong>{selected.employee_name}</strong>
                  <small>
                    {kindNames[selected.kind]} ·{" "}
                    {formatDate(selected.created_at)}
                  </small>
                </div>
                <Badge status={selected.status} />
              </div>
              <p className="request-description">
                {requestText(selected.description)}
              </p>
              {selected.start_date && (
                <div className="info-strip">
                  <CalendarDays size={16} /> {formatDate(selected.start_date)}{" "}
                  {selected.end_date && "até " + formatDate(selected.end_date)}
                </div>
              )}
              {selected.decision_note && (
                <div className="decision-note">
                  <strong>Parecer do responsável</strong>
                  <p>{selected.decision_note}</p>
                </div>
              )}
              {selected.status === "pending" &&
                !isEmployee &&
                selected.employee_id !== user.employee_id && (
                  <Form
                    submit="Registrar decisão"
                    onClose={() => setModal(null)}
                    onSubmit={(f) =>
                      mutate(
                        "/requests/" + selected.id + "/decision",
                        "POST",
                        Object.fromEntries(f),
                        "Decisão registrada com histórico.",
                      )
                    }
                  >
                    <Field label="Decisão">
                      <select name="status">
                        <option value="approved">Aprovar</option>
                        <option value="rejected">
                          Devolver com orientação
                        </option>
                      </select>
                    </Field>
                    <Field label="Parecer">
                      <textarea
                        name="note"
                        required
                        rows={3}
                        placeholder="Explique sua decisão para a pessoa."
                      />
                    </Field>
                  </Form>
                )}
              {selected.status === "pending" &&
                selected.employee_id === user.employee_id && (
                  <p className="muted small-text">
                    Outro responsável precisa analisar sua solicitação.
                  </p>
                )}
            </>
          )}
          {modal === "new-document" && (
            <DocumentForm
              employees={data.employees}
              user={user}
              payslip={validPage === "holerites"}
              onClose={() => setModal(null)}
              onSubmit={(f) =>
                mutate(
                  "/documents",
                  "POST",
                  f,
                  "Arquivo recebido e guardado para conferência.",
                )
              }
            />
          )}
          {modal === "publish-document" && (
            <Form
              submit="Conferir e publicar"
              onClose={() => setModal(null)}
              onSubmit={async () =>
                mutate(
                  "/documents/" + selected.id + "/publish",
                  "POST",
                  { confirm_employee_id: selected.employee_id },
                  "Documento publicado para o funcionário correto.",
                )
              }
            >
              <div className="publish-preview">
                <FileText size={30} />
                <strong>{selected.title}</strong>
                <span>{selected.file_name}</span>
              </div>
              <div className="info-strip">
                <ShieldCheck size={18} /> Confira o destinatário antes de
                disponibilizar.
              </div>
              <Field label="Funcionário que receberá o documento">
                <input value={selected.employee_name} readOnly />
              </Field>
              <label className="checkbox-line">
                <input type="checkbox" required /> Conferi o arquivo e o
                funcionário destinatário.
              </label>
            </Form>
          )}
          {modal === "new-message" && (
            <Form
              submit="Enviar mensagem"
              onClose={() => setModal(null)}
              onSubmit={async (f) =>
                mutate(
                  "/messages",
                  "POST",
                  Object.fromEntries(f),
                  "Mensagem enviada.",
                )
              }
            >
              <Field label="Destinatário">
                <select
                  name="employee_id"
                  defaultValue={selected?.employee_id ?? ""}
                >
                  {isAdmin && <option value="">Toda a empresa</option>}
                  {data.employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                      {e.id === user.employee_id
                        ? " · minha conversa com o RH"
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Assunto">
                <input
                  name="title"
                  required
                  defaultValue={selected ? "Re: " + selected.title : ""}
                  placeholder="Sobre o que vamos conversar?"
                />
              </Field>
              <Field label="Mensagem">
                <textarea
                  name="body"
                  rows={5}
                  required
                  maxLength={3000}
                  placeholder="Escreva sua mensagem…"
                />
              </Field>
            </Form>
          )}
          {modal === "new-admission" && (
            <Form
              submit="Preparar admissão"
              onClose={() => setModal(null)}
              onSubmit={async (f) =>
                mutate(
                  "/admissions",
                  "POST",
                  Object.fromEntries(f),
                  "Admissão preparada.",
                )
              }
            >
              <div className="form-grid">
                <Field label="Nome completo">
                  <input name="name" required />
                </Field>
                <Field label="E-mail">
                  <input name="email" type="email" required />
                </Field>
                <Field label="Cargo">
                  <input name="job_title" required />
                </Field>
                <Field label="Departamento">
                  <input name="department" required />
                </Field>
              </div>
              <Field label="Data prevista de início">
                <input
                  name="start_date"
                  type="date"
                  required
                  defaultValue={today()}
                />
              </Field>
            </Form>
          )}
          {modal === "invitation-link" && (
            <>
              <p className="modal-description">
                Envie este link diretamente para {selected.name}. Ele é de uso
                único e expira em {formatDate(selected.expires_at)} às{" "}
                {formatTime(selected.expires_at)}. O link precisa estar no
                endereço publicado da Elozia para acesso fora deste ambiente.
              </p>
              <Field label="Link de admissão">
                <input
                  readOnly
                  value={location.origin + "/#/convite/" + selected.token}
                  onFocus={(e) => e.target.select()}
                />
              </Field>
              <div className="form-actions">
                <Button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        location.origin + "/#/convite/" + selected.token,
                      );
                      notify("Link copiado.");
                    } catch {
                      notify("Selecione e copie o link acima.");
                    }
                  }}
                >
                  Copiar convite
                </Button>
              </div>
            </>
          )}
          {modal === "advance-admission" && (
            <Form
              submit={
                selected.stage === "review"
                  ? "Concluir e criar vínculo"
                  : "Confirmar avanço"
              }
              onClose={() => setModal(null)}
              onSubmit={async () =>
                mutate(
                  "/admissions/" + selected.id,
                  "PATCH",
                  { stage: stageNames[stageNames.indexOf(selected.stage) + 1] },
                  "Etapa atualizada.",
                )
              }
            >
              <p className="modal-description">
                {selected.name} passará de{" "}
                <strong>{statusNames[selected.stage]}</strong> para{" "}
                <strong>
                  {
                    statusNames[
                      stageNames[stageNames.indexOf(selected.stage) + 1]
                    ]
                  }
                </strong>
                .
              </p>
              {selected.stage === "review" && (
                <label className="checkbox-line">
                  <input type="checkbox" required /> Conferi os dados e os
                  documentos necessários fora deste acompanhamento.
                </label>
              )}
            </Form>
          )}
          {modal === "change-password" && (
            <Form
              submit="Atualizar minha senha"
              onClose={() => setModal(null)}
              onSubmit={async (f) =>
                mutate(
                  "/auth/password",
                  "POST",
                  Object.fromEntries(f),
                  "Senha atualizada. As outras sessões foram encerradas.",
                )
              }
            >
              <Field label="Senha atual">
                <input
                  type="password"
                  name="current_password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field label="Nova senha">
                <input
                  type="password"
                  name="password"
                  minLength={10}
                  maxLength={256}
                  autoComplete="new-password"
                  required
                />
              </Field>
            </Form>
          )}
          {modal === "profile" && (
            <>
              <div className="employee-detail">
                <Avatar name={user.name} size="xl" />
                <div>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <span className="tag">{roleNames[user.role]}</span>
                </div>
              </div>
              <div className="form-actions">
                <Button
                  variant="secondary"
                  onClick={() => setModal("change-password")}
                >
                  Alterar senha
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await api("/auth/logout", "POST", {});
                    setUser(null);
                    setData(empty);
                    setModal(null);
                    navigate("inicio");
                  }}
                >
                  <LogOut size={16} /> Sair da conta
                </Button>
              </div>
            </>
          )}
          {modal === "help" && (
            <div className="help-content">
              <p>
                Seu espaço reúne pessoas, documentos e solicitações em um só
                lugar.
              </p>
              <h3>Por onde começar?</h3>
              <p>
                <strong>RH:</strong> cadastre pessoas, prepare admissões e
                confira documentos antes de publicar.
              </p>
              <p>
                <strong>Funcionário:</strong> acompanhe suas marcações e
                holerites, envie pedidos e converse com o RH.
              </p>
              <p>
                <strong>Gestor:</strong> acompanhe a equipe do seu departamento
                e analise solicitações de outras pessoas.
              </p>
              <div className="info-strip">
                O módulo de ponto está em validação. Os registros desta versão
                não substituem um registrador oficial conforme a Portaria 671.
              </div>
              <Button
                onClick={() => {
                  setModal(null);
                  setAssistant(true);
                }}
              >
                <Sparkles size={16} /> Abrir assistente
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-actions">{action}</div>}
    </div>
  );
}
function People({
  employees,
  isAdmin,
  open,
  mutate,
}: {
  employees: Employee[];
  isAdmin: boolean;
  open: (kind: string, item?: unknown) => void;
  mutate: any;
}) {
  const [filter, setFilter] = useState(""),
    [status, setStatus] = useState(""),
    [department, setDepartment] = useState("");
  const visible = employees.filter(
    (e) =>
      (e.name + " " + e.email + " " + e.job_title)
        .toLowerCase()
        .includes(filter.toLowerCase()) &&
      (!status || status === e.status) &&
      (!department || department === e.department),
  );
  return (
    <>
      <PageHeading
        eyebrow="PESSOAS NO CENTRO"
        title={isAdmin ? "Nossa gente" : "Pessoas"}
        description="Cada pessoa tem uma história. Cuide de cada etapa dela."
        action={
          isAdmin && (
            <Button onClick={() => open("new-employee")}>
              <Plus size={17} /> Novo funcionário
            </Button>
          )
        }
      />
      <div className="mini-stats">
        <span>
          <strong>{employees.length}</strong> pessoas no seu escopo
        </span>
        <span>
          <i className="status-dot" />
          <strong>
            {employees.filter((e) => e.status === "active").length}
          </strong>{" "}
          ativas
        </span>
        <span>
          <i className="status-dot amber" />
          <strong>
            {employees.filter((e) => e.status === "onboarding").length}
          </strong>{" "}
          em admissão
        </span>
      </div>
      <section className="card">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input
              aria-label="Buscar funcionário"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar por nome, cargo ou e-mail"
            />
          </div>
          <div className="toolbar-filters">
            <select
              aria-label="Filtrar departamento"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Todos os departamentos</option>
              {[...new Set(employees.map((e) => e.department))].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              aria-label="Filtrar situação"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todas as situações</option>
              {["active", "onboarding", "away", "inactive"].map((s) => (
                <option value={s} key={s}>
                  {statusNames[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Cargo e departamento</th>
                <th>Unidade</th>
                <th>Admissão</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr key={e.id}>
                  <td>
                    <button
                      className="person-cell cell-button"
                      onClick={() => open("employee", e)}
                    >
                      <Avatar name={e.name} color={e.avatar_color} />
                      <span>
                        <strong>{e.name}</strong>
                        <small>{e.email}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className="stacked">
                      <strong>{e.job_title}</strong>
                      <small>{e.department}</small>
                    </span>
                  </td>
                  <td>{e.unit}</td>
                  <td>{formatDate(e.admission_date)}</td>
                  <td>
                    <Badge status={e.status} />
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={"Ver " + e.name}
                      onClick={() => open("employee", e)}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length && (
          <EmptyState
            icon={Users}
            title="Nenhuma pessoa encontrada"
            body="Ajuste os filtros ou cadastre o primeiro funcionário."
          />
        )}
        <div className="table-footer">
          {visible.length} de {employees.length} pessoa(s)
          <span>Dados visíveis conforme seu perfil</span>
        </div>
      </section>
    </>
  );
}
function Requests({
  data,
  user,
  open,
}: {
  data: Data;
  user: User;
  open: (kind: string, item?: unknown) => void;
}) {
  const [tab, setTab] = useState("pending");
  const filtered = data.requests.filter((r) => !tab || r.status === tab);
  return (
    <>
      <PageHeading
        eyebrow="CADA PEDIDO, UM PRÓXIMO PASSO"
        title="Solicitações"
        description="Pedidos organizados, decisões claras e todo mundo informado."
        action={
          <Button onClick={() => open("new-request")}>
            <Plus size={17} /> Nova solicitação
          </Button>
        }
      />
      <section className="card">
        <div className="tabs">
          {[
            ["pending", "Pendentes"],
            ["approved", "Aprovadas"],
            ["rejected", "Devolvidas"],
            ["", "Todas"],
          ].map(([value, label]) => (
            <button
              className={tab === value ? "active" : ""}
              key={label}
              onClick={() => setTab(value)}
            >
              {label}
              <span>
                {
                  data.requests.filter((r) => !value || r.status === value)
                    .length
                }
              </span>
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Solicitação</th>
                <th>Funcionário</th>
                <th>Tipo</th>
                <th>Enviada em</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button
                      className="cell-button"
                      onClick={() => open("request-detail", r)}
                    >
                      <strong>{r.title}</strong>
                    </button>
                  </td>
                  <td>
                    <div className="person-cell">
                      <Avatar name={r.employee_name} />
                      {r.employee_name}
                    </div>
                  </td>
                  <td>{kindNames[r.kind]}</td>
                  <td>{formatDate(r.created_at)}</td>
                  <td>
                    <Badge status={r.status} />
                  </td>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => open("request-detail", r)}
                    >
                      {user.role !== "employee" &&
                      r.status === "pending" &&
                      r.employee_id !== user.employee_id
                        ? "Analisar"
                        : "Acompanhar"}
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum pedido por aqui"
            body="As solicitações desta etapa aparecerão neste espaço."
          />
        )}
      </section>
    </>
  );
}
function RequestForm({
  employees,
  user,
  onClose,
  onSubmit,
}: {
  employees: Employee[];
  user: User;
  onClose: () => void;
  onSubmit: (data: unknown) => Promise<void>;
}) {
  const [kind, setKind] = useState("vacation");
  return (
    <Form
      onSubmit={async (f) => onSubmit(Object.fromEntries(f))}
      submit="Enviar solicitação"
      onClose={onClose}
    >
      {user.role !== "employee" && (
        <Field label="Funcionário">
          <select name="employee_id" defaultValue={user.employee_id}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Tipo de solicitação">
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {["vacation", "adjustment", "document", "registration", "other"].map(
            (k) => (
              <option value={k} key={k}>
                {kindNames[k]}
              </option>
            ),
          )}
        </select>
      </Field>
      <Field label="Assunto">
        <input name="title" required placeholder="Resuma o que você precisa" />
      </Field>
      {(kind === "vacation" || kind === "adjustment") && (
        <div className="form-grid">
          <Field
            label={kind === "vacation" ? "Data inicial" : "Dia da marcação"}
          >
            <input type="date" name="start_date" required />
          </Field>
          {kind === "vacation" ? (
            <Field label="Data final">
              <input type="date" name="end_date" required />
            </Field>
          ) : (
            <Field label="Horário que faltou">
              <input type="time" name="correction_time" required />
            </Field>
          )}
        </div>
      )}
      {kind === "adjustment" && (
        <Field label="Tipo da marcação faltante">
          <select name="correction_kind">
            {["entry", "break_start", "break_end", "exit"].map((k) => (
              <option key={k} value={k}>
                {kindNames[k]}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Descrição e justificativa">
        <textarea
          name="description"
          required
          rows={4}
          maxLength={2000}
          placeholder="Conte os detalhes para o responsável analisar."
        />
      </Field>
    </Form>
  );
}
function Documents({
  data,
  isAdmin,
  payslips,
  open,
}: {
  data: Data;
  isAdmin: boolean;
  payslips: boolean;
  open: (kind: string, item?: unknown) => void;
}) {
  const [filter, setFilter] = useState("");
  const docs = data.documents.filter(
    (d) =>
      (payslips ? d.category === "payslip" : d.category !== "payslip") &&
      (d.title + " " + d.employee_name)
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow={
          payslips
            ? "CADA INFORMAÇÃO NO LUGAR CERTO"
            : "ORGANIZAÇÃO QUE TRAZ TRANQUILIDADE"
        }
        title={payslips ? "Holerites" : "Documentos"}
        description={
          payslips
            ? "Demonstrativos individuais, com acesso reservado ao funcionário."
            : "Envie, confira e encontre os documentos da sua equipe."
        }
        action={
          (!payslips || isAdmin) && (
            <Button onClick={() => open("new-document")}>
              <Upload size={16} />
              {payslips ? "Importar holerite" : "Enviar documento"}
            </Button>
          )
        }
      />
      {payslips && isAdmin && (
        <div className="info-strip">
          <ShieldCheck size={18} /> Os holerites vêm da sua folha ou
          contabilidade. Confira o arquivo e o destinatário antes de publicar.
        </div>
      )}
      <section className="card">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={16} />
            <input
              placeholder="Buscar documento ou funcionário"
              aria-label="Buscar documento"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <span className="muted small-text">{docs.length} arquivo(s)</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Funcionário</th>
                <th>{payslips ? "Competência" : "Validade"}</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="person-cell">
                      <span className="file-icon">
                        <FileText size={20} />
                      </span>
                      <span>
                        <strong>{d.title}</strong>
                        <small>
                          {d.file_name} ·{" "}
                          {Math.max(1, Math.round(d.size_bytes / 1024))} KB
                        </small>
                      </span>
                    </div>
                  </td>
                  <td>{d.employee_name || "Admissão em conferência"}</td>
                  <td>{payslips ? d.competence : formatDate(d.expires_at)}</td>
                  <td>
                    <Badge status={d.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <a
                        className="icon-button"
                        href={"/api/documents/" + d.id + "/download"}
                        aria-label={"Baixar " + d.title}
                      >
                        <Download size={17} />
                      </a>
                      {isAdmin && d.status === "draft" && d.employee_id && (
                        <button
                          className="text-link"
                          onClick={() => open("publish-document", d)}
                        >
                          Conferir e publicar <ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!docs.length && (
          <EmptyState
            icon={payslips ? Wallet : Files}
            title={
              payslips
                ? "Seus holerites terão lugar aqui"
                : "Tudo começa com o primeiro arquivo"
            }
            body={
              payslips
                ? "Quando o RH publicar um demonstrativo para você, ele aparecerá aqui."
                : "Envie um documento e acompanhe a conferência e a publicação."
            }
            action={
              (!payslips || isAdmin) && (
                <Button
                  variant="secondary"
                  onClick={() => open("new-document")}
                >
                  <Upload size={15} /> Enviar arquivo
                </Button>
              )
            }
          />
        )}
      </section>
    </>
  );
}
function DocumentForm({
  employees,
  user,
  payslip,
  onClose,
  onSubmit,
}: {
  employees: Employee[];
  user: User;
  payslip: boolean;
  onClose: () => void;
  onSubmit: (data: unknown) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <Form
      submit="Enviar para conferência"
      onClose={onClose}
      onSubmit={async (f) => {
        if (!file) throw new Error("Selecione um arquivo.");
        if (file.size > 8 * 1024 * 1024)
          throw new Error("O arquivo deve ter até 8 MB.");
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = () =>
            reject(new Error("Não foi possível ler o arquivo."));
          reader.readAsDataURL(file);
        });
        await onSubmit({
          ...Object.fromEntries(f),
          file_name: file.name,
          mime_type: file.type || "text/plain",
          content,
        });
      }}
    >
      <Field label="Funcionário destinatário">
        <select name="employee_id" defaultValue={user.employee_id}>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Título">
        <input
          name="title"
          required
          placeholder={
            payslip
              ? "Ex.: Holerite — novembro de 2026"
              : "Ex.: Contrato de trabalho"
          }
        />
      </Field>
      <div className="form-grid">
        <Field label="Categoria">
          <select
            name="category"
            defaultValue={payslip ? "payslip" : "contract"}
          >
            {(payslip
              ? ["payslip"]
              : ["contract", "identity", "certificate", "other"]
            ).map((k) => (
              <option key={k} value={k}>
                {kindNames[k]}
              </option>
            ))}
          </select>
        </Field>
        {payslip ? (
          <Field label="Competência">
            <input name="competence" type="month" required />
          </Field>
        ) : (
          <Field label="Validade (opcional)">
            <input name="expires_at" type="date" />
          </Field>
        )}
      </div>
      <label className="upload-zone">
        <Upload size={26} />
        <strong>{file ? file.name : "Escolha um arquivo"}</strong>
        <span>PDF, JPG, PNG ou texto · até 8 MB</span>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <p className="small-text muted">
        O arquivo ficará em conferência até a publicação pelo RH.
      </p>
    </Form>
  );
}
function TimePage({
  data,
  user,
  notify,
  refresh,
  open,
}: {
  data: Data;
  user: User;
  notify: (s: string) => void;
  refresh: () => Promise<void>;
  open: (kind: string, item?: unknown) => void;
}) {
  const [busy, setBusy] = useState(false),
    [employee, setEmployee] = useState(user.employee_id),
    [receipt, setReceipt] = useState<any>(null),
    [summary, setSummary] = useState<any[]>([]),
    [error, setError] = useState("");
  const punches = data.punches.filter((p) => p.employee_id === employee);
  useEffect(() => {
    api<any[]>("/time-summary?employee=" + employee)
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, [employee, data.punches, data.requests]);
  const ownToday = data.punches
      .filter((p) => p.employee_id === user.employee_id && p.day === today())
      .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at)),
    last = ownToday.at(-1),
    next = !last
      ? "entry"
      : last.kind === "entry"
        ? "break_start"
        : last.kind === "break_start"
          ? "break_end"
          : last.kind === "break_end"
            ? "exit"
            : "entry";
  const [kind, setKind] = useState(next);
  useEffect(() => setKind(next), [next]);
  async function punch() {
    setBusy(true);
    setError("");
    const pendingKey =
      sessionStorage.getItem("elozia-punch-key") ?? crypto.randomUUID();
    sessionStorage.setItem("elozia-punch-key", pendingKey);
    try {
      const result = await api("/punches", "POST", {
        kind,
        idempotency_key: pendingKey,
      });
      sessionStorage.removeItem("elozia-punch-key");
      setReceipt(result);
      await refresh();
      notify("Marcação de teste recebida e preservada.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function downloadReceipt() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            ...receipt,
            aviso:
              "Registro de desenvolvimento; não é comprovante oficial REP-P.",
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `elozia-registro-teste-${receipt.receipt_number}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <PageHeading
        eyebrow="CADA MOMENTO CONTA"
        title="Jornada e ponto"
        description="Suas marcações e solicitações, com transparência em cada etapa."
        action={
          <Button variant="secondary" onClick={() => open("new-request")}>
            <Plus size={16} /> Solicitar ajuste
          </Button>
        }
      />
      <div className="info-strip amber-strip">
        <AlertCircle size={18} />
        <span>
          <strong>Registro em validação.</strong> Esta versão é para testes e
          não substitui o ponto oficial conforme a Portaria 671.
        </span>
      </div>
      <div className="time-grid">
        <section className="card clock-card">
          <span className="eyebrow">MEU REGISTRO DE HOJE</span>
          <LiveClock />
          <p>
            {formatDate(new Date().toISOString(), {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <div className="punch-select">
            <select
              aria-label="Tipo de marcação"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {["entry", "break_start", "break_end", "exit"].map((k) => (
                <option value={k} key={k}>
                  {kindNames[k]}
                </option>
              ))}
            </select>
            <Button onClick={punch} disabled={busy}>
              {busy ? (
                <Loader2 className="spin" size={18} />
              ) : (
                <Clock3 size={18} />
              )}{" "}
              Registrar teste
            </Button>
          </div>
          <small>Horário recebido pelo servidor · Brasília</small>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          {receipt && (
            <div className="receipt">
              <CheckCircle2 size={20} />
              <div>
                <strong>Registro #{receipt.receipt_number} recebido</strong>
                <small>
                  {kindNames[receipt.kind]} · {formatTime(receipt.occurred_at)}
                </small>
              </div>
              <button
                className="icon-button"
                aria-label="Baixar registro de teste"
                onClick={downloadReceipt}
              >
                <Download size={17} />
              </button>
            </div>
          )}
        </section>
        <section className="card today-card">
          <div className="card-title">
            <div>
              <h2>Seu dia, até aqui</h2>
              <p>Marcações originais preservadas.</p>
            </div>
            <span className="round-icon">
              <Sun size={20} />
            </span>
          </div>
          <div className="punch-timeline">
            {ownToday.length ? (
              ownToday.map((p) => (
                <div key={p.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{kindNames[p.kind]}</strong>
                    <small>Registro #{p.receipt_number}</small>
                  </div>
                  <b>{formatTime(p.occurred_at)}</b>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Clock3}
                title="Seu dia começa por aqui"
                body="Nenhuma marcação de teste registrada hoje."
              />
            )}
          </div>
        </section>
      </div>
      <section className="card">
        <div className="card-title">
          <div>
            <h2>Histórico de jornada</h2>
            <p>
              Total dos intervalos registrados, sem cálculo de direitos ou banco
              de horas.
            </p>
          </div>
          {user.role !== "employee" && (
            <select
              aria-label="Funcionário do histórico"
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
            >
              {data.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th>Marcações originais</th>
                <th>Tempo registrado</th>
                <th>Inclusões aprovadas</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.day}>
                  <td>
                    {formatDate(s.day, {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td>
                    <div className="time-chips">
                      {s.punches.map((p: any) => (
                        <span key={p.id} title={kindNames[p.kind]}>
                          {formatTime(p.occurred_at)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <strong>
                      {Math.floor(s.minutes / 60)}h{" "}
                      {String(s.minutes % 60).padStart(2, "0")}min
                    </strong>
                  </td>
                  <td>
                    {s.adjustments.length
                      ? s.adjustments.map((a: any) => (
                          <span key={a.id} className="tag">
                            {formatTime(a.occurred_at)} · ajuste
                          </span>
                        ))
                      : "Sem inclusões"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!summary.length && (
          <EmptyState
            icon={CalendarDays}
            title="Seu histórico vai aparecer aqui"
            body="As marcações e os ajustes aprovados serão organizados por dia."
          />
        )}
      </section>
    </>
  );
}
function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="live-clock">
      {new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(t)}
    </div>
  );
}
function Assistant({
  health,
  onClose,
  navigate,
}: {
  health: Health | null;
  onClose: () => void;
  navigate: (s: string) => void;
}) {
  const [chat, setChat] = useState<
      { role: string; text: string; mode?: string; sources?: string[] }[]
    >([
      {
        role: "assistant",
        text: "Olá! Posso reunir suas pendências e ajudar a encontrar o próximo passo. Como posso facilitar seu dia?",
      },
    ]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);
  async function send(text = input) {
    if (!text.trim() || busy) return;
    setChat((c) => [...c, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const result = await api<{
        answer: string;
        mode: string;
        sources: string[];
      }>("/assistant", "POST", { message: text });
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: result.answer,
          mode: result.mode,
          sources: result.sources,
        },
      ]);
    } catch (e) {
      setChat((c) => [...c, { role: "assistant", text: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="assistant-overlay">
      <button
        className="assistant-scrim"
        aria-label="Fechar assistente"
        onClick={onClose}
      />
      <aside
        className="assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Assistente Elozia"
      >
        <div className="assistant-head">
          <span className="sparkle-box">
            <Sparkles size={22} />
          </span>
          <div>
            <h2>Assistente Elozia</h2>
            <p>
              {health?.ai
                ? "Ajuda conectada à IA"
                : "Resumo operacional · sem IA conectada"}
            </p>
          </div>
          <button
            className="icon-button"
            aria-label="Fechar assistente"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="assistant-chat">
          {chat.map((c, i) => (
            <div key={i} className={"chat-bubble " + c.role}>
              {c.role === "assistant" && <Sparkles size={15} />}
              <p>{c.text}</p>
              {c.mode && (
                <small>
                  {c.mode === "ai"
                    ? "Resposta assistida por IA"
                    : "Calculado pelas regras do ambiente"}
                </small>
              )}
              {c.sources && (
                <div className="chat-sources">
                  <ShieldCheck size={12} />
                  {c.sources.join(" · ")}
                </div>
              )}
            </div>
          ))}
          {chat.length === 1 && (
            <div className="suggestions">
              {[
                "O que precisa da minha atenção?",
                "Resuma as pendências da minha equipe",
                "Como acompanho meus pedidos?",
              ].map((t) => (
                <button key={t} onClick={() => send(t)}>
                  {t}
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          )}
          {busy && (
            <p className="assistant-thinking">
              <Loader2 className="spin" size={16} /> Organizando as informações…
            </p>
          )}
          <div ref={bottom} />
        </div>
        <div className="assistant-shortcuts">
          <button
            onClick={() => {
              navigate("solicitacoes");
              onClose();
            }}
          >
            Solicitações <ArrowUpRight size={13} />
          </button>
          <button
            onClick={() => {
              navigate("documentos");
              onClose();
            }}
          >
            Documentos <ArrowUpRight size={13} />
          </button>
        </div>
        <form
          className="assistant-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            aria-label="Pergunta para a assistente"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1500}
            placeholder="Como posso ajudar?"
          />
          <button aria-label="Enviar pergunta" disabled={busy || !input.trim()}>
            <Send size={18} />
          </button>
        </form>
        <p className="assistant-disclaimer">
          A assistente não altera dados nem toma decisões por você.
        </p>
      </aside>
    </div>
  );
}
function modalTitle(kind: string, item: any) {
  return (
    (
      {
        "new-employee": "Uma nova pessoa por aqui",
        employee: "Ficha do funcionário",
        "employee-status": "Alterar situação",
        "new-request": "O que você precisa?",
        "request-detail": item?.title ?? "Solicitação",
        "new-document": "Enviar documento",
        "publish-document": "Conferir publicação",
        "new-message": "Vamos conversar?",
        "new-admission": "Preparar uma admissão",
        "invitation-link": "Convite de admissão",
        "advance-admission": "Avançar admissão",
        "change-password": "Alterar minha senha",
        profile: "Minha conta",
        help: "Conte com a Elozia",
      } as Record<string, string>
    )[kind] ?? "Elozia"
  );
}
function modalSubtitle(kind: string) {
  return (
    {
      "new-employee": "Cadastre os dados essenciais e organize o vínculo.",
      "new-request":
        "Seu pedido vai para análise, com histórico de cada etapa.",
      "new-document": "Arquivos privados, com publicação conferida pelo RH.",
      "new-admission": "Organize o início da jornada desta pessoa.",
    } as Record<string, string>
  )[kind];
}
function actionLabel(action: string) {
  return (
    (
      {
        "session.login": "Entrou no ambiente",
        "company.created": "Criou a empresa",
        "company.updated": "Atualizou a empresa",
        "employee.created": "Cadastrou funcionário",
        "employee.status_changed": "Alterou situação do vínculo",
        "request.created": "Enviou solicitação",
        "request.approved": "Aprovou solicitação",
        "request.rejected": "Devolveu solicitação",
        "punch.recorded": "Registrou marcação de teste",
        "document.uploaded": "Enviou documento",
        "document.published": "Publicou documento",
        "document.downloaded": "Acessou documento",
        "message.sent": "Enviou mensagem",
        "admission.created": "Preparou admissão",
        "admission.stage_changed": "Atualizou etapa de admissão",
      } as Record<string, string>
    )[action] ?? action
  );
}
function Invitation({ token, onExit }: { token: string; onExit: () => void }) {
  const [invite, setInvite] = useState<any>(null),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [files, setFiles] = useState<File[]>([]);
  useEffect(() => {
    api("/invitation/" + token)
      .then(setInvite)
      .catch((e) => setError(e.message));
  }, [token]);
  return (
    <div className="invitation-screen">
      <header>
        <Mark small />
        <button className="text-link" onClick={onExit}>
          Ir para o login <ArrowUpRight size={14} />
        </button>
      </header>
      <main className="card invitation-card">
        {done ? (
          <div className="empty-state">
            <span>
              <CheckCircle2 size={28} />
            </span>
            <h2>Um novo começo está a caminho.</h2>
            <p>
              Seus dados foram enviados ao RH. Depois da conferência e da
              conclusão da admissão, você poderá entrar com seu e-mail e a senha
              que definiu.
            </p>
            <Button onClick={onExit}>Voltar ao login</Button>
          </div>
        ) : error ? (
          <div className="empty-state">
            <span>
              <AlertCircle size={28} />
            </span>
            <h2>Vamos conferir esse convite?</h2>
            <p>{error}</p>
            <Button variant="secondary" onClick={onExit}>
              Voltar
            </Button>
          </div>
        ) : !invite ? (
          <div className="empty-state">
            <Loader2 className="spin" />
            <p>Conferindo seu convite…</p>
          </div>
        ) : (
          <>
            <span className="eyebrow">SEU PRÓXIMO CAPÍTULO</span>
            <h1>Bem-vindo, {invite.name.split(" ")[0]}.</h1>
            <p className="modal-description">
              A {invite.company_name} preparou sua admissão para{" "}
              <strong>{invite.job_title}</strong>. Confira os dados e envie os
              documentos administrativos solicitados pelo RH.
            </p>
            <Form
              submit="Enviar para conferência do RH"
              onSubmit={async (f) => {
                if (!files.length)
                  throw new Error("Escolha pelo menos um documento.");
                if (
                  files.length > 3 ||
                  files.some((file) => file.size > 3 * 1024 * 1024)
                )
                  throw new Error(
                    "Envie até três arquivos, com no máximo 3 MB cada.",
                  );
                const attachments = await Promise.all(
                  files.map(async (file) => {
                    const content = await new Promise<string>(
                      (resolve, reject) => {
                        const r = new FileReader();
                        r.onload = () =>
                          resolve(String(r.result).split(",")[1]);
                        r.onerror = reject;
                        r.readAsDataURL(file);
                      },
                    );
                    return {
                      file_name: file.name,
                      mime_type: file.type,
                      content,
                    };
                  }),
                );
                await api("/invitation/" + token, "POST", {
                  ...Object.fromEntries(f),
                  attachments,
                  confirm: true,
                });
                setDone(true);
              }}
            >
              <Field label="Nome completo">
                <input name="name" required defaultValue={invite.name} />
              </Field>
              <Field label="Seu e-mail">
                <input value={invite.email} readOnly />
              </Field>
              <Field label="Telefone de contato">
                <input
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  maxLength={30}
                />
              </Field>
              <Field label="Defina sua senha para o portal">
                <input
                  name="password"
                  type="password"
                  required
                  minLength={10}
                  maxLength={256}
                  autoComplete="new-password"
                  placeholder="Pelo menos 10 caracteres"
                />
              </Field>
              <Field label="Observação para o RH (opcional)">
                <textarea name="note" maxLength={1000} rows={3} />
              </Field>
              <label className="upload-zone">
                <Upload size={25} />
                <strong>
                  {files.length
                    ? files.map((f) => f.name).join(", ")
                    : "Selecionar documentos"}
                </strong>
                <span>Até 3 arquivos · PDF, PNG ou JPG · 3 MB cada</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
              </label>
              <p className="small-text muted">
                Envie somente documentos administrativos pedidos pelo RH. Não
                envie exames ou informações clínicas.
              </p>
              <label className="checkbox-line">
                <input type="checkbox" required /> Conferi os dados e os
                documentos que estou enviando para minha admissão.
              </label>
            </Form>
          </>
        )}
      </main>
      <footer className="invitation-footer">
        <ShieldCheck size={14} /> Acesso restrito à sua admissão · Elozia
      </footer>
    </div>
  );
}
