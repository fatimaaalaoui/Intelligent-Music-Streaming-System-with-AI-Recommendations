// importJamendo.js
require("dotenv").config();
const axios = require("axios");
const { MongoClient } = require("mongodb");

const JAMENDO_API = "https://api.jamendo.com/v3.0";

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  console.log("✅ Connecté à MongoDB");
  const db = client.db(process.env.MONGO_DB);

  try {
    const LIMIT = 100; // nombre de tracks par appel API
    let offset = 0;
    let totalTracks = 0;

    while (true) {
      console.log(`➡️  Récupération Jamendo /tracks offset=${offset}`);

      const res = await axios.get(`${JAMENDO_API}/tracks`, {
        params: {
          client_id: process.env.JAMENDO_CLIENT_ID,
          format: "json",
          limit: LIMIT,
          offset: offset,
        },
      });

      const tracks = res.data.results;

      if (!tracks || tracks.length === 0) {
        console.log("✨ Plus de tracks à importer, on arrête.");
        break;
      }

      for (const track of tracks) {
        const artistId = track.artist_id;
        const albumId  = track.album_id;

        // --- ARTISTE ---
        await db.collection("artists").updateOne(
          { _id: artistId },
          {
            $set: {
              name: track.artist_name,
              image: track.album_image,
              jamendoUrl: track.shareurl,
              source: "jamendo",
            },
          },
          { upsert: true }
        );

        // --- ALBUM ---
        await db.collection("albums").updateOne(
          { _id: albumId },
          {
            $set: {
              title: track.album_name,
              artistId: artistId,
              image: track.album_image,
              jamendoUrl: track.shareurl,
              source: "jamendo",
            },
          },
          { upsert: true }
        );

        // --- TRACK ---
        await db.collection("tracks").updateOne(
          { _id: track.id },
          {
            $set: {
              title: track.name,
              albumId: albumId,
              artistId: artistId,
              duration: track.duration,
              audioUrl: track.audio,
              image: track.album_image,
              licenseUrl: track.license_ccurl,
              tags: [],          // tu pourras remplir plus tard avec les genres
              source: "jamendo",
            },
          },
          { upsert: true }
        );

        totalTracks++;
      }

      console.log(`✅ Page importée : ${tracks.length} tracks (total = ${totalTracks})`);

      offset += LIMIT;

      // Sécurité : on limite à 1000 tracks pour un projet étudiant
      if (offset >= 1000) {
        console.log("⏹ Offset >= 1000, on stop pour éviter un import énorme.");
        break;
      }
    }

    console.log(`🎉 Import terminé. Tracks insérés/mis à jour : ${totalTracks}`);
  } catch (err) {
    console.error("❌ Erreur pendant l'import Jamendo :");
    if (err.response) {
      console.error("Status :", err.response.status);
      console.error("Data  :", err.response.data);
    } else {
      console.error(err.message || err);
    }
  } finally {
    await client.close();
    console.log("🔌 Connexion MongoDB fermée");
  }
}

main();
