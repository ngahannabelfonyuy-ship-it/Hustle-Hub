"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Send, MessageSquare, ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Avatar({ name, size = "md" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div
      className={cn(
        "rounded-full bg-(--color-primary-container) flex items-center justify-center font-bold text-(--color-on-primary-container) flex-shrink-0",
        sizes[size]
      )}
    >
      {name?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function MessagesPage() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversations, setConversations] = useState([]); // [{otherUser, messages, unreadCount}]
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  // ── Load all messages for the current user ──
  const loadMessages = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(id, name, avatar_url), receiver:profiles!messages_receiver_id_fkey(id, name, avatar_url)")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    if (error || !data) return;

    // Group into conversations by "other" user
    const convMap = new Map();
    for (const msg of data) {
      const other = msg.sender_id === userId ? msg.receiver : msg.sender;
      if (!other) continue;
      const key = other.id;
      if (!convMap.has(key)) {
        convMap.set(key, { otherUser: other, messages: [], unreadCount: 0 });
      }
      const conv = convMap.get(key);
      conv.messages.push(msg);
      if (!msg.is_read && msg.receiver_id === userId) conv.unreadCount++;
    }

    // Sort conversations by latest message
    const sorted = Array.from(convMap.values()).sort((a, b) => {
      const aLast = a.messages.at(-1)?.created_at ?? "";
      const bLast = b.messages.at(-1)?.created_at ?? "";
      return bLast.localeCompare(aLast);
    });

    setConversations(sorted);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      setCurrentUserId(session.user.id);
      await loadMessages(session.user.id);
      setLoading(false);

      // TODO: subscribe to Supabase Realtime for live updates
      // const channel = supabase
      //   .channel("messages-live")
      //   .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
      //     loadMessages(session.user.id);
      //   })
      //   .subscribe();
      // return () => supabase.removeChannel(channel);
    }
    init();
  }, [loadMessages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConvId, conversations]);

  // Mark messages as read when selecting a conversation
  const handleSelectConversation = async (conv) => {
    setSelectedConvId(conv.otherUser.id);
    setMobileShowChat(true);

    const unread = conv.messages.filter(
      (m) => !m.is_read && m.receiver_id === currentUserId
    );
    if (unread.length > 0 && currentUserId) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .in("id", unread.map((m) => m.id));

      setConversations((prev) =>
        prev.map((c) =>
          c.otherUser.id === conv.otherUser.id
            ? { ...c, unreadCount: 0, messages: c.messages.map((m) => ({ ...m, is_read: true })) }
            : c
        )
      );
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvId || !currentUserId || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: currentUserId, receiver_id: selectedConvId, content })
      .select("*, sender:profiles!messages_sender_id_fkey(id, name, avatar_url), receiver:profiles!messages_receiver_id_fkey(id, name, avatar_url)")
      .single();

    if (!error && data) {
      setConversations((prev) =>
        prev.map((c) =>
          c.otherUser.id === selectedConvId
            ? { ...c, messages: [...c.messages, data] }
            : c
        )
      );
    }
    setSending(false);
  };

  const selectedConv = conversations.find((c) => c.otherUser.id === selectedConvId);
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const filteredConvs = conversations.filter((c) =>
    !search || c.otherUser.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── LOADING STATE ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="inline-block w-8 h-8 border-4 border-(--color-secondary)/30 border-t-(--color-secondary) rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-headline-md text-(--color-on-background)">Messages</h1>
        <p className="text-body-sm text-(--color-on-surface-variant) mt-1">
          Communicate securely with clients and workers.
          {totalUnread > 0 && (
            <span className="ml-2 bg-(--color-secondary) text-(--color-on-secondary) text-xs font-bold px-2 py-0.5 rounded-full">
              {totalUnread} unread
            </span>
          )}
        </p>
      </div>

      <div className="bg-white rounded-(--radius-lg) border border-(--color-outline-variant)/30 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        <div className="flex h-full">

          {/* ── LEFT: Conversation List ── */}
          <div
            className={cn(
              "w-full md:w-80 border-r border-(--color-outline-variant)/30 flex flex-col",
              mobileShowChat ? "hidden md:flex" : "flex"
            )}
          >
            <div className="p-4 border-b border-(--color-outline-variant)/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-outline)" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-(--color-outline-variant)/50 rounded-md text-sm outline-none focus:border-(--color-secondary) transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-500">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Messages from clients will appear here.
                  </p>
                </div>
              ) : (
                filteredConvs.map((conv) => {
                  const lastMsg = conv.messages.at(-1);
                  const isSelected = selectedConvId === conv.otherUser.id;
                  return (
                    <button
                      key={conv.otherUser.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-(--color-outline-variant)/10",
                        isSelected
                          ? "bg-(--color-secondary-container)/40"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="relative">
                        <Avatar name={conv.otherUser.name} size="md" />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-(--color-secondary) text-(--color-on-secondary) text-[10px] font-bold rounded-full flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className={cn("text-sm font-semibold truncate", conv.unreadCount > 0 ? "text-(--color-on-background)" : "text-(--color-on-surface-variant)")}>
                            {conv.otherUser.name}
                          </span>
                          <span className="text-[10px] text-(--color-outline) flex-shrink-0 ml-2">
                            {formatTime(lastMsg?.created_at)}
                          </span>
                        </div>
                        <p className={cn("text-xs truncate mt-0.5", conv.unreadCount > 0 ? "font-semibold text-(--color-on-background)" : "text-(--color-on-surface-variant)")}>
                          {lastMsg ? (lastMsg.sender_id === currentUserId ? "You: " : "") + lastMsg.content : "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: Chat Window ── */}
          <div
            className={cn(
              "flex-1 flex flex-col",
              !mobileShowChat ? "hidden md:flex" : "flex"
            )}
          >
            {!selectedConv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
                <p className="font-semibold text-(--color-on-surface-variant)">Select a conversation</p>
                <p className="text-xs text-(--color-on-surface-variant) mt-1 max-w-xs">
                  Choose a conversation from the left to start messaging.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-(--color-outline-variant)/20 flex items-center gap-3">
                  <button
                    className="md:hidden p-1 mr-1 text-(--color-on-surface-variant)"
                    onClick={() => { setMobileShowChat(false); setSelectedConvId(null); }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar name={selectedConv.otherUser.name} size="md" />
                  <div>
                    <p className="font-semibold text-(--color-on-background)">{selectedConv.otherUser.name}</p>
                    <p className="text-xs text-(--color-on-surface-variant)">Active</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedConv.messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex gap-2 items-end", isMine ? "flex-row-reverse" : "flex-row")}
                      >
                        {!isMine && <Avatar name={selectedConv.otherUser.name} size="sm" />}
                        <div
                          className={cn(
                            "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                            isMine
                              ? "bg-(--color-secondary) text-(--color-on-secondary) rounded-br-sm"
                              : "bg-gray-100 text-(--color-on-background) rounded-bl-sm"
                          )}
                        >
                          {msg.content}
                          <div className={cn("text-[10px] mt-1 opacity-60 text-right", isMine ? "text-(--color-on-secondary)" : "text-gray-500")}>
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-(--color-outline-variant)/20">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-(--color-outline-variant)/50 rounded-full text-sm outline-none focus:border-(--color-secondary) transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="w-10 h-10 flex-shrink-0 bg-(--color-secondary) text-(--color-on-secondary) rounded-full flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
