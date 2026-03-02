const express = require("express");
const router = express.Router();

const ListeningHistory = require("../models/ListeningHistory");
const Track = require("../models/Track");

// POST /api/reco/seed   body: { seedTrackIds: [], limit?: 30 }
router.post("/reco/seed", async (req, res) => {
  try {
    const seedTrackIds = Array.isArray(req.body.seedTrackIds) ? req.body.seedTrackIds : [];
    const limit = Number(req.body.limit || 30);

    if (!seedTrackIds.length) return res.json([]);

    const userIds = await ListeningHistory.distinct("userId", {
      trackId: { $in: seedTrackIds },
    });

    if (!userIds.length) return res.json([]);

    const agg = await ListeningHistory.aggregate([
      { $match: { userId: { $in: userIds }, trackId: { $nin: seedTrackIds } } },
      { $group: { _id: "$trackId", score: { $sum: 1 } } },
      { $sort: { score: -1 } },
      { $limit: limit * 8 },
    ]);

    const ids = agg.map((x) => x._id);

    const tracks = await Track.find({
      _id: { $in: ids },
      audioUrl: { $exists: true, $ne: null },
    }).lean();

    const map = new Map(tracks.map((t) => [String(t._id), t]));
    const ordered = ids.map((id) => map.get(String(id))).filter(Boolean).slice(0, limit);

    res.json(ordered);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "seed_reco_failed" });
  }
});

module.exports = router;
