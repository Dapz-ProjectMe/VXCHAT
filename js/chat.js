import { supabase } from "./supabase.js";
import { requireSession, getMyProfile, logout } from "./auth.js";

let session;
let me;
let activeConversationId = null;
let activeOtherUser = null;
let messageChannel = null;

const $ = (s) => document.querySelector(s);
const initials = (name = "VX") => name.trim().slice(0, 2).toUpperCase();

async function init() {
  session = await requireSession();
  if (!session) return;
  me = await getMyProfile();

  $("#myName").textContent = me.display_name || me.username;
  $("#myUsername").textContent = "@" + me.username;
  $("#myAvatar").textContent = initials(me.display_name || me.username);

  $("#logoutButton").addEventListener("click", logout);
  $("#userSearch").addEventListener("input", debounce(searchUsers, 300));
  $("#messageForm").addEventListener("submit", sendMessage);

  await loadConversations();
}

async function searchUsers() {
  const q = $("#userSearch").value.trim().toLowerCase().replace(/^@/, "");
  const box = $("#searchResults");
  box.innerHTML = "";
  if (q.length < 2) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .ilike("username", `${q}%`)
    .neq("id", me.id)
    .limit(8);

  if (error) {
    box.textContent = error.message;
    return;
  }

  for (const user of data) {
    const item = document.createElement("div");
    item.className = "result";
    item.innerHTML = `<div class="avatar">${initials(user.display_name || user.username)}</div>
      <div><strong>${escapeHtml(user.display_name || user.username)}</strong><span class="muted">@${escapeHtml(user.username)}</span></div>`;
    item.addEventListener("click", () => openConversation(user));
    box.appendChild(item);
  }
}

async function openConversation(user) {
  const { data: existing, error: findError } = await supabase.rpc("find_direct_conversation", {
    other_user_id: user.id
  });
  if (findError) {
    alert(findError.message);
    return;
  }

  let conversationId = existing?.[0]?.conversation_id;

  if (!conversationId) {
    const { data: created, error } = await supabase.rpc("create_direct_conversation", {
      other_user_id: user.id
    });
    if (error) {
      alert(error.message);
      return;
    }
    conversationId = created;
  }

  activeConversationId = conversationId;
  activeOtherUser = user;

  $("#emptyState").classList.add("hidden");
  $("#chatWindow").classList.remove("hidden");
  $("#chatName").textContent = user.display_name || user.username;
  $("#chatUsername").textContent = "@" + user.username;
  $("#chatAvatar").textContent = initials(user.display_name || user.username);
  $("#userSearch").value = "";
  $("#searchResults").innerHTML = "";

  await loadMessages();
  subscribeToMessages();
}

async function loadMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("conversation_id", activeConversationId)
    .order("created_at", { ascending: true });

  if (error) {
    alert(error.message);
    return;
  }

  $("#messages").innerHTML = "";
  for (const message of data) renderMessage(message);
  scrollMessages();
}

function renderMessage(message) {
  const bubble = document.createElement("div");
  bubble.className = "bubble" + (message.sender_id === me.id ? " mine" : "");
  bubble.textContent = message.content;

  const time = document.createElement("time");
  time.textContent = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  bubble.appendChild(time);

  $("#messages").appendChild(bubble);
}

async function sendMessage(e) {
  e.preventDefault();
  if (!activeConversationId) return;

  const input = $("#messageInput");
  const content = input.value.trim();
  if (!content) return;

  input.disabled = true;
  const { error } = await supabase.from("messages").insert({
    conversation_id: activeConversationId,
    sender_id: me.id,
    content
  });
  input.disabled = false;

  if (error) {
    alert(error.message);
    return;
  }

  input.value = "";
}

function subscribeToMessages() {
  if (messageChannel) supabase.removeChannel(messageChannel);

  messageChannel = supabase
    .channel("messages:" + activeConversationId)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConversationId}` },
      (payload) => {
        if (!document.querySelector(`[data-message-id="${payload.new.id}"]`)) {
          renderMessage(payload.new);
          scrollMessages();
        }
      }
    )
    .subscribe();
}

async function loadConversations() {
  const { data, error } = await supabase.rpc("my_direct_conversations");
  if (error) {
    console.warn(error.message);
    return;
  }

  const list = $("#conversationList");
  list.innerHTML = "";

  for (const c of data || []) {
    const item = document.createElement("div");
    item.className = "conversation-item";
    item.innerHTML = `<div class="avatar">${initials(c.display_name || c.username)}</div>
      <div><strong>${escapeHtml(c.display_name || c.username)}</strong><span class="muted">@${escapeHtml(c.username)}</span></div>`;
    item.addEventListener("click", () => openConversation({
      id: c.user_id, username: c.username, display_name: c.display_name, avatar_url: c.avatar_url
    }));
    list.appendChild(item);
  }
}

function scrollMessages() {
  const box = $("#messages");
  box.scrollTop = box.scrollHeight;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

init().catch((error) => {
  console.error(error);
  alert(error.message);
});
