import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  // @ts-ignore
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    // @ts-ignore
    global._mongoClientPromise = client.connect()
      .then((c) => {
        console.log("Connected to MongoDB (development)");
        return c;
      })
      .catch((err) => {
        console.error("Not connected to MongoDB (development):", err);
        throw err;
      });
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then((c) => {
      console.log("Connected to MongoDB (production)");
      return c;
    })
    .catch((err) => {
      console.error("Not connected to MongoDB (production):", err);
      throw err;
    });
}

// Export a function to connect to the database
export async function connectToDatabase(): Promise<MongoClient> {
  return clientPromise;
}

export default clientPromise;
