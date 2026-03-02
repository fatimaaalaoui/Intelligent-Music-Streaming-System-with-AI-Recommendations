// assignGenresBySearch.js
require("dotenv").config();
const axios = require("axios");
const { MongoClient } = require("mongodb");

const JAMENDO_API = "https://api.jamendo.com/v3.0";

// Les genres que tu veux pour ton projet
const GENRES = ["rock", "pop", "rap", "jazz", "electro"];

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  console.log("✅ Connecté à MongoDB (assignGenresBySearch)");
  const db = client.db(process.env.MONGO_DB);

  const LIMIT = 50;          // nb de tracks par appel
  const MAX_PER_GENRE = 200; // max de morceaux par genre (pour ne pas exploser la base)

  for (const genre of GENRES) {
    console.log(`🎧 Traitement du genre: ${genre}`);
    let offset = 0;
    let countForGenre = 0;

    while (true) {
      console.log(`  → Jamendo /tracks tags=${genre} offset=${offset}`);

      const res = await axios.get(`${JAMENDO_API}/tracks`, {
        params: {
          client_id: process.env.JAMENDO_CLIENT_ID,
          format: "json",
          limit: LIMIT,
          offset,
          tags: genre, // on demande à Jamendo : morceaux tagués "genre"
        },
      });

      const tracks = res.data.results;
      if (!tracks || tracks.length === 0) {
        console.log(`  ✨ Plus de tracks pour ${genre}`);
        break;
      }

      for (const track of tracks) {
        const artistId = String(track.artist_id);
        const albumId = String(track.album_id);
        const trackId = String(track.id);

        // ARTISTE
        await db.collection("artists").updateOne(
          { _id: artistId },
          {
            $set: {
              name: track.artist_name,
              image: track.album_image,
              source: "jamendo",
            },
          },
          { upsert: true }
        );

        // ALBUM
        await db.collection("albums").updateOne(
          { _id: albumId },
          {
            $set: {
              title: track.album_name,
              artistId: artistId,
              image: track.album_image,
              source: "jamendo",
            },
          },
          { upsert: true }
        );

        // TRACK + mainGenre
        await db.collection("tracks").updateOne(
          { _id: trackId },
          {
            $set: {
              title: track.name,
              albumId: albumId,
              artistId: artistId,
              duration: track.duration,
              audioUrl: track.audio,
              image: track.album_image,
              licenseUrl: track.license_ccurl || "",
              source: "jamendo",
              mainGenre: genre, // 🔥 on force le genre ici
            },
          },
          { upsert: true }
        );

        countForGenre++;
        if (countForGenre >= MAX_PER_GENRE) {
          console.log(`  ⏹ Limite ${MAX_PER_GENRE} atteinte pour ${genre}`);
          break;
        }
      }

      if (countForGenre >= MAX_PER_GENRE) break;
      offset += LIMIT;
    }

    console.log(
      `✅ Genre ${genre} terminé, ${countForGenre} tracks marqués comme ${genre}`
    );
  }

  await client.close();
  console.log("🔌 Connexion MongoDB fermée (assignGenresBySearch)");
}

main().catch((err) => {
  console.error("Erreur assignGenresBySearch :", err);
});
