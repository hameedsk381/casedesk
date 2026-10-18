import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Ward lookup from a GeoJSON file of ward boundaries (WGS84 lon/lat).
 *
 * Put the municipality's boundaries at data/wards.geojson (or point
 * WARDS_GEOJSON_PATH at another file). Each feature must be a Polygon or
 * MultiPolygon with the ward number/name in a property; WARD_PROPERTY names that
 * property, otherwise a few common names are tried. The lookup runs entirely
 * inside this app — coordinates are never sent to a third party or stored.
 */

type Ring = number[][];
type PolygonCoords = Ring[]; // [outer, ...holes]

interface WardShape {
  ward: string;
  polygons: PolygonCoords[];
  bbox: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
}

const COMMON_PROPERTIES = ['ward', 'WARD', 'ward_no', 'WARD_NO', 'Ward_No', 'wardno', 'WardNo', 'ward_name', 'WARD_NAME', 'name', 'NAME'];

let cache: { shapes: WardShape[] } | null | undefined;

function wardLabel(properties: Record<string, unknown> | null | undefined): string | null {
  if (!properties) return null;
  const configured = process.env.WARD_PROPERTY?.trim();
  const keys = configured ? [configured] : COMMON_PROPERTIES;
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 50);
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

function bboxOf(polygons: PolygonCoords[]): [number, number, number, number] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const polygon of polygons) {
    for (const [lng, lat] of polygon[0]) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return [minLng, minLat, maxLng, maxLat];
}

/** Parses GeoJSON text into ward shapes; throws on structurally invalid input. */
export function parseWardGeoJson(text: string): WardShape[] {
  const data = JSON.parse(text);
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error('wards file must be a GeoJSON FeatureCollection');
  }
  const shapes: WardShape[] = [];
  for (const feature of data.features) {
    const geometry = feature?.geometry;
    const ward = wardLabel(feature?.properties);
    if (!ward || !geometry) continue;
    let polygons: PolygonCoords[] = [];
    if (geometry.type === 'Polygon') polygons = [geometry.coordinates];
    else if (geometry.type === 'MultiPolygon') polygons = geometry.coordinates;
    else continue;
    if (polygons.length === 0) continue;
    shapes.push({ ward, polygons, bbox: bboxOf(polygons) });
  }
  if (shapes.length === 0) throw new Error('no usable ward polygons found (check WARD_PROPERTY)');
  return shapes;
}

function inRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(lng: number, lat: number, polygon: PolygonCoords): boolean {
  if (!inRing(lng, lat, polygon[0])) return false;
  for (let h = 1; h < polygon.length; h++) {
    if (inRing(lng, lat, polygon[h])) return false; // inside a hole
  }
  return true;
}

export function findWardIn(shapes: WardShape[], lat: number, lng: number): string | null {
  for (const shape of shapes) {
    const [minLng, minLat, maxLng, maxLat] = shape.bbox;
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue;
    if (shape.polygons.some((polygon) => inPolygon(lng, lat, polygon))) return shape.ward;
  }
  return null;
}

function load(): { shapes: WardShape[] } | null {
  if (cache !== undefined) return cache;
  const file = path.resolve(process.env.WARDS_GEOJSON_PATH || 'data/wards.geojson');
  try {
    cache = { shapes: parseWardGeoJson(readFileSync(file, 'utf8')) };
    console.log(`[wards] Loaded ${cache.shapes.length} ward boundaries from ${file}`);
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT') {
      console.error('[wards] Could not load ward boundaries:', error instanceof Error ? error.message : error);
    }
    cache = null;
  }
  return cache;
}

/** True when a boundary file is present and valid. */
export function wardLookupAvailable(): boolean {
  return load() !== null;
}

/** The ward containing the point, or null if outside every ward / lookup unavailable. */
export function lookupWard(lat: number, lng: number): string | null {
  const loaded = load();
  return loaded ? findWardIn(loaded.shapes, lat, lng) : null;
}
