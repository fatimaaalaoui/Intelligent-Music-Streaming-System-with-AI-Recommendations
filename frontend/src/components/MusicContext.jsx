import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";

const API = "http://localhost:5000/api";
export const MusicContext = createContext(null);

const safeParse = (v, fallback) => {
  try {
    const p = JSON.parse(v);
    return p ?? fallback;
  } catch {
    return fallback;
  }
};

const trackKey = (t) =>
  String(
    t?._id ||
      t?.id ||
      t?.trackId ||
      t?.audioUrl ||
      t?.src ||
      `${t?.title || t?.name || "track"}-${t?.artist || t?.artistName || ""}`
  );

const dedupeTracks = (arr) => {
  const seen = new Set();
  const out = [];
  for (const t of Array.isArray(arr) ? arr : []) {
    const k = trackKey(t);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
};

// Normalisation: format commun pour tout le front
const normalizeTrack = (t = {}) => {
  const _id = String(t?._id || t?.id || t?.trackId || "");
  return {
    ...t,
    _id: _id || t?._id,
    id: _id || t?.id,
    title: t?.title || t?.name || "Titre",
    artist: t?.artist || t?.artistName || t?.artist_name || "Artiste Jamendo",
    cover: t?.cover || t?.image || t?.albumImage || "",
    src: t?.src || t?.audioUrl || t?.audio || "",
    albumId: t?.albumId || t?.album_id || null,
    artistId: t?.artistId || t?.artist_id || null,
  };
};

export function MusicProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [contextTitle, setContextTitle] = useState("");

  // ✅ Queue + index (Next/Prev)
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // ✅ Shuffle
  const [isShuffle, setIsShuffle] = useState(false);
  const shuffleHistoryRef = useRef([]); // stack d'index pour Prev en shuffle

  const [recentTracks, setRecentTracks] = useState(() =>
    safeParse(localStorage.getItem("recentTracks"), [])
  );

  const [currentAlbumTracks, setCurrentAlbumTracks] = useState(() =>
    safeParse(localStorage.getItem("currentAlbumTracks"), [])
  );

  useEffect(() => {
    localStorage.setItem("recentTracks", JSON.stringify(recentTracks));
  }, [recentTracks]);

  useEffect(() => {
    localStorage.setItem(
      "currentAlbumTracks",
      JSON.stringify(currentAlbumTracks)
    );
  }, [currentAlbumTracks]);

  const setQueueFromList = useCallback((track, list = []) => {
    const clean = dedupeTracks(list.length ? list : [track].filter(Boolean));

    const k = trackKey(track);
    const idx = clean.findIndex((t) => trackKey(t) === k);
    const safeIdx = idx >= 0 ? idx : 0;

    setQueue(clean);
    setQueueIndex(safeIdx);
    setCurrentTrack(clean[safeIdx] || null);

    // reset history shuffle quand on change de contexte
    shuffleHistoryRef.current = [];
  }, []);

  const playTrack = useCallback(
    (track, list) => {
      if (!track) return;

      // version normalisée pour l'historique (sidebar)
      const normalizedForHistory = normalizeTrack(track);

      if (Array.isArray(list) && list.length) {
        setQueueFromList(track, list);
      } else {
        // fallback : si on n'a pas de liste, garder queue existante
        setCurrentTrack(track);
        setQueue((q) => {
          const arr = Array.isArray(q) ? q : [];
          if (!arr.length) return [track];
          return arr;
        });
      }

      // recent history (sans doublons)
      setRecentTracks((prev) => {
        const key = trackKey(normalizedForHistory);
        const safePrev = Array.isArray(prev) ? prev : [];
        const filtered = safePrev.filter((t) => trackKey(t) !== key);
        return [normalizedForHistory, ...filtered].slice(0, 30);
      });
    },
    [setQueueFromList]
  );

  const nextTrack = useCallback(() => {
    setQueue((q) => {
      const arr = Array.isArray(q) ? q : [];
      if (!arr.length) return arr;

      setQueueIndex((i) => {
        let ni = i;

        if (isShuffle) {
          shuffleHistoryRef.current.push(i);

          if (arr.length === 1) {
            ni = 0;
          } else {
            let tries = 0;
            do {
              ni = Math.floor(Math.random() * arr.length);
              tries++;
            } while (ni === i && tries < 10);
          }
        } else {
          ni = Math.min(i + 1, arr.length - 1);
        }

        setCurrentTrack(arr[ni] || null);
        return ni;
      });

      return arr;
    });
  }, [isShuffle]);

  const prevTrack = useCallback(() => {
    setQueue((q) => {
      const arr = Array.isArray(q) ? q : [];
      if (!arr.length) return arr;

      setQueueIndex((i) => {
        let pi = i;

        if (isShuffle) {
          const hist = shuffleHistoryRef.current;
          if (hist.length) {
            pi = hist.pop();
          } else {
            pi = Math.max(i - 1, 0);
          }
        } else {
          pi = Math.max(i - 1, 0);
        }

        setCurrentTrack(arr[pi] || null);
        return pi;
      });

      return arr;
    });
  }, [isShuffle]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((v) => {
      const nv = !v;
      shuffleHistoryRef.current = [];
      return nv;
    });
  }, []);

  const setAlbumTracks = useCallback((tracks) => {
    setCurrentAlbumTracks(Array.isArray(tracks) ? tracks : []);
  }, []);

  // ✅ FIX : /recent-listens renvoie directement des tracks (pas {track: ...})
  const loadRecentFromServer = useCallback(async (userId, limit = 20) => {
    if (!userId) return;

    try {
      const r = await fetch(
        `${API}/users/${userId}/recent-listens?limit=${limit}`
      );
      if (!r.ok) return;

      const data = await r.json();

      const tracks = dedupeTracks(Array.isArray(data) ? data : [])
        .map(normalizeTrack)
        .filter((t) => (t?._id || t?.id) && (t?.src || t?.audioUrl));

      setRecentTracks(tracks.slice(0, limit));
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      currentTrack,
      setCurrentTrack,

      queue,
      queueIndex,
      setQueueFromList,
      playTrack,
      nextTrack,
      prevTrack,

      isShuffle,
      toggleShuffle,

      recentTracks,
      currentAlbumTracks,
      contextTitle,

      setAlbumTracks,
      setContextTitle,
      loadRecentFromServer,
    }),
    [
      currentTrack,
      queue,
      queueIndex,
      setQueueFromList,
      playTrack,
      nextTrack,
      prevTrack,
      isShuffle,
      toggleShuffle,
      recentTracks,
      currentAlbumTracks,
      contextTitle,
      setAlbumTracks,
      loadRecentFromServer,
    ]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
