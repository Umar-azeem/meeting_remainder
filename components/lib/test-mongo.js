import { MongoClient } from 'mongodb';

const uri = "mongodb://discoverymeetingcall_db_user:sirfahaad123@ac-cyisios-shard-00-00.cjxxv5g.mongodb.net:27017,ac-cyisios-shard-00-01.cjxxv5g.mongodb.net:27017,ac-cyisios-shard-00-02.cjxxv5g.mongodb.net:27017/meetings_db?ssl=true&replicaSet=atlas-c1egvl-shard-0&authSource=admin&appName=Cluster0";

async function test() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ MongoDB connected successfully!");
    const db = client.db("meetings_db");
    await db.command({ ping: 1 });
    console.log("✅ Ping successful");
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    // Print full error for debugging
    console.error(err);
  } finally {
    await client.close();
  }
}
test();