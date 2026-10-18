# Ward boundaries (optional)

`wards.geojson` here enables "Detect my ward from my location" on the citizen form.
Without it the button is simply hidden and citizens type their ward.

## Adding a municipality

Get the municipality's current ward boundaries (Shapefile, KML or GeoJSON) from the
municipal administration — use the latest delimitation, as ward lines are being
redrawn — then import them. Ward numbers repeat across towns, so every ward is stored
with its municipality name.

```bash
# 1. Which attribute holds the ward number?
node scripts/import-wards.mjs --input vijayawada.shp --list-properties

# 2. Import it (add --replace to refresh a municipality already in the file)
node scripts/import-wards.mjs --input vijayawada.shp --municipality "Vijayawada" --ward-property WARD_NO
```

Repeat for each municipality; they accumulate in `data/wards.geojson`. If a shapefile
has no `.prj` and is not in longitude/latitude, add `--source-crs EPSG:32644` (UTM 44N)
or the right code. The script reprojects to WGS84, strips "Ward"/leading zeros from
labels, merges duplicate labels, and refuses data that lands outside Andhra Pradesh.

## Format (if you prepare the file yourself)

GeoJSON `FeatureCollection` in WGS84; `Polygon` or `MultiPolygon` features with
`ward` and `municipality` properties. Other names are read from `WARD_PROPERTY` /
`WARD_MUNICIPALITY_PROPERTY`.

The file is baked into the Docker image, so rebuild after changing it (or point
`WARDS_GEOJSON_PATH` elsewhere). Coordinates are only used for the lookup inside
this app; they are never stored or sent to a third party.
