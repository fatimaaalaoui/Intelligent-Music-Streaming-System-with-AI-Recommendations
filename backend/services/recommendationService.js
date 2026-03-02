// services/recommendationService.js
const { ObjectId } = require("mongodb");

/**
 * 1) Recos globales : les tracks les plus écoutés
 */
async function getTopTracks(db, { limit = 20, days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const pipeline = [
    { $match: { playedAt: { $gte: since } } },
    {
      $group: {
        _id: "$trackId",
        playCount: { $sum: 1 },
      },
    },
    { $sort: { playCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "tracks",
        localField: "_id",     // trackId dans listening_history
        foreignField: "_id",   // _id dans tracks (doit être même type !)
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
async function getGenreBasedRecommendations(db, userId, {
  limit = 20,
  historyLimit = 200,
  maxGenres = 3,
} = {}) {
  const userObjectId = new ObjectId(userId);

  // a) genres préférés de l'user
  const pipelineGenres = [
    { $match: { userId: userObjectId } },
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
    .distinct("trackId", { userId: userObjectId });

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
 * On cherche des users qui ont écouté les mêmes morceaux,
 * puis on recommande d'autres tracks qu'ils ont écoutés.
 */
async function getUserUserRecommendations(db, userId, {
  limit = 20,
  historyLimit = 100,
  maxNeighbors = 50,
} = {}) {
  const userObjectId = new ObjectId(userId);
  const listening = db.collection("listening_history");

  // a) Tracks récents de cet user (ancre pour trouver des voisins)
  const recentTracksAgg = await listening
    .aggregate([
      { $match: { userId: userObjectId } },
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

  // b) Trouver des "voisins" : users qui écoutent les mêmes tracks
  const neighborsAgg = await listening
    .aggregate([
      {
        $match: {
          trackId: { $in: anchorTrackIds },
          userId: { $ne: userObjectId },
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

  // c) Tous les tracks déjà écoutés par l'user cible (pour filtrer)
  const userListenedTrackIds = await listening.distinct("trackId", {
    userId: userObjectId,
  });

  // d) Tracks écoutés par ces voisins que l'user n'a pas encore écoutés
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
          score: { $sum: 1 }, // plus c'est écouté par les voisins, plus c'est haut
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
async function getCombinedRecommendations(db, userId, {
  limit = 30,
} = {}) {
  // on lance les 3 en parallèle
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

  // ordre de priorité : genre perso -> user-user -> global
  add(genreRecos);
  add(userUserRecos);
  add(topRecos);

  return combined;
}

module.exports = {
  getTopTracks,
  getGenreBasedRecommendations,
  getUserUserRecommendations,
  getCombinedRecommendations,
};
 
