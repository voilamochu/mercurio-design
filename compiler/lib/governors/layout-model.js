const { resolveIcon } = require('./icon-registry');

function e(kind, props) {
  return Object.assign({ kind }, props);
}

// ─── Group builders ─────────────────────────────────────────────

function buildPlanetTypeGroup(req) {
  const resolved = resolveIcon(req.value);
  if (resolved.iconType === 'resource') {
    resolved.glow = '#FF9800';
  }
  const elements = [];
  if (req.count && req.count > 1) {
    elements.push(e('badge', { value: req.count }));
  }
  elements.push(e('icon', resolved));
  return { elements };
}

function buildMinPlanetCountGroup(req) {
  return {
    elements: [
      e('badge', { value: req.value }),
      e('icon', { icon: 'planet_any', iconType: 'generic' }),
    ],
  };
}

function buildMinProjectCountGroup(req) {
  return {
    elements: [
      e('badge', { value: req.value }),
      e('icon', { icon: 'project', iconType: 'generic' }),
    ],
  };
}

function buildMinDifferentOutputsGroup(req) {
  return {
    elements: [
      e('icon', { icon: 'resource_any', iconType: 'generic', glow: '#FF9800' }),
      e('badge', { value: req.value }),
      e('operator', { symbol: 'different', color: '#FF9800', anchor: 'south-east' }),
    ],
  };
}

function buildFullSectorGroup() {
  return {
    elements: [
      e('badge', { value: 5 }),
      e('icon', { icon: 'planet_any', iconType: 'generic' }),
    ],
  };
}

function buildMinSatisfiedInputsGroup(req) {
  return {
    elements: [
      e('badge', { value: req.value }),
      e('icon', { icon: 'planet_any', iconType: 'generic', glow: '#4CAF50' }),
    ],
  };
}

function buildMinConsumedOutputsGroup(req) {
  return {
    elements: [
      e('badge', { value: req.value }),
      e('icon', { icon: 'planet_any', iconType: 'generic', glow: '#FF9800' }),
    ],
  };
}

function buildRequiredOutputGroup(req) {
  const resolved = resolveIcon(req.value);
  return {
    elements: [
      e('icon', Object.assign(resolved, { glow: '#FF9800' })),
    ],
  };
}

function buildRequiredInputGroup(req) {
  const resolved = resolveIcon(req.value);
  return {
    elements: [
      e('icon', Object.assign(resolved, { glow: '#4CAF50' })),
    ],
  };
}

function buildMinDifferentTypesGroup(req) {
  return {
    elements: [
      e('icon', { icon: 'planet_any', iconType: 'generic' }),
      e('badge', { value: req.value }),
      e('operator', { symbol: 'different', color: '#FF9800', anchor: 'south-east' }),
    ],
  };
}

function buildMinDifferentBioTypesGroup(req) {
  const pool = (req.pool || ['Earth', 'Jungle', 'Swamp', 'Ocean'])
    .map(p => p.toLowerCase());
  const elements = [];
  pool.forEach((p, i) => {
    if (i > 0) {
      elements.push(e('label', { text: '/', fontSize: 22, fontWeight: 700, color: '#C4A35A' }));
    }
    elements.push(e('icon', { icon: p, iconType: 'planet', size: 56 }));
  });
  elements.push(e('label', { text: String(req.value), superscript: true, fontSize: 11, fontWeight: 700, color: '#C4A35A' }));
  return { elements };
}

function buildNoProjectsGroup() {
  return {
    elements: [
      e('icon', { icon: 'project', iconType: 'generic' }),
      e('overlay', { style: 'cross' }),
    ],
  };
}

function buildColdIcePlanetsGroup(req) {
  const elements = [
    e('icon', { icon: 'cold', iconType: 'planet', size: 56 }),
    e('label', { text: '/', fontSize: 22, fontWeight: 700, color: '#C4A35A' }),
    e('icon', { icon: 'ice', iconType: 'planet', size: 56 }),
  ];
  if (req.count) {
    elements.push(e('label', { text: String(req.count), superscript: true, fontSize: 11, fontWeight: 700, color: '#C4A35A' }));
  }
  return { elements };
}

function buildOutputAnyOfGroup(req) {
  const values = req.value || [];
  const elements = [];
  if (values[0]) {
    const r0 = resolveIcon(values[0]);
    elements.push(e('icon', Object.assign(r0, { size: 60, glow: '#FF9800' })));
  }
  elements.push(e('label', { text: '/', fontSize: 18, color: '#C4A35A' }));
  if (values[1]) {
    const r1 = resolveIcon(values[1]);
    elements.push(e('icon', Object.assign(r1, { size: 60, glow: '#FF9800' })));
  }
  return { elements, subIconSpacing: 'loose' };
}

