import React, { useEffect, useRef, useState, useMemo } from "react";
import { assets } from "../assets/assetes/photo";
import { useNavigate } from "react-router-dom";
import { useMusic } from "./useMusic";

const API = "http://localhost:5000/api";

function pastelFromString(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 75%)`;
}

const trackKey = (t) =>
  String(
    t?._id ||
      t?.id ||
      `${t?.title || t?.name || "track"}-${t?.artist || t?.artistName || ""}`
  );

export default function Sidebar({ currentUser }) {
  const navigate = useNavigate();
  const { recentTracks, currentAlbumTracks, playTrack } = useMusic();

  // ✅ FIX LOGIN: support _id OR id
  const userIdRaw = currentUser?._id || currentUser?.id || null;
  const userId = userIdRaw ? String(userIdRaw) : null;
  const isLoggedIn = !!userId;

  const [playlists, setPlaylists] = useState([]);
  const [loadingPl, setLoadingPl] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [showBlue, setShowBlue] = useState(false);
  const plusRef = useRef(null);
  const guestCardRef = useRef(null);

  const anchorElRef = useRef(null);
  const hideTimerRef = useRef(null);

  const [bluePos, setBluePos] = useState({ top: 120, left: 380 });
  const [arrowSide, setArrowSide] = useState("left");

  const [deleteError, setDeleteError] = useState("");

  // ✅ reset propre quand logout (sans changer style)
  useEffect(() => {
    if (!isLoggedIn) {
      setPlaylists([]);
      setLoadingPl(false);
      setEditingId(null);
      setEditingName("");
      setDeleteError("");
      setShowBlue(false);
    }
  }, [isLoggedIn]);

  // ✅ Tracks de l’album/artiste courant que l’utilisateur a réellement écoutées
  const listenedInContext = useMemo(() => {
    const recentSet = new Set((recentTracks || []).map(trackKey));
    const list = (currentAlbumTracks || []).filter((t) =>
      recentSet.has(trackKey(t))
    );

    const seen = new Set();
    const out = [];
    for (const t of list) {
      const k = trackKey(t);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
      if (out.length >= 50) break;
    }
    return out;
  }, [recentTracks, currentAlbumTracks]);

  const computeBluePos = () => {
    const el = anchorElRef.current || plusRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const popupW = 460;
    const popupH = 180;
    const gap = 12;

    let top = r.top + r.height / 2 - popupH / 2;

    let left = r.right + gap;
    let side = "left";

    if (left + popupW > window.innerWidth - 10) {
      left = r.left - gap - popupW;
      side = "right";
    }

    left = Math.max(10, Math.min(left, window.innerWidth - popupW - 10));
    top = Math.max(10, Math.min(top, window.innerHeight - popupH - 10));

    setArrowSide(side);
    setBluePos({ top, left });
  };

  const openBlue = (refOrEl) => {
    if (isLoggedIn) return;

    const el = refOrEl?.current || refOrEl || plusRef.current;
    anchorElRef.current = el;

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowBlue(true);
    setTimeout(computeBluePos, 0);
  };

  const closeBlue = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowBlue(false), 260);
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showBlue) return;
    const onResize = () => computeBluePos();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [showBlue]);

  const fetchPlaylists = async () => {
    if (!isLoggedIn || !userId) return;
    try {
      setLoadingPl(true);
      const r = await fetch(`${API}/users/${encodeURIComponent(userId)}/playlists`);
      const data = await r.json().catch(() => []);
      setPlaylists(Array.isArray(data) ? data : []);
    } finally {
      setLoadingPl(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userId]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const onRefresh = () => fetchPlaylists();
    window.addEventListener("playlists:refresh", onRefresh);

    return () => window.removeEventListener("playlists:refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userId]);

  // ✅ FIX createPlaylist : robust + error handling
  const createPlaylist = async () => {
    if (!isLoggedIn || !userId) {
      openBlue(plusRef);
      return;
    }

    try {
      const name = `Ma playlist n°${(playlists?.length || 0) + 1}`;

      const r = await fetch(`${API}/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name }),
      });

      if (!r.ok) {
        console.error("Create playlist failed:", r.status);
        return;
      }

      const json = await r.json().catch(() => null);

      // backend peut renvoyer {playlist: {...}} ou direct {...}
      const pl = json?.playlist || json?.data?.playlist || json?.data || json;
      const pid = pl?._id || pl?.id;

      // ✅ update UI même si navigate échoue
      setPlaylists((prev) => [pl, ...(Array.isArray(prev) ? prev : [])]);

      // refresh + navigate si id dispo
      window.dispatchEvent(new CustomEvent("playlists:refresh"));
      if (pid) navigate(`/playlist/${pid}`);
    } catch (e) {
      console.error("Create playlist error:", e);
    }
  };

  const startRename = (pl) => {
    setEditingId(String(pl._id || pl.id));
    setEditingName(pl.name || "");
  };

  const saveRename = async () => {
    const id = editingId;
    const name = editingName.trim();
    if (!id || !name) return setEditingId(null);

    await fetch(`${API}/playlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setPlaylists((prev) =>
      prev.map((p) => (String(p._id) === id ? { ...p, name } : p))
    );
    setEditingId(null);

    window.dispatchEvent(new CustomEvent("playlists:refresh"));
  };

  const deletePlaylist = async (id) => {
    if (!isLoggedIn) return;

    setDeleteError("");

    const ok = window.confirm("Supprimer cette playlist ?");
    if (!ok) return;

    try {
      const r = await fetch(`${API}/playlists/${id}`, { method: "DELETE" });

      if (!r.ok) {
        setDeleteError("Erreur suppression playlist");
        setTimeout(() => setDeleteError(""), 3000);
        return;
      }

      setPlaylists((prev) =>
        prev.filter((p) => String(p._id || p.id) !== String(id))
      );

      window.dispatchEvent(new CustomEvent("playlists:refresh"));

      if (window.location.pathname.includes(`/playlist/${id}`)) {
        navigate("/");
      }
    } catch (e) {
      console.error(e);
      setDeleteError("Erreur suppression playlist");
      setTimeout(() => setDeleteError(""), 3000);
    }
  };

  return (
    <>
      <aside className="top-0 bg-black text-white hidden lg:flex h-screen self-start w-[350px] p-2">
        <div className="flex flex-col w-full gap-2">
          <nav className="bg-[#01011c] rounded-xl p-2">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#041748]"
              onClick={() => navigate("/")}
            >
              <img src={assets.home_icon} alt="" className="w-6 h-6" />
              <span className="font-semibold">Home</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#041748]"
            onClick={() => navigate("/browse")}
            >
              <img src={assets.search_icon} alt="" className="w-6 h-6" />
              <span className="font-semibold">Search</span>
            </button>
          </nav>

          <section className="bg-[#01011c] rounded-xl flex-1 min-h-0 flex flex-col">
            <header className="px-3 py-3 flex items-center justify-between">
              <span className="font-semibold">Bibliothèque</span>

              <button
                ref={plusRef}
                className="p-2 rounded-md hover:bg-white/10 text-xl leading-none"
                onMouseEnter={() => openBlue(plusRef)}
                onMouseLeave={closeBlue}
                onClick={createPlaylist}
                aria-label="Créer une playlist"
                title="Créer une playlist"
              >
                +
              </button>
            </header>

            <div className="h-px bg-white/10 mx-4" />

            <div className="px-4 py-3 flex-1 overflow-y-auto space-y-3 sidebar-scroll">
              {!isLoggedIn && (
                <div
                  ref={guestCardRef}
                  className="rounded-md bg-white/5 p-4 border border-white/10"
                  onMouseEnter={() => openBlue(guestCardRef)}
                  onMouseLeave={closeBlue}
                >
                  <h3 className="font-semibold">Créez votre première playlist</h3>
                  <p className="text-white/70 text-sm mt-1">
                    Survolez ici ou le + pour afficher le message, puis connectez-vous.
                  </p>

                  <button
                    className="mt-3 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold"
                    onMouseEnter={() => openBlue(guestCardRef)}
                    onMouseLeave={closeBlue}
                    onClick={() => openBlue(guestCardRef)}
                  >
                    Créer une playlist
                  </button>
                </div>
              )}

              {isLoggedIn && (
                <>
                  <div className="text-xs uppercase tracking-wider text-white/50">
                    Playlists
                  </div>

                  {loadingPl && (
                    <div className="text-white/60 text-sm">Chargement…</div>
                  )}

                  {!loadingPl &&
                    playlists.map((pl) => {
                      const id = String(pl._id || pl.id);
                      const color = pastelFromString(id);
                      const cover = pl.image || pl.cover || pl.coverUrl || "";

                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10"
                        >
                          <button
                            type="button"
                            onClick={() => navigate(`/playlist/${id}`)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-black/20 shrink-0">
                              {cover ? (
                                <img
                                  src={cover}
                                  alt={pl.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-full h-full"
                                  style={{ backgroundColor: color }}
                                />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              {editingId === id ? (
                                <input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onBlur={saveRename}
                                  onKeyDown={(e) => e.key === "Enter" && saveRename()}
                                  className="w-full bg-transparent border border-white/20 rounded-md px-2 py-1 text-sm"
                                  autoFocus
                                />
                              ) : (
                                <div className="truncate font-medium">{pl.name}</div>
                              )}

                              <div className="text-xs text-white/50 truncate">
                                Playlist • {currentUser?.username || currentUser?.name}
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              className="text-xs text-white/60 hover:text-white shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                startRename(pl);
                              }}
                            >
                              Rename
                            </button>

                            <button
                              className="text-xs text-red-400 hover:text-red-300 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePlaylist(id);
                              }}
                              title="Supprimer"
                              aria-label="Supprimer"
                            >
                              🗑️
                            </button>

                            {deleteError && (
                              <span className="text-xs text-red-500 whitespace-nowrap">
                                {deleteError}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  <div className="pt-3 text-xs uppercase tracking-wider text-white/50">
                    Récents
                  </div>

                  {(recentTracks || []).length === 0 ? (
                    <div className="text-white/40 text-sm">Aucun titre récent.</div>
                  ) : (
                    (recentTracks || []).slice(0, 8).map((t, i) => (
                      <button
                        key={t.id || t._id || i}
                        onClick={() => playTrack(t)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 text-left"
                      >
                        <img
                          src={t.cover || t.image || ""}
                          className="w-10 h-10 rounded-md bg-white/10 object-cover"
                          alt=""
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{t.title || t.name}</div>
                          <div className="truncate text-xs text-white/50">
                            {t.artist || t.desc}
                          </div>
                        </div>
                      </button>
                    ))
                  )}

                  <div className="pt-3 text-xs uppercase tracking-wider text-white/50">
                    Dans cet album / artiste
                  </div>

                  {(listenedInContext || []).length === 0 ? (
                    <div className="text-white/40 text-sm">
                      Aucun titre écouté ici pour le moment.
                    </div>
                  ) : (
                    (listenedInContext || []).slice(0, 8).map((t, i) => (
                      <button
                        key={t.id || t._id || i}
                        onClick={() => playTrack(t)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 text-left"
                      >
                        <img
                          src={t.cover || t.image || ""}
                          className="w-10 h-10 rounded-md bg-white/10 object-cover"
                          alt=""
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{t.title || t.name}</div>
                          <div className="truncate text-xs text-white/50">
                            {t.artist || t.desc}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </aside>

      {showBlue && !isLoggedIn && (
        <div
          className="fixed z-[9999]"
          style={{ top: bluePos.top, left: bluePos.left }}
          onMouseEnter={() => openBlue(anchorElRef.current)}
          onMouseLeave={closeBlue}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-[460px] rounded-xl bg-[#71BFFF] text-black shadow-2xl p-6">
            {arrowSide === "left" ? (
              <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-b-[10px] border-r-[10px] border-t-transparent border-b-transparent border-r-[#71BFFF]" />
            ) : (
              <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-b-[10px] border-l-[10px] border-t-transparent border-b-transparent border-l-[#71BFFF]" />
            )}

            <h3 className="text-xl font-extrabold">Créer une playlist</h3>
            <p className="mt-2 text-sm font-medium">
              Connectez-vous pour créer et partager des playlists.
            </p>

            <div className="mt-6 flex items-center justify-end gap-5">
              <button
                className="text-sm font-semibold hover:underline"
                onClick={() => setShowBlue(false)}
              >
                Plus tard
              </button>

              <button
                className="rounded-full bg-white px-5 py-2 text-sm font-bold"
                onClick={() => {
                  setShowBlue(false);
                  navigate("/login");
                }}
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
