import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url, method, headers, body } = await req.json() as {
      url: string
      method: string
      headers?: Record<string, string>
      body?: string
    }

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    const init: RequestInit = {
      method: method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
    }

    if (body && !['GET', 'HEAD'].includes(method?.toUpperCase())) {
      init.body = body
    }

    const upstream = await fetch(url, init)
    let data: unknown
    const contentType = upstream.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      data = await upstream.json()
    } else {
      data = await upstream.text()
    }

    return NextResponse.json({
      status: upstream.status,
      statusText: upstream.statusText,
      data,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
