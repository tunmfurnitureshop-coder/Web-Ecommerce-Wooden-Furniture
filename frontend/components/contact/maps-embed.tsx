// Google Maps embed (free iframe — no API key). Server Component.

interface MapsEmbedProps {
  /** Google Maps embed URL (the `...maps/embed?pb=...` value). */
  src: string;
  /** i18n title for accessibility. */
  title: string;
}

export function MapsEmbed({ src, title }: MapsEmbedProps) {
  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden border border-border-default">
      <iframe
        src={src}
        title={title}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
