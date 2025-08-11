import { spotifyEmbeds } from "@/data/spotify";
import { listPublic } from "@/lib/fs-public";
import AudioList from "@/components/audio-list";
export const dynamic = "force-static";

// force /embed + grey theme safely
function toEmbedUrl(input: string) {
  try {
    const u = new URL(input);
    if (!u.pathname.startsWith("/embed/")) u.pathname = "/embed" + u.pathname;
    u.searchParams.set("theme", "0");
    return u.toString();
  } catch {
    const base = input.replace("open.spotify.com", "open.spotify.com/embed");
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}theme=0`;
  }
}

export default async function MusicPage() {
  const files = await listPublic("music", [".mp3", ".wav", ".flac", ".m4a", ".ogg"]);
  const paths = files.map((f) => `/music/${f}`);

  return (
      <main className="page-pad grid place-items-center">
        {/* add the extra headroom to match the photo grid */}
        <div className="w-full max-w-2xl space-y-6 mt-[120px]">
          {spotifyEmbeds.length ? (
            spotifyEmbeds.map(({ title, url }, i) => (
              <iframe
                key={i}
                title={title}
                className="w-full rounded-xl"
                src={toEmbedUrl(url)}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            ))
          ) : (
            <div className="text-center opacity-70">no spotify entries</div>
          )}
        </div>

        <div className="mt-12 w-full max-w-2xl">
          <h2 className="sr-only">unreleased</h2>
          <AudioList files={paths} />
        </div>
      </main>
    );
}

