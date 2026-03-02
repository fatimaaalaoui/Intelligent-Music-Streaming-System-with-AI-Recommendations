// routes/discover.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

// 1) mapping mood -> tags Jamendo + styleName (pour afficher "Ton style")
const MOOD_MAP = {
  chill:   { style: "Chill Vibes", tags: ["chill", "downtempo", "ambient"] },
  focus:   { style: "Study Focus", tags: ["lofi", "ambient", "piano"] },
  energy:  { style: "Energy Boost", tags: ["dance", "edm", "electronic"] },
  sad:     { style: "Soft Sad", tags: ["acoustic", "sad", "indie"] },
};

// 2) petite extraction simple depuis un message (chatbot)
function parseMessage(message = "") {
  const text = message.toLowerCase();

  // mood par mots-clés (simple mais efficace)
  if (/(réviser|study|focus|concentration)/.test(text)) return { mood: "focus" };
  if (/(chill|calm|relax|détente)/.test(text)) return { mood: "chill" };
  if (/(sport|gym|energi|workout|dance)/.test(text)) return { mood: "energy" };
  if (/(triste|sad|broken|calm down)/.test(text)) return { mood: "sad" };

  // fallback
  return { mood: "chill" };
}

// 3) appel Jamendo
async function jamendoFetchTracks({ clientId, tags = [], limit = 20 }) {
  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    limit: String(limit),
    include: "musicinfo",
    // Jamendo: on peut passer plusieurs tags séparés par des "+"
    tags: tags.join("+"),
  });

  const url = `https://api.jamendo.com/v3.0/tracks/?${params.toString()}`;
  const { data } = await axios.get(url);
  return (data?.results || []).map(t => ({
    id: t.id,
    name: t.name,
    artist_name: t.artist_name,
    album_name: t.album_name,
    image: t.image,
    audio: t.audio,
    tags: t.musicinfo?.tags || [],
  }));
}

// 4) endpoint unique
router.post("/", async (req, res) => {
  try {
    const db = req.app.locals.db; // on va le configurer dans server.js
    const clientId = process.env.JAMENDO_CLIENT_ID;
    if (!clientId) return res.status(400).json({ error: "JAMENDO_CLIENT_ID manquant dans .env" });

    const { userId, mood, message, limit = 20 } = req.body;

    // a) déterminer le mood
    const finalMood = mood || parseMessage(message).mood;
    const cfg = MOOD_MAP[finalMood] || MOOD_MAP.chill;

    // b) personnalisation simple via Mongo (si userId existe)
    //    -> on récupère 1-2 genres les + écoutés pour enrichir les tags Jamendo
    let extraTags = [];
    if (userId && db) {
      const topGenres = await db.collection("listening_history").aggregate([
        { $match: { userId } }, // si chez toi userId est string (comme dans server.js)
        { $sort: { playedAt: -1 } },
        { $limit: 200 },
        { $lookup: { from: "tracks", localField: "trackId", foreignField: "_id", as: "track" } },
        { $unwind: "$track" },
        { $group: { _id: "$track.mainGenre", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 2 },
      ]).toArray();

      extraTags = topGenres.map(g => g._id).filter(Boolean);
    }

    // c) tags finaux = mood tags + 0..2 tags user
    const tags = [...cfg.tags, ...extraTags].slice(0, 5);

    // d) fetch Jamendo
    const tracks = await jamendoFetchTracks({ clientId, tags, limit });

    // e) artistes & genres proposés (déduits)
    const artists = [...new Set(tracks.map(t => t.artist_name))].slice(0, 6);
    const genres = tags.slice(0, 3);

    return res.json({
      reply: `🎧 Ton style du moment : ${cfg.style}`,
      style: cfg.style,
      mood: finalMood,
      genres,
      artists,
      tracks,
    });
  } catch (e) {
    console.error("POST /api/discover error:", e);
    res.status(500).json({ error: "Erreur discover" });
  }
});

module.exports = router;