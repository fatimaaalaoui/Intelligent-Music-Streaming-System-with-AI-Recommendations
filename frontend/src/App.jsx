/*import React from 'react'
import Sidebar from './components/Sidebar'
import Player from './components/Player'
import {songsData} from './assets/assetes/photo'

const App = () => {
  return (
    <div className='h-screen  bg-[#010112]'>
      <div className='h-[90%] flex'>
        <Sidebar/>
      </div>
      <Player
        track={{
          title: songsData[0].name,
          artist: songsData[0].desc,
    cover: songsData[0].image,
    src: songsData[0].src // important
  }}
      />
    </div>
  )
}

export default    
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { Routes, Route } from "react-router-dom";
import DisplayHome from "./components/DisplayHome";
import Album from "./components/Album";


export default function App() {
  return (
   
    <div className="min-h-screen bg-[#0a0b16] text-white">
      <div className="grid grid-cols-[350px_1fr] min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-col relative">
          <Navbar />
          <main className="flex-1 overflow-y-auto px-6 pt-4 pb-28">
            <Routes>
              <Route path="/" element={<DisplayHome />} />
              <Route path="/album/:id" element={<Album />} />
              
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
  
}*/
/*import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { Routes, Route } from "react-router-dom";
import DisplayHome from "./components/DisplayHome";
import AlbumPage from "./components/Album";

export default function App() {
  return (
    /*<div className="min-h-screen bg-[#0a0b16] text-white">
      <div className="grid grid-cols-[350px_1fr] min-h-screen">
        <Sidebar />

        
        <div className="relative flex min-h-screen flex-col overflow-y-auto">
          
          <div className="sticky top-0 z-50">
            <Navbar />
          </div>

          
          <main className="flex-1 px-6 pt-4 pb-28">
            <Routes>
              <Route path="/" element={<DisplayHome />} />
              <Route path="/album/:id" element={<AlbumPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>*/
    /*
     <div className="min-h-screen bg-[#0a0b16] text-white">

      <div className="fixed top-0 right-0 left-[350px] z-50
                      max-md:left-0 ">
        <Navbar />
      </div>

      <div className="grid grid-cols-[350px_1fr] min-h-screen max-md:grid-cols-1">
        <Sidebar />

        
        <div className="relative flex min-h-screen flex-col overflow-y-auto pt-16">
          <main className="flex-1 px-6 pb-28">
            <Routes>
              <Route path="/" element={<DisplayHome />} />
              <Route path="/album/:id" element={<AlbumPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
*/
// src/App.jsx

   /* <div className="min-h-screen bg-[#0a0b16] text-white">
      
      <div className="grid grid-cols-[auto_1fr] min-h-screen max-md:grid-cols-1">
       
        <Sidebar />

      
        <div className="relative flex min-h-screen flex-col overflow-y-auto scrollbar-dark">
         
          <div className="sticky top-0 z-50 bg-[#0a0b16]">
            <Navbar />
          </div>

          
          <main className="flex-1 px-6 pb-28 pt-4">
            <Routes>
              <Route path="/" element={<DisplayHome />} />
              <Route path="/album/:id" element={<AlbumPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
*/
/*import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import DisplayHome from "./components/DisplayHome";
import AlbumPage from "./components/Album";
import Player from "./components/Player";

export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);

  return (
    <div className="min-h-screen bg-[#010112] text-white">
      
      <div className="grid grid-cols-[auto_1fr] min-h-screen max-md:grid-cols-1">
       
        <Sidebar />

        
        <div className="relative flex min-h-screen flex-col overflow-y-auto scrollbar-dark">
          
          <div className="sticky top-0 z-50 bg-[#010112]">
            <Navbar />
          </div>

         
          <main className="flex-1 px-6 pb-28 pt-4">
            <Routes>
              <Route
                path="/"
                element={<DisplayHome onPlayTrack={setCurrentTrack} />}
              />
              <Route path="/album/:id" element={<AlbumPage />} />
            </Routes>
          </main>
        </div>
      </div>

      
      <Player track={currentTrack || undefined} />
    </div>
  );
}*/
// src/App.jsx
/*import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import JamendoHome from "./components/JamendoHome";  // 👈 nouvelle home
import AlbumPage from "./components/Album";
import Player from "./components/Player";
import SeeAllAlbums from "./components/SeeAllAlbums";
export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);

  return (
    <div className="min-h-screen bg-[#010112] text-white">
      <div className="grid grid-cols-[auto_1fr] min-h-screen max-md:grid-cols-1">
        <Sidebar />

        <div className="relative flex min-h-screen flex-col overflow-y-auto scrollbar-dark">
          <div className="sticky top-0 z-50 bg-[#010112]">
            <Navbar />
          </div>

          <main className="flex-1 px-6 pb-28 pt-4">
            <Routes>
              <Route
                path="/"
                element={<JamendoHome onPlayTrack={setCurrentTrack} />}
              />

              
              <Route path="/album/:id" element={<AlbumPage />} />
              <Route path="/see-all" element={<SeeAllAlbums />} />
            </Routes>
          </main>
        </div>
      </div>

      
      <Player track={currentTrack || undefined} />
    </div>
  );
}
*/
// src/App.jsx
// src/App.jsx
// src/App.jsx
// src/App.jsx

