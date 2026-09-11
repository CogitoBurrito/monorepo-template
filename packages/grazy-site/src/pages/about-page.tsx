import { useSuspenseQuery } from "@tanstack/react-query";
import { aboutContentQueryOptions } from "@jonsun/grazy-query/about";
import { useSearchStateExperimentalMicrotask } from "@jonsun/search-state";

export function AboutPage() {
  const { data: content } = useSuspenseQuery(aboutContentQueryOptions);
  const [count, setCount] = useSearchStateExperimentalMicrotask({
    from: "/about",
    key: "count",
  });
  const [input, setInput] = useSearchStateExperimentalMicrotask({
    from: "/about",
    key: "input",
  });

  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">{content.kicker}</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          {content.title}
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          {content.description}
        </p>
        <div className="mt-8 border-t border-[var(--line)] pt-5">
          <label htmlFor="about-input" className="island-kicker mb-2 block">
            Input
          </label>
          <input
            id="about-input"
            type="text"
            value={input}
            onChange={(event) => { setInput(event.target.value); }}
            className="demo-input max-w-xl"
            placeholder="Type something"
          />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
          <span className="island-kicker">Counter</span>
          <button
            type="button"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
            onClick={() => { setCount((previous) => previous + 1); }}
          >
            Count: <span aria-live="polite">{count}</span>
          </button>
        </div>
      </section>
    </main>
  );
}
