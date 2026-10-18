# Ward boundaries (optional)

Put the municipality's ward boundaries here as `wards.geojson` to enable "Detect my
ward from my location" on the citizen form. Without this file the button is simply
hidden and citizens type their ward.

Requirements
- GeoJSON `FeatureCollection` in WGS84 (longitude, latitude).
- Each feature is a `Polygon` or `MultiPolygon` with the ward number/name in a property.
  The property is read from `WARD_PROPERTY` if set, otherwise one of:
  `ward`, `WARD`, `ward_no`, `WARD_NO`, `Ward_No`, `wardno`, `WardNo`, `ward_name`, `WARD_NAME`, `name`, `NAME`.

The file is baked into the Docker image (rebuild after changing it) or point
`WARDS_GEOJSON_PATH` at another location. Coordinates are only used for the lookup
inside this app; they are never stored or sent to a third party.
