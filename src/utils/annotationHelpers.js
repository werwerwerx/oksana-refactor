import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Fill, Stroke, Style } from 'ol/style';

export const CLASS_COLORS = {
  'Трек': '#00FF00', // Красный для "трэк"
  'Фоновый трек': '#FF0000', // Синий для "Фоновый трек"
  'Неизвестный объект': '#0000FF', // Зелёный для "другие"
  delete: '#fa541c', // Оранжевый при выделении для удаления
  default: '#1677ff', // Синий по умолчанию (если класс не определён)
};

// Возвращает цвет для класса разметки
export const getClassColor = (objClass) => CLASS_COLORS[objClass] || CLASS_COLORS.default;

// Этот style используется для всех bbox на карте
export const getAnnotationFeatureStyle = (feature) => {
  const objClass = feature.get('detect_class');
  const isSelectedForDelete = Boolean(feature.get('isSelectedForDelete'));
  const baseColor = getClassColor(objClass);

  return new Style({
    stroke: new Stroke({
      color: isSelectedForDelete ? CLASS_COLORS.delete : baseColor, // Оранжевый при удалении
      width: isSelectedForDelete ? 3 : 2,
    }),
    fill: new Fill({
      color: isSelectedForDelete ? 'rgba(250, 84, 28, 0.08)' : 'rgba(0, 0, 0, 0.03)',
    }),
  });
};

// Создаёт Feature из bbox_global с указанием класса
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
  feature.set('detect_class', meta.detect_class || 'Трек'); // Добавляем класс
  feature.set('isSelectedForDelete', false);

  return feature;
};

// Преобразует feature в формат detection с сохранением класса
export const featureToDetection = (feature, imageHeight) => {
  const geometry = feature?.getGeometry?.();
  const coordinates = geometry?.getCoordinates?.()?.[0];
  if (!coordinates || coordinates.length < 4) return null;

  const xs = coordinates.map((point) => point[0]);
  const ys = coordinates.map((point) => point[1]);
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
    detect_class: feature.get('detect_class'), // Сохраняем класс
  };
};

export const detectionToBBox = (detection) => {
  if (Array.isArray(detection?.bbox_global)) return detection.bbox_global;
  if (Array.isArray(detection?.bbox)) return detection.bbox;
  return null;
};
