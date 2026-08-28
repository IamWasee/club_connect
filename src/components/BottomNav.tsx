"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarBlankIcon,
  ChatCircleTextIcon,
  UsersThreeIcon,
  BuildingsIcon,
  IdentificationBadgeIcon,
} from "@phosphor-icons/react";

import { useDemo } from "@/demo/store";
import { canSeeDirectory } from "@/demo/selectors";

/**
 * Phone navigation.
 *
 * The header's inline links collapse to unusable width on a phone: at 375px the
 * nav had 46px to render 378px of links, so "Forum" was sliced in half and the
 * rest were unreachable. A thumb-reachable bottom bar is what a phone app
 * actually does, and it frees the header for the account controls.
 *
 * Hidden from `md` up, where the inline header nav takes over.
 */
const ITEMS = [
  { href: "/", label: "Forum", Icon: ChatCircleTextIcon },
  { href: "/events", label: "Events", Icon: CalendarBlankIcon },
  { href: "/clubs", label: "Clubs", Icon: BuildingsIcon },
  { href: "/council", label: "Council", Icon: UsersThreeIcon },
] as const;

export function BottomNav() {
  const { state, me } = useDemo();
  const pathname = usePathname();

  const items = canSeeDirectory(state, me)
    ? [...ITEMS, { href: "/directory", label: "Students", Icon: IdentificationBadgeIcon }]
    : ITEMS;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 backdrop-blur-md md:hidden"
      // Clears the iOS home indicator.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? "text-ink" : "text-subtle"
                }`}
              >
                <Icon size={21} weight={active ? "fill" : "regular"} aria-hidden="true" />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
