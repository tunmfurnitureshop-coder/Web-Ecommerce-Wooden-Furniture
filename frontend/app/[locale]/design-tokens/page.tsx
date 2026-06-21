import { notFound } from "next/navigation";
import { Container } from "@/design-system/primitives/container";

export default function DesignTokensPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Container className="py-10 pb-20 flex flex-col gap-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Design Tokens</h1>
        <p className="text-text-muted mt-1 text-sm">Dev-only · <code className="text-xs bg-surface-muted px-1 py-0.5 rounded-sm">/[locale]/design-tokens</code></p>
      </div>

      {/* ── Colors ── */}
      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-text-primary border-b border-border-default pb-2">Semantic Colors</h2>

        <TokenGroup label="Surface">
          <Swatch bg="bg-background" label="background" hex="#FAF8F5" />
          <Swatch bg="bg-surface" label="surface" hex="#FFFFFF" border />
          <Swatch bg="bg-surface-muted" label="surface-muted" hex="#F4F1EC" />
          <Swatch bg="bg-surface-subtle" label="surface-subtle" hex="#FAF8F5" />
        </TokenGroup>

        <TokenGroup label="Text">
          <Swatch bg="bg-text-primary" label="text-primary" hex="#24201D" />
          <Swatch bg="bg-text-secondary" label="text-secondary" hex="#6C635B" />
          <Swatch bg="bg-text-muted" label="text-muted" hex="#8B8177" />
          <Swatch bg="bg-text-inverse" label="text-inverse" hex="#FFFFFF" border />
        </TokenGroup>

        <TokenGroup label="Brand">
          <Swatch bg="bg-brand" label="brand" hex="#B88E2F" />
          <Swatch bg="bg-brand-hover" label="brand-hover" hex="#946E22" />
          <Swatch bg="bg-brand-active" label="brand-active" hex="#74531A" />
          <Swatch bg="bg-brand-soft" label="brand-soft" hex="#FBEBCB" />
        </TokenGroup>

        <TokenGroup label="Border">
          <Swatch bg="bg-border-default" label="border-default" hex="#E8E1D8" />
          <Swatch bg="bg-border-strong" label="border-strong" hex="#D5CBC0" />
          <Swatch bg="bg-border-focus" label="border-focus" hex="#B88E2F" />
        </TokenGroup>

        <TokenGroup label="Status">
          <Swatch bg="bg-success" label="success" hex="#2F7D57" />
          <Swatch bg="bg-success-bg" label="success-bg" hex="#EAF7EF" />
          <Swatch bg="bg-warning" label="warning" hex="#B7791F" />
          <Swatch bg="bg-warning-bg" label="warning-bg" hex="#FFF6DD" />
          <Swatch bg="bg-danger" label="danger" hex="#C23B3B" />
          <Swatch bg="bg-danger-bg" label="danger-bg" hex="#FFF0F0" />
          <Swatch bg="bg-info" label="info" hex="#3973C6" />
          <Swatch bg="bg-info-bg" label="info-bg" hex="#EEF5FF" />
        </TokenGroup>
      </section>

      {/* ── Primitives ── */}
      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-text-primary border-b border-border-default pb-2">Primitive Scales</h2>

        <TokenGroup label="Stone">
          {[["50","#FAF8F5"],["100","#F4F1EC"],["200","#E8E1D8"],["300","#D5CBC0"],["400","#B5AAA0"],["500","#8B8177"],["600","#6C635B"],["700","#4B453F"],["800","#332F2B"],["900","#24201D"]].map(([n,hex]) => (
            <Swatch key={n} bg={`bg-stone-${n}`} label={`stone-${n}`} hex={hex} border={n === "50"} />
          ))}
        </TokenGroup>

        <TokenGroup label="Oak">
          {[["50","#FFF7E8"],["100","#FBEBCB"],["200","#F1D59C"],["300","#E0BB67"],["400","#C99F42"],["500","#B88E2F"],["600","#946E22"],["700","#74531A"]].map(([n,hex]) => (
            <Swatch key={n} bg={`bg-oak-${n}`} label={`oak-${n}`} hex={hex} border={n === "50"} />
          ))}
        </TokenGroup>
      </section>

      {/* ── Typography ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-text-primary border-b border-border-default pb-2">Typography Scale</h2>
        <div className="flex flex-col gap-3">
          {(["xs","sm","base","lg","xl","2xl","3xl","4xl","5xl"] as const).map((size) => (
            <div key={size} className="flex items-baseline gap-4">
              <span className="w-10 text-xs text-text-muted shrink-0">{size}</span>
              <span className={`text-${size} text-text-primary leading-none`}>Vin Furniture</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <p className="font-sans text-base text-text-primary">Font sans — Manrope / Noto Sans SC</p>
          <p className="font-display text-base text-text-primary">Font display — DM Serif Display / Noto Serif SC</p>
        </div>
      </section>

      {/* ── Border Radius ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-text-primary border-b border-border-default pb-2">Border Radius</h2>
        <div className="flex flex-wrap gap-6">
          {[["xs","rounded-xs","2px"],["sm","rounded-sm","4px"],["md","rounded-md","8px"],["lg","rounded-lg","12px"],["xl","rounded-xl","16px"],["full","rounded-full","9999px"]].map(([label,cls,val]) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 bg-brand-soft border border-border-default ${cls}`} />
              <span className="text-xs text-text-muted">{label}</span>
              <span className="text-xs text-text-muted">{val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shadows ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-text-primary border-b border-border-default pb-2">Shadows</h2>
        <div className="flex flex-wrap gap-8">
          {[["xs","shadow-xs"],["sm","shadow-sm"],["md","shadow-md"]].map(([label,cls]) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div className={`w-24 h-24 bg-surface rounded-lg ${cls}`} />
              <span className="text-xs text-text-muted">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}

function TokenGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

function Swatch({ bg, label, hex, border }: { bg: string; label: string; hex: string; border?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 w-28">
      <div className={`h-12 w-full rounded-md ${bg} ${border ? "border border-border-default" : ""}`} />
      <div>
        <p className="text-xs font-medium text-text-primary truncate">{label}</p>
        <p className="text-xs text-text-muted">{hex}</p>
      </div>
    </div>
  );
}
