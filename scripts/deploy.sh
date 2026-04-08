#!/usr/bin/env bash
# CardClawCo — One-Command Deploy
# Run from cardclawco/ folder: bash scripts/deploy.sh
set -e
TEAM="team_s1rfma92810AxLvjb4NEiKzU"

if ! command -v vercel &>/dev/null; then npm install -g vercel@latest; fi

vercel login
vercel link --yes --project cardclawco --team rawagon-projects 2>/dev/null || true

e() { printf "%s" "$2" | vercel env add "$1" "$3" --scope rawagon-projects --force --yes 2>/dev/null && echo "  ✓ $1" || echo "  ~ $1"; }

echo "Setting env vars..."

# All keys loaded from .env file — never hardcoded here
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

[ -n "$VITE_CLERK_PUBLISHABLE_KEY" ] && e VITE_CLERK_PUBLISHABLE_KEY "$VITE_CLERK_PUBLISHABLE_KEY" production
[ -n "$CLERK_SECRET_KEY" ]           && e CLERK_SECRET_KEY           "$CLERK_SECRET_KEY"           production
[ -n "$STRIPE_SECRET_KEY" ]          && e STRIPE_SECRET_KEY          "$STRIPE_SECRET_KEY"          production
[ -n "$VITE_STRIPE_PUBLISHABLE_KEY" ] && e VITE_STRIPE_PUBLISHABLE_KEY "$VITE_STRIPE_PUBLISHABLE_KEY" production
[ -n "$STRIPE_WEBHOOK_SECRET" ]      && e STRIPE_WEBHOOK_SECRET      "$STRIPE_WEBHOOK_SECRET"      production
[ -n "$SUPABASE_URL" ]               && e SUPABASE_URL               "$SUPABASE_URL"               production
[ -n "$SUPABASE_ANON_KEY" ]          && e SUPABASE_ANON_KEY          "$SUPABASE_ANON_KEY"          production
[ -n "$SUPABASE_SERVICE_KEY" ]       && e SUPABASE_SERVICE_KEY       "$SUPABASE_SERVICE_KEY"       production
[ -n "$APP_URL" ]                    && e APP_URL                    "$APP_URL"                    production

echo ""
echo "Deploying..."
vercel --prod --scope rawagon-projects --yes
echo ""
echo "✅ Live at https://cardclawco.vercel.app"
