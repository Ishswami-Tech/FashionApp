import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ oid: string }> }
) {
  try {
    const { oid } = await params;
    
    if (!oid) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    console.log(`[API] Fetching order details for: ${oid}`);
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "fashionapp");
    
    // Fetch the order
    const order = await db.collection("orders").findOne({ oid });
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log(`[API] Order found: ${oid}, PDFs generated: ${order.pdfsGenerated || false}`);
    
    return NextResponse.json(order);
    
  } catch (error: any) {
    console.error("[API] Error fetching order:", error);
    return NextResponse.json({ 
      error: "Failed to fetch order",
      details: error.message 
    }, { status: 500 });
  }
} 