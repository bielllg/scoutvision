import type { ReactNode } from "react";
import Link from "next/link";
import { Goal } from "lucide-react";

export const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
export const decimal = (value: number | null, digits = 2) =>
  value === null ? "—" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value);
export const dateLabel = (date: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(date));
export const initials = (name: string) => {
  const words = name.trim().split(/\s+/);
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words.at(-1)?.[0]).toUpperCase();
};

export function PageHead({ section, title, description, children }: {
  section: string; title: string; description?: string; children?: ReactNode;
}) {
  return <header className="page-head">
    <div>
      <div className="eyebrow">Inteligência esportiva / {section}</div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {children && <div className="page-actions">{children}</div>}
  </header>;
}

export function ContextPill() {
  return <Link className="button scout-context" href="/competicoes/copa-2022"><Goal size={15} />Copa do Mundo 2022</Link>;
}

export function Panel({ title, description, action, children, className = "" }: {
  title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return <section className={"panel " + className}>
    <header className="panel-head">
      <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {action}
    </header>
    <div className="panel-body">{children}</div>
  </section>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><strong>{title}</strong>{children && <div className="muted">{children}</div>}</div>;
}

export function CardStat({ label, value, detail, icon }: {
  label: string; value: string | number; detail?: string; icon?: ReactNode;
}) {
  return <div className="panel stat-card">
    <div className="stat-label">{label}{icon && <span className="stat-icon">{icon}</span>}</div>
    <div className="stat-value">{value}</div>
    {detail && <small className="muted">{detail}</small>}
  </div>;
}
