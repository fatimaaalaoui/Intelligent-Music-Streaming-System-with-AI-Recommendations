// importJamendo.js
require("dotenv").config();
const axios = require("axios");
const { MongoClient } = require("mongodb");

const JAMENDO_API = "https://api.jamendo.com/v3.0";

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  console.log("Connecté à MongoDB");
  const db = client.db(process.env.MONGO_DB);

  try {
    const LIMIT = 70; // nb d'albums par appel API
    let offset = 0;
    let totalAlbums = 0;

    while (true) {
      console.log(`Récupération Jamendo offset=${offset}`);

      // Appel API Jamendo: albums + leurs tracks
      const res = await axios.get(`${JAMENDO_API}/albums/tracks`, {
        params: {
          client_id: process.env.JAMENDO_CLIENT_ID,
          format: "json",
          limit: LIMIT,
          offset: offset,
          // important : pour récupérer les infos musicales (genres, tags, moods...)
          include: "musicinfo",
        },
      });

      const albums = res.data.results;

      if (!albums || albums.length === 0) {
        console.log("Plus d'albums à importer, on arrête.");
        break;
      }

      // Pour chaque album → insert / update artist, album, tracks
      for (const album of albums) {
        // --- ARTISTE ---
        await db.collection("artists").updateOne(
          { _id: album.artist_id },
          {
            $set: {
              name: album.artist_name,
              image: album.image,
              jamendoUrl: album.shareurl,
              source: "jamendo",
            },
          },
          { upsert: true }
        );

        // --- ALBUM ---
        await db.collection("albums").updateOne(
          { _id: album.id },
          {
            $set: {
              title: album.name,
              artistId: album.artist_id,
              image: album.image,
              zip: album.zip,
              zipAllowed: album.zip_allowed,
              jamendoUrl: album.shareurl,
              source: "jamendo",
            },
          },
          { upsert: true }
        );

        // --- TRACKS ---
        if (Array.isArray(album.tracks)) {
          for (const track of album.tracks) {
            // 🔹 Récupérer les genres/tags depuis musicinfo
            let tags = [];

            if (track.musicinfo) {
              // 1) tags généraux (objet { tag: poids, ... })
              if (track.musicinfo.tags) {
                const tagObj = track.musicinfo.tags;
                tags = Object.keys(tagObj); // ex: ["rock", "indie", "chill"]
              }

              // 2) genres spécifiques
              if (track.musicinfo.genre) {
                const g = track.musicinfo.genre;
                let genresFromField = [];

                if (Array.isArray(g)) {
                  // ex: [{ name: "rock", weight: 1 }, { name: "indie", weight: 0.8 }]
                  genresFromField = g
                    .map((item) =>
                      typeof item === "string" ? item : item.name
                    )
                    .filter(Boolean);
                } else if (typeof g === "string") {
                  // ex: "rock"
                  genresFromField = [g];
                } else if (typeof g === "object") {
                  // ex: { rock: 1, indie: 0.8 }
                  genresFromField = Object.keys(g);
                }

                // fusionner tags + genres (sans doublons)
                tags = Array.from(new Set([...tags, ...genresFromField]));
              }
            }

            await db.collection("tracks").updateOne(
              { _id: track.id },
              {
                $set: {
                  title: track.name,
                  albumId: album.id,
                  artistId: album.artist_id,
                  duration: track.duration,
                  audioUrl: track.audio,
                  image: track.image,
                  licenseUrl: track.license_ccurl,
                  tags: tags,
                  source: "jamendo",
                },
              },
              { upsert: true }
            );
          }
        }

        totalAlbums++;
      }

      console.log(`Page importée : ${albums.length} albums`);
      offset += LIMIT;

      // Sécurité pour les tests : on stop après 500 albums
      if (offset >= 500) {
        console.log("Offset >= 500, on arrête ici pour le test.");
        break;
      }
    }

    console.log("Import terminé. Albums parcourus :", totalAlbums);
  } catch (err) {
    console.error("Erreur pendant l'import Jamendo :");
    console.error(err.response?.data || err);
  } finally {
    await client.close();
    console.log("Connexion MongoDB fermée");
  }
}

main();
