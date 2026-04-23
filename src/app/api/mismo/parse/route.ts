import { NextRequest, NextResponse } from 'next/server'
import { parseMismo } from '@/lib/mismo/parse'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10 MB.' }, { status: 413 })
    }

    if (file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json(
        { error: 'ZIP support coming soon. Please upload the .xml file directly.' },
        { status: 400 }
      )
    }

    const parsed = parseMismo(await file.text())

    return NextResponse.json({ fields: parsed, filename: file.name })
  } catch (error) {
    console.error('[mismo/parse] error:', error)
    return NextResponse.json({ error: 'Failed to parse MISMO file' }, { status: 500 })
  }
}
