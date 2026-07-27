import type { JournalEntry } from "@/engine/types";

export function JournalDrawer({ journal }: { journal: JournalEntry[] }) {
  return (
    <div className="animate-fadein rounded-2xl border border-[#2f5d4a]/15 bg-white/70 p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#5a7266]">
        Your journal — written for no one but you
      </p>
      {journal.length === 0 ? (
        <p className="text-sm text-[#5a7266]">Nothing written yet. It will appear here when it does.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {journal.map((entry, index) => (
            <li key={`${entry.promptId}-${index}`} className="rounded-xl bg-white/80 p-3 text-sm text-[#1c2b24]">
              <p className="mb-1 text-xs uppercase tracking-wide text-[#5a7266]">
                {new Date(entry.createdAt).toLocaleDateString()}
              </p>
              <p>{entry.answer}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
