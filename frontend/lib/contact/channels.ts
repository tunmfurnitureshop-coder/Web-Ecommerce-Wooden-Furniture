/**
 * Contact channels — single source of truth for customer→store deep-links.
 *
 * Reads build-time `NEXT_PUBLIC_*` env and returns only the channels that are
 * configured. Pure TS (no React) so it is importable by both Server and Client
 * components.
 *
 * Channels are deep-links only (Meta discontinued the embedded Messenger plugin
 * 2024-05-09; the shop has no Zalo OA), so chat opens in the respective app.
 */

export type ContactChannelId = "zalo" | "messenger" | "hotline";

export interface ContactChannel {
  id: ContactChannelId;
  /**
   * Build the channel href. Only Messenger honours `text` (prefilled message);
   * Zalo phone deep-links and `tel:` ignore it.
   */
  href: (opts?: { text?: string }) => string;
  /** true → open in a new tab with rel=noopener; `tel:` must stay same-tab. */
  external: boolean;
}

/** Treat empty / whitespace-only env values as "not configured". */
function readEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getContactChannels(): ContactChannel[] {
  const zaloPhone = readEnv(process.env.NEXT_PUBLIC_ZALO_PHONE);
  const fbPage = readEnv(process.env.NEXT_PUBLIC_FB_PAGE);
  const hotline = readEnv(process.env.NEXT_PUBLIC_HOTLINE);

  const channels: ContactChannel[] = [];

  if (zaloPhone) {
    const phone = zaloPhone.replace(/\D/g, "");
    if (phone) {
      // zalo.me/<phone> does not support a prefilled message — ignore opts.text.
      channels.push({ id: "zalo", external: true, href: () => `https://zalo.me/${phone}` });
    }
  }

  if (fbPage) {
    const page = encodeURIComponent(fbPage);
    channels.push({
      id: "messenger",
      external: true,
      href: (opts) =>
        `https://m.me/${page}` + (opts?.text ? `?text=${encodeURIComponent(opts.text)}` : ""),
    });
  }

  if (hotline) {
    const dialable = hotline.replace(/\s+/g, "");
    channels.push({ id: "hotline", external: false, href: () => `tel:${dialable}` });
  }

  return channels;
}

/** Convenience lookup used by the product-detail inquiry button. */
export function findContactChannel(id: ContactChannelId): ContactChannel | undefined {
  return getContactChannels().find((channel) => channel.id === id);
}