/*import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import JamendoHome from "./components/JamendoHome";
import ArtistPage from "./components/ArtistPage";
import AlbumsPage from "./components/Albums";
import SeeAllAlbums from "./components/SeeAllAlbums";
import Player from "./components/Player";
import LoginPage from "./components/LoginPage";

const getId = (t) => t?.id || t?._id || t?.src || t?.audioUrl;

export default function App() {
  const [currentTrack, setCurrentTrack] = useState(null);

  // ✅ UNE seule playlist active
  const [playlist, setPlaylist] = useState({
    list: [],
    index: -1,
    
  });
  
  // Navbar (inchangé)
  const [currentUser, setCurrentUser] = useState(null);
  const handleLogout = () => setCurrentUser(null);
  const [isShuffle, setIsShuffle] = useState(false);
const [baseList, setBaseList] = useState([]); // ordre normal (zone sélectionnée)

   const shuffleCopy = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// met le track courant en 1er, puis mélange le reste
const buildShuffledList = (list, keepId) => {
  if (!Array.isArray(list) || list.length === 0) return [];
  const idx = list.findIndex((t) => getId(t) === keepId);
  const current = idx >= 0 ? list[idx] : list[0];

  const rest = list.filter((t) => getId(t) !== getId(current));
  const shuffledRest = shuffleCopy(rest);

  return [current, ...shuffledRest];
};

  
   * @param {object} track  track cliqué
   * @param {object[]} list playlist complète
   
  const handlePlayTrack = (track, list) => {
  if (!track) return; 
  const rawTracks = Array.isArray(list) && list.length > 0 ? list : [track];
  const tracks = normalizeList(rawTracks);
  const clicked = normalizeTrack(track);
  const clickedId = clicked.id;

  setBaseList(tracks);

  if (isShuffle) {
    const shuffled = buildShuffledList(tracks, clickedId);
    setPlaylist({ list: shuffled, index: 0 });
    setCurrentTrack(shuffled[0]);
    return;
  }

  let index = tracks.findIndex((t) => t.id === clickedId);
  if (index === -1) index = 0;

  setPlaylist({ list: tracks, index });
  setCurrentTrack(tracks[index]);
};

const normalizeTrack = (t = {}) => ({
  id: t.id || t._id || t.audioUrl || t.src,
  title: t.title || t.name || "Titre",
  artist: t.artist || t.artistName || (t.artist?.name ?? "") || "Artiste Jamendo",
  cover: t.cover || t.image || t.coverUrl || "",
  src: t.src || t.audioUrl || "",
});

const normalizeList = (list) =>
  (Array.isArray(list) ? list : [])
    .map(normalizeTrack)
    .filter((x) => x.id); // garde les items valides


  const handleNext = () => {
    setPlaylist((prev) => {
      if (!prev.list.length) return prev;

      const nextIndex = (prev.index + 1) % prev.list.length;
      setCurrentTrack(prev.list[nextIndex]);

      return { ...prev, index: nextIndex };
    });
  };

  const handlePrev = () => {
    setPlaylist((prev) => {
      if (!prev.list.length) return prev;

      const prevIndex =
        prev.index <= 0 ? prev.list.length - 1 : prev.index - 1;

      setCurrentTrack(prev.list[prevIndex]);

      return { ...prev, index: prevIndex };
    });
  };

  const handleClosePlayer = () => {
    setCurrentTrack(null);
    setPlaylist({ list: [], index: -1 });
  };
   const toggleShuffle = () => {
  setIsShuffle((prev) => {
    const next = !prev;

    if (!playlist.list.length) return next;

    const current = playlist.list[playlist.index] || currentTrack;
    const currentId = getId(current);

    if (next) {
      const base = baseList.length ? baseList : playlist.list;
      setBaseList(base);

      const shuffled = buildShuffledList(base, currentId);
      setPlaylist({ list: shuffled, index: 0 });
      setCurrentTrack(shuffled[0]);
    } else {
      const base = baseList.length ? baseList : playlist.list;
      let idx = base.findIndex((t) => getId(t) === currentId);
      if (idx === -1) idx = 0;

      setPlaylist({ list: base, index: idx });
      setCurrentTrack(base[idx]);
    }

    return next;
  });
};
const location = useLocation();
const isAuth = location.pathname === "/login" || location.pathname === "/signup";

if (isAuth) {
  return (
    <div className="min-h-screen bg-[#010112] text-white">
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={setCurrentUser} />} />
        <Route path="/signup" element={<LoginPage onLogin={setCurrentUser} initialStep="signup" />} />
      </Routes>
    </div>
  );
}

  return (
    <div className="h-screen bg-[#010112] text-white overflow-hidden">
      <div className="grid grid-cols-[auto_1fr] h-full max-md:grid-cols-1">
        <Sidebar />

        <div className="relative flex flex-col h-full overflow-y-auto scrollbar-dark">
          <div className="sticky top-0 z-50 bg-[#010112]">
            <Navbar currentUser={currentUser} onLogout={handleLogout} />
          </div>

          <main className="flex-1 px-6 pb-28 pt-4">
            <Routes>
             <Route path="/login" element={<LoginPage onLogin={setCurrentUser} />} />

              <Route
                path="/"
                element={<JamendoHome onPlayTrack={handlePlayTrack} />}
              />
              <Route
                path="/album/:id"
                element={<AlbumsPage onPlayTrack={handlePlayTrack} />}
              />
              <Route
                path="/artist/:id"
                element={<ArtistPage onPlayTrack={handlePlayTrack} />}
              />
              <Route
  path="/see-all"
  element={<SeeAllAlbums onPlayTrack={handlePlayTrack} />}
/> 
         <Route path="/profile" element={<div className="text-white">Profile (à créer)</div>} />

            </Routes>
          </main>
        </div>
      </div>

      {currentTrack && (
        <Player
  track={currentTrack}
  onNext={handleNext}
  onPrev={handlePrev}
  onClose={handleClosePlayer}
  isShuffle={isShuffle}
  onToggleShuffle={toggleShuffle}
/>
      )}
    </div>
  );
}*/
// src/App.jsx
// src/App.jsx
// src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import JamendoHome from "./components/JamendoHome";
import DisplayHome from "./components/DisplayHome";

