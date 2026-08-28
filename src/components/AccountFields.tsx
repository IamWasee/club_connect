"use client";

import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Field, TextInput } from "@/components/ui";
import { AVATAR_HUES, avatarFor, suggestEmail } from "@/demo/initial";
import type { Role } from "@/demo/types";

export type AccountDraft = {
  displayName: string;
  email: string;
  pfpUrl: string | null;
  role: Role;
};

export const EMPTY_ACCOUNT: AccountDraft = {
  displayName: "",
  email: "",
  pfpUrl: null,
  role: "student",
};

const ROLE_CHOICES: Array<{ value: Role; label: string; blurb: string }> = [
  { value: "student", label: "Student", blurb: "Reacts and signs up. Can't post." },
  { value: "council", label: "Student Council", blurb: "Posts announcements, runs events." },
  { value: "admin", label: "Admin", blurb: "Everything, everywhere." },
];

export function isValidAccount(draft: AccountDraft): boolean {
  const name = draft.displayName.trim();
  return name.length >= 2 && name.length <= 32 && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(draft.email.trim());
}

/**
 * The account form, shared by first-run setup and "add account". Email is the
 * private field — it exists so officers can invite by exact address, and it is
 * never shown back anywhere in the app.
 */
export function AccountFields({
  draft,
  onChange,
  showRole = true,
}: {
  draft: AccountDraft;
  onChange: (next: AccountDraft) => void;
  showRole?: boolean;
}) {
  // Stop auto-filling the email once it has been typed in by hand.
  const [emailTouched, setEmailTouched] = useState(false);

  function setName(displayName: string) {
    onChange({
      ...draft,
      displayName,
      email: emailTouched ? draft.email : suggestEmail(displayName),
    });
  }

  return (
    <div className="space-y-5">
      <Field label="Display name" hint="This is the only name anyone else sees.">
        <TextInput
          autoFocus
          value={draft.displayName}
          maxLength={32}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ada Lovelace"
        />
      </Field>

      <Field
        label="School email"
        hint="Private. Used only so club officers can find this account to invite it."
      >
        <TextInput
          type="email"
          value={draft.email}
          onChange={(e) => {
            setEmailTouched(true);
            onChange({ ...draft, email: e.target.value });
          }}
          placeholder="ada.lovelace@northside.edu"
        />
      </Field>

      <div>
        <span className="mb-2 block text-sm font-medium">Picture</span>
        <div className="flex flex-wrap gap-2">
          {AVATAR_HUES.map((hue) => {
            const url = avatarFor(draft.displayName || "?", hue);
            return (
              <button
                key={hue}
                type="button"
                aria-label="Use this picture"
                onClick={() => onChange({ ...draft, pfpUrl: url })}
                className={`rounded-full transition ${
                  draft.pfpUrl === url
                    ? "ring-2 ring-ink ring-offset-2 ring-offset-[var(--color-surface)]"
                    : ""
                }`}
              >
                <Avatar identity={{ displayName: draft.displayName || "?", pfpUrl: url }} size="sm" />
              </button>
            );
          })}
        </div>
      </div>

      {showRole ? (
        <div>
          <span className="mb-2 block text-sm font-medium">Role</span>
          <div className="grid gap-2">
            {ROLE_CHOICES.map((choice) => (
              <label
                key={choice.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  draft.role === choice.value
                    ? "border-brand bg-brand-soft"
                    : "border-line hover:border-brand"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  checked={draft.role === choice.value}
                  onChange={() => onChange({ ...draft, role: choice.value })}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{choice.label}</span>
                  <span className="block text-xs text-subtle">{choice.blurb}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
