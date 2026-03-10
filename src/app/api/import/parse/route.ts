import { NextRequest, NextResponse } from 'next/server'

// ── HTML-XLS parser (no external deps) ───────────────────────────────────────
// Salesforce exports .xls files that are actually HTML tables.
// Structure: <table><tr><th filter=all>ColName</th>…</tr><tr><td …>value</td>…</tr>…</table>

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim()
}

function parseHTMLTable(html: string): { columns: string[]; rows: string[][] } {
  const headerMatch = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i)
  if (!headerMatch) return { columns: [], rows: [] }

  const headerCells = [...headerMatch[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
  const columns = headerCells.map(m => stripTags(m[1]))

  const rowMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
  const rows: string[][] = []

  for (let i = 1; i < rowMatches.length; i++) {
    const cells = [...rowMatches[i][1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
    if (cells.length === 0) continue
    rows.push(cells.map(c => stripTags(c[1])))
  }

  return { columns, rows }
}

// ── CSV parser (no external deps) ────────────────────────────────────────────
function parseCSV(text: string): { columns: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return { columns: [], rows: [] }

  function parseLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        result.push(current.trim()); current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const columns = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)
  return { columns, rows }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const fileName = file.name.toLowerCase()

    let parsed: { columns: string[]; rows: string[][] }
    let fileType: 'csv' | 'xls-html' | 'unknown'

    if (fileName.endsWith('.csv')) {
      parsed = parseCSV(text)
      fileType = 'csv'
    } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || text.trimStart().startsWith('<')) {
      // Salesforce HTML-XLS or any HTML table
      parsed = parseHTMLTable(text)
      fileType = 'xls-html'
    } else {
      // Try CSV as fallback
      parsed = parseCSV(text)
      fileType = text.trimStart().startsWith('<') ? 'xls-html' : 'unknown'
    }

    const { columns, rows } = parsed

    if (columns.length === 0) {
      return NextResponse.json({ error: 'Could not detect columns. Check file format.' }, { status: 422 })
    }

    // When `full=true` is sent (from import modal confirm step), return all rows.
    // Otherwise return only 5-row preview to keep the response small.
    const full = formData.get('full') === 'true'

    return NextResponse.json({
      columns,
      rows: full ? rows : rows.slice(0, 5),
      count: rows.length,
      fileType,
    })
  } catch (err) {
    console.error('[import/parse]', err)
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 })
  }
}
