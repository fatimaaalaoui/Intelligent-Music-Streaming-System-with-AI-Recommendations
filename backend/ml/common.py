# ml/common.py
import os
from datetime import datetime
from typing import Dict, List, Tuple, Set, Optional

from pymongo import MongoClient


def get_db():
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    dbname = os.getenv("MONGO_DB", "spotify_colonne")
    client = MongoClient(uri)
    return client, client[dbname]


def ensure_ml_indexes(db):
    col = db["ml_recommendations"]

    # Drop any unique index on userId alone if it exists (bad old index)
    info = col.index_information()
    # Example: {'userId_1': {'key': [('userId', 1)], 'unique': True}, ...}
    for name, meta in list(info.items()):
        keys = meta.get("key", [])
        unique = meta.get("unique", False)
        if unique and keys == [("userId", 1)]:
            try:
                col.drop_index(name)
                print(f"✅ Dropped bad index: {name}")
            except Exception as e:
                print(f"⚠️ Could not drop index {name}: {e}")

    # Ensure correct unique index (userId, type)
    col.create_index([("userId", 1), ("type", 1)], unique=True)
    return col


def load_listens_grouped(db) -> List[Tuple[str, str, float]]:
    """
    Returns list of (userId, trackId, weight) grouped by number of listens.
    listening_history expected: { userId: str, trackId: str, playedAt: ... }
    """
    col = db["listening_history"]
    pipeline = [
        {"$match": {"userId": {"$ne": None}, "trackId": {"$ne": None}}},
        {"$group": {"_id": {"u": "$userId", "t": "$trackId"}, "w": {"$sum": 1}}},
    ]
    rows = []
    for d in col.aggregate(pipeline, allowDiskUse=True):
        u = str(d["_id"]["u"])
        t = str(d["_id"]["t"])
        w = float(d.get("w", 1))
        rows.append((u, t, w))
    return rows


def get_listened_track_ids(db, user_id: str) -> Set[str]:
    col = db["listening_history"]
    ids = set()
    for d in col.find({"userId": user_id}, {"trackId": 1, "_id": 0}):
        if d.get("trackId") is not None:
            ids.add(str(d["trackId"]))
    return ids


def _find_dislikes_collection(db) -> Optional[str]:
    names = set(db.list_collection_names())
    # common names (adapt to your project)
    candidates = ["dislikes", "user_dislikes", "track_dislikes", "users_dislikes"]
    for c in candidates:
        if c in names:
            return c
    return None


def get_disliked_track_ids(db, user_id: str) -> Set[str]:
    """
    Tries to read disliked tracks from a collection if it exists.
    Supported schemas:
      - { userId: "...", trackId: "..." }
      - { userId: "...", trackIds: [...] }
    If no collection exists -> returns empty set.
    """
    cname = _find_dislikes_collection(db)
    if not cname:
        return set()

    col = db[cname]
    out: Set[str] = set()

    for d in col.find({"userId": user_id}):
        if "trackId" in d and d["trackId"] is not None:
            out.add(str(d["trackId"]))
        if "trackIds" in d and isinstance(d["trackIds"], list):
            out.update(str(x) for x in d["trackIds"] if x is not None)

    return out


def get_available_track_ids(db, track_ids: Optional[Set[str]] = None) -> Set[str]:
    """
    Returns ids of tracks that have a playable audio url.
    tracks collection expected field names: audioUrl OR audio OR src.
    """
    col = db["tracks"]
    q = {}
    if track_ids is not None:
        q["_id"] = {"$in": list(track_ids)}

    out = set()
    for t in col.find(q, {"_id": 1, "audioUrl": 1, "audio": 1, "src": 1}):
        tid = str(t["_id"])
        audio = t.get("audioUrl") or t.get("audio") or t.get("src")
        if audio and isinstance(audio, str) and audio.strip():
            out.add(tid)
    return out


def top_trending(db, limit: int = 50) -> List[str]:
    col = db["listening_history"]
    pipeline = [
        {"$group": {"_id": "$trackId", "c": {"$sum": 1}}},
        {"$sort": {"c": -1}},
        {"$limit": limit},
    ]
    out = []
    for d in col.aggregate(pipeline, allowDiskUse=True):
        if d.get("_id") is not None:
            out.append(str(d["_id"]))
    return out


def save_recos(db, user_id: str, rec_type: str, track_ids: List[str], scores: Optional[List[float]] = None, meta: Optional[dict] = None):
    col = ensure_ml_indexes(db)
    doc = {
        "userId": str(user_id),
        "type": rec_type,
        "trackIds": [str(x) for x in track_ids],
        "updatedAt": datetime.utcnow(),
    }
    if scores is not None:
        doc["scores"] = [float(x) for x in scores]
    if meta:
        doc["meta"] = meta

    col.update_one(
        {"userId": str(user_id), "type": rec_type},
        {"$set": doc},
        upsert=True
    )
