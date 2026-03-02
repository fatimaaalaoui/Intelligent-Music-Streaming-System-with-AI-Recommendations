// src/components/GenrePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = "http://localhost:5000/api";

function hashString(str = "") {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pastel(userKey, key) {
  const seed = hashString(`${userKey}::${key}`);
  const hue = seed % 360;
  return `hsl(${hue} 55% 72%)`; // pastel
}

function normalizeArtistName(t) {
  return (
    t?.artistName ||
    t?.artist ||
    t?.artist?.name ||
    t?.author ||
    "Artiste"
  );
}

export default function GenrePage({ currentUser, onPlayTrack }) {
  const navigate = useNavigate();
  const params = useParams();
  const genre = decodeURIComponent(params.genre || "");
  const userKey = String(currentUser?._id || currentUser?.id || "guest");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const r = await fetch(
          `${API}/tracks?genre=${encodeURIComponent(genre)}&limit=250`
        );
        if (!r.ok) throw new Error("API tracks genre: " + r.status);
        const json = await r.json();

        if (!alive) return;
        setTracks(Array.isArray(json) ? json : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Erreur chargement genre");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [genre]);

  const headerBg = pastel(userKey, `header::${genre}`);

  const playOne = (t) => {
    if (!onPlayTrack) return;
    // ✅ queue = tous les tracks du genre
    onPlayTrack(t, tracks);
  };

  return (
    <div className="min-h-screen w-full text-white">
      <header
        className="rounded-3xl p-6 md:p-8 mb-6 shadow-[0_12px_50px_rgba(0,0,0,0.3)] relative overflow-hidden"
        style={{ background: headerBg }}
      >
        <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-white to-transparent pointer-events-none" />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="relative mb-4 grid h-10 w-10 place-items-center rounded-full bg-black/25 hover:bg-black/35 transition"
          title="Retour"
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

        <div className="relative">
          <p className="text-xs font-semibold uppercase text-black/60">Genre</p>
          <h1 className="text-4xl md:text-6xl font-black leading-tight text-black drop-shadow">
            {genre}
          </h1>
          <p className="mt-2 text-black/60 font-semibold">
            {tracks.length} titre{tracks.length > 1 ? "s" : ""} trouvés
          </p>
        </div>
      </header>

      {loading && <p className="text-white/60">Chargement…</p>}
      {err && <p className="text-red-300">Erreur : {err}</p>}

      {!loading && !err && (
        <>
          {/* Tracks */}
          <section className="pb-12">
            <h2 className="text-2xl md:text-3xl font-bold">Titres</h2>

            {tracks.length === 0 ? (
              <p className="text-white/60 mt-3">Aucun titre trouvé.</p>
            ) : (
              <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tracks.map((t) => {
                  const id = String(t?._id || t?.id || t?.audioUrl || Math.random());
                  const cover = t?.image || t?.cover || t?.coverUrl || "";
                  const title = t?.title || t?.name || "Titre";
                  const artist = normalizeArtistName(t);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => playOne(t)}
                      className="group text-left rounded-2xl bg-white/[0.06] border border-white/10
                                 hover:bg-white/[0.10] transition overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="relative rounded-xl overflow-hidden bg-black/20">
                          {cover ? (
                            <img
                              src={cover}
                              alt=""
                              className="w-full aspect-square object-cover
                                         transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full aspect-square grid place-items-center text-white/40 font-black text-3xl">
                              {title.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <span
                            className="absolute bottom-3 right-3 opacity-0
                                       group-hover:opacity-100 group-hover:translate-y-[-2px]
                                       transition-all duration-200
                                       h-11 w-11 rounded-full bg-[#1babd3]
                                       grid place-items-center shadow-xl"
                            title="Lire"
                          >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </div>

                        <p className="mt-3 truncate font-semibold text-white">
                          {title}
                        </p>
                        <p className="truncate text-xs text-white/60 mt-1">
                          {artist}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
