require("dotenv").config();
const { MongoClient } = require("mongodb");
const axios = require("axios");

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB;
const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID;

async function main() {
  if (!JAMENDO_CLIENT_ID) {
    throw new Error("Missing JAMENDO_CLIENT_ID in .env");
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  // Exemple : récupérer des tracks (tu peux ajouter tags/genre/offset etc.)
  const url = "https://api.jamendo.com/v3.0/tracks";
  const { data } = await axios.get(url, {
    params: {
      client_id: JAMENDO_CLIENT_ID,
      format: "json",
      limit: 200,
      // track_type: "all", // utile si tu veux singles+albums (voir doc)
    },
  });

  const tracks = data?.results || [];
  console.log("Jamendo tracks:", tracks.length);

  for (const t of tracks) {
    await db.collection("tracks").updateOne(
      { _id: String(t.id) },
      {
        $set: {
          _id: String(t.id),
          title: t.name,
          artistName: t.artist_name,
          image: t.image || t.album_image || "",
          audioUrl: t.audio || "",
          albumId: t.album_id ? String(t.album_id) : null,
          artistId: t.artist_id ? String(t.artist_id) : null,
          source: "jamendo",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  }

  await client.close();
  console.log("OK: tracks upserted.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
