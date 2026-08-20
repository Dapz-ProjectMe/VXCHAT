import { supabase } from "./supabase.js";
import { normalizeUsername, validUsername } from "./auth.js";

const form = document.querySelector("#registerForm");
const message = document.querySelector("#message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "Creating account...";

  const username = normalizeUsername(document.querySelector("#username").value);
  const displayName = document.querySelector("#displayName").value.trim();
  const password = document.querySelector("#password").value;

  if (!validUsername(username)) {
    message.textContent = "Username: 3–24 characters, letters, numbers, underscore.";
    return;
  }

  const email = `${username}@vxchat.local`;

  // Supabase Auth expects an email/password credential.
  // The email is an internal identifier and is never shown as the user's public identity.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: displayName }
    }
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  // If email confirmation is disabled, the user can enter chat immediately.
  // If confirmation is enabled, Supabase will require confirmation.
  if (data.session) {
    location.href = "chat.html";
  } else {
    message.textContent = "Account created. Check the confirmation flow configured in Supabase.";
  }
});
