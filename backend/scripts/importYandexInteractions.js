// importYandexInteractions.js
require("dotenv").config();
const fs = require("fs");
const readline = require("readline");
const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  console.log("✅ Connecté à MongoDB (importYandexInteractions)");
  const db = client.db(process.env.MONGO_DB);

  // 👉 chemin vers ton CSV généré par Python
  const filePath =
    "C:/Users/lenovo/yandex_yambda/interactions_sample.csv";

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let isFirstLine = true;
  let headers = [];

  let batch = [];
  const BATCH_SIZE = 2000;

  for await (const line of rl) {
    if (isFirstLine) {
      // première ligne = en-têtes CSV
      headers = line.split(",");
      isFirstLine = false;
      continue;
    }

    const cols = line.split(",");
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i];
    });

    const yUserId = row["user_id"];
    const itemId = row["item_id"];
    const ts = row["timestamp"];
    const eventType = row["event_type"] || "play";

    if (!yUserId || !itemId) continue;

    const doc = {
      userId: `y_${yUserId}`, // même format qu'on utilisera pour les users Yandex
      itemId: itemId,
      timestamp: ts,
      eventType: eventType,
      source: "yandex",
    };

    batch.push(doc);

    if (batch.length >= BATCH_SIZE) {
      await db.collection("listening_history").insertMany(batch);
      console.log(`  ➕ ${batch.length} interactions importées...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await db.collection("listening_history").insertMany(batch);
    console.log(`  ➕ ${batch.length} interactions importées (fin)`);
  }

  await client.close();
  console.log("Connexion MongoDB fermée (importYandexInteractions)");
}

main().catch(console.error);
