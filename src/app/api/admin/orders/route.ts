import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "fashionapp");
    const orders = await db.collection("orders").find({}).sort({ createdAt: -1 }).toArray();
    
    // No need to convert files since they're already stored as Cloudinary URLs
    // The data structure is now: { url: "https://...", originalname: "..." }
    
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
} 