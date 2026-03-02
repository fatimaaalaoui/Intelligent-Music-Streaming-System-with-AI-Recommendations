/*import React from 'react'

const DisplayHome = () => {
  return (
    <>
     <Navbar/>
    </>
  )
}

export default */ 
/*import Navbar from "./Navbar"; 
import HeroShelf from "./HeroShelf";       
import NewReleases from "./NewReleases";

import FilterChips from "./FilterChips";

/*export default function DisplayHome() {
  const onFilter = (val) => {
    // filtre ton contenu: all | music | podcasts
    console.log("filter:", val);
  };

  return ( 
    <div className="mx-auto max-w-[1115px] px-4"> 
      <HeroShelf />
      <NewReleases />
    </div>
  
      
  );
}*/
/*export default function DisplayHome() {
  const onFilter = (val) => {
    console.log("filter:", val);
  };

  return (
    <div className="px-6 lg:px-10 space-y-8">
      
      <FilterChips onFilter={onFilter} />

      
      <HeroShelf />

      
      <NewReleases />
    </div>
  );
}*/
// src/components/DisplayHome.jsx
// src/components/DisplayHome.jsx
// src/components/DisplayHome.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroShelf from "./HeroShelf";
import NewReleases from "./NewReleases";
import FilterChips from "./FilterChips";
import Recommendations from "./Recommendations";

import Section from "./Section";
import ScrollRow from "./ScrollRow";
import ArtistBubbleCard from "./ArtistBubbleCard";

export default function DisplayHome({ user, onPlayTrack }) {
  const navigate = useNavigate();

  const [filter, setFilter] = useState("all"); // all | music | artists
  const [albums, setAlbums] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [artists, setArtists] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [hasLikedTracks, setHasLikedTracks] = useState(false);
    // ✅ Quand on clique "Titres likés"
  // ✅ remplace openLikedTracks dans DisplayHome.jsx
const openLikedTracks = () => {
  const userId = user?._id || user?.id;
  if (!userId) return;
  navigate(`/liked?userId=${encodeURIComponent(userId)}`);
};


  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const userId = user?._id || user?.id;

        const [resAlbums, resTop, resArtists, resLikes] = await Promise.all([
          fetch("http://localhost:5000/api/albums"),
          fetch("http://localhost:5000/api/reco/top"),
          // ✅ prends beaucoup (augmente si besoin)
          fetch("http://localhost:5000/api/artists?limit=200"),
          userId
            ? fetch(`http://localhost:5000/api/users/${userId}/likes/summary`)
            : Promise.resolve(null),
        ]);

        if (!resAlbums.ok) throw new Error("API albums: " + resAlbums.status);
        if (!resTop.ok) throw new Error("API reco/top: " + resTop.status);
        if (!resArtists.ok) throw new Error("API artists: " + resArtists.status);
        if (resLikes && !resLikes.ok) throw new Error("API likes: " + resLikes.status);

        const [albumsJson, topJson, artistsJson] = await Promise.all([
          resAlbums.json(),
          resTop.json(),
          resArtists.json(),
        ]);

        let liked = false;
        if (resLikes) {
          const likesSummary = await resLikes.json();
          liked = !!likesSummary?.hasLikes;
        }

        setAlbums(albumsJson || []);
        setTopTracks(topJson || []);
        setArtists(artistsJson || []);
        setHasLikedTracks(liked);
      } catch (e) {
        setErr(e.message || "Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const normalizedArtists = useMemo(() => {
    return (artists || [])
      .map((a) => ({
        _id: a._id || a.id,
        name: a.name || a.artistName || "Artiste",
        image: a.image || a.photo || a.picture || null,
      }))
      .filter((a) => a._id);
  }, [artists]);

  const artistsPopular12 = normalizedArtists.slice(0, 12);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4">
        <FilterChips value={filter} onChange={setFilter} />
      </div>

      {loading && <p className="px-4 py-6 text-sm text-white/60">Chargement…</p>}
      {err && <p className="px-4 py-6 text-sm text-red-400">Erreur : {err}</p>}

      {!loading && !err && (
        <>
          {/* ✅ IMPORTANT: en mode "Artistes", on cache HeroShelf + tracks + reco */}
          {filter !== "artists" && (
            <HeroShelf
  albums={albums}
  hasLikedTracks={hasLikedTracks}
  onOpenLikedTracks={openLikedTracks}
/>

          )}

          {filter !== "artists" && (
            <NewReleases tracks={topTracks} onPlayTrack={onPlayTrack} />
          )}

          {/* ✅ SECTION ARTISTES : style JamendoHome */}
          {normalizedArtists.length > 0 && (
            <div className="px-4">
              {filter === "artists" ? (
                <Section
                  title="Artistes"
                  description="Artistes les plus présents dans ta base Jamendo."
                >
                  <div className="flex flex-wrap gap-8">
                    {normalizedArtists.map((artist) => (
                      <ArtistBubbleCard
                        key={artist._id}
                        artist={artist}
                        onClick={() => navigate(`/artist/${artist._id}`)}
                      />
                    ))}
                  </div>
                </Section>
              ) : (
                // ✅ en "Tout" : au milieu, seulement 12 + lien "Tout afficher"
                filter === "all" && (
                  <Section
                    title="Artistes populaires"
                    actionLabel="Tout afficher"
                    description="Artistes les plus présents dans ta base Jamendo."
                    seeAllData={{
                      title: "Artistes populaires",
                      type: "artists",
                      artists: normalizedArtists, // on envoie tous
                    }}
                  >
                    <ScrollRow itemCount={artistsPopular12.length}>
                      {artistsPopular12.map((artist) => (
                        <ArtistBubbleCard
                          key={artist._id}
                          artist={artist}
                          onClick={() => navigate(`/artist/${artist._id}`)}
                        />
                      ))}
                    </ScrollRow>
                  </Section>
                )
              )}
            </div>
          )}

          {filter !== "artists" && (
            <div className="px-4 pb-10">
              <Recommendations
                currentUser={user}
                hasLikedTracks={hasLikedTracks}
                limit={30}
                onPlayTrack={onPlayTrack}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}