import ArtistPage from "./components/ArtistPage";
import AlbumsPage from "./components/Albums";
import SeeAllAlbums from "./components/SeeAllAlbums";

import Player from "./components/Player";
import LoginPage from "./components/LoginPage";
import PlaylistPage from "./components/PlaylistPage";
import SeeAll from "./components/SeeAll";
import { MusicProvider } from "./components/MusicContext";
import { useMusic } from "./components/useMusic";
import BrowseGenres from "./components/BrowseGenres";
import GenrePage from "./components/GenrePage";
import SearchPage from "./components/SearchPage";
import LikedTracksPage from "./components/LikedTracksPage";


import Recommendations from "./components/Recommendations";

const getId = (t) => t?.id || t?._id || t?.src || t?.audioUrl;

function AppInner() {
  // ✅ states manquants
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playlist, setPlaylist] = useState({ list: [], index: -1 });

  // ✅ UNE SEULE FOIS (corrigé)
  const { playTrack, loadRecentFromServer } = useMusic();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  });

  // ---------- PLAYER / PLAYLIST LOGIC ----------
  const [isShuffle, setIsShuffle] = useState(false);
  const [baseList, setBaseList] = useState([]); // ordre normal (avant shuffle)

  const normalizeTrack = (t = {}) => ({
    id: t.id || t._id || t.audioUrl || t.src,
    title: t.title || t.name || "Titre",
    artist: t.artist || t.artistName || (t.artist?.name ?? "") || "Artiste",
    cover: t.cover || t.image || t.coverUrl || "",
    src: t.src || t.audioUrl || "",
  });

  const normalizeList = (list) =>
    (Array.isArray(list) ? list : []).map(normalizeTrack).filter((x) => x.id);

  const shuffleCopy = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const buildShuffledList = (list, keepId) => {
    if (!Array.isArray(list) || list.length === 0) return [];
    const idx = list.findIndex((t) => getId(t) === keepId);
    const current = idx >= 0 ? list[idx] : list[0];
    const rest = list.filter((t) => getId(t) !== getId(current));
    return [current, ...shuffleCopy(rest)];
  };

  const handlePlayTrack = (track, list) => {
    if (!track) return;

    const rawTracks = Array.isArray(list) && list.length > 0 ? list : [track];
    const tracks = normalizeList(rawTracks);
    const clicked = normalizeTrack(track);
    const clickedId = clicked.id;

    setBaseList(tracks);

    if (isShuffle) {
      const shuffled = buildShuffledList(tracks, clickedId);
      setPlaylist({ list: shuffled, index: 0 });
      setCurrentTrack(shuffled[0]);
      playTrack(shuffled[0]); // ✅ historique
      return;
    }

    let index = tracks.findIndex((t) => t.id === clickedId);
    if (index === -1) index = 0;

    setPlaylist({ list: tracks, index });
    setCurrentTrack(tracks[index]);
    playTrack(tracks[index]); // ✅ historique
  };

  const handleNext = () => {
    setPlaylist((prev) => {
      if (!prev.list.length) return prev;
      const nextIndex = (prev.index + 1) % prev.list.length;
      const nextTrack = prev.list[nextIndex];
      setCurrentTrack(nextTrack);
      playTrack(nextTrack); // ✅ historique
      return { ...prev, index: nextIndex };
    });
  };

  const handlePrev = () => {
    setPlaylist((prev) => {
      if (!prev.list.length) return prev;
      const prevIndex = prev.index <= 0 ? prev.list.length - 1 : prev.index - 1;
      const prevTrack = prev.list[prevIndex];
      setCurrentTrack(prevTrack);
      playTrack(prevTrack); // ✅ historique
      return { ...prev, index: prevIndex };
    });
  };

  const handleClosePlayer = () => {
    setCurrentTrack(null);
    setPlaylist({ list: [], index: -1 });
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (!playlist.list.length) return next;

      const current = playlist.list[playlist.index] || currentTrack;
      const currentId = getId(current);

      if (next) {
        const base = baseList.length ? baseList : playlist.list;
        setBaseList(base);
        const shuffled = buildShuffledList(base, currentId);
        setPlaylist({ list: shuffled, index: 0 });
        setCurrentTrack(shuffled[0]);
        playTrack(shuffled[0]); // ✅ historique
      } else {
        const base = baseList.length ? baseList : playlist.list;
        let idx = base.findIndex((t) => getId(t) === currentId);
        if (idx === -1) idx = 0;
        setPlaylist({ list: base, index: idx });
        setCurrentTrack(base[idx]);
        playTrack(base[idx]); // ✅ historique
      }

      return next;
    });
  };

  // ---------- AUTH ----------
  const handleLogin = (u) => {
    setCurrentUser(u);
    localStorage.setItem("currentUser", JSON.stringify(u));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  // ---------- RECENT (sidebar) ----------
  useEffect(() => {
    if (currentUser?._id) loadRecentFromServer(String(currentUser._id));
  }, [currentUser, loadRecentFromServer]);

  const location = useLocation();
  const isAuth = location.pathname === "/login" || location.pathname === "/signup";

  if (isAuth) {
    return (
      <div className="min-h-screen bg-[#010112] text-white">
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/see-all" element={<SeeAll />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#010112] text-white overflow-hidden">
      <div className="grid grid-cols-[auto_1fr] h-full max-md:grid-cols-1">
        <Sidebar currentUser={currentUser} />

        <div className="relative flex flex-col h-full overflow-y-auto scrollbar-dark">
          <div className="sticky top-0 z-50 bg-[#010112]">
            <Navbar currentUser={currentUser} onLogout={handleLogout} />
          </div>

          <main className="flex-1 px-6 pb-28 pt-4">
            <Routes>
              <Route
                path="/"
                element={
                  currentUser ? (
                    <DisplayHome user={currentUser} onPlayTrack={handlePlayTrack} />
                  ) : (
                    <JamendoHome onPlayTrack={handlePlayTrack} />
                  )
                }
              />
               <Route
  path="/browse"
  element={<BrowseGenres currentUser={currentUser} />}
/>
<Route
  path="/search"
  element={<SearchPage onPlayTrack={handlePlayTrack} />}
/>

<Route
  path="/genre/:genre"
  element={<GenrePage currentUser={currentUser} onPlayTrack={handlePlayTrack} />}
/>
<Route path="/liked" element={<LikedTracksPage onPlayTrack={handlePlayTrack} />} />


              <Route path="/album/:id" element={<AlbumsPage onPlayTrack={handlePlayTrack} />} />
              <Route path="/artist/:id" element={<ArtistPage onPlayTrack={handlePlayTrack} />} />
              <Route path="/see-all" element={<SeeAllAlbums onPlayTrack={handlePlayTrack} />} />
              
              <Route
                path="/playlist/:playlistId"
                element={<PlaylistPage currentUser={currentUser} onPlayTrack={handlePlayTrack} />}
              />

              <Route
                path="/profile"
                element={
                  currentUser ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </main>
        </div>
      </div>

      {currentTrack && (
        <Player
          track={currentTrack}
          currentUser={currentUser}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={handleClosePlayer}
          isShuffle={isShuffle}
          onToggleShuffle={toggleShuffle}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <MusicProvider>
      <AppInner />
    </MusicProvider>
  );
}
