import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Fill, Stroke, Style } from 'ol/style';

export const createAnnotationFeatureStyle = (feature) => {
  const sourceType = feature.get('sourceType');
  const isSelectedForDelete = Boolean(feature.get('isSelectedForDelete'));
  let strokeColor = '#ff0000';

  if (sourceType === 'manual') strokeColor = '#1677ff';
  if (isSelectedForDelete) strokeColor = '#fa541c';

  return new Style({
    stroke: new Stroke({
      color: strokeColor,
      width: isSelectedForDelete ? 3 : 2,
    }),
    fill: new Fill({
      color: isSelectedForDelete ? 'rgba(250, 84, 28, 0.08)' : 'rgba(0, 0, 0, 0.03)',
    }),
  });
};

export const createFeatureFromBBox = (bbox, imageHeight, meta = {}) => {
  if (!Array.isArray(bbox) || bbox.length < 4) return null;

  const [rawX1, rawY1, rawX2, rawY2] = bbox;
  const minX = Math.min(rawX1, rawX2);
  const maxX = Math.max(rawX1, rawX2);
  const minY = Math.min(rawY1, rawY2);
  const maxY = Math.max(rawY1, rawY2);
  const invertedMinY = imageHeight - maxY;
  const invertedMaxY = imageHeight - minY;

  const feature = new Feature({
    geometry: new Polygon([[
      [minX, invertedMinY],
      [minX, invertedMaxY],
      [maxX, invertedMaxY],
      [maxX, invertedMinY],
      [minX, invertedMinY],
    ]]),
  });

  feature.set('id', meta.id || `bbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  feature.set('sourceType', meta.sourceType || 'predicted');
  feature.set('isSelectedForDelete', false);

  return feature;
};

export const featureToDetection = (feature, imageHeight) => {
  const geometry = feature?.getGeometry?.();
  const coordinates = geometry?.getCoordinates?.()?.[0];
  if (!coordinates || coordinates.length < 4) return null;

  const xs = coordinates.map(point => point[0]);
  const ys = coordinates.map(point => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const mapMinY = Math.min(...ys);
  const mapMaxY = Math.max(...ys);

  return {
    bbox_global: [
      Math.round(minX),
      Math.round(imageHeight - mapMaxY),
      Math.round(maxX),
      Math.round(imageHeight - mapMinY),
    ],
  };
};

export const detectionToBBox = (detection) => {
  if (Array.isArray(detection?.bbox_global)) return detection.bbox_global;
  if (Array.isArray(detection?.bbox)) return detection.bbox;
  return null;
};
