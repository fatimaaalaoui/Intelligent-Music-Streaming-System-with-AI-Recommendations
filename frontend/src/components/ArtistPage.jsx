import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMusic } from "./useMusic";

const API_URL = "http://localhost:5000";

export default function ArtistPage({ onPlayTrack }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const { setAlbumTracks } = useMusic();

  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const [resArtist, resTracks] = await Promise.all([
          fetch(`${API_URL}/api/artists/${id}`),
          fetch(`${API_URL}/api/artists/${id}/tracks`),
        ]);

        if (!resArtist.ok) throw new Error("API artist: " + resArtist.status);
        if (!resTracks.ok) throw new Error("API artist tracks: " + resTracks.status);

        const [artistJson, tracksJson] = await Promise.all([
          resArtist.json(),
          resTracks.json(),
        ]);

        setArtist(artistJson);
        setTracks(tracksJson);

        // ✅ stocker les tracks du contexte
        setAlbumTracks(tracksJson);
        // ✅ AJOUT: normaliser pour Sidebar (artist, cover, src)
const normalizedForSidebar = (Array.isArray(tracksJson) ? tracksJson : []).map((t) => ({
  id: t._id || t.id || t.audioUrl,
  title: t.title || t.name,
  artist: t.artist || t.artistName || artistJson?.name || "Artiste Jamendo",
  cover: t.albumImage || t.image || artistJson?.image || "",
  src: t.audioUrl || t.src || "",
  duration: t.duration,
}));

setAlbumTracks(normalizedForSidebar); // ✅ AJOUT (ne retire rien)

      } catch (e) {
        console.error(e);
        setErr(
          e.message === "Failed to fetch"
            ? "Impossible de contacter le backend (http://localhost:5000)."
            : e.message || "Erreur lors du chargement."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, setAlbumTracks]);

  const normalizedTracks = tracks.map((t) => ({
    id: t._id || t.id || t.audioUrl,
    title: t.title,
    artist: artist?.name || "Artiste Jamendo",
    cover: t.albumImage || t.image || artist?.image || null,
    src: t.audioUrl,
  }));

  const handlePlayTrack = (t) => {
    if (!onPlayTrack) return;

    const id = t._id || t.id || t.audioUrl;
    const current = normalizedTracks.find((nt) => nt.id === id) || normalizedTracks[0];

    // ✅ joue seulement la track sélectionnée
    onPlayTrack(current, normalizedTracks);
  };

  const handlePlayArtist = () => {
    if (!onPlayTrack || tracks.length === 0) return;
    handlePlayTrack(tracks[0]);
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const rest = s % 60;
    return `${m}:${rest.toString().padStart(2, "0")}`;
  };

  const heroName = artist?.name || "Artiste Jamendo";
  const heroImage =
    artist?.image || (tracks[0] && (tracks[0].albumImage || tracks[0].image));

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
            <div className="h-[200px] w-[200px] rounded-full overflow-hidden bg-black/40 shadow-2xl">
              {heroImage ? (
                <img src={heroImage} alt={heroName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-6xl font-bold">
                  {heroName.charAt(0)}
                </div>
              )}
            </div>

            <div className="space-y-3 mt-4 md:mt-0">
              <p className="text-xs font-semibold uppercase text-white/70">Artiste</p>
              <h1 className="text-4xl md:text-6xl font-black leading-tight drop-shadow">
                {heroName}
              </h1>
              <p className="text-sm text-white/70">
                {tracks.length} titre{tracks.length > 1 ? "s" : ""} dans ta base Jamendo.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="-mt-4 px-8 pb-20">
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={handlePlayArtist}
            className="grid h-14 w-14 place-items-center rounded-full bg-[#1babd3] text-black shadow-xl hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-transform"
            disabled={!onPlayTrack || tracks.length === 0}
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-black ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>

        {loading && <p className="text-sm text-white/60">Chargement des pistes…</p>}
        {err && <p className="text-sm text-red-400">Erreur : {err}</p>}

        {!loading && !err && (
          <>
            {tracks.length === 0 ? (
              <p className="text-sm text-white/60">Aucun titre trouvé pour cet artiste.</p>
            ) : (
              <div className="mt-4 rounded-xl bg-black/30 px-4 py-2">
                <div className="grid grid-cols-[16px_minmax(0,1.6fr)_minmax(0,1.2fr)_80px] items-center gap-4 border-b border-white/10 px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                  <span>#</span>
                  <span>Titre</span>
                  <span>Album</span>
                  <span className="justify-self-end">Durée</span>
                </div>

                <ul className="mt-1">
                  {tracks.map((t, idx) => (
                    <li
                      key={t._id || idx}
                      className="grid cursor-pointer grid-cols-[16px_minmax(0,1.6fr)_minmax(0,1.2fr)_80px] items-center gap-4 rounded-md px-2 py-2 text-sm text-white/90 hover:bg-white/5"
                      onClick={() => handlePlayTrack(t)}
                    >
                      <span className="text-xs text-white/60">{idx + 1}</span>

                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {t.title || `Piste ${idx + 1}`}
                        </p>
                      </div>

                      <p className="truncate text-xs text-white/70">
                        {t.albumTitle || "Album Jamendo"}
                      </p>

                      <span className="justify-self-end text-xs text-white/70">
                        {formatDuration(t.duration)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