function buildBioPlanetClusterGroup(req) {
  const pool = ['Earth', 'Jungle', 'Swamp', 'Ocean']
    .map(p => p.toLowerCase());
  const elements = [];
  pool.forEach((p, i) => {
    if (i > 0) {
      elements.push(e('label', { text: '/', fontSize: 22, fontWeight: 700, color: '#C4A35A' }));
    }
    elements.push(e('icon', { icon: p, iconType: 'planet', size: 56 }));
  });
  elements.push(e('label', { text: String(req.value), superscript: true, fontSize: 11, fontWeight: 700, color: '#C4A35A' }));
  return { elements };
}

function buildSingleGoodAllGroup() {
  return [
    {
      elements: [
        e('icon', { icon: 'planet_any', iconType: 'generic' }),
        e('badge', { value: 3 }),
        e('label', { text: ':', fontSize: 22, fontWeight: 700, color: '#C4A35A' }),
      ],
    },
    {
      elements: [
        e('icon', { icon: 'resource_any', iconType: 'generic', dualGlow: { left: '#4CAF50', right: '#FF9800' } }),
        e('operator', { symbol: 'equals', color: '#8899AA', anchor: 'south-east' }),
      ],
    },
  ];
}

function buildSingleGoodCountGroup(req) {
  return [
    {
      elements: [
        e('icon', { icon: 'planet_any', iconType: 'generic' }),
        e('badge', { value: req.value }),
        e('label', { text: ':', fontSize: 22, fontWeight: 700, color: '#C4A35A' }),
      ],
    },
    {
      elements: [
        e('icon', { icon: 'resource_any', iconType: 'generic', dualGlow: { left: '#4CAF50', right: '#FF9800' } }),
        e('operator', { symbol: 'equals', color: '#8899AA', anchor: 'south-east' }),
      ],
    },
  ];
}

function buildMinSameInputGoodGroup(req) {
  return {
    elements: [
      e('icon', { icon: 'resource_any', iconType: 'generic', glow: '#4CAF50' }),
      e('badge', { value: req.value }),
      e('operator', { symbol: 'equals', color: '#8899AA', anchor: 'south-east' }),
    ],
  };
}

function buildMinSameOutputGoodGroup(req) {
  return {
    elements: [
      e('icon', { icon: 'resource_any', iconType: 'generic', glow: '#FF9800' }),
      e('badge', { value: req.value }),
      e('operator', { symbol: 'equals', color: '#8899AA', anchor: 'south-east' }),
    ],
  };
}

// ─── Registry ──────────────────────────────────────────────────

const BUILDERS = {
  planetType: buildPlanetTypeGroup,
  minPlanetCount: buildMinPlanetCountGroup,
  minProjectCount: buildMinProjectCountGroup,
  minDifferentOutputs: buildMinDifferentOutputsGroup,
  fullSector: buildFullSectorGroup,
  minSatisfiedInputs: buildMinSatisfiedInputsGroup,
  minConsumedOutputs: buildMinConsumedOutputsGroup,
  requiredOutput: buildRequiredOutputGroup,
  requiredInput: buildRequiredInputGroup,
  minDifferentTypes: buildMinDifferentTypesGroup,
  minDifferentBioTypes: buildMinDifferentBioTypesGroup,
  noProjects: buildNoProjectsGroup,
  coldIcePlanets: buildColdIcePlanetsGroup,
  outputAnyOf: buildOutputAnyOfGroup,
  bioPlanetCluster: buildBioPlanetClusterGroup,
  singleGoodAll: buildSingleGoodAllGroup,
  singleGoodCount: buildSingleGoodCountGroup,
  minSameInputGood: buildMinSameInputGoodGroup,
  minSameOutputGood: buildMinSameOutputGoodGroup,
};

function buildGroup(req) {
  const builder = BUILDERS[req.type];
  if (!builder) {
    return { elements: [] };
  }
  return builder(req);
}

function buildLayoutModel(governor) {
  return {
    vp: governor.vp,
    title: governor.name,
    description: governor.description,
    groups: governor.requirements.reduce((acc, req) => {
      const result = buildGroup(req);
      if (Array.isArray(result)) {
        acc.push(...result);
      } else {
        acc.push(result);
      }
      return acc;
    }, []),
  };
}

module.exports = { buildLayoutModel };
