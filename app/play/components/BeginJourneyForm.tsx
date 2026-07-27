"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { beginJourney } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[#2f5d4a] px-8 py-3 text-sm font-medium tracking-wide text-[#f3e8d4] transition hover:bg-[#264b3c] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Opening the gate..." : "Begin your journey"}
    </button>
  );
}

export function BeginJourneyForm() {
  const [name, setName] = useState("");

  return (
    <form action={beginJourney} className="flex w-full max-w-sm flex-col gap-4">
      <label htmlFor="seeker-name" className="text-sm font-medium text-[#2f5d4a]">
        What shall we call you, Seeker?
      </label>
      <input
        id="seeker-name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={40}
        placeholder="Your name"
        autoComplete="off"
        className="rounded-xl border border-[#2f5d4a]/25 bg-white/70 px-4 py-3 text-[#1c2b24] placeholder:text-[#5a7266] focus:border-[#2f5d4a] focus:outline-none"
      />
      <SubmitButton />
    </form>
  );
}
