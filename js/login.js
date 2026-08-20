import { supabase } from "./supabase.js";
import { normalizeUsername } from "./auth.js";

const form = document.querySelector("#loginForm");
const message = document.querySelector("#message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "Signing in...";

  const username = normalizeUsername(document.querySelector("#username").value);
  const password = document.querySelector("#password").value;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();

  if (profileError) {
    message.textContent = profileError.message;
    return;
  }

  if (!profile) {
    message.textContent = "Username or password is incorrect.";
    return;
  }

  const email = `${username}@vxchat.local`;
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    message.textContent = "Username or password is incorrect.";
    return;
  }

  location.href = "chat.html";
});
