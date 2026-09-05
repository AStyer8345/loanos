export async function collectPages<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = []
  const size = 500
  for (let from = 0; ; from += size) {
    const { data, error } = await read(from, from + size - 1)
    if (error || !data) throw new Error('Command Center data is unavailable')
    rows.push(...data)
    if (data.length < size) return rows
  }
}
