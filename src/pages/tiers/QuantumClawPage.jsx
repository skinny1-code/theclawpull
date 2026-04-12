import TierPage from './TierPage.jsx'
const CONFIG = {
  packId:'quantumclaw', name:'QuantumClaw', price:'$500', credits:500,
  color:'#C9A84C', glow:'rgba(201,168,76,0.3)', bgTint:'#100e06',
  badge:'ULTIMATE TIER · $500', icon:'⚡',
  tagline:'Museum-grade. Investment-level. Legendary.',
  description:'The most exclusive pull experience in TheClawPull. 500 credits to pull from a pool of the rarest cards on the platform — Michael Jordan Fleer RC, Pikachu Illustrator, LeBron Chrome RC, and more. Cards that belong in collections, not shelves.',
  rarity:'INVESTMENT GRADE · $1,100–$4,200 FMV',
  cards:[
    { name:'Pikachu Illustrator',    grade:'PSA 7',  fmv:4200, img:'https://images.pokemontcg.io/basep/26_hires.png' },
    { name:'Michael Jordan Fleer RC',grade:'PSA 6',  fmv:3800, img:'https://www.baseball-reference.com/minors/img/baseball.png' },
    { name:'Rayquaza Gold Star',     grade:'PSA 7',  fmv:2800, img:'https://images.pokemontcg.io/ex11/101_hires.png' },
    { name:'Umbreon Gold Star',      grade:'PSA 6',  fmv:3200, img:'https://images.pokemontcg.io/ex15/17_hires.png' },
    { name:'LeBron James Chrome RC', grade:'PSA 8',  fmv:2200, img:'https://www.baseball-reference.com/minors/img/baseball.png' },
    { name:'Tom Brady Auto /25',     grade:'BGS 9',  fmv:1800, img:'https://www.baseball-reference.com/minors/img/baseball.png' },
    { name:'Luka Doncic Prizm RC',   grade:'PSA 10', fmv:1200, img:'https://www.baseball-reference.com/minors/img/baseball.png' },
    { name:'Bored Ape #8102',        grade:'Auth.',  fmv:1100, img:'https://ipfs.io/ipfs/QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ' },
  ],
}
export default function QuantumClawPage() { return <TierPage config={CONFIG}/> }
