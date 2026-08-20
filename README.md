# VXCHAT

VXCHAT is a username-first chat application starter. It does not require phone numbers.

## V1 included
- Landing page
- Username/password register and login
- Supabase Auth integration
- Username profile
- User search
- 1-to-1 realtime text chat
- Logout
- Responsive mobile-first UI
- PWA manifest and service worker

## Setup
1. Create a Supabase project.
2. Open `supabase/schema.sql` in Supabase SQL Editor and run it.
3. Copy your Supabase Project URL and anon/publishable key into `js/config.js`.
4. Serve the project from a web server (GitHub Pages, Vercel, or local server). Do not open `index.html` directly with `file://`.
5. In Supabase Auth settings, configure your Site URL and Redirect URLs for your deployed domain.
6. Test registration, login, user search, and messaging.

Never put a Supabase service-role key in this frontend project.
