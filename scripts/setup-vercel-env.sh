#!/usr/bin/env bash
# Run after: vercel link --project cardclawco --team rawagon-projects
# Reads all values from .env file — no hardcoded secrets here
set -e
if [ ! -f .env ]; then echo "No .env file found. Copy .env.example to .env and fill in values."; exit 1; fi
export $(grep -v '^#' .env | xargs)
TEAM="team_s1rfma92810AxLvjb4NEiKzU"
e() { printf "%s" "$2" | vercel env add "$1" "$3" --scope rawagon-projects --force --yes 2>/dev/null && echo "  ✓ $1 [$3]"; }
echo "Setting Vercel env vars from .env..."
for ENV in production preview; do
  e VITE_CLERK_PUBLISHABLE_KEY  "$VITE_CLERK_PUBLISHABLE_KEY"  $ENV
  e CLERK_SECRET_KEY            "$CLERK_SECRET_KEY"            $ENV
  e SUPABASE_URL                "$SUPABASE_URL"                $ENV
  e SUPABASE_ANON_KEY           "$SUPABASE_ANON_KEY"           $ENV
  e SUPABASE_SERVICE_KEY        "$SUPABASE_SERVICE_KEY"        $ENV
  e APP_URL                     "$APP_URL"                     $ENV
done
e STRIPE_SECRET_KEY          "$STRIPE_SECRET_KEY"         production
e VITE_STRIPE_PUBLISHABLE_KEY "$VITE_STRIPE_PUBLISHABLE_KEY" production
e STRIPE_WEBHOOK_SECRET      "$STRIPE_WEBHOOK_SECRET"      production
echo "Done. Run: vercel --prod --scope rawagon-projects"
