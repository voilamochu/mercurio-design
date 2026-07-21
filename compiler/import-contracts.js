const fs = require('fs');
const path = require('path');

const REF_CONTRACTS = path.join(__dirname, '..', '..', 'scratch', 'src', 'data', 'contracts.js');
const OUT = path.join(__dirname, '..', 'source', 'data', 'contracts.json');

const src = fs.readFileSync(REF_CONTRACTS, 'utf8');

const match = src.match(/CONTRACTS_DATA\s*=\s*(\[[\s\S]*?\]);/);
if (!match) throw new Error('Could not parse CONTRACTS_DATA from contracts.js');

const raw = eval('(' + match[1] + ')');

const FACTION_ROW = { Aelyr: 0, Varuuk: 1, Ephydri: 2, Thyrnekin: 3, Korrn: 4 };
const STOP = new Set([
  'a','an','the','have','build','deliver','settle','spend','gain','get',
  'for','in','when','or','of','and','your','that','at','on','by','to',
  'is','are','was','were','be','been','being','do','does','did','doing',
  'it','its','with','from','as','into','through','during','before','after',
  'above','below','between','out','off','over','under','again','further',
  'then','once','here','there','all','each','every','both','few','more',
  'most','other','some','such','no','nor','not','only','own','same','so',
  'than','too','very','just','because','about','up','can','will','would',
  'could','should','may','might','shall','need','dare','ought','used',
  'this','these','those','which','who','whom','free','extra','basic',
  'different','single','remaining','produce','producing','increases',
  'increased','during','using','use','without','also','now','then','well',
  'back','still','already','yet','even','ever','never','always','sometimes',
  'often','usually','finally','next','last','ago','later','early','soon','twice',
]);

const OVERRIDE_ID = {
  'aelyr_5': 'lost-fleet-electronics',
  'varuuk_2': 'mass-reactor',
  'korrn_4': 'basic-goods',
  'korrn_5': 'value-trade',
};

const TYPE_MAP = {
  1: 'Bounty',
  2: 'Deal',
  4: 'Permanent',
  hybrid: 'Accord',
};

const CONTRACT_NAMES = {
  'aelyr_1': 'Contacts',
  'aelyr_2': 'Supply Line',
  'aelyr_3': 'Heritage',
  'aelyr_4': 'Diaspora',
  'aelyr_5': 'Deep Scan',
  'varuuk_1': 'Heavy Haul',
  'varuuk_2': 'Reactor Tech',
  'varuuk_3': 'Mineral Rights',
  'varuuk_4': 'Workshop',
  'varuuk_5': 'Automation',
  'ephydri_1': 'Ecosystem',
  'ephydri_2': 'Sample',
  'ephydri_3': 'Aquifer',
  'ephydri_4': 'Conduction',
  'ephydri_5': 'Nourishment',
  'thyrnekin_1': 'Research Grant',
  'thyrnekin_2': 'Think Tank',
  'thyrnekin_3': 'Recovery',
  'thyrnekin_4': 'Grid',
  'thyrnekin_5': 'Reserve',
  'korrn_1': 'Emporium',
  'korrn_2': 'Arbitrage',
  'korrn_3': 'Leverage',
  'korrn_4': 'Consignment',
  'korrn_5': 'Speculation',
};

function deriveId(desc, faction, index, originalId) {
  const override = OVERRIDE_ID[originalId];
  if (override) return override;
  const words = desc
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\d+/g, ' ')
    .split(/\s+/)
    .filter(w => w && !STOP.has(w));

  const deduped = [];
  const seen = new Set();
  for (const w of words) {
    if (!seen.has(w)) { deduped.push(w); seen.add(w); }
  }

  const slug = deduped.slice(0, 4).join('-');
  return slug || `${faction.toLowerCase()}-${index + 1}`;
}

const contracts = raw.map((c, i) => ({
  id: deriveId(c.contract, c.faction, i, c.id),
  originalId: c.id,
  name: CONTRACT_NAMES[c.id] || '',
  civilization: c.faction,
  requirement: c.contract,
  reward: c.benefit,
  type: TYPE_MAP[c.type] || c.type,
  requiredTech: c.requiredTech || null,
  row: FACTION_ROW[c.faction],
}));

const out = {
  schema: 'v1',
  generatedAt: new Date().toISOString(),
  description: 'Canonical, engine-independent contract card data for Mercurio. Single source of truth for renderers.',
  contractCount: contracts.length,
  contracts,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`Written ${contracts.length} contracts to ${path.relative(path.join(__dirname,'..'), OUT)}`);
contracts.forEach(c => console.log(`  ${c.originalId.padEnd(10)} → ${c.id}`));
