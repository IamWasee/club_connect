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

import { Avatar } from "@/components/Avatar";
import { useDemo } from "@/demo/store";
import { canSeeDirectory, pendingInvites } from "@/demo/selectors";

/**
 * Phone navigation.
 *
 * There is no top bar anywhere in the app, so on a phone this bar is the whole
 * of the chrome: five destinations plus the avatar. Hidden from `md` up, where
 * the left rail takes over.
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
  const invites = pendingInvites(state, me.id).length;
  const onProfile = pathname === "/profile";

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

        {/* With no top bar there is nowhere else for the avatar to live. */}
        <li className="flex-1">
          <Link
            href="/profile"
            aria-current={onProfile ? "page" : undefined}
            className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors ${
              onProfile ? "text-ink" : "text-subtle"
            }`}
          >
            <span className="relative">
              <Avatar identity={me} size="xs" />
              {invites > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-semibold text-on-brand">
                  {invites}
                </span>
              ) : null}
            </span>
            <span className="truncate">You</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
