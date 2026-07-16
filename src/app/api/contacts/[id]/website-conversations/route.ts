import { NextRequest, NextResponse } from 'next/server'
import { getOrganization } from '@/lib/getOrganization'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await getOrganization()
    const userClient = createClient()
    const { data: contact } = await userClient
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', params.id)
      .maybeSingle()

    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

    const service = createServiceClient()
    // Tables are newer than the generated database types; service access remains server-only.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conversations, error: conversationError } = await (service.from('website_conversations' as never) as any)
      .select('id, status, summary, created_at, updated_at')
      .eq('organization_id', organizationId)
      .eq('contact_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (conversationError) throw conversationError
    const ids = (conversations ?? []).map((conversation: { id: string }) => conversation.id)
    if (!ids.length) return NextResponse.json({ conversations: [] }, { headers: { 'Cache-Control': 'no-store' } })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: messages, error: messageError } = await (service.from('website_conversation_messages' as never) as any)
      .select('id, conversation_id, sequence_number, role, redacted_text, source_refs, created_at')
      .eq('organization_id', organizationId)
      .in('conversation_id', ids)
      .order('sequence_number', { ascending: true })

    if (messageError) throw messageError
    const messagesByConversation = new Map<string, Array<Record<string, unknown>>>()
    for (const message of messages ?? []) {
      const list = messagesByConversation.get(message.conversation_id) ?? []
      list.push(message)
      messagesByConversation.set(message.conversation_id, list)
    }

    return NextResponse.json({
      conversations: (conversations ?? []).map((conversation: { id: string }) => ({
        ...conversation,
        messages: messagesByConversation.get(conversation.id) ?? [],
      })),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    console.error('[website-conversations] read failed', message.slice(0, 200))
    return NextResponse.json({ error: message === 'Unauthorized' ? message : 'Unable to load chat transcripts' }, { status: 401 })
  }
}
