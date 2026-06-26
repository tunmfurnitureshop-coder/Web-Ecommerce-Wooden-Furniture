import { MessageCircle, Send, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContactChannel, ContactChannelId } from "@/lib/contact/channels";

const ICONS: Record<ContactChannelId, typeof MessageCircle> = {
  zalo: MessageCircle,
  messenger: Send,
  hotline: Phone,
};

interface Props {
  channel: ContactChannel;
  label: string;
  /** Prefilled message; only Messenger honours it (see channels.ts). */
  text?: string;
  /** "fab" → panel row, "inline" → compact footer/inline link. */
  variant?: "fab" | "inline";
  className?: string;
}

/**
 * Renders a single contact channel as a native anchor — these are external
 * `https`/`tel` targets, NOT locale routes, so they must not use the i18n Link.
 */
export function ContactChannelButton({ channel, label, text, variant = "fab", className }: Props) {
  const Icon = ICONS[channel.id];
  const href = channel.href(text ? { text } : undefined);

  return (
    <a
      href={href}
      {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm",
        variant === "fab"
          ? "flex items-center gap-3 rounded-md border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted"
          : "inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary",
        className
      )}
    >
      <Icon className={cn(variant === "fab" ? "h-5 w-5 text-brand" : "h-4 w-4")} aria-hidden />
      <span>{label}</span>
    </a>
  );
}
