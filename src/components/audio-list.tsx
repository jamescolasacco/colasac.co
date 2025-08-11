"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseBlob } from "music-metadata-browser";

type Track = { src: string; title: string; artist: string; cover?: string | null };
type RowProps = Track & { idx: number };

function baseName(path: string) {
  const f = path.split("/").pop() || "";
  return f.replace(/\.[^.]+$/, "");
}

async function sidecarCover(src: string) {
  const base = src.replace(/\.[^.]+$/, "");
  for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
    const url = `${base}${ext}`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch {}
  }
  return undefined;
}

function fmt(n: number) {
  if (!isFinite(n)) return "0:00";
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioList({ files }: { files: string[] }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const blobs: string[] = [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Track[] = [];
      for (const src of files) {
        let title = baseName(src);
        let artist = "unreleased";
        let cover: string | null | undefined = await sidecarCover(src);
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          const mm = await parseBlob(blob);
          title = (mm.common.title || title).trim();
          if (mm.common.artist) artist = mm.common.artist;
          if (!cover && mm.common.picture?.length) {
          // coerce types so TS chills
          const pic = mm.common.picture[0] as { data: any; format?: string };
          const data: any = pic.data;

          // normalize to Uint8Array without instanceof
          const bytes = data?.buffer
            ? new Uint8Array(data.buffer) // handles Buffer/TypedArray
            : data instanceof ArrayBuffer
            ? new Uint8Array(data)
            : new Uint8Array(data as any); // final fallback

          const blob = new Blob([bytes], { type: pic.format || "image/jpeg" });
          const url = URL.createObjectURL(blob);
          blobs.push(url);
          cover = url;
        }


        } catch {}
        out.push({ src, title, artist, cover });
      }
      if (!cancelled) {
        setTracks(out);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      blobs.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.join("|")]);

  if (loading && tracks.length === 0) {
    return <div className="opacity-70 text-sm">loading...</div>;
  }

  return (
    <ul className="list-none p-0 m-0 space-y-4">
      {tracks.map((t, i) => (
        <li key={t.src}>
          <Row idx={i + 1} {...t} />
        </li>
      ))}
      {tracks.length === 0 && (
        <li className="opacity-70 text-sm">unreleased songs are currently disabled</li>
      )}
    </ul>
  );
}

function Row({ idx, src, title, artist, cover }: RowProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolume] = useState(1);

  const changeVolume = (v: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = v;
    setVolume(v);
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime || 0);
    const onDur = () => setDur(el.duration || 0);
    const onEnd = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onDur);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onDur);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const pct = useMemo(() => (dur ? (time / dur) * 100 : 0), [time, dur]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); } else { el.pause(); setPlaying(false); }
  };

  const seek = (v: number) => {
    const el = audioRef.current; if (!el || !dur) return;
    el.currentTime = (v / 100) * dur;
    setTime(el.currentTime);
  };

  return (
    <div className="unrl">
      <div className="unrl-left">
        <button className="unrl-play" onClick={toggle} aria-label={playing ? "pause" : "play"}>
          {playing ? "❚❚" : "►"}
        </button>
        {cover ? (
          <img src={cover} alt="" className="unrl-cover" />
        ) : (
          <div className="unrl-cover placeholder" />
        )}
      </div>

      <div className="unrl-meta">
        <div className="unrl-title">{title}</div>
        <div className="unrl-artist">{artist}</div>

        <div className="unrl-bar">
          <input
            className="unrl-range"
            type="range"
            min={0}
            max={100}
            value={pct}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="seek"
          />
          <div className="unrl-time">{fmt(time)} / {dur ? fmt(dur) : "—"}</div>
        </div>
       <div className="unrl-vol-inline">
        <button className="unrl-vol-btn" onClick={() => changeVolume(volume === 0 ? 1 : 0)}>
          {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
        </button>
        <input
          className="unrl-vol-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
        />
      </div>
      </div>

      <audio ref={audioRef} src={src} preload="none" />
    </div>
  );
}
