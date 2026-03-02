/*import React from 'react'
import { songsData } from '../assets/assetes/photo'
import { useEffect, useRef, useState } from "react";

export default function Player({
  track = {
    title: "make you mine",
    artist: "Madison Beer",
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(0.75);

  // init volume + duration
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setCurrent(a.currentTime || 0);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
    };
  }, [track.src]);

  // play/pause
  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      await a.play();
      setIsPlaying(true);
    }
  };

  // timeline seek
  const onSeek = (e) => {
    const val = Number(e.target.value);
    audioRef.current.currentTime = val;
    setCurrent(val);
  };

  // volume
  const onVol = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const fmt = (s) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
    };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#010112] text-white">
      <audio ref={audioRef} src={track.src} preload="metadata" />

      <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between gap-4">
        
        <div className="min-w-0 flex items-center gap-3 w-[30%]">
          <img
            src={track.cover}
            alt={track.title}
            className="h-12 w-12 rounded object-cover"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold leading-tight">{track.title}</p>
              <span className="i-check h-4 w-4 rounded-full bg-green-500 inline-block" aria-hidden />
            </div>
            <p className="truncate text-xs text-white/70">{track.artist}</p>
          </div>
        </div>

       
        <div className="w-[40%] flex flex-col items-center gap-2">
          <div className="flex items-center gap-5">
           
            <IconButton ariaLabel="Shuffle">
              <ShuffleIcon />
            </IconButton>

            
            <IconButton ariaLabel="Previous">
              <PrevIcon />
            </IconButton>

            
            <button
              onClick={togglePlay}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-black hover:scale-105 transition"
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

           
            <IconButton ariaLabel="Next">
              <NextIcon />
            </IconButton>

           
            <IconButton ariaLabel="Repeat">
              <RepeatIcon />
            </IconButton>
          </div>

          
          <div className="flex w-full items-center gap-3">
            <span className="text-[11px] tabular-nums text-white/70 w-9 text-right">
              {fmt(current)}
            </span>

            <input
              type="range"
              min={0}
              max={Math.max(duration, 0)}
              step={0.5}
              value={Math.min(current, duration)}
              onChange={onSeek}
              className="w-full accent-white
                         [--track:#3a3a3a] [--fill:#ffffff]
                         appearance-none h-1 rounded outline-none
                         bg-[var(--track)]
                         "
              style={{
                background: `linear-gradient(to right, var(--fill) ${
                  (current / (duration || 1)) * 100
                }%, var(--track) 0)`,
              }}
            />

            <span className="text-[11px] tabular-nums text-white/70 w-9">
              {fmt(duration)}
            </span>
          </div>
        </div>

       
        <div className="flex items-center justify-end gap-3 w-[30%]">
          <GreenDotIcon />
          <IconButton ariaLabel="Lyrics"><MicIcon /></IconButton>
          <IconButton ariaLabel="Queue"><QueueIcon /></IconButton>
          <IconButton ariaLabel="Devices"><DevicesIcon /></IconButton>

          
          <IconButton ariaLabel="Volume"><VolumeIcon /></IconButton>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={onVol}
            className="w-28 accent-white appearance-none h-1 rounded outline-none
                       bg-[#3a3a3a]"
            style={{
              background: `linear-gradient(to right, #ffffff ${
                volume * 100
              }%, #3a3a3a 0)`,
            }}
          />

          <IconButton ariaLabel="Mini player"><PipIcon /></IconButton>
          <IconButton ariaLabel="Fullscreen"><FullscreenIcon /></IconButton>
        </div>
      </div>
    </div>
  );
}



function IconButton({ children, ariaLabel }) {
  return (
    <button
      type="button"
      className="p-2 rounded hover:bg-white/10 transition"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {children}
    </button>
  );
}


function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}
function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M6 5h2v14H6zM20 6v12L9 12z" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M16 5h2v14h-2zM4 6v12l11-6z" />
    </svg>
  );
}
/*function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M17 3h4v4h-2V6h-2a5 5 0 0 0-4.24 2.34l-1.52 2.32A7 7 0 0 1 6 13H3v-2h3a5 5 0 0 0 4.24-2.34l1.52-2.32A7 7 0 0 1 17 4h2V3zM21 17v4h-4v-2h2v-1h2zM3 17h3a5 5 0 0 0 4.24 2.34l1.52 2.32A7 7 0 0 0 17 22h2v-1h2v-4h-4v2h2a5 5 0 0 1-4.24-2.34l-1.52-2.32A7 7 0 0 0 6 15H3z"/>
    </svg>
  );
}
function RepeatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M7 7h9V5H7a5 5 0 0 0 0 10h1v2H7a7 7 0 0 1 0-14h9V1l4 3-4 3V5H7a3 3 0 0 0 0 6h1V9H7a1 1 0 0 1 0-2z" />
    </svg>
  );
}*/
/*import React from 'react'
import { songsData } from '../assets/assetes/photo'
import { useEffect, useRef, useState } from "react";

export default function Player({
  track = {
    title: "make you mine",
    artist: "Madison Beer",
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(0.75);
  // états en plus
const [err, setErr] = useState(null);
const [loaded, setLoaded] = useState(false);

// <audio .../>
<audio
  ref={audioRef}
  src={track.src}
  preload="metadata"
  crossOrigin="anonymous"
  onLoadedMetadata={(e) => {
    const d = e.currentTarget.duration;
    if (isFinite(d) && d > 0) {
      setDuration(d);
      setLoaded(true);
    }
  }}
  onLoadedData={(e) => {
    // fallback Safari / serveurs lents
    const d = e.currentTarget.duration;
    if (isFinite(d) && d > 0) {
      setDuration(d);
      setLoaded(true);
    }
  }}
  onDurationChange={(e) => {
    const d = e.currentTarget.duration;
    if (isFinite(d) && d > 0) {
      setDuration(d);
      setLoaded(true);
    }
  }}
  onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime || 0)}
  onError={(e) => {
    setErr("Impossible de charger l’audio (CORS ou URL invalide).");
    setLoaded(false);
  }}
  onEnded={() => setIsPlaying(false)}
/>


  // init volume + duration
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setCurrent(a.currentTime || 0);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
    };
  }, [track.src]);

  // play/pause
  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      await a.play();
      setIsPlaying(true);
    }
  };

  // timeline seek
  const onSeek = (e) => {
    const val = Number(e.target.value);
    audioRef.current.currentTime = val;
    setCurrent(val);
  };

  // volume
  const onVol = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const fmt = (s) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
    };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#010112] text-white">
      <audio ref={audioRef} src={track.src} preload="metadata" />

      <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between gap-4">
       
        <div className="min-w-0 flex items-center gap-3 w-[30%]">
          <img
            src={track.cover}
            alt={track.title}
            className="h-12 w-12 rounded object-cover"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold leading-tight">{track.title}</p>
              <span className="i-check h-4 w-4 rounded-full bg-green-500 inline-block" aria-hidden />
            </div>
            <p className="truncate text-xs text-white/70">{track.artist}</p>
          </div>
        </div>

        
        <div className="w-[40%] flex flex-col items-center gap-2">
          <div className="flex items-center gap-5">
           
            <IconButton ariaLabel="Shuffle">
              <ShuffleIcon />
            </IconButton>

           =
            <IconButton ariaLabel="Previous">
              <PrevIcon />
            </IconButton>

            
            <button
              onClick={togglePlay}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-black hover:scale-105 transition"
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            
            <IconButton ariaLabel="Next">
              <NextIcon />
            </IconButton>

          
            <IconButton ariaLabel="Repeat">
              <RepeatIcon />
            </IconButton>
          </div>

         
          <div className="flex w-full items-center gap-3">
            <span className="text-[11px] tabular-nums text-white/70 w-9 text-right">
              {fmt(current)}
            </span>

            <input
              type="range"
              min={0}
              max={Math.max(duration, 0)}
              step={0.5}
              value={Math.min(current, duration)}
              onChange={onSeek}
              className="w-full accent-white
                         [--track:#3a3a3a] [--fill:#ffffff]
                         appearance-none h-1 rounded outline-none
                         bg-[var(--track)]
                         "
              style={{
                background: `linear-gradient(to right, var(--fill) ${
                  (current / (duration || 1)) * 100
                }%, var(--track) 0)`,
              }}
            />

            <span className="text-[11px] tabular-nums text-white/70 w-9">
              {fmt(duration)}
            </span>
          </div>
        </div>

        
        <div className="flex items-center justify-end gap-3 w-[30%]">
          <GreenDotIcon />
          <IconButton ariaLabel="Lyrics"><MicIcon /></IconButton>
          <IconButton ariaLabel="Queue"><QueueIcon /></IconButton>
          <IconButton ariaLabel="Devices"><DevicesIcon /></IconButton>

         
          <IconButton ariaLabel="Volume"><VolumeIcon /></IconButton>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={onVol}
            className="w-28 accent-white appearance-none h-1 rounded outline-none
                       bg-[#3a3a3a]"
            style={{
              background: `linear-gradient(to right, #ffffff ${
                volume * 100
              }%, #3a3a3a 0)`,
            }}
          />

          <IconButton ariaLabel="Mini player"><PipIcon /></IconButton>
          <IconButton ariaLabel="Fullscreen"><FullscreenIcon /></IconButton>
        </div>
      </div>
    </div>
  );
}



function IconButton({ children, ariaLabel }) {
  return (
    <button
      type="button"
      className="p-2 rounded hover:bg-white/10 transition"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {children}
    </button>
  );
}



function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}
function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M6 5h2v14H6zM20 6v12L9 12z" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M16 5h2v14h-2zM4 6v12l11-6z" />
    </svg>
  );
}
function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M17 3h4v4h-2V6h-2a5 5 0 0 0-4.24 2.34l-1.52 2.32A7 7 0 0 1 6 13H3v-2h3a5 5 0 0 0 4.24-2.34l1.52-2.32A7 7 0 0 1 17 4h2V3zM21 17v4h-4v-2h2v-1h2zM3 17h3a5 5 0 0 0 4.24 2.34l1.52 2.32A7 7 0 0 0 17 22h2v-1h2v-4h-4v2h2a5 5 0 0 1-4.24-2.34l-1.52-2.32A7 7 0 0 0 6 15H3z"/>
    </svg>
  );
}
function RepeatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M7 7h9V5H7a5 5 0 0 0 0 10h1v2H7a7 7 0 0 1 0-14h9V1l4 3-4 3V5H7a3 3 0 0 0 0 6h1V9H7a1 1 0 0 1 0-2z" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zM5 11h2a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.92V21h-2v-3.08A7 7 0 0 1 5 11z" />
    </svg>
  );
}
function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M3 6h18v2H3V6zm0 5h12v2H3v-2zm0 5h18v2H3v-2z" />
    </svg>
  );
}
function DevicesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M4 6h10v8H4zM2 4v12h14V4H2zm18 6h2v8H10v-2h10v-6z" />
    </svg>
  );
}
function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M5 10v4h3l4 3V7L8 10H5zm10.5 2a3.5 3.5 0 0 0-2.5-3.33v6.66A3.5 3.5 0 0 0 15.5 12zm0-6a9 9 0 0 1 0 12l-1.4-1.4a7 7 0 0 0 0-9.2L15.5 6z" />
    </svg>
  );
}
function PipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M3 5h18v14H3V5zm10 6h8v6h-8v-6z" />
    </svg>
  );
}
function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm12 5h-5v-2h3v-3h2v5zM7 5h3V3H5v5h2V5zm12 3V3h-5v2h3v3h2z" />
    </svg>
  );
}
function GreenDotIcon() {
  return <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" title="Playing on this device" />;
}*/
// src/components/Player.jsx
// src/components/Player.jsx
// src/components/Player.jsx
// src/components/Player.jsx
// src/components/Player.jsx
// src/components/Player.jsx
// src/components/Player.jsx
// src/components/Player.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "../App.css";
import { useMusic } from "./useMusic";

