import { NextRequest, NextResponse } from "next/server";

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build query string if status filter exists
    const queryString = status ? `?status=${encodeURIComponent(status)}` : "";
    
    // Get auth token from cookies or headers (optional for public endpoint)
    const authToken = request.cookies.get("authToken")?.value || 
                      request.headers.get("authorization");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Include auth token if available
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`;
    }

    console.log(`[API] Fetching jobs from ${SERVER_URL}/api/jobs${queryString}`);

    const response = await fetch(`${SERVER_URL}/api/jobs${queryString}`, {
      method: "GET",
      headers,
    });

    console.log(`[API] Server responded with status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error response: ${errorText}`);
      return NextResponse.json(
        { message: "Failed to fetch jobs from server", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching jobs:", error);
    return NextResponse.json(
      { 
        message: "Internal server error", 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get("authorization");
    if (!authToken) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${SERVER_URL}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
