const fs = require('fs');
const path = require('path');

const REF = 'C:/Users/mOCHU/CascadeProjects/bga-mercurio/reference-data/standalone-src-data';

// Import ONLY content/data, not implementation logic.
const techsSrc = fs.readFileSync(path.join(REF, 'techs.js'), 'utf8');
const projSrc = fs.readFileSync(path.join(REF, 'projectDescriptions.js'), 'utf8');

// Extract TECH_DATA array (content only).
const techMatch = techsSrc.match(/TECH_DATA\s*=\s*(\[[\s\S]*?\]);/);
if (!techMatch) throw new Error('Could not locate TECH_DATA');
const TECH_DATA = eval(techMatch[1]);

// Extract PROJECT_DESCRIPTIONS object (content only).
const projMatch = projSrc.match(/PROJECT_DESCRIPTIONS\s*=\s*(\{[\s\S]*?\});/);
const PROJECT_DESCRIPTIONS = projMatch ? eval('(' + projMatch[1] + ')') : {};

// The building/produced-resource mapping for each Project tech.
// projectName = the building named in the tech description ("Build X on ...").
// projectOutput = the single resource the project produces, when unambiguously one.
const PROJECT_META = {
  frontiers:       { projectName: 'Resort Complex',  projectOutput: 'credit' },
  discovery:       { projectName: 'Research Array',  projectOutput: 'science' },
  fusion:          { projectName: 'Reactor Core',    projectOutput: 'power' },
  synthetics:      { projectName: 'Assembly Yard',   projectOutput: 'robot' },
  hydroponics:     { projectName: 'Agri-Dome',      projectOutput: 'grain' },
  extraction:      { projectName: 'Drill Platform', projectOutput: 'ore' },
  neural_links:    { projectName: 'Mindforge',       projectOutput: null },
  collectives:     { projectName: 'Cultural Spire',  projectOutput: 'influence' },
  overdrive:       { projectName: 'Mass Reactor',    projectOutput: 'power' },
  nexus:           { projectName: 'Trade Port',      projectOutput: 'reputation' },
  microforge:      { projectName: 'Nano Foundry',   projectOutput: 'crate' }
};

const technologies = TECH_DATA.map(t => {
  const rec = {
    id: t.id,
    name: t.name,
    level: t.level,
    type: t.type,
    copies: t.copies,
    description: t.description
  };
  if (t.type === 'Project') {
    const meta = PROJECT_META[t.id];
    rec.projectName = meta ? meta.projectName : null;
    rec.projectDescription = PROJECT_DESCRIPTIONS[t.id] || null;
    rec.projectOutput = meta ? meta.projectOutput : null;
  }
  return rec;
});

const out = {
  schema: 'v1',
  generatedAt: new Date().toISOString(),
  description: 'Canonical, engine-independent technology card data for Mercurio. Single source of truth for renderers.',
  technologyCount: technologies.length,
  technologies
};

fs.mkdirSync('C:/Users/mOCHU/CascadeProjects/mercurio-design/source/data', { recursive: true });
fs.writeFileSync('C:/Users/mOCHU/CascadeProjects/mercurio-design/source/data/technologies.json', JSON.stringify(out, null, 2) + '\n');
console.log('Wrote', technologies.length, 'technologies');
