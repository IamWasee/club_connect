"use client";

import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import {
  Badge,
  Button,
  Card,
  Field,
  PageHead,
  TextInput,
} from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import { ROLE_LABELS, clubsOf, pendingInvites } from "@/demo/selectors";
import { AVATAR_HUES, avatarFor } from "@/demo/initial";
import { AccountSwitcher } from "@/components/Sidebar";

const NAME_MIN = 2;
const NAME_MAX = 32;

export default function ProfilePage() {
  const { state, me } = useDemo();
  const { updateProfile, respondToInvite } = useActions();

  const [name, setName] = useState(me.displayName);
  const [pfp, setPfp] = useState(me.pfpUrl);

  const invites = pendingInvites(state, me.id);
  const clubs = clubsOf(state, me.id);
  const valid = name.trim().length >= NAME_MIN && name.trim().length <= NAME_MAX;
  const dirty = name !== me.displayName || pfp !== me.pfpUrl;

  return (
    <>
      <PageHead
        label="You, publicly"
        title="Your profile"
        lede="This is all anyone else sees. Your real name and school email stay private."
      />

      {invites.length > 0 ? (
        <Card className="mb-6 border-brand">
          <p className="text-sm font-semibold">
            Pending {invites.length === 1 ? "invite" : "invites"}
          </p>
          <ul className="mt-3 space-y-3">
            {invites.map(({ club, from }) => (
              <li key={club.id} className="flex flex-wrap items-center gap-3">
                <span className="min-w-0 flex-1 text-sm">
                  <Link href={`/clubs/${club.slug}`} className="font-medium hover:underline">
                    {club.name}
                  </Link>
                  {from ? (
                    <span className="text-subtle"> - invited by {from.displayName}</span>
                  ) : null}
                </span>
                <div className="flex gap-2">
                  <Button onClick={() => respondToInvite(club.id, true)}>Accept</Button>
                  <Button variant="ghost" onClick={() => respondToInvite(club.id, false)}>
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar identity={{ displayName: name || "?", pfpUrl: pfp }} size="xl" />
          <div>
            <p className="font-medium">{name || "Unnamed"}</p>
            <p className="mt-1 text-xs text-subtle">{ROLE_LABELS[me.role]}</p>
          </div>
        </div>

        <Field label="Display name" hint={`${NAME_MIN}-${NAME_MAX} characters.`}>
          <TextInput
            value={name}
            maxLength={NAME_MAX}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <div>
          <span className="mb-2 block text-sm font-medium">Picture</span>
          <div className="flex flex-wrap gap-2">
            {AVATAR_HUES.map((hue) => {
              const url = avatarFor(name || "?", hue);
              return (
                <button
                  key={hue}
                  type="button"
                  aria-label="Use this picture"
                  onClick={() => setPfp(url)}
                  className={`rounded-full transition ${
                    pfp === url ? "ring-2 ring-ink ring-offset-2 ring-offset-[var(--color-surface)]" : ""
                  }`}
                >
                  <Avatar identity={{ displayName: name || "?", pfpUrl: url }} size="sm" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {dirty ? (
            <Button
              variant="ghost"
              onClick={() => {
                setName(me.displayName);
                setPfp(me.pfpUrl);
              }}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            disabled={!valid || !dirty}
            onClick={() => updateProfile({ displayName: name.trim(), pfpUrl: pfp })}
          >
            {dirty ? "Save profile" : "Saved"}
          </Button>
        </div>
      </Card>

      <Card className="mt-4 md:hidden">
        <p className="mb-3 text-xs font-semibold text-subtle">Demo accounts</p>
        <AccountSwitcher compact />
      </Card>

      <Card className="mt-4">
        <p className="mb-3 text-xs font-semibold text-subtle">Your clubs</p>
        {clubs.length === 0 ? (
          <p className="text-sm text-subtle">
            You&apos;re not in any clubs yet. Officers invite members by school email.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {clubs.map((club) => (
              <li key={club.id}>
                <Link href={`/clubs/${club.slug}`}>
                  <Badge tone="muted">{club.name}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
