#!/usr/bin/env node
/**
 * Imports one municipality's ward boundaries (Shapefile, KML or GeoJSON) into
 * data/wards.geojson, tagging every ward with the municipality name so ward
 * numbers from different towns never collide.
 *
 *   # 1. See which attribute holds the ward number
 *   node scripts/import-wards.mjs --input vijayawada.shp --list-properties
 *
 *   # 2. Import (add --replace to refresh a municipality that is already in the file)
 *   node scripts/import-wards.mjs --input vijayawada.shp --municipality "Vijayawada" --ward-property WARD_NO
 *
 * Options
 *   --input <file>            .shp (with .dbf next to it), .kml, .geojson or .json
 *   --municipality <name>     required to import; stored on every ward
 *   --ward-property <name>    attribute holding the ward number/name
 *   --source-crs <code>       e.g. EPSG:32644 when a shapefile has no .prj (default: WGS84)
 *   --output <file>           default data/wards.geojson
 *   --replace                 replace an existing municipality instead of failing
 *   --list-properties         print the attributes of the first features and exit
 *
 * Coordinates are reprojected to WGS84 (lon/lat), rounded to 6 decimals, and
 * features sharing a ward label are merged into one MultiPolygon.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import * as shapefile from 'shapefile';
import proj4 from 'proj4';
import { DOMParser } from '@xmldom/xmldom';
import { kml as kmlToGeoJson } from '@tmcw/togeojson';

// Rough bounds of Andhra Pradesh, used only to catch a wrong coordinate system.
const AP_BOUNDS = { minLat: 12.5, maxLat: 19.95, minLng: 76.5, maxLng: 85.0 };

function fail(message) {
  console.error(`import-wards: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) fail(`unexpected argument "${arg}"`);
    const key = arg.slice(2);
    if (['replace', 'list-properties'].includes(key)) args[key] = true;
    else {
      const value = argv[++i];
      if (value === undefined || value.startsWith('--')) fail(`--${key} needs a value`);
      args[key] = value;
    }
  }
  return args;
}

async function loadFeatures(input, sourceCrs) {
  const ext = path.extname(input).toLowerCase();
  if (ext === '.geojson' || ext === '.json') {
    const data = JSON.parse(readFileSync(input, 'utf8'));
    if (data.type === 'FeatureCollection') return { features: data.features, crs: sourceCrs };
    fail('GeoJSON input must be a FeatureCollection');
  }
  if (ext === '.kml') {
    const doc = new DOMParser().parseFromString(readFileSync(input, 'utf8'), 'text/xml');
    return { features: kmlToGeoJson(doc).features, crs: null }; // KML is always WGS84
  }
  if (ext === '.shp') {
    const base = input.slice(0, -4);
    const dbf = existsSync(`${base}.dbf`) ? `${base}.dbf` : undefined;
    if (!dbf) console.warn('warning: no .dbf found next to the .shp, so there are no attributes');
    const collection = await shapefile.read(input, dbf, { encoding: 'utf-8' });
    let crs = sourceCrs;
    if (!crs && existsSync(`${base}.prj`)) crs = readFileSync(`${base}.prj`, 'utf8').trim();
    return { features: collection.features, crs };
  }
  return fail(`unsupported file type "${ext}" (use .shp, .kml, .geojson or .json)`);
}

function walkCoordinates(coords, fn) {
  if (typeof coords[0] === 'number') return fn(coords);
  return coords.map((c) => walkCoordinates(c, fn));
}

function looksLikeLonLat(features) {
  for (const f of features.slice(0, 20)) {
    if (!f.geometry) continue;
    let ok = true;
    walkCoordinates(f.geometry.coordinates, ([x, y]) => {
      if (x < -180 || x > 180 || y < -90 || y > 90) ok = false;
      return [x, y];
    });
    if (!ok) return false;
  }
  return true;
}

function buildTransform(crs, features) {
  if (!crs) {
    if (!looksLikeLonLat(features)) {
      fail('coordinates are not longitude/latitude and no coordinate system is known — pass --source-crs, e.g. EPSG:32644');
    }
    return (c) => c;
  }
  const geographic = /^(EPSG:4326|WGS84)$/i.test(crs) || (/GEOGCS/i.test(crs) && !/PROJCS/i.test(crs) && /WGS[_ ]?1984|D_WGS_1984/i.test(crs));
  if (geographic) return (c) => c;
  let converter;
  try {
    converter = proj4(crs, 'EPSG:4326');
  } catch (error) {
    fail(`cannot understand the coordinate system (${error instanceof Error ? error.message : error}) — pass --source-crs`);
  }
  return (c) => converter.forward([c[0], c[1]]);
}

const round = (n) => Math.round(n * 1e6) / 1e6;

function cleanRing(ring) {
  const points = ring.map(([x, y]) => [round(x), round(y)]);
  const first = points[0];
  const last = points[points.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) points.push([...first]);
  return points.length >= 4 ? points : null;
}

function cleanPolygon(rings) {
  const cleaned = rings.map(cleanRing).filter(Boolean);
  return cleaned.length > 0 && cleaned[0] ? cleaned : null; // the outer ring must survive
}

function normaliseLabel(raw) {
  if (raw === null || raw === undefined) return null;
  let label = String(raw).trim().replace(/^ward[ .:#-]*/i, '').trim();
  if (/^\d+$/.test(label)) label = String(parseInt(label, 10)); // "012" -> "12"
  return label ? label.slice(0, 50) : null;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) fail('--input is required');
  if (!existsSync(args.input)) fail(`file not found: ${args.input}`);

  const { features, crs } = await loadFeatures(args.input, args['source-crs']);
  console.log(`Read ${features.length} features from ${args.input}`);

  if (args['list-properties']) {
    for (const feature of features.slice(0, 5)) console.log(JSON.stringify(feature.properties ?? {}));
    console.log('Pick the attribute that holds the ward number and pass it as --ward-property.');
    return;
  }

  const municipality = (args.municipality || '').trim();
  const wardProperty = args['ward-property'];
  if (!municipality) fail('--municipality is required');
  if (!wardProperty) fail('--ward-property is required (run with --list-properties to see the choices)');

  const transform = buildTransform(crs, features);
  const byWard = new Map();
  let skipped = 0;
  let outside = 0;

  for (const feature of features) {
    const label = normaliseLabel(feature.properties?.[wardProperty]);
    const geometry = feature.geometry;
    if (!label || !geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) {
      skipped++;
      continue;
    }
    const projected = walkCoordinates(geometry.coordinates, transform);
    const polygons = (geometry.type === 'Polygon' ? [projected] : projected).map(cleanPolygon).filter(Boolean);
    if (polygons.length === 0) {
      skipped++;
      continue;
    }
    const [x, y] = polygons[0][0][0];
    if (y < AP_BOUNDS.minLat || y > AP_BOUNDS.maxLat || x < AP_BOUNDS.minLng || x > AP_BOUNDS.maxLng) outside++;
    byWard.set(label, [...(byWard.get(label) || []), ...polygons]);
  }

  if (byWard.size === 0) fail(`no usable wards found using property "${wardProperty}"`);
  if (outside > 0) {
    fail(`${outside} ward(s) fall outside Andhra Pradesh — the coordinate system is probably wrong. Pass --source-crs (e.g. EPSG:32644 for UTM zone 44N) and try again.`);
  }

  const merged = features.length - skipped - byWard.size;
  const newFeatures = [...byWard.entries()].map(([ward, polygons]) => ({
    type: 'Feature',
    properties: { municipality, ward },
    geometry: polygons.length === 1 ? { type: 'Polygon', coordinates: polygons[0] } : { type: 'MultiPolygon', coordinates: polygons },
  }));

  const output = args.output || 'data/wards.geojson';
  let existing = [];
  if (existsSync(output)) {
    const data = JSON.parse(readFileSync(output, 'utf8'));
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) fail(`${output} is not a GeoJSON FeatureCollection`);
    existing = data.features;
  }
  const sameMunicipality = existing.filter((f) => f.properties?.municipality === municipality);
  if (sameMunicipality.length > 0 && !args.replace) {
    fail(`${output} already has ${sameMunicipality.length} wards for "${municipality}" — add --replace to replace them`);
  }
  const kept = existing.filter((f) => f.properties?.municipality !== municipality);

  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify({ type: 'FeatureCollection', features: [...kept, ...newFeatures] }) + '\n');

  console.log(`Imported ${newFeatures.length} wards for ${municipality} into ${output}`);
  if (skipped > 0) console.warn(`warning: skipped ${skipped} feature(s) with no ward label or no polygon`);
  if (merged > 0) console.warn(`warning: ${merged} feature(s) shared a ward label with another and were merged — check the source`);
  console.log(`File now holds ${kept.length + newFeatures.length} wards. Rebuild the image to ship it (see data/README.md).`);
}

run().catch((error) => fail(error instanceof Error ? error.message : String(error)));
