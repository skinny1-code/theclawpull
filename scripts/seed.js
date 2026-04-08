/**
 * npm run db:seed
 * Seeds the cards table via Supabase. Safe to re-run (ON CONFLICT DO NOTHING).
 */
import { createClient } from '@supabase/supabase-js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const { readFileSync } = await import('fs')
  const envContent = readFileSync(resolve(__dirname, '../.env'), 'utf8')
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.split('=')
    if (key && !key.startsWith('#') && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
} catch { /* .env optional */ }

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const CARDS = [
  { name:"Shohei Ohtani RC 2023",       grade:"PSA 10", sport:"Sports",  year:2023, set_name:"Topps",          player:"Shohei Ohtani",     rarity:"Legendary",  total_supply:1, fmv:420,  claw_tier:"UltraClaw"   },
  { name:"Charizard Base Set Holo",     grade:"PSA 9",  sport:"Pokémon", year:1999, set_name:"Base Set",       player:"Charizard",         rarity:"Legendary",  total_supply:1, fmv:850,  claw_tier:"QuantumClaw" },
  { name:"Goku Ultra Instinct Prizm",   grade:"BGS 9.5",sport:"Anime",   year:2022, set_name:"Dragon Ball",    player:"Goku",              rarity:"Ultra Rare", total_supply:2, fmv:180,  claw_tier:"PremierClaw" },
  { name:"LeBron James Chrome RC 2003", grade:"PSA 8",  sport:"Sports",  year:2003, set_name:"Topps Chrome",   player:"LeBron James",      rarity:"Legendary",  total_supply:1, fmv:2200, claw_tier:"QuantumClaw" },
  { name:"Mewtwo Base Set Holo",        grade:"PSA 9",  sport:"Pokémon", year:1999, set_name:"Base Set",       player:"Mewtwo",            rarity:"Ultra Rare", total_supply:1, fmv:320,  claw_tier:"PremierClaw" },
  { name:"Naruto Shippuden Gold Leaf",  grade:"BGS 9",  sport:"Anime",   year:2021, set_name:"Naruto",         player:"Naruto",            rarity:"Rare",       total_supply:3, fmv:95,   claw_tier:"CoreClaw"    },
  { name:"Fernando Tatis Jr. Finest",   grade:"PSA 10", sport:"Sports",  year:2021, set_name:"Topps Finest",   player:"Fernando Tatis Jr", rarity:"Rare",       total_supply:3, fmv:145,  claw_tier:"CoreClaw"    },
  { name:"Patrick Mahomes Prizm 2022",  grade:"BGS 9.5",sport:"Sports",  year:2022, set_name:"Panini Prizm",   player:"Patrick Mahomes",   rarity:"Ultra Rare", total_supply:2, fmv:380,  claw_tier:"PremierClaw" },
  { name:"Pikachu Illustrator Promo",   grade:"PSA 7",  sport:"Pokémon", year:1998, set_name:"Promo",          player:"Pikachu",           rarity:"Legendary",  total_supply:1, fmv:4200, claw_tier:"QuantumClaw" },
  { name:"Michael Jordan Fleer RC 1986",grade:"PSA 6",  sport:"Sports",  year:1986, set_name:"Fleer",          player:"Michael Jordan",    rarity:"Legendary",  total_supply:1, fmv:3800, claw_tier:"QuantumClaw" },
  { name:"Luffy Gear 5 Gold Foil /10",  grade:"BGS 10", sport:"Anime",   year:2024, set_name:"One Piece",      player:"Luffy",             rarity:"Legendary",  total_supply:1, fmv:490,  claw_tier:"UltraClaw"   },
  { name:"Victor Wembanyama RC 2024",   grade:"PSA 10", sport:"Sports",  year:2024, set_name:"Topps",          player:"Victor Wembanyama", rarity:"Legendary",  total_supply:1, fmv:660,  claw_tier:"UltraClaw"   },
  { name:"Bored Ape #8102 Print Card",  grade:"Auth.",  sport:"NFT",     year:2022, set_name:"NFT",            player:null,                rarity:"Legendary",  total_supply:1, fmv:1100, claw_tier:"QuantumClaw" },
  { name:"CryptoPunk #3498 Card",       grade:"Auth.",  sport:"NFT",     year:2022, set_name:"NFT",            player:null,                rarity:"Ultra Rare", total_supply:1, fmv:720,  claw_tier:"PremierClaw" },
  { name:"Tom Brady Impeccable Auto",   grade:"BGS 9",  sport:"Sports",  year:2020, set_name:"Panini Impeccable",player:"Tom Brady",        rarity:"Legendary",  total_supply:1, fmv:1800, claw_tier:"QuantumClaw" },
  { name:"Ja Morant Select RC 2020",    grade:"PSA 10", sport:"Sports",  year:2020, set_name:"Panini Select",  player:"Ja Morant",         rarity:"Rare",       total_supply:3, fmv:88,   claw_tier:"CoreClaw"    },
  { name:"Gojo Satoru Prizm Auto",      grade:"PSA 10", sport:"Anime",   year:2023, set_name:"Jujutsu Kaisen", player:"Satoru Gojo",       rarity:"Legendary",  total_supply:1, fmv:620,  claw_tier:"UltraClaw"   },
  { name:"Charizard VMAX Alt Art",      grade:"PSA 9",  sport:"Pokémon", year:2021, set_name:"Darkness Ablaze",player:"Charizard",         rarity:"Legendary",  total_supply:1, fmv:950,  claw_tier:"UltraClaw"   },
  { name:"Luka Doncic Prizm RC 2018",   grade:"PSA 10", sport:"Sports",  year:2018, set_name:"Panini Prizm",   player:"Luka Doncic",       rarity:"Legendary",  total_supply:1, fmv:1200, claw_tier:"QuantumClaw" },
  { name:"Rayquaza Gold Star",          grade:"PSA 7",  sport:"Pokémon", year:2005, set_name:"EX Deoxys",      player:"Rayquaza",          rarity:"Legendary",  total_supply:1, fmv:2800, claw_tier:"QuantumClaw" },
]

async function seed() {
  console.log(`🌱  Seeding ${CARDS.length} cards into Supabase...`)
  let inserted = 0
  for (const card of CARDS) {
    const { error } = await db.from('cards').upsert(
      { ...card, remaining: card.total_supply, pull_cost: 1 },
      { onConflict: 'name,grade', ignoreDuplicates: true }
    )
    if (!error) inserted++
  }
  console.log(`✅  Seeded ${inserted}/${CARDS.length} cards`)
}

seed().catch(err => { console.error('❌', err.message); process.exit(1) })
