import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageSquareText, UserRound, UserRoundX } from 'lucide-react'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

type ConversationRow = {
  id: string
  contact_id: string | null
  status: string
  created_at: string
  updated_at: string
  knowledge_version: string | null
}

type MessageRow = {
  id: string
  conversation_id: string
  sequence_number: number
  role: 'visitor' | 'assistant' | 'system'
  redacted_text: string
  created_at: string
}

type ContactRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

export default async function AssistantConversationsPage() {
  let organizationId: string
  try {
    ;({ organizationId } = await getOrganization())
  } catch {
    redirect('/auth/login')
  }

  const supabase = createServiceClient()
  // These private assistant tables intentionally deny browser access through RLS.
  // The authenticated server page uses the service client and always scopes by organization.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationsQuery = supabase.from('website_conversations' as never) as any
  const { data: conversationData, error: conversationError } = await conversationsQuery
    .select('id, contact_id, status, created_at, updated_at, knowledge_version')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (conversationError) throw new Error('Unable to load website assistant conversations')
  const conversations = (conversationData ?? []) as ConversationRow[]
  const conversationIds = conversations.map((conversation) => conversation.id)
  const contactIds = [...new Set(conversations.map((conversation) => conversation.contact_id).filter(Boolean))] as string[]

  let messages: MessageRow[] = []
  if (conversationIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messagesQuery = supabase.from('website_conversation_messages' as never) as any
    const { data, error } = await messagesQuery
      .select('id, conversation_id, sequence_number, role, redacted_text, created_at')
      .eq('organization_id', organizationId)
      .in('conversation_id', conversationIds)
      .order('sequence_number', { ascending: true })
    if (error) throw new Error('Unable to load website assistant messages')
    messages = (data ?? []) as MessageRow[]
  }

  let contacts: ContactRow[] = []
  if (contactIds.length > 0) {
    const { data } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .eq('organization_id', organizationId)
      .in('id', contactIds)
    contacts = (data ?? []) as ContactRow[]
  }

  const messagesByConversation = new Map<string, MessageRow[]>()
  for (const message of messages) {
    const existing = messagesByConversation.get(message.conversation_id) ?? []
    existing.push(message)
    messagesByConversation.set(message.conversation_id, existing)
  }
  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]))

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <MessageSquareText className="size-5" />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">Website assistant</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Chat transcripts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every visitor conversation is recorded here, including anonymous chats that never become a contact.
          </p>
        </div>
        <Badge variant="outline" className="w-fit font-mono">
          {conversations.length} recent conversation{conversations.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No conversations yet</CardTitle>
            <CardDescription>Chats will appear after a visitor sends their first message.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => {
            const transcript = messagesByConversation.get(conversation.id) ?? []
            const contact = conversation.contact_id ? contactsById.get(conversation.contact_id) : undefined
            const displayName = contact
              ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email || 'Known contact'
              : 'Anonymous visitor'
            return (
              <Card key={conversation.id}>
                <details>
                  <summary className="cursor-pointer list-none px-6 py-5 [&::-webkit-details-marker]:hidden">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-input bg-muted/40">
                          {contact ? <UserRound className="size-5 text-primary" /> : <UserRoundX className="size-5 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(conversation.updated_at)} · {Math.ceil(transcript.length / 2)} turn{Math.ceil(transcript.length / 2) === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!contact && <Badge variant="secondary">Anonymous</Badge>}
                        <Badge variant="outline" className="capitalize">{conversation.status}</Badge>
                      </div>
                    </div>
                  </summary>
                  <CardContent className="border-t border-input pt-5">
                    {contact && (
                      <Link href={`/dashboard/contacts/${contact.id}`} className="mb-5 inline-flex text-sm font-medium text-primary hover:underline">
                        Open contact record
                      </Link>
                    )}
                    <div className="space-y-3">
                      {transcript.map((message) => (
                        <div
                          key={message.id}
                          className={message.role === 'visitor'
                            ? 'ml-auto max-w-[85%] rounded-xl bg-primary px-4 py-3 text-primary-foreground'
                            : 'mr-auto max-w-[85%] rounded-xl border border-input bg-muted/30 px-4 py-3 text-foreground'}
                        >
                          <div className="mb-1 flex items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-wider opacity-70">
                            <span>{message.role === 'visitor' ? 'Visitor' : 'Assistant'}</span>
                            <span>{formatTime(message.created_at)}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.redacted_text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </details>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago',
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago',
  }).format(new Date(value))
}
