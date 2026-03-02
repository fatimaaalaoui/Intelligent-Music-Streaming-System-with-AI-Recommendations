# ml/merge_hybrid.py
import os
from datetime import datetime
from typing import Dict, List, Set, Tuple

from common import (
    get_db,
    ensure_ml_indexes,
    get_listened_track_ids,
    get_disliked_track_ids,
    get_available_track_ids,
    top_trending,
    save_recos,
)

TYPE = "hybrid"


def rank_score(rank: int) -> float:
    # decaying score: rank 0 -> 1.0, rank 1 -> 0.5, rank 2 -> 0.333...
    return 1.0 / float(rank + 1)


def main():
    client, db = get_db()
    col = ensure_ml_indexes(db)

    limit = int(os.getenv("HYBRID_TOPN", "50"))

    fallback_top = top_trending(db, limit=200)
    print("fallback top size:", len(fallback_top))

    users = db["listening_history"].distinct("userId")
    users = [str(u) for u in users if u]
    print("users:", len(users))

    # available audio filter
    available = get_available_track_ids(db)

    for u in users:
        listened = get_listened_track_ids(db, u)
        disliked = get_disliked_track_ids(db, u)
        bad = set(listened) | set(disliked)

        svd = col.find_one({"userId": u, "type": "svd"}) or {}
        it  = col.find_one({"userId": u, "type": "item_item"}) or {}
        cb  = col.find_one({"userId": u, "type": "content"}) or {}

        svd_list = [str(x) for x in (svd.get("trackIds") or [])]
        it_list  = [str(x) for x in (it.get("trackIds") or [])]
        cb_list  = [str(x) for x in (cb.get("trackIds") or [])]

        # Weights: CF(70%) + Content(20%) + Top(10%)
        # Inside CF: svd 35% + item_item 35%
        weights = {
            "svd": 0.35,
            "item_item": 0.35,
            "content": 0.20,
            "top": 0.10,
        }

        scores: Dict[str, float] = {}

        def add_list(track_list: List[str], w: float):
            for r, tid in enumerate(track_list):
                if not tid:
                    continue
                scores[tid] = scores.get(tid, 0.0) + w * rank_score(r)

        add_list(svd_list, weights["svd"])
        add_list(it_list, weights["item_item"])
        add_list(cb_list, weights["content"])
        add_list(fallback_top, weights["top"])

        # Filter bad + noaudio
        final = []
        for tid, sc in scores.items():
            if tid in bad:
                continue
            if tid not in available:
                continue
            final.append((tid, float(sc)))

        final.sort(key=lambda x: x[1], reverse=True)
        final = final[:limit]

        save_recos(
            db,
            user_id=u,
            rec_type=TYPE,
            track_ids=[t for t, _ in final],
            scores=[s for _, s in final],
            meta={"mix": weights, "generatedAt": datetime.utcnow().isoformat()},
        )

    print("OK: hybrid recommendations created/updated.")
    client.close()


if __name__ == "__main__":
    main()