const GRADIENTS = [
  "from-sky-400 via-cyan-400 to-pink-500",
  "from-fuchsia-500 via-pink-500 to-amber-400",
  "from-emerald-400 via-teal-400 to-sky-500",
  "from-indigo-500 via-sky-500 to-cyan-300",
  "from-rose-200 via-pink-200 to-sky-200",
  "from-amber-200 via-orange-200 to-rose-200",
  "from-emerald-200 via-teal-200 to-cyan-200",
  "from-indigo-200 via-purple-200 to-sky-200",
];

export default function Player({
  track,
  currentUser: currentUserProp, // ✅ IMPORTANT
  onPrev,
  onNext,
  onClose,
  isShuffle,
  onToggleShuffle,
}) {
  const { nextTrack, prevTrack, isShuffle: ctxShuffle, toggleShuffle } = useMusic();

  const handleNext = onNext || nextTrack;
  const handlePrev = onPrev || prevTrack;

  const shuffleOn = typeof isShuffle === "boolean" ? isShuffle : ctxShuffle;
  const handleToggleShuffle = onToggleShuffle || toggleShuffle;

  const audioRef = useRef(null);
  const API = "http://localhost:5000/api";

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [showMini, setShowMini] = useState(false);
  const [repeatOne, setRepeatOne] = useState(false);

  // ✅ Like / Dislike
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  // ✅ Add to playlist (popup)
  const [showAdd, setShowAdd] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loadingPl, setLoadingPl] = useState(false);
  const [addErr, setAddErr] = useState(null);

  if (!track) return null;

  const trackId = String(track?._id || track?.id || "");
  const audioSrc = track?.src || track?.audioUrl || track?.audio || "";
  const lastLoggedRef = useRef(null);

  // ✅ Auth: utilise le prop currentUser en priorité, sinon fallback localStorage
  const currentUser = useMemo(() => {
    if (currentUserProp !== undefined) return currentUserProp; // peut être null ou objet
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  }, [currentUserProp]);

  const userId = currentUser?._id ? String(currentUser._id) : null;
  const isLoggedIn = !!userId;

  // ✅ UI: ne jamais afficher bleu si déconnecté (même si state est resté true)
  const uiLiked = isLoggedIn && liked;
  const uiDisliked = isLoggedIn && disliked;

  // ✅ Reset états quand déconnexion (et fermer popup)
  useEffect(() => {
    if (!isLoggedIn) {
      setLiked(false);
      setDisliked(false);
      setShowAdd(false);
      setAddErr(null);
    }
  }, [isLoggedIn, trackId]);

  // ✅ Log listen 1 fois par track (uniquement si connecté)
  useEffect(() => {
    if (!isLoggedIn || !trackId) return;
    if (lastLoggedRef.current === trackId) return;
    lastLoggedRef.current = trackId;

    fetch(`${API}/listens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, trackId, playlistId: null }),
    }).catch(() => {});
  }, [trackId, isLoggedIn, userId]);

  // dégradé différent par track
  const gradientClass = useMemo(() => {
    const key = String(track._id || track.id || track.title || "");
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash + key.charCodeAt(i) * 13) % GRADIENTS.length;
    }
    return GRADIENTS[hash];
  }, [track]);

  // fade-out visuel
  const remaining = duration ? Math.max(duration - current, 0) : 0;
  const fadeFactor = duration ? (remaining > 10 ? 1 : remaining / 10) : 1;
  const waveScale = 0.8 + 1.2 * fadeFactor;

  // ✅ Charger état like/dislike depuis MongoDB (uniquement si connecté)
  useEffect(() => {
    if (!isLoggedIn || !trackId) return;

    fetch(`${API}/users/${userId}/track-status/${trackId}`)
      .then((r) => r.json())
      .then((s) => {
        setLiked(!!s?.liked);
        setDisliked(!!s?.disliked);
      })
      .catch(() => {});
  }, [trackId, isLoggedIn, userId]);

  // ✅ Like: si déconnecté => ne change rien
  const toggleLike = async () => {
    if (!isLoggedIn || !trackId) return;

    try {
      if (!liked) {
        await fetch(`${API}/users/${userId}/likes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackId }),
        });
        setLiked(true);
        setDisliked(false);
      } else {
        await fetch(`${API}/users/${userId}/likes/${trackId}`, { method: "DELETE" });
        setLiked(false);
      }
    } catch (e) {
      console.error("like error", e);
    }
  };

  // ✅ Dislike: si déconnecté => ne change rien
  const toggleDislike = async () => {
    if (!isLoggedIn || !trackId) return;

    try {
      if (!disliked) {
        await fetch(`${API}/users/${userId}/dislikes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackId }),
        });
        setDisliked(true);
        setLiked(false);
      } else {
        await fetch(`${API}/users/${userId}/dislikes/${trackId}`, { method: "DELETE" });
        setDisliked(false);
      }
    } catch (e) {
      console.error("dislike error", e);
    }
  };

  // ✅ charger playlists au moment d’ouvrir le popup
  const openAddPopup = async () => {
    if (!isLoggedIn) return;

    setAddErr(null);
    setShowAdd((v) => !v);

    if (playlists.length) return;

    try {
      setLoadingPl(true);
      const r = await fetch(`${API}/users/${encodeURIComponent(userId)}/playlists`);
      const data = await r.json();
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (e) {
      setPlaylists([]);
      setAddErr("Impossible de charger les playlists.");
    } finally {
      setLoadingPl(false);
    }
  };

  const addToPlaylist = async (playlistId) => {
    if (!isLoggedIn || !playlistId) return;

    if (!trackId) {
      setAddErr("Track invalide (id manquant).");
      return;
    }

    try {
      setAddErr(null);

      const r = await fetch(`${API}/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });

      if (!r.ok) throw new Error("API add track: " + r.status);

      setShowAdd(false);
      window.dispatchEvent(new CustomEvent("playlists:refresh"));
    } catch (e) {
      console.error(e);
      setAddErr("Erreur: impossible d’ajouter ce titre à la playlist.");
    }
  };

  /* ========= events audio ========= */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setCurrent(a.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onEnded = async () => {
      if (repeatOne) {
        try {
          a.currentTime = 0;
          await a.play();
          setIsPlaying(true);
        } catch (e) {
          console.error("Erreur repeat:", e);
          setIsPlaying(false);
        }
        return;
      }

      if (typeof handleNext === "function") {
        handleNext();
        return;
      }

      setIsPlaying(false);
      setCurrent(0);
    };

    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [repeatOne, handleNext]);

  // ✅ volume appliqué au vrai <audio>
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // track change → reset + auto-play (anti AbortError)
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioSrc) return;

    let cancelled = false;

    setCurrent(0);
    setDuration(0);

    a.pause();
    a.currentTime = 0;
    a.load();

    (async () => {
      try {
        if (cancelled) return;
        await a.play();
        if (!cancelled) setIsPlaying(true);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Erreur lecture audio :", err);
        if (!cancelled) setIsPlaying(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audioSrc]);

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;

    try {
      if (a.paused) {
        await a.play();
        setIsPlaying(true);
      } else {
        a.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      console.error("Erreur lecture audio :", e);
    }
  };

  const onSeek = (e) => {
    const val = Number(e.target.value);
    if (!audioRef.current) return;
    audioRef.current.currentTime = val;
    setCurrent(val);
  };

  const onVol = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
  };

  const fmt = (s) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleCloseClick = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    if (typeof onClose === "function") onClose();
  };

  const cover = track.cover || track.image || "";
  const title = track.title || track.name || "";
  const artist = track.artist || track.artistName || track.artist_name || "";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#010112] text-white">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* ✅ Popup choix playlist */}
      {showAdd && isLoggedIn && (
        <div className="absolute left-6 bottom-full mb-4 w-[320px] rounded-2xl bg-[#0b0b16] border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-sm font-semibold">Ajouter à une playlist</p>
            <button
              className="text-white/70 hover:text-white"
              onClick={() => setShowAdd(false)}
              title="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="p-3 max-h-64 overflow-y-auto">
            {loadingPl ? (
              <p className="text-sm text-white/60 px-2 py-2">Chargement…</p>
            ) : playlists.length === 0 ? (
              <p className="text-sm text-white/60 px-2 py-2">Aucune playlist trouvée.</p>
            ) : (
              playlists.map((pl) => {
                const pid = pl?._id || pl?.id;
                return (
                  <button
                    key={String(pid)}
                    onClick={() => addToPlaylist(pid)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition"
                  >
                    <div className="font-medium truncate">{pl?.name || "Playlist"}</div>
                    <div className="text-xs text-white/50 truncate">
                      Playlist • {currentUser?.username || currentUser?.name || ""}
                    </div>
                  </button>
                );
              })
            )}

            {addErr && <p className="text-sm text-red-300 px-2 pt-2">{addErr}</p>}
          </div>
        </div>
      )}

      {showMini && (
        <div className="absolute right-6 bottom-full mb-4 w-[340px] rounded-2xl bg-[#0b0b16] border border-white/10 shadow-2xl overflow-hidden">
          <div className="relative">
            <img src={cover} alt={title} className="w-full h-52 object-cover" />
            <div className="absolute top-3 left-3 rounded bg-black/60 px-2 py-1 text-[10px] tracking-wide">
              PARENTAL ADVISORY
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{title}</p>
                <p className="truncate text-sm text-white/70">Vidéo • {artist}</p>
              </div>

              <div className="h-9 w-9 rounded-full bg-green-500 grid place-items-center shrink-0">
                <CheckIcon />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        {isPlaying && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 z-0 overflow-hidden">
            <div className="absolute left-1/2 -translate-x-1/2 w-[200%] h-full">
              <div
                className={`wave-strip bg-gradient-to-r ${gradientClass}`}
                style={{
                  opacity: 0.25 + 0.55 * fadeFactor,
                  transform: `scaleY(${waveScale})`,
                }}
              />
            </div>
          </div>
        )}

        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between gap-4 relative z-10">
          {/* LEFT */}
          <div className="min-w-0 flex items-center gap-3 w-[30%]">
            <img src={cover} alt={title} className="h-12 w-12 rounded object-cover" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold leading-tight">{title}</p>
                <span className="h-4 w-4 rounded-full bg-green-500 inline-block" aria-hidden />
              </div>
              <p className="truncate text-xs text-white/70">{artist}</p>

              {/* ✅ Like / Dislike / Add-to-playlist */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={toggleLike}
                  disabled={!isLoggedIn}
                  className={`p-2 rounded-full hover:bg-white/10 transition ${
                    uiLiked ? "text-[#00A3FF]" : "text-white"
                  } ${!isLoggedIn ? "opacity-60 cursor-not-allowed" : ""}`}
                  aria-label="Like"
                  title={isLoggedIn ? "Like" : "Connecte-toi pour liker"}
                >
                  <HeartIcon />
                </button>

                <button
                  type="button"
                  onClick={toggleDislike}
                  disabled={!isLoggedIn}
                  className={`p-2 rounded-full hover:bg-white/10 transition ${
                    uiDisliked ? "text-[#00A3FF]" : "text-white"
                  } ${!isLoggedIn ? "opacity-60 cursor-not-allowed" : ""}`}
                  aria-label="Dislike"
                  title={isLoggedIn ? "Dislike" : "Connecte-toi pour disliker"}
                >
                  <DislikeIcon />
                </button>

                {/* ✅ bouton + : visible uniquement si connecté */}
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={openAddPopup}
                    className="p-2 rounded-full hover:bg-white/10 transition text-white"
                    aria-label="Ajouter à une playlist"
                    title="Ajouter à une playlist"
                  >
                    <PlusIcon />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SHUFFLE */}
          <div className="relative group">
            <button
              type="button"
              onClick={handleToggleShuffle}
              className={`p-2 rounded-full transition hover:bg-white/10 ${
                shuffleOn ? "text-[#00A3FF]" : "text-white"
              }`}
              aria-label={shuffleOn ? "Désactiver la lecture aléatoire" : "Activer la lecture aléatoire"}
            >
              <ShuffleIcon />
            </button>

            <span
              className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                           rounded bg-black/80 px-2 py-1 text-[11px]
                           opacity-0 group-hover:opacity-100"
            >
              {shuffleOn ? "Lecture aléatoire activée" : "Activer la lecture aléatoire"}
            </span>
          </div>

          {/* CENTER */}
          <div className="w-[40%] flex flex-col items-center gap-2">
            <div className="flex items-center gap-5">
              <IconButton ariaLabel="Previous" onClick={handlePrev}>
                <PrevIcon />
              </IconButton>

              <button
                onClick={togglePlay}
                className={`
                  grid h-12 w-12 place-items-center rounded-full 
                  text-white 
                  bg-gradient-to-tr ${gradientClass} gradient-play
                  shadow-lg shadow-pink-500/40
                  hover:scale-110 hover:shadow-pink-400/70
                  transition-transform duration-200
                `}
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              <IconButton ariaLabel="Next" onClick={handleNext}>
                <NextIcon />
              </IconButton>
            </div>

            <div className="flex w-full items-center gap-3">
              <span className="text-[11px] tabular-nums text-white/70 w-9 text-right">
                {fmt(current)}
              </span>

              <input
                type="range"
                min={0}
                max={Math.max(duration, 0)}
                step={0.5}
                value={Math.min(current, duration)}
                onChange={onSeek}
                className="w-full accent-white appearance-none h-1 rounded outline-none bg-[#3a3a3a]"
                style={{
                  background: `linear-gradient(to right, #ffffff ${
                    (current / (duration || 1)) * 100
                  }%, #3a3a3a 0)`,
                }}
              />

              <span className="text-[11px] tabular-nums text-white/70 w-9">{fmt(duration)}</span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-end gap-3 w-[30%]">
            <IconButton ariaLabel="Volume">
              <VolumeIcon />
            </IconButton>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={onVol}
              className="w-28 accent-white appearance-none h-1 rounded outline-none bg-[#3a3a3a]"
              style={{
                background: `linear-gradient(to right, #ffffff ${volume * 100}%, #3a3a3a 0)`,
              }}
            />

            <div className="relative group">
              <button
                type="button"
                onClick={() => setRepeatOne((v) => !v)}
                className={`p-2 rounded-full transition hover:bg-white/10 ${
                  repeatOne ? "text-[#00A3FF]" : "text-white"
                }`}
                aria-label={repeatOne ? "Désactiver répétition" : "Activer répétition"}
                title={repeatOne ? "Désactiver répétition" : "Activer répétition"}
              >
                <RepeatOneIcon />
              </button>

              <span
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                           rounded bg-black/80 px-2 py-1 text-[11px]
                           opacity-0 group-hover:opacity-100"
              >
                {repeatOne ? "Désactiver répétition" : "Activer répétition automatique"}
              </span>
            </div>

            <div className="relative group">
              <button
                type="button"
                onClick={() => setShowMini((v) => !v)}
                className={`p-2 rounded-full transition hover:bg-white/10 ${
                  showMini ? "text-[#00A3FF]" : "text-white"
                }`}
                aria-label="Ouvrir lecture réduite"
                title="Ouvrir lecture réduite"
              >
                <MiniPlayerIcon />
              </button>

              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[11px] opacity-0 group-hover:opacity-100">
                Ouvrir lecture réduite
              </span>
            </div>

            {onClose && (
              <IconButton ariaLabel="Fermer le lecteur" onClick={handleCloseClick}>
                <CloseIcon />
              </IconButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({ children, ariaLabel, onClick }) {
  return (
    <button
      type="button"
      className="p-2 rounded hover:bg-white/10 transition"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* Icônes */
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M11 5h2v14h-2z" />
      <path d="M5 11h14v2H5z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}
function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M6 5h2v14H6zM20 6v12L9 12z" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M16 5h2v14h-2zM4 6v12l11-6z" />
    </svg>
  );
}
function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M5 10v4h3l4 3V7L8 10H5zm10.5 2a3.5 3.5 0 0 0-2.5-3.33v6.66A3.5 3.5 0 0 0 15.5 12zm0-6a9 9 0 0 1 0 12l-1.4-1.4a7 7 0 0 0 0-9.2L15.5 6z" />
    </svg>
  );
}
function MiniPlayerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <rect x="3" y="5" width="14" height="12" rx="2" ry="2" />
      <rect x="19" y="13" width="3" height="4" rx="0.6" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M18.3 5.71 12 12.01 5.7 5.71 4.29 7.12 10.59 13.4 4.29 19.71 5.7 21.12 12 14.83 18.3 21.12 19.71 19.71 13.41 13.4 19.71 7.12z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  );
}
function RepeatOneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M7 7h9V5l4 3-4 3V9H7a3 3 0 0 0 0 6h1v2H7A5 5 0 0 1 7 7z" />
      <path d="M17 17H8v2l-4-3 4-3v2h9a3 3 0 0 0 0-6h-1V7h1a5 5 0 0 1 0 10z" />
      <path d="M12.7 9.3h-1.2l-.8.6.6.8.4-.3V15h1V9.3z" />
    </svg>
  );
}
function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M16 3h5v5h-2V6.41l-3.29 3.3-1.42-1.42L17.59 5H16V3zM3 7h5c1.1 0 2.16.44 2.93 1.22l1.2 1.2-1.42 1.41-1.2-1.2C8.9 10.23 8.46 10 8 10H3V7zm0 7h5c.46 0 .9-.23 1.31-.63l1.2-1.2 1.42 1.41-1.2 1.2C10.16 15.56 9.1 16 8 16H3v-2zm18 2.59V16h-2v5h-5v-2h1.59l-3.3-3.29 1.42-1.42 3.29 3.3z" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7-4.6-9.5-8.5C.8 9.4 2.2 6.5 5.3 6c1.8-.3 3.4.6 4.2 1.8.8-1.2 2.4-2.1 4.2-1.8 3.1.5 4.5 3.4 2.8 6.5C19 16.4 12 21 12 21z" />
    </svg>
  );
}
function DislikeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M10 15H6.4c-.9 0-1.6-.7-1.6-1.6V6.6C4.8 5.7 5.5 5 6.4 5H16c.6 0 1.1.3 1.4.8l2.1 3.8c.1.2.2.5.2.8v2c0 1.1-.9 2-2 2h-5.1l.6 3.1c.1.6-.1 1.2-.6 1.5l-1 .7c-.3.2-.8.2-1.1 0l-3.7-3.2c-.3-.2-.5-.6-.5-1V15z" />
    </svg>
  );
}


