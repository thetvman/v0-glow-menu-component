import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, credentials, params } = body

    if (!credentials?.username || !credentials?.password || !credentials?.baseUrl) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    const { username, password, baseUrl } = credentials

    // Build URL with query parameters
    const urlParams = new URLSearchParams({
      username,
      password,
      action,
      ...params,
    })

    const url = `${baseUrl}/player_api.php?${urlParams.toString()}`

    console.log("[v0] Fetching from Xtream API:", action)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "webNetplayer v2.0",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
      },
    })

    if (!response.ok) {
      console.error("[v0] Xtream API error:", response.status, response.statusText)
      const responseText = await response.text()
      console.error("[v0] Response body:", responseText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${response.statusText}`, details: responseText },
        { status: response.status },
      )
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text()
      console.error("[v0] Non-JSON response from IPTV service:", responseText)
      return NextResponse.json({ error: "Invalid response from IPTV service", details: responseText }, { status: 502 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Xtream API proxy error:", error)
    return NextResponse.json(
      { error: "Failed to fetch from IPTV service", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
