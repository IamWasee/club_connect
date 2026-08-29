/**
 * Render plain text with URLs and emails turned into real links.
 *
 * Deliberately not `dangerouslySetInnerHTML`: post bodies are written by
 * students, so the text is only ever inserted as React text nodes. The regex
 * finds candidates and each one is rendered as an <a>, which means a post can
 * never inject markup into anyone else's page.
 */
const PATTERN =
  /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]|www\.[^\s<>()]+[^\s<>().,;:!?'"]|[^\s<>()@]+@[^\s<>()@]+\.[a-z]{2,})/gi;

export function Linkify({ text }: { text: string }) {
  const parts = text.split(PATTERN);

  return (
    <>
      {parts.map((part, index) => {
        // split() with one capture group puts matches at odd indices.
        if (index % 2 === 0) return part;

        const isEmail = !/^(https?:\/\/|www\.)/i.test(part) && part.includes("@");
        const href = isEmail
          ? `mailto:${part}`
          : part.startsWith("www.")
            ? `https://${part}`
            : part;

        return (
          <a
            key={index}
            href={href}
            {...(isEmail ? {} : { target: "_blank", rel: "noreferrer noopener" })}
            className="break-all font-medium text-brand underline underline-offset-2 hover:text-ink"
          >
            {part}
          </a>
        );
      })}
    </>
  );
}
