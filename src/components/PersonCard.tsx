"use client";

import {
  EnvelopeSimpleIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";

import { Avatar } from "@/components/Avatar";
import type { User } from "@/demo/types";

/**
 * The square person card used on the council page and on every club roster.
 *
 * Deliberately not a horizontal row: a roster is a wall of people, and a
 * portrait tile gives the photo enough room to be the thing you recognise.
 * One component for both surfaces, so a profile edit shows up identically
 * wherever that person appears.
 */
export function PersonCard({
  person,
  seat,
  accent,
  onEdit,
  onRemove,
}: {
  person: User;
  /** "President", "Vice President", "Member" and so on. */
  seat?: string;
  /** Club theme colour, when the card sits on a club page. */
  accent?: string;
  /** Shown only to the person themselves, or to an admin. */
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const instagram = person.instagram?.trim().replace(/^@/, "");
  const facebook = person.facebook?.trim().replace(/^@/, "");
  // The address they chose to publish, never the one they signed in with.
  const email = person.publicEmail?.trim();

  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-surface/80 p-5 text-center shadow-[0_1px_2px_rgba(20,40,30,0.04),0_10px_28px_-16px_rgba(20,40,30,0.14)] backdrop-blur-[2px] transition-colors hover:border-ink/25">
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${person.displayName}`}
          className="absolute right-2 top-2 rounded-full px-2 py-1 text-[11px] text-subtle opacity-0 transition-opacity hover:bg-down-soft hover:text-down focus-visible:opacity-100 group-hover:opacity-100"
        >
          Remove
        </button>
      ) : null}

      <div className="mx-auto">
        <Avatar identity={person} size="xl" />
      </div>

      <h3 className="mt-4 text-balance font-display text-lg leading-tight">
        {person.displayName}
      </h3>

      {seat ? (
        <p
          className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em]"
          style={{ color: accent ?? "var(--color-brand)" }}
        >
          {seat}
        </p>
      ) : null}

      {person.contribution?.trim() ? (
        <p
          className="mt-3 text-pretty text-[13px] font-medium leading-snug"
          style={{ color: accent ?? "var(--color-brand)" }}
        >
          {person.contribution}
        </p>
      ) : null}

      {person.bio?.trim() ? (
        <p className="mt-2.5 text-pretty text-[13px] leading-relaxed text-subtle">{person.bio}</p>
      ) : null}

      {instagram || facebook || email ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-4">
          {instagram ? (
            <SocialLink
              href={`https://instagram.com/${encodeURIComponent(instagram)}`}
              label={`${person.displayName} on Instagram`}
              handle={instagram}
            >
              <InstagramLogoIcon size={15} weight="bold" />
            </SocialLink>
          ) : null}
          {facebook ? (
            <SocialLink
              href={`https://facebook.com/${encodeURIComponent(facebook)}`}
              label={`${person.displayName} on Facebook`}
              handle={facebook}
            >
              <FacebookLogoIcon size={15} weight="bold" />
            </SocialLink>
          ) : null}
          {email ? (
            <SocialLink
              href={`mailto:${email}`}
              label={`Email ${person.displayName}`}
              handle={email}
            >
              <EnvelopeSimpleIcon size={15} weight="bold" />
            </SocialLink>
          ) : null}
        </div>
      ) : null}

      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="mt-4 inline-flex items-center justify-center gap-1.5 self-center rounded-full border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-ink hover:bg-brand-soft"
        >
          <PencilSimpleIcon size={13} weight="bold" aria-hidden="true" />
          Edit your card
        </button>
      ) : null}
    </article>
  );
}

function SocialLink({
  href,
  label,
  handle,
  children,
}: {
  href: string;
  label: string;
  handle: string;
  children: React.ReactNode;
}) {
  // A mailto: hands off to the mail client, so it must not open a tab.
  const external = !href.startsWith("mailto:");

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      aria-label={label}
      className="inline-flex max-w-[9rem] items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-subtle transition-colors hover:border-ink hover:text-ink"
    >
      {children}
      <span className="truncate">{handle}</span>
    </a>
  );
}
