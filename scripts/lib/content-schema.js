// Schemas for sections.json and collection front matter (projectplan.md §6).
// Pure functions: each returns a list of error strings, empty when valid.

const isString = (v) => typeof v === "string" && v.length > 0;
const isUrl = (v) => typeof v === "string" && /^https?:\/\/[^\s]+$/.test(v);

const TYPES = {
  string: isString,
  integer: (v) => Number.isInteger(v),
  positiveInteger: (v) => Number.isInteger(v) && v > 0,
  boolean: (v) => typeof v === "boolean",
  date: (v) => v instanceof Date && !Number.isNaN(v.getTime()),
  url: isUrl,
  stringList: (v) => Array.isArray(v) && v.length > 0 && v.every(isString),
  links: (v) => v !== null && typeof v === "object" && !Array.isArray(v)
    && Object.entries(v).every(([k, u]) => ["live", "source"].includes(k) && isUrl(u)),
  scalarMap: (v) => v !== null && typeof v === "object" && !Array.isArray(v)
    && Object.values(v).every((x) => ["string", "number", "boolean"].includes(typeof x)),
  sitePath: (v) => typeof v === "string" && /^\/([a-z0-9-]+\/)*$/.test(v),
  id: (v) => typeof v === "string" && /^[a-z][a-z0-9-]*$/.test(v),
};

// Each field: [type, required, allowed values?]. `strict` rejects unknown fields.
export const SCHEMAS = {
  projects: {
    strict: true,
    fields: {
      title: ["string", true],
      kind: ["string", true, ["project", "research"]],
      status: ["string", true, ["current", "past"]],
      order: ["integer", true],
      period: ["string", true],
      role: ["string", true],
      stack: ["stringList", true],
      links: ["links", false],
      summary: ["string", true],
      detail: ["string", false, ["high-level", "deep"]],
      pi_signoff: ["boolean", false],
    },
  },
  writing: {
    strict: true,
    fields: {
      title: ["string", true],
      outlet: ["string", true],
      date: ["date", true],
      url: ["url", true],
      category: ["string", true],
      deck: ["string", true],
    },
  },
  notes: {
    strict: true,
    fields: {
      title: ["string", true],
      date: ["date", true],
      summary: ["string", true],
      draft: ["boolean", false],
    },
  },
};

// Sections added later get this until they have a schema of their own.
export const DEFAULT_SCHEMA = { strict: false, fields: { title: ["string", true] } };

function checkFields(where, obj, schema) {
  const errors = [];
  for (const [name, [type, required, allowed]] of Object.entries(schema.fields)) {
    if (obj[name] === undefined) {
      if (required) errors.push(`${where}: missing required field "${name}"`);
      continue;
    }
    if (!TYPES[type](obj[name])) errors.push(`${where}: "${name}" must be ${type}`);
    else if (allowed && !allowed.includes(obj[name])) {
      errors.push(`${where}: "${name}" must be one of ${allowed.join(", ")}`);
    }
  }
  if (schema.strict) {
    for (const name of Object.keys(obj)) {
      if (!(name in schema.fields)) errors.push(`${where}: unknown field "${name}"`);
    }
  }
  return errors;
}

// `entry` is { path, collection, data } where data is front matter only.
export function validateEntry(entry) {
  const schema = SCHEMAS[entry.collection] ?? DEFAULT_SCHEMA;
  const errors = checkFields(entry.path, entry.data, schema);

  if (entry.collection === "projects") {
    const d = entry.data;
    if (d.kind === "research") {
      if (d.detail === undefined) errors.push(`${entry.path}: research needs "detail"`);
      if (d.pi_signoff === undefined) errors.push(`${entry.path}: research needs "pi_signoff"`);
      if (d.detail === "deep" && d.pi_signoff !== true) {
        errors.push(`${entry.path}: detail "deep" requires pi_signoff: true`);
      }
    } else if (d.detail !== undefined || d.pi_signoff !== undefined) {
      errors.push(`${entry.path}: "detail" and "pi_signoff" are for research only`);
    }
  }
  return errors;
}

const SECTION_FIELDS = {
  id: ["id", true],
  label: ["string", true],
  show: ["boolean", true],
  collection: ["id", false],
  filter: ["scalarMap", false],
  limit: ["positiveInteger", false],
  page: ["sitePath", false],
};

// `folders` is the set of directory names under src/, to confirm collections exist.
export function validateSections(sections, folders) {
  if (!Array.isArray(sections)) return ["sections.json: must be an array"];
  const errors = [];
  const ids = new Set();
  sections.forEach((s, i) => {
    const where = `sections.json[${i}]${s && s.id ? ` (${s.id})` : ""}`;
    if (s === null || typeof s !== "object") {
      errors.push(`${where}: must be an object`);
      return;
    }
    errors.push(...checkFields(where, s, { strict: true, fields: SECTION_FIELDS }));
    if (ids.has(s.id)) errors.push(`${where}: duplicate id`);
    ids.add(s.id);
    if ((s.collection === undefined) === (s.page === undefined)) {
      errors.push(`${where}: needs exactly one of "collection" or "page"`);
    }
    if (s.collection !== undefined) {
      if (s.limit === undefined) errors.push(`${where}: a collection section needs "limit"`);
      if (!folders.has(s.collection)) errors.push(`${where}: no folder src/${s.collection}/`);
    }
    if (s.page !== undefined && (s.filter !== undefined || s.limit !== undefined)) {
      errors.push(`${where}: a page section takes no "filter" or "limit"`);
    }
  });
  return errors;
}
