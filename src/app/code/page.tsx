import { projects } from "@/data/projects";
export const dynamic = "force-static";
export default function CodePage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl md:text-5xl tracking-tight mb-6">code projects</h1>
      <div className="grid sm:grid-cols-2 gap-6 md:gap-7">
        {projects.map((p) => (
          <article key={p.title} className="card p-6 flex flex-col gap-3">
            <header className="flex items-start justify-between gap-4">
              <h3 className="text-xl tracking-tight">{p.title}</h3>
              {p.href && <a href={p.href} target="_blank" rel="noreferrer" className="no-underline">↗</a>}
            </header>
            <p className="text-sm text-ink-700">{p.blurb}</p>
            {p.tags && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-600">
                {p.tags.map((t) => <span key={t} className="rounded-full border border-ink-300 px-2 py-0.5">{t}</span>)}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}