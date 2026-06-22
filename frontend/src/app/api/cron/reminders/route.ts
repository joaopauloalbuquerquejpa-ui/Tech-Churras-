import { NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tech-churras-production.up.railway.app'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(BACKEND + '/cron/event-reminders', {
    headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
    signal: AbortSignal.timeout(55_000),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
