const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('C:/Users/mOCHU/CascadeProjects/mercurio-design/source/data/technologies.json', 'utf8'));
const techs = data.technologies;

const VALID_TYPES = ['Project', 'Passive', 'Active', 'Endgame'];
const VALID_LEVELS = [1, 2, 3];
const VALID_COPIES = [1, 2, 3];

const errors = [];

// unique ids
const ids = new Set();
for (const t of techs) {
  if (ids.has(t.id)) errors.push(`Duplicate id: ${t.id}`);
  ids.add(t.id);
}

// unique names
const names = new Set();
for (const t of techs) {
  if (names.has(t.name)) errors.push(`Duplicate name: ${t.name}`);
  names.add(t.name);
}

// valid type / level / copies / description
for (const t of techs) {
  if (!VALID_TYPES.includes(t.type)) errors.push(`${t.id}: invalid type "${t.type}"`);
  if (!VALID_LEVELS.includes(t.level)) errors.push(`${t.id}: invalid level ${t.level}`);
  if (!VALID_COPIES.includes(t.copies)) errors.push(`${t.id}: invalid copies ${t.copies}`);
  if (!t.description || !t.description.trim()) errors.push(`${t.id}: missing description`);
}

// every Project references valid project metadata
for (const t of techs) {
  if (t.type === 'Project') {
    if (!t.projectName) errors.push(`${t.id}: Project missing projectName`);
    if (t.projectDescription === null || t.projectDescription === undefined) errors.push(`${t.id}: Project missing projectDescription`);
  } else {
    if (t.projectName !== undefined || t.projectDescription !== undefined || t.projectOutput !== undefined) {
      errors.push(`${t.id}: non-Project tech should not carry project fields`);
    }
  }
}

console.log('Technologies:', techs.length);
if (errors.length) {
  console.error('VALIDATION FAILED:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
} else {
  console.log('VALIDATION PASSED');
}
