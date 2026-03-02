// server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const app = express(); // ✅ d’abord
const discoverRoutes = require("./routes/discover");

app.use(cors());
app.use(express.json());
app.use("/api/discover", discoverRoutes);

// ✅ monte tes routes playlists APRÈS
// (désactivé) const playlistsRoutes = require("./routes/playlists_extra"); // ✅ IMPORTANT (voir point 2)
// (désactivé) app.use("/api", playlistsRoutes);

const client = new MongoClient(process.env.MONGO_URI);
let db;



// ------------------- MOTEUR DE RECOMMANDATION -------------------

/**
 * 1) Recos globales : les tracks les plus écoutés
 */
async function getTopTracks(db, { limit = 20, days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const pipeline = [
    { $match: { playedAt: { $gte: since } } },
    {
      $group: {
        _id: "$trackId", // ex: "168"
        playCount: { $sum: 1 },
      },
    },
    { $sort: { playCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "tracks",
        localField: "_id",     // "168"
        foreignField: "_id",   // "_id": "168" dans tracks
        as: "track",
      },
    },
    { $unwind: "$track" },
    {
      $project: {
        _id: 0,
        track: 1,
        playCount: 1,
        reason: {
          type: "global_popular",
        },
      },
    },
  ];

  return db.collection("listening_history").aggregate(pipeline).toArray();
}

/**
 * 2) Recos personnalisées par GENRE
 */
async function getGenreBasedRecommendations(
  db,
  userId,
  { limit = 20, historyLimit = 200, maxGenres = 3 } = {}
) {
  // a) genres préférés de l'user
  const pipelineGenres = [
    { $match: { userId } }, // userId = string, ex: "6785..."
    { $sort: { playedAt: -1 } },
    { $limit: historyLimit },
    {
      $lookup: {
        from: "tracks",
        localField: "trackId",
        foreignField: "_id",
        as: "track",
      },
    },
    { $unwind: "$track" },
    {
      $group: {
        _id: "$track.mainGenre",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: maxGenres },
  ];

  const genresAgg = await db
    .collection("listening_history")
    .aggregate(pipelineGenres)
    .toArray();

  const topGenres = genresAgg.map((g) => g._id).filter(Boolean);

  if (topGenres.length === 0) {
    return [];
  }

  // b) tous les tracks déjà écoutés par cet user
  const listenedTrackIds = await db
    .collection("listening_history")
    .distinct("trackId", { userId });

  // c) proposer des tracks de ces genres qu'il n'a jamais écoutés
  const tracksCursor = db.collection("tracks").find({
    mainGenre: { $in: topGenres },
    _id: { $nin: listenedTrackIds },
  });

  const recos = [];
  for await (const track of tracksCursor) {
    recos.push({
      track,
      reason: {
        type: "genre",
        genres: topGenres,
      },
    });
    if (recos.length >= limit) break;
  }

  return recos;
}

/**
 * 3) Recos collaboratives "user-user"
 */
async function getUserUserRecommendations(
  db,
  userId,
  { limit = 20, historyLimit = 100, maxNeighbors = 50 } = {}
) {
  const listening = db.collection("listening_history");

  // a) Tracks récents de cet user
  const recentTracksAgg = await listening
    .aggregate([
      { $match: { userId } }, // string
      { $sort: { playedAt: -1 } },
      { $limit: historyLimit },
      {
        $group: {
          _id: "$trackId",
        },
      },
    ])
    .toArray();

  const anchorTrackIds = recentTracksAgg.map((d) => d._id);

  if (anchorTrackIds.length === 0) {
    return [];
  }

  // b) voisins : users qui écoutent les mêmes tracks
  const neighborsAgg = await listening
    .aggregate([
      {
        $match: {
          trackId: { $in: anchorTrackIds },
          userId: { $ne: userId },
        },
      },
      {
        $group: {
          _id: "$userId",
          commonTracks: { $sum: 1 },
        },
      },
      { $sort: { commonTracks: -1 } },
      { $limit: maxNeighbors },
    ])
    .toArray();

  if (neighborsAgg.length === 0) {
    return [];
  }

  const neighborIds = neighborsAgg.map((n) => n._id);

  // c) Tous les tracks déjà écoutés par l'user cible
  const userListenedTrackIds = await listening.distinct("trackId", { userId });

  // d) Tracks écoutés par les voisins mais pas par l'user
  const candidateAgg = await listening
    .aggregate([
      {
        $match: {
          userId: { $in: neighborIds },
          trackId: { $nin: userListenedTrackIds },
        },
      },
      {
        $group: {
          _id: "$trackId",
          score: { $sum: 1 },
        },
      },
      { $sort: { score: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "tracks",
          localField: "_id",
          foreignField: "_id",
          as: "track",
        },
      },
      { $unwind: "$track" },
      {
        $project: {
          _id: 0,
          track: 1,
          score: 1,
          reason: {
            type: "user_user",
          },
        },
      },
    ])
    .toArray();

  return candidateAgg;
}

/**
 * 4) Combiner les 3 stratégies
 */
async function getCombinedRecommendations(db, userId, { limit = 30 } = {}) {
  const [genreRecos, userUserRecos, topRecos] = await Promise.all([
    getGenreBasedRecommendations(db, userId, { limit }),
    getUserUserRecommendations(db, userId, { limit }),
    getTopTracks(db, { limit }),
  ]);

  const combined = [];
  const seen = new Set();

  function add(list) {
    for (const reco of list) {
      if (!reco.track) continue;
      const id = String(reco.track._id);
      if (seen.has(id)) continue;
      seen.add(id);
      combined.push(reco);
      if (combined.length >= limit) break;
    }
  }

  // ordre de priorité : genre -> user-user -> global
  add(genreRecos);
  add(userUserRecos);
  add(topRecos);

  return combined;
}
async function fetchTracksInOrder(db, trackIds) {
  const ids = (trackIds || []).map(String);
  if (!ids.length) return [];

  const docs = await db.collection("tracks").find({ _id: { $in: ids } }).toArray();
  const map = new Map(docs.map((t) => [String(t._id), t]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}
app.get("/api/users/:userId/recommendations/:type", async (req, res) => {
  try {
    const { userId, type } = req.params;
    const limit = Math.max(1, Math.min(Number(req.query.limit || 20), 100));

    const allowed = new Set(["ml", "cf", "content", "hybrid"]);
    if (!allowed.has(type)) return res.status(400).json({ error: "type invalid" });

    const mapType = {
      ml: "ml_svd",
      cf: "cf_item_item",
      content: "content",
      hybrid: "hybrid",
    };

    const uid = String(userId);

// 1) essayer ML
const doc = await db.collection("ml_recommendations").findOne(
  { userId: uid, type: mapType[type] },
  { projection: { _id: 0, trackIds: 1, scores: 1 } }
);

if (doc?.trackIds?.length) {
  const trackIds = doc.trackIds.slice(0, limit).map(String);
  const tracks = await fetchTracksInOrder(db, trackIds);

  const out = tracks.map((t, idx) => ({
    track: t,
    score: Array.isArray(doc.scores) ? (doc.scores[idx] ?? 1) : 1,
    reason: { type: mapType[type] },
  }));

  return res.json(out);
}

// 2) ✅ FALLBACK si nouveau compte (pas de doc ML)
const fallback = await getCombinedRecommendations(db, uid, { limit });
// fallback a déjà {track, reason, score?} dans ton code
return res.json(fallback);

  } catch (e) {
    console.error("reco error", e);
    res.status(500).json({ error: "server error" });
  }
});

// ------------------- S -------------------

// 1) Liste de tracks (option genre)
/*app.get("/api/tracks", async (req, res) => {
  try {
    const { genre } = req.query; // /api/tracks?genre=rock
    const filter = {};
    if (genre) {
      filter.mainGenre = genre;
    }

    const tracks = await db.collection("tracks").find(filter).limit(100).toArray();

    res.json(tracks);
  } catch (err) {
    console.error("Erreur /api/tracks :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});*/

// Batch tracks (ids[])
app.post("/api/tracks/batch", async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
    if (!ids.length) return res.json([]);

    const tracks = await db.collection("tracks").find({ _id: { $in: ids } }).toArray();
    res.json(tracks);
  } catch (err) {
    console.error("Erreur /api/tracks/batch :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Track by id (utile pour PlaylistPage)
app.get("/api/tracks/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const track = await db.collection("tracks").findOne({ _id: id });
    if (!track) return res.status(404).json({ error: "Track non trouvé" });
    res.json(track);
  } catch (err) {
    console.error("Erreur /api/tracks/:id :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// Liste des albums pour l'interface Spotify
/*app.get("/api/albums", async (req, res) => {
  try {
    const albums = await db
      .collection("albums")
      .find()
      .limit(50)
      .toArray();

    res.json(albums);
  } catch (err) {
    console.error("Erreur /api/albums :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});*/
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "backend up", db: process.env.MONGO_DB });
});
/*
app.get("/api/albums", async (req, res) => {
  try {
    console.log(" GET /api/albums reçu");   // <--- AJOUT

    const albums = await db
      .collection("albums")
      .find()
      .limit(120)
      .toArray();

    res.json(albums);
  } catch (err) {
    console.error("Erreur /api/albums :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
*/
// Liste des albums pour l'interface Spotify
app.get("/api/albums", async (req, res) => {
  try {
    console.log("GET /api/albums reçu");

    // on lit les paramètres ?limit= et ?page= depuis le front
    const limit = parseInt(req.query.limit || "200", 10); // nombre d'albums renvoyés
    const page = parseInt(req.query.page || "1", 10);     // page actuelle (1, 2, 3...)
    const skip = (page - 1) * limit;

    const albums = await db
      .collection("albums")
      .find({image: { $exists: true, $ne: "" },})
      .sort({ title: 1 })    // trie par titre (tu peux changer en artistId ou random)
      .skip(skip)            // saute les albums des pages précédentes
      .limit(limit)          // combien on en renvoie
      .toArray();

    res.json(albums);
  } catch (err) {
    console.error("Erreur /api/albums :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Tracks d'un album
app.get("/api/albums/:id/tracks", async (req, res) => {
  try {
    const albumId = req.params.id; // ⚠️ chez toi albumId est très probablement une string

    const tracks = await db
      .collection("tracks")
      .find({ albumId: albumId })
      .toArray();

    res.json(tracks);
  } catch (err) {
    console.error("Erreur /api/albums/:id/tracks :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// Reco globale (top tracks) version simple
/*app.get("/api/reco/top", async (req, res) => {
  try {
    const agg = await db.collection("listening_history").aggregate([
      { $group: { _id: "$trackId", listens: { $sum: 1 } } },
      { $sort: { listens: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "tracks",
          localField: "_id",    // trackId dans listening_history
          foreignField: "_id",  // _id dans tracks
          as: "track",
        },
      },
      { $unwind: "$track" },
    ]).toArray();

    res.json(agg.map((d) => d.track));
  } catch (err) {
    console.error("Erreur /api/reco/top :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});*/
// Reco "top" simple : morceaux pris directement dans la base tracks
app.get("/api/reco/top", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "30", 10);

    const tracks = await db
      .collection("tracks")
      .aggregate([
        // on ne garde que les tracks qui ont une URL audio valide
        { $match: { audioUrl: { $exists: true, $ne: "" } } },
        // on pioche au hasard dans ta base (différents morceaux)
        { $sample: { size: limit } },
      ])
      .toArray();

    res.json(tracks);
  } catch (err) {
    console.error("Erreur /api/reco/top :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Reco "même style" à partir d'une liste de tracks seed
// POST /api/reco/seed  body: { seedTrackIds: [], limit?: number }
app.post("/api/reco/seed", async (req, res) => {
  try {
    const seedTrackIds = Array.isArray(req.body.seedTrackIds)
      ? req.body.seedTrackIds.map(String)
      : [];
    const limit = Math.max(1, Math.min(Number(req.body.limit || 30), 100));

    if (!seedTrackIds.length) return res.json([]);

    // Users qui ont écouté au moins 1 seed
    const userIds = await db.collection("listening_history").distinct("userId", {
      trackId: { $in: seedTrackIds },
    });

    if (!userIds.length) return res.json([]);

    // Co-occurrence : autres tracks écoutés par ces users
    const agg = await db.collection("listening_history").aggregate([
      { $match: { userId: { $in: userIds }, trackId: { $nin: seedTrackIds } } },
      { $group: { _id: "$trackId", score: { $sum: 1 } } },
      { $sort: { score: -1 } },
      { $limit: limit * 5 },
    ]).toArray();

    const ids = agg.map((x) => String(x._id));

    const tracks = await db.collection("tracks").find({
      _id: { $in: ids },
      audioUrl: { $exists: true, $ne: "" },
    }).toArray();

    const map = new Map(tracks.map((t) => [String(t._id), t]));
    const ordered = ids.map((id) => map.get(id)).filter(Boolean).slice(0, limit);

    res.json(ordered);
  } catch (err) {
    console.error("Erreur /api/reco/seed :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 2) Créer un user local (UNE SEULE ROUTE)
app.post("/api/users", async (req, res) => {
  try {
    console.log("🔍 req.headers =", req.headers);
    console.log("🔍 req.body    =", req.body);

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name requis" });
    }

    const result = await db.collection("users").insertOne({
      name,
      source: "local",
      createdAt: new Date(),
    });

    res.status(201).json({ _id: result.insertedId, name });
  } catch (err) {
    console.error("Erreur /api/users :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 3) Créer une playlist
/*app.post("/api/playlists", async (req, res) => {
  try {
    const { userId, name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: "userId et name sont requis" });
    }

    const doc = {
      name,
      userId, // string
      trackIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
    };

    const result = await db.collection("playlists").insertOne(doc);

    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    console.error("Erreur /api/playlists (POST) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 4) Ajouter un track dans une playlist


// 5) Récupérer les playlists d'un user
app.get("/api/users/:userId/playlists", async (req, res) => {
  try {
    const { userId } = req.params;

    const playlists = await db.collection("playlists").find({ userId }).toArray();

    res.json(playlists);
  } catch (err) {
    console.error("Erreur /api/users/:userId/playlists :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 6) Détail d'une playlist + infos des tracks


*/

// 7) Logger une écoute
app.post("/api/listens", async (req, res) => {
  try {
    const { userId, trackId, playlistId } = req.body;

    if (!userId || !trackId) {
      return res.status(400).json({ error: "userId et trackId requis" });
    }

    const doc = {
      userId,
      trackId,
      playlistId: playlistId || null,
      playedAt: new Date(),
      source: "app",
    };

    await db.collection("listening_history").insertOne(doc);

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Erreur /api/listens :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 8) Ecoutes récentes d'un user (pour le front)
app.get("/api/users/:userId/recent-listens", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit || "20", 10);

    const listens = await db
      .collection("listening_history")
      .find({ userId: String(userId) })
      .sort({ playedAt: -1 })
      .limit(limit)
      .toArray();

    const trackIds = listens.map((l) => String(l.trackId)).filter(Boolean);
    const tracks = await fetchTracksInOrder(db, trackIds);

    res.json(tracks);
  } catch (err) {
    console.error("Erreur /api/users/:userId/recent-listens :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



// 9) Recos TOP global
app.get("/api/recommendations/top", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "20", 10);
    const recos = await getTopTracks(db, { limit });
    res.json(recos);
  } catch (err) {
    console.error("Erreur /api/recommendations/top :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 10) Recos par GENRE pour un user
app.get("/api/users/:userId/recommendations/genres", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit || "20", 10);
    const recos = await getGenreBasedRecommendations(db, userId, { limit });
    res.json(recos);
  } catch (err) {
    console.error("Erreur /api/users/:userId/recommendations/genres :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 11) Recos user-user
app.get("/api/users/:userId/recommendations/similar-users", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit || "20", 10);
    const recos = await getUserUserRecommendations(db, userId, { limit });
    res.json(recos);
  } catch (err) {
    console.error("Erreur /api/users/:userId/recommendations/similar-users :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 12) Recos combinées
app.get("/api/users/:userId/recommendations", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit || "30", 10);
    const recos = await getCombinedRecommendations(db, userId, { limit });
    res.json(recos);
  } catch (err) {
    console.error("Erreur /api/users/:userId/recommendations :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// 13) Liker un track
app.post("/api/users/:userId/likes", async (req, res) => {
  try {
    const { userId } = req.params;
    const { trackId } = req.body;

    if (!trackId) {
      return res.status(400).json({ error: "trackId requis" });
    }

    await db.collection("likes").updateOne(
      { userId, trackId },
      {
        $setOnInsert: {
          userId,
          trackId,
          likedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Erreur /api/users/:userId/likes (POST) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 14) Déliker un track
app.delete("/api/users/:userId/likes/:trackId", async (req, res) => {
  try {
    const { userId, trackId } = req.params;
    await db.collection("likes").deleteOne({ userId, trackId });
    res.json({ ok: true });
  } catch (err) {
    console.error("Erreur /api/users/:userId/likes (DELETE) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 15) Résumé des likes d’un user

// Résumé des likes d’un user
app.get("/api/users/:userId/likes/summary", async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await db.collection("likes").countDocuments({ userId });

    res.json({
      userId,
      count,
      hasLikes: count > 0,
    });
  } catch (err) {
    console.error("Erreur /api/users/:userId/likes/summary :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// 16) Disliker un track
app.post("/api/users/:userId/dislikes", async (req, res) => {
  try {
    const { userId } = req.params;
    const { trackId } = req.body;

    if (!trackId) return res.status(400).json({ error: "trackId requis" });

    await db.collection("dislikes").updateOne(
      { userId, trackId },
      { $setOnInsert: { userId, trackId, dislikedAt: new Date() } },
      { upsert: true }
    );

    // optionnel (recommandé) : si dislike => retirer like
    await db.collection("likes").deleteOne({ userId, trackId });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Erreur dislikes POST:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 17) Enlever dislike
app.delete("/api/users/:userId/dislikes/:trackId", async (req, res) => {
  try {
    const { userId, trackId } = req.params;
    await db.collection("dislikes").deleteOne({ userId, trackId });
    res.json({ ok: true });
  } catch (err) {
    console.error("Erreur dislikes DELETE:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// 18) Status pour une track (Player)
app.get("/api/users/:userId/track-status/:trackId", async (req, res) => {
  try {
    const { userId, trackId } = req.params;

    const [like, dislike] = await Promise.all([
      db.collection("likes").findOne({ userId, trackId }),
      db.collection("dislikes").findOne({ userId, trackId }),
    ]);

    res.json({ liked: !!like, disliked: !!dislike });
  } catch (err) {
    console.error("Erreur track-status:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// 19) Renommer une playlist
/*

// Générer une cover simple pour une playlist (prend l'image du 1er track)




*/

// === ARTISTES ===

// Liste des artistes (avec recherche optionnelle ?q= )
app.get("/api/artists", async (req, res) => {
  try {
    const { q } = req.query; // /api/artists?q=rock

    const filter = {};
    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }

    const artists = await db
      .collection("artists")
      .find(filter)
      .sort({ name: 1 })
      .limit(100)
      .toArray();

    res.json(artists);
  } catch (err) {
    console.error("Erreur /api/artists :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Détail d'un artiste
app.get("/api/artists/:artistId", async (req, res) => {
  try {
    const { artistId } = req.params;

    const artist = await db
      .collection("artists")
      .findOne({ _id: artistId });

    if (!artist) {
      return res.status(404).json({ error: "Artiste non trouvé" });
    }

    res.json(artist);
  } catch (err) {
    console.error("Erreur /api/artists/:artistId :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Tous les tracks d'un artiste + info album
app.get("/api/artists/:artistId/tracks", async (req, res) => {
  try {
    const { artistId } = req.params;

    const tracks = await db.collection("tracks").aggregate([
      { $match: { artistId: artistId } }, // ex "7"
      {
        $lookup: {
          from: "albums",
          localField: "albumId",
          foreignField: "_id",
          as: "album",
        },
      },
      { $unwind: { path: "$album", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          duration: 1,
          audioUrl: 1,
          image: 1,
          albumId: 1,
          artistId: 1,
          source: 1,
          albumTitle: "$album.title",
          albumImage: "$album.image",
        },
      },
    ]).toArray();

    res.json(tracks);
  } catch (err) {
    console.error("Erreur /api/artists/:artistId/tracks :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ------------------- START -------------------
// ------------------- AUTH (LOGIN / SIGNUP) -------------------

// GET /api/users/exists?identifier=...   (identifier = email OU username OU name)
app.get("/api/users/exists", async (req, res) => {
  try {
    const identifier = String(req.query.identifier || req.query.email || req.query.name || "")
      .trim()
      .toLowerCase();

    if (!identifier) return res.json({ exists: false });

    const user = await db.collection("users").findOne({
      $or: [
        { email: identifier },
        { emailLower: identifier },
        { username: identifier },
        { name: identifier },
      ],
    });

    if (!user) return res.json({ exists: false });

    res.json({
      exists: true,
      user: {
        _id: user._id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || user.name || "",
        name: user.name || user.username || "",
        email: user.email || "",
        source: user.source || "local",
      },
    });
  } catch (e) {
    console.error("Erreur /api/users/exists :", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/users/register  { firstName, lastName, email, password }
app.post("/api/users/register", async (req, res) => {
  try {
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Mot de passe trop court." });
    }

    const username = `${firstName}.${lastName}`.toLowerCase();

    // Unicité email / username
    const existing = await db.collection("users").findOne({
      $or: [{ email }, { emailLower: email }, { username }, { name: username }],
    });
    if (existing) return res.status(409).json({ error: "Compte existe déjà" });

    const passwordHash = await bcrypt.hash(password, 10);

    const doc = {
      firstName,
      lastName,
      username,
      name: username, // compat
      email,
      emailLower: email,
      passwordHash,
      source: "local",
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(doc);

    res.status(201).json({
      _id: result.insertedId,
      firstName,
      lastName,
      username,
      email,
      source: doc.source,
      createdAt: doc.createdAt,
    });
  } catch (e) {
    console.error("Erreur /api/users/register :", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/users/login  { identifier, password }
app.post("/api/users/login", async (req, res) => {
  try {
    const identifier = String(req.body.identifier || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!identifier || !password) {
      return res.status(400).json({ error: "identifier + password requis" });
    }

    const user = await db.collection("users").findOne({
      $or: [
        { username: identifier },
        { name: identifier },
        { email: identifier },
        { emailLower: identifier },
      ],
    });

    if (!user) return res.status(404).json({ error: "NOT_FOUND" });

    if (!user.passwordHash) {
      return res.status(409).json({ error: "NO_PASSWORD_SETUP" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "WRONG_PASSWORD" });

    res.json({
      _id: user._id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || user.name || "",
      email: user.email || "",
      source: user.source || "local",
      createdAt: user.createdAt || null,
      avatar: user.avatar || "",
      favoriteGenre: user.favoriteGenre || "",
    });
  } catch (e) {
    console.error("Erreur /api/users/login :", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/users/:id  (optionnel) pour compléter le profil
app.patch("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (typeof req.body.avatar === "string") updates.avatar = req.body.avatar.trim();
    if (typeof req.body.favoriteGenre === "string") updates.favoriteGenre = req.body.favoriteGenre.trim();

    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ message: "Not found" });

    const u = result.value;
    res.json({
      _id: u._id,
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      username: u.username || u.name || "",
      email: u.email || "",
      avatar: u.avatar || "",
      favoriteGenre: u.favoriteGenre || "",
    });
  } catch (e) {
    console.error("Erreur PATCH /api/users/:id :", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// ✅ RESET PASSWORD (simple, sans email token)
app.post("/api/users/reset-password", async (req, res) => {
  try {
    const identifier = String(req.body.identifier || "").trim().toLowerCase();
    const newPassword = String(req.body.newPassword || "");

    if (!identifier || !newPassword) {
      return res.status(400).json({ error: "identifier + newPassword requis" });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: "Mot de passe trop court" });
    }

    const user = await db.collection("users").findOne({
      $or: [{ username: identifier }, { email: identifier }, { name: identifier }],
    });

    if (!user) return res.status(404).json({ error: "NOT_FOUND" });

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { passwordHash } }
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/users/:userId/recommendations/ml", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit || "30", 10);

    const doc = await db.collection("ml_recommendations").findOne({ userId: String(userId) });
    if (!doc?.trackIds?.length) return res.json([]);

    const trackIds = doc.trackIds.slice(0, limit).map(String);

    const tracks = await db.collection("tracks")
      .find({ _id: { $in: trackIds } })
      .toArray();

    const trackById = {};
    for (const t of tracks) trackById[String(t._id)] = t;

    const result = trackIds
      .map((id, idx) => ({
        track: trackById[id] || null,
        score: doc.scores?.[idx] ?? null,
        reason: { type: "ml_svd" },
      }))
      .filter((x) => x.track);

    res.json(result);
  } catch (err) {
    console.error("Erreur /recommendations/ml:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.post("/api/jamendo/import/tracks", async (req, res) => {
  try {
    const clientId = process.env.JAMENDO_CLIENT_ID;
    if (!clientId) return res.status(400).json({ error: "JAMENDO_CLIENT_ID manquant dans .env" });

    const limit = parseInt(req.query.limit || "50", 10);
    const offset = parseInt(req.query.offset || "0", 10);
    const tag = String(req.query.tag || "").trim(); // ex: rock

    const params = new URLSearchParams({
      client_id: clientId,
      format: "json",
      limit: String(limit),
      offset: String(offset),
      include: "musicinfo",
      audioformat: "mp32",
    });
    if (tag) params.set("tags", tag);

    const url = `https://api.jamendo.com/v3.0/tracks/?${params.toString()}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: "Jamendo API error", status: r.status });

    const data = await r.json();
    const results = data.results || [];

    let upserted = 0;
    for (const t of results) {
      await upsertJamendoTrack(db, t);
      upserted++;
    }

    res.json({ ok: true, fetched: results.length, upserted });
  } catch (err) {
    console.error("Erreur import Jamendo:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});




// === PLAYLISTS ROUTES (FIXED) ===
// Ces routes existaient mais étaient commentées → donc 404 côté frontend.
// On les redéfinit ici de façon propre, sans changer le style du front.

// Créer une playlist
app.post("/api/playlists", async (req, res) => {
  try {
    const { userId, name } = req.body || {};
    const safeName = typeof name === "string" ? name.trim() : "";
    const safeUserId = typeof userId === "string" ? userId.trim() : "";

    if (!safeUserId || !safeName) {
      return res.status(400).json({ error: "userId et name sont requis" });
    }

    const doc = {
      name: safeName,
      userId: safeUserId, // string
      trackIds: [],
      image: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("playlists").insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    console.error("POST /api/playlists:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Lister les playlists d'un user
app.get("/api/users/:userId/playlists", async (req, res) => {
  try {
    const { userId } = req.params;
    const safeUserId = typeof userId === "string" ? userId.trim() : "";
    if (!safeUserId) return res.status(400).json({ error: "userId requis" });

    const list = await db
      .collection("playlists")
      .find({ userId: safeUserId })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    res.json(list || []);
  } catch (err) {
    console.error("GET /api/users/:userId/playlists:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ===============================
// PLAYLISTS (FIXED: rename + add track + load playlist)
// ===============================

// Trouver une playlist quel que soit le type de _id (ObjectId ou string)
async function findPlaylistAnyId(playlistId) {
  const pid = String(playlistId || "").trim();
  if (!pid) return null;

  // Essayer d'abord ObjectId si possible, sinon string
  if (ObjectId.isValid(pid)) {
    return await db.collection("playlists").findOne({
      $or: [{ _id: new ObjectId(pid) }, { _id: pid }],
    });
  }
  return await db.collection("playlists").findOne({ _id: pid });
}

// Charger une playlist (playlist + tracks)
app.get("/api/playlists/:playlistId", async (req, res) => {
  try {
    const { playlistId } = req.params;

    const playlist = await findPlaylistAnyId(playlistId);
    if (!playlist) return res.status(404).json({ error: "playlist_not_found" });

    const raw = Array.isArray(playlist.trackIds) ? playlist.trackIds : [];
    const ids = [];
    const seen = new Set();

    for (const v of raw) {
      if (v == null) continue;

      // Si déjà ObjectId
      if (typeof v === "object" && v._bsontype === "ObjectID") {
        const k = `oid:${String(v)}`;
        if (!seen.has(k)) {
          seen.add(k);
          ids.push(v);
        }
        continue;
      }

      const s = String(v).trim();
      if (!s) continue;

      const ks = `s:${s}`;
      if (!seen.has(ks)) {
        seen.add(ks);
        ids.push(s);
      }

      // Si c'est un hex de 24 chars, ajouter aussi la version ObjectId pour couvrir les 2 types
      if (ObjectId.isValid(s)) {
        const oid = new ObjectId(s);
        const ko = `oid:${String(oid)}`;
        if (!seen.has(ko)) {
          seen.add(ko);
          ids.push(oid);
        }
      }
    }

    const tracks = ids.length
      ? await db.collection("tracks").find({ _id: { $in: ids } }).toArray()
      : [];

    return res.json({ playlist, tracks });
  } catch (err) {
    console.error("GET /api/playlists/:playlistId:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Ajouter un track à une playlist (trackId string Jamendo OK)
app.post("/api/playlists/:playlistId/tracks", async (req, res) => {
  try {
    const { playlistId } = req.params;

    const raw =
      req.body?.trackId ??
      req.body?.id ??
      req.body?._id ??
      req.body?.track?.trackId ??
      req.body?.track?.id ??
      req.body?.track?._id;

    const trackId = raw != null ? String(raw).trim() : "";
    if (!trackId) return res.status(400).json({ error: "trackId requis" });

    const playlist = await findPlaylistAnyId(playlistId);
    if (!playlist) return res.status(404).json({ error: "playlist_not_found" });

    await db.collection("playlists").updateOne(
      { _id: playlist._id },
      {
        $addToSet: { trackIds: trackId },
        $set: { updatedAt: new Date() },
      }
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/playlists/:playlistId/tracks :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Renommer / changer l'image d'une playlist (support _id ObjectId OU string)
app.patch("/api/playlists/:playlistId", async (req, res) => {
  try {
    const { playlistId } = req.params;

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const image = typeof req.body?.image === "string" ? req.body.image.trim() : "";

    if (!name && !image) {
      return res.status(400).json({ error: "name ou image requis" });
    }

    const playlist = await findPlaylistAnyId(playlistId);
    if (!playlist) return res.status(404).json({ error: "playlist_not_found" });

    const set = { updatedAt: new Date() };
    if (name) set.name = name;
    if (image) set.image = image;

    await db.collection("playlists").updateOne({ _id: playlist._id }, { $set: set });

    const updated = await db.collection("playlists").findOne({ _id: playlist._id });
    return res.json(updated);
  } catch (err) {
    console.error("PATCH /api/playlists/:playlistId:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Générer une cover (prend l'image du 1er track)
app.post("/api/playlists/:playlistId/cover", async (req, res) => {
  try {
    const { playlistId } = req.params;

    const playlist = await findPlaylistAnyId(playlistId);
    if (!playlist) return res.status(404).json({ error: "playlist_not_found" });

    const firstTrackId = Array.isArray(playlist.trackIds) ? playlist.trackIds[0] : null;
    if (!firstTrackId) return res.status(400).json({ error: "no_tracks_in_playlist" });

    const track = await db.collection("tracks").findOne({ _id: String(firstTrackId) });
    const image = track?.image ? String(track.image) : "";
    if (!image) return res.status(400).json({ error: "no_image_found" });

    await db.collection("playlists").updateOne(
      { _id: playlist._id },
      { $set: { image, updatedAt: new Date() } }
    );

    const updated = await db.collection("playlists").findOne({ _id: playlist._id });
    return res.json(updated);
  } catch (err) {
    console.error("POST /api/playlists/:playlistId/cover:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer une playlist
app.delete("/api/playlists/:playlistId", async (req, res) => {
  try {
    const { playlistId } = req.params;

    const playlist = await findPlaylistAnyId(playlistId);
    if (!playlist) return res.status(404).json({ error: "playlist_not_found" });

    const r = await db.collection("playlists").deleteOne({ _id: playlist._id });
    if (!r.deletedCount) return res.status(404).json({ error: "playlist_not_found" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/playlists/:playlistId:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});
// 1) Liste de tracks (option genre)
app.get("/api/tracks", async (req, res) => {
  try {
    const { genre } = req.query;
    const limit = Math.min(parseInt(req.query.limit || "100", 10), 500);

    const filter = {};
    if (genre) {
      // ✅ match insensible à la casse
      filter.mainGenre = { $regex: `^${String(genre).trim()}$`, $options: "i" };
    }

    const tracks = await db.collection("tracks").find(filter).limit(limit).toArray();
    res.json(tracks);
  } catch (err) {
    console.error("Erreur /api/tracks :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// GET /api/users/:userId/likes?limit=50
app.get("/api/users/:userId/likes", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

    const likedTracks = await db
      .collection("likes")
      .aggregate([
        { $match: { userId: String(userId) } },
        { $sort: { createdAt: -1, _id: -1 } },
        { $limit: limit },

        // ⚠️ Si dans "likes" ton champ s'appelle autrement que "trackId",
        // remplace localField: "trackId" par le bon nom.
        {
          $lookup: {
            from: "tracks",
            localField: "trackId",
            foreignField: "_id",
            as: "track",
          },
        },
        { $unwind: "$track" },
        { $replaceRoot: { newRoot: "$track" } },
      ])
      .toArray();

    res.json(likedTracks);
  } catch (err) {
    console.error("Erreur GET /api/users/:userId/likes :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// Charger une playlist (playlist + tracks)


// Ajouter un track à une playlist


// Renommer / changer l'image d'une playlist


// Supprimer une playlist


// === END PLAYLISTS ROUTES (FIXED) ===


async function start() {
  try {
    await client.connect();
    db = client.db(process.env.MONGO_DB);
    app.locals.db = db;
    console.log("✅ Mongo connecté");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 API démarrée sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Erreur de démarrage :", err);
  }
}
async function upsertJamendoTrack(db, jamendoTrack) {
  if (!db) throw new Error("db not connected");
  if (!jamendoTrack?.id) throw new Error("jamendoTrack.id missing");

  await db.collection("tracks").updateOne(
    { _id: String(jamendoTrack.id) },
    {
      $set: {
        _id: String(jamendoTrack.id),
        title: jamendoTrack.name || "",
        artistName: jamendoTrack.artist_name || "",
        image: jamendoTrack.image || jamendoTrack.album_image || "",
        audioUrl: jamendoTrack.audio || "",
        albumId: jamendoTrack.album_id ? String(jamendoTrack.album_id) : null,
        artistId: jamendoTrack.artist_id ? String(jamendoTrack.artist_id) : null,
        mainGenre: jamendoTrack.musicinfo?.tags?.genres?.[0] || null,
        source: "jamendo",
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}
app.get("/api/genres", async (req, res) => {
  try {
    const genres = await db.collection("tracks").distinct("mainGenre", {
      mainGenre: { $exists: true, $ne: "" },
    });

    res.json(genres.filter(Boolean).sort());
  } catch (err) {
    console.error("Erreur /api/genres :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// Recherche (tracks) : /api/search?q=pretty&limit=20
// server.js  (ajoute ou remplace ton endpoint /api/search)

app.get("/api/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);

    if (!q) {
      return res.json({ tracks: [], artists: [], albums: [], genres: [] });
    }

    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); // escape + insensitive

    // ---- TRACKS ----
    // adapte les champs selon ta DB (title, artistName, mainGenre…)
    const tracks = await db
      .collection("tracks")
      .find({
        $or: [{ title: rx }, { artistName: rx }, { mainGenre: rx }],
      })
      .limit(limit)
      .toArray();

    // ---- ARTISTS ----
    // Si ta collection artists a un champ "name"
    const artists = await db
      .collection("artists")
      .find({ $or: [{ name: rx }, { artistName: rx }] })
      .limit(12)
      .toArray();

    // ---- ALBUMS ----
    // Si ta collection albums a un champ "title" ou "name"
    const albums = await db
      .collection("albums")
      .find({ $or: [{ title: rx }, { name: rx }] })
      .limit(12)
      .toArray();

    // ---- GENRES ----
    // Genres depuis tracks (distinct)
    const genres = await db
      .collection("tracks")
      .distinct("mainGenre", { mainGenre: rx });

    res.json({
      tracks,
      artists,
      albums,
      genres: (genres || []).filter(Boolean).slice(0, 20),
    });
  } catch (err) {
    console.error("Erreur /api/search :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// === RECOMMANDATIONS ML (SVD) ===
// GET /api/users/:userId/recommendations/ml?limit=30
app.get("/api/users/:userId/recommendations/ml", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit || "30", 10);

    const doc = await db
      .collection("ml_recommendations")
      .findOne({ userId: String(userId) });

    if (!doc || !Array.isArray(doc.trackIds) || doc.trackIds.length === 0) {
      return res.json([]);
    }

    const trackIds = doc.trackIds.slice(0, limit).map(String);

    const tracks = await db
      .collection("tracks")
      .find({ _id: { $in: trackIds } })
      .toArray();

    // Pour garder l'ordre des trackIds
    const byId = {};
    for (const t of tracks) byId[String(t._id)] = t;

    const result = trackIds
      .map((id, idx) => {
        const track = byId[id];
        if (!track) return null;
        return {
          track,
          score: Array.isArray(doc.scores) ? (doc.scores[idx] ?? null) : null,
          reason: { type: "ml_svd" },
        };
      })
      .filter(Boolean);

    res.json(result);
  } catch (err) {
    console.error("Erreur /api/users/:userId/recommendations/ml :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

start();