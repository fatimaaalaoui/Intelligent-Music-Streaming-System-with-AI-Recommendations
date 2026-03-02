import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMusic } from "../components/useMusic";

export default function LikedTracksPage({ onPlayTrack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const { setAlbumTracks } = useMusic();

  // userId peut venir de l’URL: /liked?userId=xxx
  const userId = params.get("userId") || "";

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // ✅ Normalisation UNIQUE (comme Albums.jsx)
  const playlist = useMemo(() => {
    const coverFallback = tracks.find((t) => t?.image)?.image || "";
    const artistFallback = "Artiste";

    return (Array.isArray(tracks) ? tracks : [])
      .map((t) => ({
        id: t._id || t.id,
        title: t.title || t.name || "Titre",
        artist: t.artistName || t.artist || artistFallback,
        cover: t.image || t.albumImage || coverFallback,
        src: t.audioUrl || t.src || "",
        duration: t.duration,
      }))
      .filter((x) => x.id && x.src);
  }, [tracks]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        if (!userId) {
          setTracks([]);
          return;
        }

        const res = await fetch(`http://localhost:5000/api/users/${userId}/likes?limit=200`);
        if (!res.ok) throw new Error("API likes: " + res.status);
        const json = await res.json();

        if (cancelled) return;

        const list = Array.isArray(json) ? json : [];
        setTracks(list);

        // ✅ stocker une version normalisée dans le contexte (player/sidebar)
        const normalized = list
          .map((t) => ({
            id: t._id || t.id,
            title: t.title || t.name || "Titre",
            artist: t.artistName || t.artist || "Artiste",
            cover: t.image || t.albumImage || "",
            src: t.audioUrl || t.src || "",
            duration: t.duration,
          }))
          .filter((x) => x.id && x.src);

        setAlbumTracks(normalized);
      } catch (e) {
        console.error(e);
        setErr(
          e.message === "Failed to fetch"
            ? "Impossible de contacter le backend (http://localhost:5000)."
            : e.message || "Erreur lors du chargement."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, setAlbumTracks]);

  const heroTitle = "Titres likés";
  const heroArtist = "Vous";
  const heroImage = tracks.find((t) => t?.image)?.image || null;

  // ✅ PLAY : 1ère track + playlist complète
  const handlePlayAll = () => {
    if (!onPlayTrack || playlist.length === 0) return;
    onPlayTrack(playlist[0], playlist);
  };

  return (
    <div
      className="
        min-h-screen w-full text-white
        bg-gradient-to-b
        from-[#7e22ce] via-[#0ea5e9] to-[#020617]
      "
    >
      <header className="relative overflow-hidden">
        <div className="px-8 pt-8 pb-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 grid h-10 w-10 place-items-center rounded-full 
             bg-gradient-to-b from-[#7c3aed] to-[#4c1d95]
             text-white shadow-lg
             hover:scale-105 hover:brightness-110
             transition-transform"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M15 6l-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            <div className="h-[220px] w-[220px] shrink-0 overflow-hidden rounded-md shadow-2xl md:h-[260px] md:w-[260px]">
              {heroImage ? (
                <img src={heroImage} alt={heroTitle} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black/40 text-sm text-white/60">
                  Playlist
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-1 flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                Playlist
              </span>
              <h1 className="text-4xl font-black leading-tight drop-shadow md:text-6xl">
                {heroTitle}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/80">
                <span className="font-semibold">{heroArtist}</span>
                <span className="mx-1">•</span>
                <span>{tracks.length} titres</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="-mt-4 px-8 pb-20">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handlePlayAll}
              className="grid h-14 w-14 place-items-center rounded-full bg-[#1babd3] text-black shadow-xl hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-transform"
              disabled={!onPlayTrack || playlist.length === 0}
              title="Lire"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-black ml-1">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-white/60">Chargement des titres likés…</p>}
        {err && <p className="text-sm text-red-400">Erreur : {err}</p>}

        {!loading && !err && (
          <TracksTable tracks={tracks} playlist={playlist} onPlayTrack={onPlayTrack} />
        )}
      </main>
    </div>
  );
}

function TracksTable({ tracks, playlist, onPlayTrack }) {
  const handlePlayTrack = (t) => {
    if (!onPlayTrack || !playlist.length) return;

    const id = t._id || t.id;
    const current = playlist.find((p) => String(p.id) === String(id)) || playlist[0];
    onPlayTrack(current, playlist);
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const rest = s % 60;
    return `${m}:${rest.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-2 rounded-xl bg-black/30 px-4 py-2">
      <div className="grid grid-cols-[16px_minmax(0,1fr)_60px] items-center gap-4 border-b border-white/10 px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
        <span>#</span>
        <span>Titre</span>
        <span className="justify-self-end">Durée</span>
      </div>

      <ul className="mt-1">
        {tracks.map((t, idx) => (
          <li
            key={t._id || t.id || idx}
            className="grid cursor-pointer grid-cols-[16px_minmax(0,1fr)_60px] items-center gap-4 rounded-md px-2 py-2 text-sm text-white/90 hover:bg-white/5"
            onClick={() => handlePlayTrack(t)}
          >
            <span className="text-xs text-white/60">{idx + 1}</span>

            <div className="min-w-0">
              <p className="truncate font-medium">{t.title || t.name || `Piste ${idx + 1}`}</p>
              <p className="truncate text-xs text-white/60">{t.artistName || t.artist || "Artiste"}</p>
            </div>

            <span className="justify-self-end text-xs text-white/70">
              {formatDuration(t.duration)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
