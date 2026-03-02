import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

function useQueryParam(name) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(name) || "", [search, name]);
}

function fmtTime(sec) {
  const s = Number(sec);
  if (!Number.isFinite(s)) return "";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function normTrack(t) {
  if (!t) return null;
  return {
    id: String(t._id || t.id || t.audioUrl || Math.random()),
    title: t.title || "Sans titre",
    artist: t.artistName || "Artiste",
    albumId: t.albumId ? String(t.albumId) : "",
    genre: t.mainGenre || "",
    image: t.image || "",
    duration: t.duration,
    raw: t,
  };
}

function normArtist(a) {
  if (!a) return null;
  const name = a.name || a.artistName || "Artiste";
  return {
    id: String(a._id || a.id || name),
    name,
    image: a.image || a.picture || "",
    raw: a,
  };
}

function normAlbum(a) {
  if (!a) return null;
  const title = a.title || a.name || "Album";
  return {
    id: String(a._id || a.id || title),
    title,
    image: a.image || a.cover || a.coverUrl || "",
    raw: a,
  };
}

export default function SearchPage({ onPlayTrack }) {
  const q = useQueryParam("q");
  const navigate = useNavigate();

  // tabs (comme chez toi)
  const [tab, setTab] = useState("tracks"); // tracks | artists | genres | albums

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState({ tracks: [], artists: [], albums: [], genres: [] });

  // ✅ Liste "Titres" à droite (celle affichée)
  const [rightTracks, setRightTracks] = useState([]);

  // 1) fetch search (inchangé)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        if (!q.trim()) {
          setData({ tracks: [], artists: [], albums: [], genres: [] });
          setRightTracks([]);
          return;
        }

        setLoading(true);
        const r = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=50`);
        if (!r.ok) throw new Error("API /search : " + r.status);
        const json = await r.json();

        if (!alive) return;

        const next = {
          tracks: Array.isArray(json.tracks) ? json.tracks : [],
          artists: Array.isArray(json.artists) ? json.artists : [],
          albums: Array.isArray(json.albums) ? json.albums : [],
          genres: Array.isArray(json.genres) ? json.genres : [],
        };

        setData(next);

        // par défaut : onglet Titres => on affiche les tracks de search
        if (tab === "tracks") {
          setRightTracks(next.tracks.map(normTrack).filter(Boolean).slice(0, 6));
        }
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Erreur recherche");
        setRightTracks([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [q]); // pas tab ici, pour ne pas refaire /search à chaque chip

  const tracks = useMemo(() => data.tracks.map(normTrack).filter(Boolean), [data.tracks]);
  const artists = useMemo(() => data.artists.map(normArtist).filter(Boolean), [data.artists]);
  const albums = useMemo(() => data.albums.map(normAlbum).filter(Boolean), [data.albums]);

  // ✅ best result dépend de l’onglet (comme tes captures)
  const best = useMemo(() => {
    if (tab === "artists") return artists[0] || null;
    if (tab === "genres") return data.genres?.[0] ? String(data.genres[0]) : null;
    if (tab === "albums") return albums[0] || null;
    return tracks[0] || null;
  }, [tab, artists, albums, tracks, data.genres]);

  // 2) ✅ charger la colonne "Titres" selon l’onglet (FIX principal)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!q.trim()) {
          setRightTracks([]);
          return;
        }

        // TITRES => prend la liste search (comme avant)
        if (tab === "tracks") {
          if (!alive) return;
          setRightTracks(tracks.slice(0, 6));
          return;
        }

        // ARTISTES => utiliser /api/artists/:id/tracks (déjà dans ton backend)
        if (tab === "artists" && best && typeof best === "object") {
          const artistId = String(best.id || "").trim();
          if (!artistId) {
            setRightTracks(tracks.slice(0, 6));
            return;
          }

          const r = await fetch(`${API}/artists/${encodeURIComponent(artistId)}/tracks`);
          if (!r.ok) throw new Error("API artist tracks: " + r.status);
          const json = await r.json();

          if (!alive) return;
          setRightTracks((Array.isArray(json) ? json : []).map(normTrack).filter(Boolean).slice(0, 6));
          return;
        }

        // ✅ ALBUMS => utiliser /api/albums/:id/tracks (FIX pour ton problème)
        if (tab === "albums" && best && typeof best === "object") {
          const albumId = String(best.id || "").trim();
          if (!albumId) {
            setRightTracks(tracks.slice(0, 6));
            return;
          }

          const r = await fetch(`${API}/albums/${encodeURIComponent(albumId)}/tracks`);
          if (!r.ok) throw new Error("API album tracks: " + r.status);
          const json = await r.json();

          if (!alive) return;
          setRightTracks((Array.isArray(json) ? json : []).map(normTrack).filter(Boolean).slice(0, 6));
          return;
        }

        // GENRES => /api/tracks?genre=... (existe chez toi)
        if (tab === "genres" && typeof best === "string") {
          const r = await fetch(`${API}/tracks?genre=${encodeURIComponent(best)}&limit=6`);
          if (!r.ok) throw new Error("API genre tracks: " + r.status);
          const json = await r.json();

          if (!alive) return;
          setRightTracks((Array.isArray(json) ? json : []).map(normTrack).filter(Boolean).slice(0, 6));
          return;
        }

        // fallback
        setRightTracks(tracks.slice(0, 6));
      } catch {
        if (!alive) return;
        setRightTracks(tracks.slice(0, 6));
      }
    })();

    return () => {
      alive = false;
    };
  }, [tab, q, best, tracks]);

  const playTrack = (t) => {
    if (!onPlayTrack) return;
    onPlayTrack(t.raw, rightTracks.map((x) => x.raw));
  };

  const chips = [
    { key: "tracks", label: "Titres" },
    { key: "artists", label: "Artistes" },
    { key: "genres", label: "Genres et ambiances" },
    { key: "albums", label: "Albums" },
  ];

  return (
    <div className="min-h-screen w-full text-white">
      {/* chips (même style) */}
      <div className="flex flex-wrap gap-2 pt-2">
        {chips.map((c) => {
          const active = tab === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setTab(c.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition
              ${active ? "bg-white text-black border-white" : "bg-white/10 border-white/10 hover:bg-white/15"}`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {loading && <p className="text-white/60 mt-6">Recherche…</p>}
      {err && <p className="text-red-300 mt-6">{err}</p>}
      {!loading && !err && !q.trim() && (
        <p className="text-white/60 mt-6">Tape quelque chose dans la barre de recherche.</p>
      )}

      {!loading && !err && q.trim() && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEFT: Best result */}
          <div>
            <h2 className="text-3xl font-bold mb-4">Meilleur résultat</h2>

            {!best ? (
              <p className="text-white/60">Aucun résultat.</p>
            ) : tab === "tracks" ? (
              <BestTrackCard t={best} onPlay={() => playTrack(best)} />
            ) : tab === "artists" ? (
              <BestArtistCard a={best} />
            ) : tab === "genres" ? (
              <BestGenreCard genre={best} onOpen={() => navigate(`/genre/${encodeURIComponent(best)}`)} />
            ) : (
              <BestAlbumCard al={best} />
            )}
          </div>

          {/* RIGHT: Tracks list (inchangé visuellement) */}
          <div>
            <h2 className="text-3xl font-bold mb-4">Titres</h2>

            {rightTracks.length === 0 ? (
              <p className="text-white/60">Aucun titre trouvé.</p>
            ) : (
              <div className="space-y-2">
                {rightTracks.slice(0, 6).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => playTrack(t)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition text-left"
                  >
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-black/30 shrink-0">
                      {t.image ? (
                        <img src={t.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-white/40 font-black">
                          {t.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{t.title}</div>
                      <div className="truncate text-white/60 text-sm">{t.artist}</div>
                    </div>

                    <div className="text-white/60 text-sm tabular-nums">
                      {fmtTime(t.duration)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BestTrackCard({ t, onPlay }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="w-full text-left rounded-2xl p-5 bg-[#181818] hover:bg-[#202020] transition border border-white/10"
    >
      <div className="flex gap-5 items-center">
        <div className="h-24 w-24 rounded-xl overflow-hidden bg-black/30 shrink-0">
          {t.image ? (
            <img src={t.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center text-white/40 font-black text-2xl">
              {t.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-4xl font-extrabold truncate">{t.title}</div>
          <div className="text-white/70 mt-1 truncate">
            <span className="text-white/60">Titre</span> • {t.artist}
          </div>
        </div>

        <div className="h-12 w-12 rounded-full bg-[#1babd3] grid place-items-center shadow-xl shrink-0">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-black">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function BestArtistCard({ a }) {
  return (
    <div className="w-full text-left rounded-2xl p-5 bg-[#181818] border border-white/10">
      <div className="flex gap-5 items-center">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-black/30 shrink-0">
          {a.image ? (
            <img src={a.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center text-white/40 font-black text-2xl">
              {a.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-4xl font-extrabold truncate">{a.name}</div>
          <div className="text-white/70 mt-1 truncate">
            <span className="text-white/60">Artiste</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BestGenreCard({ genre, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-2xl p-5 bg-[#181818] hover:bg-[#202020] transition border border-white/10"
    >
      <div className="min-w-0">
        <div className="text-5xl font-extrabold truncate">{genre}</div>
        <div className="text-white/70 mt-1">
          <span className="text-white/60">Genre</span>
        </div>
      </div>
    </button>
  );
}

function BestAlbumCard({ al }) {
  return (
    <div className="w-full text-left rounded-2xl p-5 bg-[#181818] border border-white/10">
      <div className="flex gap-5 items-center">
        <div className="h-24 w-24 rounded-xl overflow-hidden bg-black/30 shrink-0">
          {al.image ? (
            <img src={al.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center text-white/40 font-black text-2xl">
              {al.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-4xl font-extrabold truncate">{al.title}</div>
          <div className="text-white/70 mt-1 truncate">
            <span className="text-white/60">Album</span>
          </div>
        </div>
      </div>
    </div>
  );
}
