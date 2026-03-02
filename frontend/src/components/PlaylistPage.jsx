import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const API_URL = "http://localhost:5000";

const dedupeById = (arr) => {
  const seen = new Set();
  const out = [];
  for (const t of Array.isArray(arr) ? arr : []) {
    const id = String(t?._id || t?.id || t?.trackId || t?.audioUrl || t?.src || "");
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(t);
  }
  return out;
};

export default function PlaylistPage({ onPlayTrack }) {
  const { playlistId, id } = useParams();
  const pid = String(playlistId || id || "");

  const navigate = useNavigate();
  const location = useLocation();

  const [playlist, setPlaylist] = useState(location.state?.playlist ?? null);
  const [tracks, setTracks] = useState(location.state?.tracks ?? []);
  const [recoTracks, setRecoTracks] = useState([]);

  const [artistNames, setArtistNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingReco, setLoadingReco] = useState(false);
  const [err, setErr] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const pickList = (json) => {
    if (Array.isArray(json)) return json;
    return json?.tracks || json?.items || json?.data || json?.playlist?.tracks || [];
  };

  const loadPlaylist = async () => {
    if (!pid || pid === "undefined") throw new Error("ID de playlist manquant.");

    const safeId = encodeURIComponent(pid);
    const res = await fetch(`${API_URL}/api/playlists/${safeId}`);
    if (!res.ok) throw new Error("API playlist: " + res.status);
    const json = await res.json();

    const pl = json?.playlist || json?.data?.playlist || json?.data || json;
    let list = pickList(json);
    if (!Array.isArray(list) || !list.length) list = pickList(pl);
    if (!Array.isArray(list)) list = [];

    const clean = dedupeById(list);

    setPlaylist(pl);
    setTracks(clean);
    setNameDraft(pl?.name || "Ma playlist");
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        if (location.state?.playlist && Array.isArray(location.state?.tracks)) {
          if (!alive) return;
          setPlaylist(location.state.playlist);
          setTracks(dedupeById(location.state.tracks));
          setNameDraft(location.state.playlist?.name || "Ma playlist");
        } else {
          await loadPlaylist();
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr(e?.message || "Erreur lors du chargement.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => (alive = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  // ✅ si on renomme/crée/supprime depuis le Sidebar, il déclenche "playlists:refresh"
  // Ici on recharge la playlist courante pour que le nom se mette à jour automatiquement
  useEffect(() => {
    const onRefresh = () => {
      if (!pid || pid === "undefined") return;
      loadPlaylist().catch(() => {});
    };
    window.addEventListener("playlists:refresh", onRefresh);
    return () => window.removeEventListener("playlists:refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const seedIds = useMemo(() => {
    return (tracks || [])
      .map((t) => t?._id || t?.id)
      .filter(Boolean)
      .map(String);
  }, [tracks]);

  const loadReco = async () => {
    try {
      setLoadingReco(true);
      if (!seedIds.length) {
        setRecoTracks([]);
        return;
      }

      const res = await fetch(`${API_URL}/api/reco/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedTrackIds: seedIds, limit: 30 }),
      });

      if (!res.ok) throw new Error("API reco/seed: " + res.status);
      const json = await res.json();

      const seedSet = new Set(seedIds);
      const filtered = (Array.isArray(json) ? json : []).filter((t) => {
        const tid = String(t?._id || t?.id || "");
        return tid && !seedSet.has(tid);
      });

      setRecoTracks(filtered);
    } catch (e) {
      console.error(e);
      setRecoTracks([]);
    } finally {
      setLoadingReco(false);
    }
  };

  useEffect(() => {
    loadReco();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedIds.join("|")]);

  useEffect(() => {
    let alive = true;

    async function loadArtistNames() {
      const ids = Array.from(
        new Set(
          [...(tracks || []), ...(recoTracks || [])]
            .map((t) => t?.artistId || t?.artist_id || t?.artist?.id)
            .filter(Boolean)
            .map(String)
        )
      );

      const missing = ids.filter((aid) => !artistNames[aid]);
      if (!missing.length) return;

      try {
        const results = await Promise.all(
          missing.map(async (aid) => {
            const res = await fetch(`${API_URL}/api/artists/${encodeURIComponent(aid)}`);
            if (!res.ok) return null;
            return res.json();
          })
        );

        if (!alive) return;

        const patch = {};
        for (const a of results) {
          if (!a) continue;
          const aid = String(a._id || a.id);
          patch[aid] = a.name || "Artiste Jamendo";
        }
        setArtistNames((prev) => ({ ...prev, ...patch }));
      } catch {}
    }

    loadArtistNames();
    return () => (alive = false);
  }, [tracks, recoTracks, artistNames]);

  const getArtistName = (t) =>
    t?.artistName ||
    t?.artist ||
    artistNames[String(t?.artistId || t?.artist_id || t?.artist?.id)] ||
    "Artiste Jamendo";

  const inPlaylistSet = useMemo(() => new Set(seedIds), [seedIds]);

  const addTrackToPlaylist = async (track) => {
    try {
      const rawId = track?._id || track?.id;
      const trackId = rawId ? String(rawId) : "";
      if (!trackId) return;

      if (inPlaylistSet.has(trackId)) return;
      if (!pid || pid === "undefined") return;

      const res = await fetch(`${API_URL}/api/playlists/${encodeURIComponent(pid)}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });

      if (!res.ok) throw new Error("API add track: " + res.status);

      await loadPlaylist();
      await loadReco();

      window.dispatchEvent(new CustomEvent("playlists:refresh"));
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Erreur ajout track");
    }
  };

  const savePlaylistName = async () => {
    try {
      const newName = (nameDraft || "").trim();
      if (!newName) return;
      if (!pid || pid === "undefined") return;

      const res = await fetch(`${API_URL}/api/playlists/${encodeURIComponent(pid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error("API rename: " + res.status);

      const pl = await res.json();
      setPlaylist(pl);
      setIsEditingName(false);

      window.dispatchEvent(new CustomEvent("playlists:refresh"));
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Erreur rename");
    }
  };

  const generateCover = async () => {
    try {
      if (!pid || pid === "undefined") return;

      const res = await fetch(`${API_URL}/api/playlists/${encodeURIComponent(pid)}/cover`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("API cover: " + res.status);

      const pl = await res.json();
      setPlaylist(pl);

      window.dispatchEvent(new CustomEvent("playlists:refresh"));
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Erreur cover");
    }
  };

  const normalizedQueue = useMemo(() => {
    const out = [];
    const seen = new Set();

    const push = (t) => {
      const idd = t?._id || t?.id || t?.audioUrl || t?.src;
      const src = t?.audioUrl || t?.src;
      if (!idd || !src) return;
      const key = String(idd);
      if (seen.has(key)) return;
      seen.add(key);

      out.push({
        id: key,
        title: t.title || t.name || "Titre",
        artist: getArtistName(t),
        cover: t.albumImage || t.image || null,
        src,
        duration: t.duration,
      });
    };

    (tracks || []).forEach(push);
    (recoTracks || []).forEach(push);

    return out;
  }, [tracks, recoTracks, artistNames]);

  const playTrack = (t) => {
    if (!onPlayTrack || !normalizedQueue.length) return;
    const tid = String(t?._id || t?.id || t?.audioUrl || t?.src || "");
    const current = normalizedQueue.find((x) => x.id === tid) || normalizedQueue[0];
    onPlayTrack(current, normalizedQueue);
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const rest = s % 60;
    return `${m}:${String(rest).padStart(2, "0")}`;
  };

  const heroName = playlist?.name || "Ma playlist";
  const heroImage = playlist?.image || playlist?.cover || tracks?.[0]?.image || "";

  if (loading) return <p className="px-4 py-6 text-sm text-white/60">Chargement…</p>;
  if (!playlist && err) return <p className="px-4 py-6 text-sm text-red-400">Erreur : {err}</p>;

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
              <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" />
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
              <p className="text-xs font-semibold uppercase text-white/70">Playlist</p>

              {!isEditingName ? (
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl md:text-6xl font-black leading-tight drop-shadow">
                    {heroName}
                  </h1>

                  <button
                    type="button"
                    onClick={() => {
                      setNameDraft(heroName);
                      setIsEditingName(true);
                    }}
                    className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center"
                    title="Renommer"
                  >
                    ✎
                  </button>

                  <button
                    type="button"
                    onClick={generateCover}
                    className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold"
                    title="Générer une image"
                  >
                    Générer cover
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="h-12 px-4 rounded-xl bg-black/30 border border-white/10 outline-none w-[320px]"
                  />
                  <button
                    type="button"
                    onClick={savePlaylistName}
                    className="h-12 px-5 rounded-xl bg-[#1babd3] text-black font-semibold"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="h-12 px-5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              )}

              <p className="text-sm text-white/70">
                {(tracks || []).length} titre{(tracks || []).length > 1 ? "s" : ""}
              </p>

              {err && <p className="text-sm text-red-300">Erreur : {err}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="-mt-4 px-8 pb-20">
        <div className="rounded-2xl bg-black/20 border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <p className="font-semibold">Titres</p>
          </div>

          {(tracks || []).length === 0 ? (
            <p className="px-5 py-6 text-sm text-white/60">Aucun titre à afficher.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="text-xs text-white/50">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 w-12">#</th>
                  <th className="px-5 py-3">Titre</th>
                  <th className="px-5 py-3 w-20 text-right">Durée</th>
                </tr>
              </thead>
              <tbody>
                {(tracks || []).map((t, idx) => {
                  const tid = t?._id || t?.id || t?.audioUrl || t?.src;
                  return (
                    <tr
                      key={`${tid || "row"}-${idx}`}
                      className="hover:bg-white/5 cursor-pointer"
                      onClick={() => playTrack(t)}
                    >
                      <td className="px-5 py-3 text-white/60">{idx + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-black/30 shrink-0">
                            {t.albumImage || t.image ? (
                              <img
                                src={t.albumImage || t.image}
                                alt={t.title}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{t.title || t.name || "Titre"}</p>
                            <p className="truncate text-xs text-white/60">{getArtistName(t)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-white/60">
                        {formatDuration(t.duration)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-8 rounded-2xl bg-black/20 border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <p className="font-semibold">Recommandés pour cette playlist</p>
            <p className="text-xs text-white/60">{(recoTracks || []).length} au total</p>
          </div>

          {loadingReco ? (
            <p className="px-5 py-6 text-sm text-white/60">Chargement…</p>
          ) : (recoTracks || []).length === 0 ? (
            <p className="px-5 py-6 text-sm text-white/60">Aucun titre recommandé pour le moment.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="text-xs text-white/50">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 w-12">#</th>
                  <th className="px-5 py-3">Titre</th>
                  <th className="px-5 py-3 w-14 text-center">+</th>
                  <th className="px-5 py-3 w-20 text-right">Durée</th>
                </tr>
              </thead>
              <tbody>
                {(recoTracks || []).map((t, idx) => {
                  const tid = String(t?._id || t?.id || "");
                  const already = inPlaylistSet.has(tid);

                  return (
                    <tr
                      key={`${tid || "reco"}-${idx}`}
                      className="hover:bg-white/5 cursor-pointer"
                      onClick={() => playTrack(t)}
                    >
                      <td className="px-5 py-3 text-white/60">{idx + 1}</td>

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-black/30 shrink-0">
                            {t.albumImage || t.image ? (
                              <img
                                src={t.albumImage || t.image}
                                alt={t.title}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{t.title || t.name || "Titre"}</p>
                            <p className="truncate text-xs text-white/60">{getArtistName(t)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addTrackToPlaylist(t);
                          }}
                          disabled={already}
                          className={`h-9 w-9 rounded-full grid place-items-center
                                     ${
                                       already
                                         ? "bg-white/10 text-white/40"
                                         : "bg-[#1babd3] text-black hover:scale-105"
                                     }
                                     transition-transform`}
                          title={already ? "Déjà dans la playlist" : "Ajouter à la playlist"}
                        >
                          {already ? "✓" : "+"}
                        </button>
                      </td>

                      <td className="px-5 py-3 text-right text-white/60">
                        {formatDuration(t.duration)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
