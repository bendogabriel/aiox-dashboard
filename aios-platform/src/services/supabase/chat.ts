/**
 * Supabase Chat Service
 * Persistent storage layer for chat sessions and messages.
 * Falls back gracefully when Supabase is not configured or tables are missing.
 *
 * Pattern: identical to vault.ts — fire-and-forget writes, null on read errors.
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ChatSession, Message, MessageAttachment } from '../../types';

// ── Row interfaces (snake_case DB shape) ──────────────────────

interface ChatSessionRow {
  id: string;
  agent_id: string;
  agent_name: string;
  squad_id: string;
  squad_type: string;
  title: string;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  agent_id: string | null;
  agent_name: string | null;
  squad_type: string | null;
  metadata: Record<string, unknown>;
  attachments: unknown[];
  is_streaming: boolean;
  created_at: string;
}

// ── Converters ────────────────────────────────────────────────

/** Derive a short title from the first user message */
function deriveTitle(session: ChatSession): string {
  const firstUserMsg = session.messages.find((m) => m.role === 'user');
  if (!firstUserMsg) return session.agentName || 'Chat';
  const text = firstUserMsg.content.replace(/\n/g, ' ').trim();
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

/** Convert app ChatSession to DB row (messages stored separately) */
function sessionToRow(session: ChatSession): ChatSessionRow {
  const lastMsg = session.messages[session.messages.length - 1];
  return {
    id: session.id,
    agent_id: session.agentId,
    agent_name: session.agentName,
    squad_id: session.squadId,
    squad_type: session.squadType,
    title: deriveTitle(session),
    message_count: session.messages.length,
    last_message_at: lastMsg?.timestamp ?? null,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
  };
}

/** Convert app Message to DB row */
function messageToRow(sessionId: string, msg: Message): ChatMessageRow {
  // Strip base64 data from attachments to avoid storing large blobs in the DB
  const cleanAttachments = (msg.attachments ?? []).map((att) => ({
    id: att.id,
    name: att.name,
    type: att.type,
    mimeType: att.mimeType,
    size: att.size,
    url: att.url?.startsWith('blob:') ? undefined : att.url,
    thumbnailUrl: att.thumbnailUrl,
  }));

  return {
    id: msg.id,
    session_id: sessionId,
    role: msg.role,
    content: msg.content,
    agent_id: msg.agentId ?? null,
    agent_name: msg.agentName ?? null,
    squad_type: msg.squadType ?? null,
    metadata: (msg.metadata as Record<string, unknown>) ?? {},
    attachments: cleanAttachments,
    is_streaming: false, // never persist a streaming state
    created_at: msg.timestamp,
  };
}

/** Convert DB row to app Message */
function rowToMessage(row: ChatMessageRow): Message {
  return {
    id: row.id,
    role: row.role as Message['role'],
    content: row.content,
    agentId: row.agent_id ?? undefined,
    agentName: row.agent_name ?? undefined,
    squadType: (row.squad_type as Message['squadType']) ?? undefined,
    timestamp: row.created_at,
    isStreaming: false,
    metadata: row.metadata as Message['metadata'],
    attachments: (row.attachments ?? []) as MessageAttachment[],
  };
}

// ── Service ───────────────────────────────────────────────────

export const supabaseChatService = {
  /** Flags: set to true when the table does not exist yet */
  _sessionsTableUnavailable: false,
  _messagesTableUnavailable: false,

  /** Check whether Supabase persistence is available */
  isAvailable(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  /** Handle table-not-found errors (PGRST205 = relation does not exist) */
  _handleError(
    error: { code?: string; message?: string },
    operation: string,
    tableName: 'chat_sessions' | 'chat_messages',
  ): void {
    if (error.code === 'PGRST205' || error.message?.includes(tableName)) {
      if (tableName === 'chat_sessions') this._sessionsTableUnavailable = true;
      if (tableName === 'chat_messages') this._messagesTableUnavailable = true;
      console.warn(`[Supabase] ${tableName} table not found — using localStorage only`);
    } else {
      console.error(`[Supabase] Failed to ${operation}:`, error.message);
    }
  },

  // ── Sessions ──

  /** Upsert a session (header only, messages handled separately) */
  async upsertSession(session: ChatSession): Promise<void> {
    if (!supabase || this._sessionsTableUnavailable) return;

    const row = sessionToRow(session);
    const { error } = await supabase
      .from('chat_sessions')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      this._handleError(error, 'upsert chat session', 'chat_sessions');
    }
  },

  /** List recent sessions (headers only, no messages) */
  async listSessions(limit = 100): Promise<ChatSession[] | null> {
    if (!supabase || this._sessionsTableUnavailable) return null;

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      this._handleError(error, 'list chat sessions', 'chat_sessions');
      return null;
    }

    // Return lightweight session objects (messages will be empty — loaded on demand or via getMessages)
    return (data as ChatSessionRow[]).map((row) => ({
      id: row.id,
      agentId: row.agent_id,
      agentName: row.agent_name,
      squadId: row.squad_id,
      squadType: row.squad_type as ChatSession['squadType'],
      messages: [], // populated later via getMessages
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /** Delete a session (messages cascade-deleted by FK) */
  async deleteSession(id: string): Promise<void> {
    if (!supabase || this._sessionsTableUnavailable) return;

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      this._handleError(error, 'delete chat session', 'chat_sessions');
    }
  },

  // ── Messages ──

  /** Add a single message to a session */
  async addMessage(sessionId: string, message: Message): Promise<void> {
    if (!supabase || this._messagesTableUnavailable) return;

    const row = messageToRow(sessionId, message);
    const { error } = await supabase
      .from('chat_messages')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      this._handleError(error, 'add chat message', 'chat_messages');
    }
  },

  /** Update an existing message (content and/or metadata) */
  async updateMessage(
    _sessionId: string,
    messageId: string,
    content: string,
    metadata?: Message['metadata'],
  ): Promise<void> {
    if (!supabase || this._messagesTableUnavailable) return;

    const updates: Record<string, unknown> = {
      content,
      is_streaming: false,
    };
    if (metadata !== undefined) {
      updates.metadata = metadata;
    }

    const { error } = await supabase
      .from('chat_messages')
      .update(updates)
      .eq('id', messageId);

    if (error) {
      this._handleError(error, 'update chat message', 'chat_messages');
    }
  },

  /** Get all messages for a session, ordered by created_at */
  async getMessages(sessionId: string): Promise<Message[] | null> {
    if (!supabase || this._messagesTableUnavailable) return null;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      this._handleError(error, 'get chat messages', 'chat_messages');
      return null;
    }

    return (data as ChatMessageRow[]).map(rowToMessage);
  },

  /** Delete all messages for a session */
  async deleteMessages(sessionId: string): Promise<void> {
    if (!supabase || this._messagesTableUnavailable) return;

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      this._handleError(error, 'delete chat messages', 'chat_messages');
    }
  },

  /** Bulk-insert all messages for a session (used during initial sync) */
  async bulkInsertMessages(sessionId: string, messages: Message[]): Promise<void> {
    if (!supabase || this._messagesTableUnavailable || messages.length === 0) return;

    const rows = messages.map((msg) => messageToRow(sessionId, msg));

    // Supabase upsert handles duplicates by PK
    const { error } = await supabase
      .from('chat_messages')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      this._handleError(error, 'bulk insert chat messages', 'chat_messages');
    }
  },
};
