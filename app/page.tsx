import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#f3e8d4_0%,_#e8f0ea_45%,_#d7e6ef_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#2f5d4a22_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-[#2f5d4a]">
          Phase 2 · Game Engine
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-5xl leading-tight tracking-tight text-[#1c2b24] sm:text-6xl">
          Seeker
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#3d5248]">
          An interactive adventure that teaches timeless spiritual principles
          through exploration, stories, choices, and reflection — a private
          journey of growth, never a competition.
        </p>
        <div className="mt-10">
          <Link
            href="/play"
            className="inline-block rounded-full bg-[#2f5d4a] px-8 py-3 text-sm font-medium tracking-wide text-[#f3e8d4] transition hover:bg-[#264b3c]"
          >
            Begin your journey as the Seeker
          </Link>
        </div>
        <p className="mt-8 text-sm text-[#5a7266]">
          Health check:{" "}
          <a
            className="underline decoration-[#2f5d4a]/40 underline-offset-4 hover:decoration-[#2f5d4a]"
            href="/api/health"
          >
            /api/health
          </a>
        </p>
      </main>
    </div>
  );
}
