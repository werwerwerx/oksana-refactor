// @ocr-manifest (page -> line range in this file)
//   page  1: L  49-L 109  1.jpg
//   page  2: L 110-L 161  2.jpg
//   page  3: L 162-L 209  3.jpg
//   page  4: L 210-L 235  4.jpg
//   page  5: L 236-L 283  5.jpg
//   page  6: L 284-L 327  6.jpg
//   page  7: L 328-L 363  7.jpg
//   page  8: L 364-L 401  8.jpg
//   page  9: L 402-L 442  9.jpg
//   page 10: L 443-L 485  10.jpg
//   page 11: L 486-L 524  11.jpg
//   page 12: L 525-L 586  12.jpg
//   page 13: L 587-L 632  13.jpg
//   page 14: L 633-L 697  14.jpg
//   page 15: L 698-L 748  15.jpg
//   page 16: L 749-L 805  16.jpg
//   page 17: L 806-L 840  17.jpg
//   page 18: L 841-L 896  18.jpg
//   page 19: L 897-L 957  19.jpg
//   page 20: L 958-L 991  20.jpg
//   page 21: L 992-L1033  21.jpg
//   page 22: L1034-L1086  22.jpg
//   page 23: L1087-L1149  23.jpg
//   page 24: L1150-L1201  24.jpg
//   page 25: L1202-L1263  25.jpg
//   page 26: L1264-L1315  26.jpg
//   page 27: L1316-L1369  27.jpg
//   page 28: L1370-L1420  28.jpg
//   page 29: L1421-L1481  29.jpg
//   page 30: L1482-L1535  30.jpg
//   page 31: L1536-L1570  31.jpg
//   page 32: L1571-L1627  32.jpg
//   page 33: L1628-L1684  33.jpg
//   page 34: L1685-L1744  34.jpg
//   page 35: L1745-L1802  35.jpg
//   page 36: L1803-L1860  36.jpg
//   page 37: L1861-L1916  37.jpg
//   page 38: L1917-L1976  38.jpg
//   page 39: L1977-L2039  39.jpg
//   page 40: L2040-L2101  40.jpg
//   page 41: L2102-L2166  41.jpg
//   page 42: L2167-L2220  42.jpg
//   page 43: L2221-L2282  43.jpg
//   page 44: L2283-L2343  44.jpg
//   page 45: L2344-L2398  45.jpg
//   total: 45 pages, 2398 lines

// ===== BEGIN page 1 | 1.jpg | output L49 =====
// src/App.jsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';

import { Layout, Button, Modal, Card, Upload, message, Spin, Pagination, ConfigProvider } from 'antd';
import { PoweroffOutlined, DeleteOutlined, UploadOutlined, SaveOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import ru from 'antd/lib/locale/ru_RU';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import TileImage from 'ol/source/TileImage';
import ImageStatic from 'ol/source/ImageStatic';
import TileGrid from 'ol/tilegrid/TileGrid';
import Projection from 'ol/proj/Projection';
import { ScaleLine, FullScreen, Zoom } from 'ol/control';
import Draw, { createBox } from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import { click } from 'ol/events/condition';

import AtomSpinner from './components/AtomSpinner/Atom.jsx';
import DetectionProgressOverlay from './components/DetectionProgressOverlay';
import AuthPage from './components/AuthPage';
import AuthCheck from './components/AuthCheck';

import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Style, Fill, Stroke, Text } from 'ol/style';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Tag } from 'antd';

const { Header, Content, Sider } = Layout;
const API_BASE = "";

function getMaxZoomFromLevels(levels) {
  const zs = Object.keys(levels || {}).map((k) => Number(k)).filter((n) => Number.isFinite(n));
  return zs.length ? Math.max(...zs) : 0;
}

function getDimsFromLevels(levels) {
  const maxZ = getMaxZoomFromLevels(levels);
  const lvl = levels?.[String(maxZ)] || levels?.[maxZ];
  if (lvl && Number.isFinite(lvl.width) && Number.isFinite(lvl.height)) {
    return { width: lvl.width, height: lvl.height };
  }
  const any = Object.values(levels || {})[0];
  if (any && Number.isFinite(any.width) && Number.isFinite(any.height)) {
    return { width: any.width, height: any.height };
  }
  return { width: 1024, height: 768 };
}

function toNullableNumber(value) {
  if (value === null || value === undefined) return null;
  const numberValue = Number(value);
// ===== END page 1 | output L49-109 =====
// ===== BEGIN page 2 | 2.jpg | output L110 =====
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatDuration(valueMs) {
  const ms = toNullableNumber(valueMs);
  if (ms === null) return '-';
  if (ms < 1000) {
    return `${Math.round(ms)} сек`;
  }
  // if (ms < 60 * 1000) {
  //   return `${(ms / 1000).toFixed(1).replace('.', ',')} сек`;
  // // }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes} мин ${seconds} сек`;
}

const App = ({ history }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [imageCards, setImageCards] = useState([]);
  const [selectedUuid, setSelectedUuid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [defaultImageLayer, setDefaultImageLayer] = useState(null); // Новый state для дефолтного слоя
  const [isTilesLoading, setIsTilesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Текущая страница
  const [totalCards, setTotalCards] = useState(0); // Общее количество карточек
  const [itemsPerPage, setItemsPerPage] = useState(5); // Количество карточек на странице
  const [isLoading, setIsLoading] = useState(false); // Индикатор загрузки
  const [isLoading2, setIsLoading2] = useState(false); // Индикатор загрузки

  // статистика
  const [stats, setStats] = useState({totalProjects: 0, avgTileBuildMs: null, avgDetectMs: null,});
  const [statsLoading, setStatsLoading] = useState(false);
  const [deleting, setDeleting] = useState(null); // Хранит UUID удаляемого изображения

  // состояние для отслеживания процесса предразметки:
  const [detectTaskId, setDetectTaskId] = useState(null);
  const [detectLoading, setDetectLoading] = useState({});
  const [detectProgress, setDetectProgress] = useState({});
  const [detectError, setDetectError] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Сколько тайлов сейчас реально грузится. Нужен для корректного показа/скрытия спиннера.
  const pendingTileLoadsRef = useRef(0);

  // Сюда кладём функцию очистки событий tileSource, чтобы при пересоздании карты не копились старые listeners.
  const tileSourceCleanupRef = useRef(null);

  // ============================= РУЧНАЯ РАЗМЕТКА =============================
  // блок логики для ручной работы с bbox
// ===== END page 2 | output L110-161 =====
// ===== BEGIN page 3 | 3.jpg | output L162 =====
  // Идея простая:
  // 1) все bbox (и автоматические, и нарисованные вручную) живут в одном VectorSource;
  // 2) на карту добавляется один общий слой annotationLayer;
  // 3) при сохранении мы сериализуем ВСЕ features из этого слоя обратно в bbox_global;
  // 4) удаление работает и для bbox из предразметки, и для bbox, которые пользователь нарисовал сам.
  //
  // Почему так лучше:
  // - не нужно держать отдельно слой "предразметки" и слой "ручной разметки";
  // - проще удалять / добавлять / сохранять;
  // - фронт в любой момент знает "текущее итоговое состояние" разметки.

  // Текущее состояние редактора разметки:
  // null -> обычный режим просмотра
  // 'draw' -> режим рисования новых прямоугольников
  // 'delete' -> режим удаления bbox по клику
  const [annotationMode, setAnnotationMode] = useState(null);
  const [isAnnotationDirty, setIsAnnotationDirty] = useState(false); // true, если пользователь менял bbox и ещё не сохранил
  const [isSavingAnnotations, setIsSavingAnnotations] = useState(false); // отдельный loading для кнопки "сохранить"

  // refs для слоя и интеракций ручной разметки
  const annotationSourceRef = useRef(null); //здесь лежат ВСЕ bbox текущего изображения
  const annotationLayerRef = useRef(null); //слой, который показывает bbox на карте
  const drawInteractionRef = useRef(null); // интеракция рисования прямоугольников
  const selectInteractionRef = useRef(null); // интеракция выбора bbox для удаления

  const selectedCard = imageCards.find((c) => c.uuid === selectedUuid) || null;
  const showModal = () => setIsModalVisible(true);
  const handleCancelModal = () => setIsModalVisible(false);
  const [selectedClass, setSelectedClass] = useState('Трек');
  const [isApproving, setIsApproving] = useState({}); // Объект с флагами загрузки для каждого uuid
  const [approveTaskId, setApproveTaskId] = useState(null); // Текущий ID задачи апрува
  const [approveProgress, setApproveProgress] = useState({}); // Прогресс для каждой карточки

  const STATUS = {
    PROCESSED: 'Обработано',
    NOT_ANNOTATED: 'Не размечено',
    LOADING: 'Загружается',
    ERROR: 'Ошибка',
    PENDING_REVIEW: "На проверке",
  };

  const CLASS_COLORS = {
    'Трек': '#00FF00', // Красный для "трэк"
    'Фоновый трек': '#FF0000', // Синий для "Фоновый трек"
    'Неизвестный объект': '#0000FF', // Зелёный для "другие"
    'delete': '#fa541c', // Оранжевый при выделении для удаления
    'default': '#1677ff', // Синий по умолчанию (если класс не определён)
  };
// ===== END page 3 | output L162-209 =====
// ===== BEGIN page 4 | 4.jpg | output L210 =====
  // Возвращает цвет для класса разметки
  const getClassColor = (objClass) => {
    return CLASS_COLORS[objClass] || CLASS_COLORS.default;
  };

  // ПОЛУЧЕНИЕ ЦВЕТА СТАТУСА
  const getStatusColor = (status) => {
    switch (status) {
      case STATUS.PROCESSED:
        return 'green';
      case STATUS.NOT_ANNOTATED:
        return 'red';
      case STATUS.LOADING:
        return 'blue';
      case STATUS.ERROR:
        return 'volcano';
      case STATUS.PENDING_REVIEW:
        return "orange";
      default:
        return 'default';
    }
  };

  // ПОДГРУЗКА СТАТИСТИКИ В ИНФОРМАЦИОННОЕ ПОЛЕ
  const loadStatistics = async ({ totalProjects } = {}) => {
    const token = localStorage.getItem('authToken');
// ===== END page 4 | output L210-235 =====
// ===== BEGIN page 5 | 5.jpg | output L236 =====
    setStatsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/statistics/summary`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        mode: 'cors',
        cache: 'no-store',
      });

      // Логируем URL и текст ответа (даже если JSON невалиден)
      console.log("URL запроса:", response.url);
      const responseText = await response.text(); // Читаем текст до JSON
      console.log("Raw ответ сервера:", responseText);

      if (!response.ok) {
        // const errorText = await response.text().catch(() => "");
        // throw new Error(`1/ Ошибка загрузки статистики: ${response.status} ${errorText}`);
        console.error('Ошибка сервера:', response.status);
        throw new Error(responseText);
      }

      // const data = await response.json();
      // Теперь можно парсить JSON из уже сохраненного текста
      const data = JSON.parse(responseText);
      console.log("Парсинг JSON успешен:", data);

      setStats((prev) => ({
        ...prev,
        // Общее количество карточек лучше брать из /metadata,
        // потому что статистика может появиться только после тайлинга/детекции.
        totalProjects: Number.isFinite(Number(totalProjects))
          ? Number(totalProjects)
          : prev.totalProjects,
        // Эти поля приходят из backend /statistics/summary
        avgTileBuildMs: toNullableNumber(data.avg_tile_time),
        avgDetectMs: toNullableNumber(data.avg_detect_time),
      }));
    } catch (error) {
      console.error('2/ Ошибка загрузки статистики:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Этот style используется для всех bbox на карте
// ===== END page 5 | output L236-283 =====
// ===== BEGIN page 6 | 6.jpg | output L284 =====
  const getAnnotationFeatureStyle = (feature) => {
    const sourceType = feature.get('sourceType');
    const objClass = feature.get('detect_class');
    const isSelectedForDelete = !!feature.get('isSelectedForDelete');
    const baseColor = getClassColor(objClass);
    const strokeColor = isSelectedForDelete ? CLASS_COLORS.delete : baseColor;
    return new Style({
      stroke: new Stroke({
        color: isSelectedForDelete
          ? CLASS_COLORS.delete // Оранжевый при удалении
          : baseColor,
        width: isSelectedForDelete ? 3 : 2,
      }),
      fill: new Fill({
        color: isSelectedForDelete
          ? 'rgba(250, 84, 28, 0.08)'
          : 'rgba(0, 0, 0, 0.03)',
      }),
    });
  };

  // ВЫКЛЮЧАЕТ РЕЖИМЫ РАЗМЕТКИ
  const disableAllAnnotationInteractions = () => {
    // Полностью выключает все режимы ручной разметки:
    // - рисование новых прямоугольников
    // - удаление bbox по клику
    //
    // Это обязательно нужно делать перед переключением режима,
    // иначе draw/select будут "накладываться" друг на друга.
    const map = mapRef.current;
    if (!map) return;

    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    if (selectInteractionRef.current) {
      map.removeInteraction(selectInteractionRef.current);
      selectInteractionRef.current = null;
    }

    setAnnotationMode(null);
  };
// ===== END page 6 | output L284-327 =====
// ===== BEGIN page 7 | 7.jpg | output L328 =====
  // Удаляет слой аннотаций целиком.
  const clearAnnotationLayer = () => {
    // Вызывается:
    // - при смене картинки
    // - при пересоздании карты
    // - перед повторной инициализацией bbox
    const map = mapRef.current;

    // Сначала обязательно убираем интеракции
    disableAllAnnotationInteractions();

    if (annotationLayerRef.current && map) {
      map.removeLayer(annotationLayerRef.current);
    }

    annotationLayerRef.current = null;
    annotationSourceRef.current = null;
  };

  // Создаёт Feature из bbox_global с указанием класса
  const createFeatureFromBBox = (bbox, imageHeight, meta = {}) => {
    if (!Array.isArray(bbox) || bbox.length < 4) return null;
    const [rawX1, rawY1, rawX2, rawY2] = bbox;
    const minX = Math.min(rawX1, rawX2);
    const maxX = Math.max(rawX1, rawX2);
    const minY = Math.min(rawY1, rawY2);
    const maxY = Math.max(rawY1, rawY2);
    const invertedMinY = imageHeight - maxY;
    const invertedMaxY = imageHeight - minY;
    const coordinates = [[
      [minX, invertedMinY],
      [minX, invertedMaxY],
      [maxX, invertedMaxY],
      [maxX, invertedMinY],
      [minX, invertedMinY],
    ]];
// ===== END page 7 | output L328-363 =====
// ===== BEGIN page 8 | 8.jpg | output L364 =====
    const feature = new Feature({
      geometry: new Polygon(coordinates),
    });

    feature.set('id', meta.id || `bbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    feature.set('sourceType', meta.sourceType || 'predicted');
    feature.set('detect_class', meta.detect_class || 'Трек'); // Добавляем класс
    feature.set('isSelectedForDelete', false);

    return feature;
  };

  // Преобразует feature в формат detection с сохранением класса
  const featureToDetection = (feature, imageHeight) => {
    const geometry = feature?.getGeometry?.();
    const coordinates = geometry?.getCoordinates?.()?.[0];
    if (!coordinates || coordinates.length < 4) return null;

    const xs = coordinates.map((point) => point[0]);
    const ys = coordinates.map((point) => point[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const mapMinY = Math.min(...ys);
    const mapMaxY = Math.max(...ys);

    const minY = imageHeight - mapMaxY;
    const maxY = imageHeight - mapMinY;

    return {
      bbox_global: [
        Math.round(minX),
        Math.round(minY),
        Math.round(maxX),
        Math.round(maxY),
      ],
      detect_class: feature.get('detect_class'), // Сохраняем класс
    };
  };
// ===== END page 8 | output L364-401 =====
// ===== BEGIN page 9 | 9.jpg | output L402 =====
  // Собирает ВСЕ bbox с классами для сохранения
  const serializeAnnotationsFromLayer = (imageHeight) => {
    if (!annotationSourceRef.current) return [];
    return annotationSourceRef.current
      .getFeatures()
      .map((feature) => featureToDetection(feature, imageHeight))
      .filter(Boolean);
  };

  // Инициализирует единый слой аннотаций с поддержкой трёх классов
  const addDetectionsLayer = (detections, map, imageWidth, imageHeight) => {
    if (!map || !imageWidth || !imageHeight) return;
    clearAnnotationLayer();

    const vectorSource = new VectorSource();
    (detections || []).forEach((detection, index) => {
      const feature = createFeatureFromBBox(
        detection?.bbox_global || detection?.bbox_global,
        imageHeight,
        {
          id: detection?.id || `pred-${index}`,
          sourceType: detection?.source || 'predicted',
          detect_class: detection.class || detection.detect_class || 'Трек', // По умолчанию "трэк" для предразметки
        }
      );
      if (feature) {
        vectorSource.addFeature(feature);
      }
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => getAnnotationFeatureStyle(feature),
      zIndex: 1000,
    });
    vectorLayer.set('isDetectionLayer', true);
    map.addLayer(vectorLayer);

    annotationSourceRef.current = vectorSource;
    annotationLayerRef.current = vectorLayer;
  };
// ===== END page 9 | output L402-442 =====
// ===== BEGIN page 10 | 10.jpg | output L443 =====
  // Включает режим рисования с указанием класса
  const enableDrawMode = (classType) => {
    if (!mapRef.current || !selectedCard) return;

    if (!annotationSourceRef.current) {
      addDetectionsLayer(
        selectedCard.annotations || [], // Теперь detections включают detect_class
        mapRef.current,
        Number(selectedCard.width),
        Number(selectedCard.height)
      );
    }

    disableAllAnnotationInteractions();

    const draw = new Draw({
      source: annotationSourceRef.current,
      type: 'Circle',
      geometryFunction: createBox(),
    });

    draw.on('drawend', (event) => {
      event.feature.set('sourceType', 'manual');
      event.feature.set('id', `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      event.feature.set('isSelectedForDelete', false);
      event.feature.set('detect_class', classType); // Устанавливаем выбранный класс
      setIsAnnotationDirty(true);
    });

    mapRef.current.addInteraction(draw);
    drawInteractionRef.current = draw;
    setAnnotationMode('draw');
  };

  // ВКЛЮЧАЕТ РЕЖИМЫ УДАЛЕНИЯ BBOX (логика осталась прежней, но теперь учитывает класс)
  const enableDeleteMode = () => {
    if (!mapRef.current || !annotationLayerRef.current || !annotationSourceRef.current) return;

    disableAllAnnotationInteractions();

    const select = new Select({
      condition: click,
      layers: [annotationLayerRef.current],
// ===== END page 10 | output L443-485 =====
// ===== BEGIN page 11 | 11.jpg | output L486 =====
      style: null,
    });

    select.on('select', (event) => {
      // Снимаем выделение со всех кроме нового
      event.deselected.forEach((feature) => feature.set('isSelectedForDelete', false));
      // Помечаем новый выделенным
      event.selected.forEach((feature) => feature.set('isSelectedForDelete', true));

      const featureToRemove = event.selected?.[0];
      if (!featureToRemove) return;

      // Удаляем feature из слоя
      annotationSourceRef.current.removeFeature(featureToRemove);
      setIsAnnotationDirty(true);

      // Очищаем выбор
      select.getFeatures().clear();
    });

    mapRef.current.addInteraction(select);
    selectInteractionRef.current = select;
    setAnnotationMode('delete');
  };

  // Просто выйти из режима draw/delete и вернуться в обычный просмотр.
  const cancelAnnotationMode = () => {
    if (annotationSourceRef.current) {
      annotationSourceRef.current.getFeatures().forEach((feature) => {
        feature.set('isSelectedForDelete', false);
      });
    }

    disableAllAnnotationInteractions();
  };

  // Сохраняет ВСЮ текущую разметку текущего изображения
  const saveAnnotations = async () => {
    // ВАЖНО:
// ===== END page 11 | output L486-524 =====
// ===== BEGIN page 12 | 12.jpg | output L525 =====
    // здесь фронт не отправляет "дельту" (что добавили / что удалили),
    // а отправляет ПОЛНЫЙ итоговый список bbox.
    //
    // Это проще и надёжнее:
    // - фронт держит актуальное состояние в annotationSource
    // - backend просто перезаписывает JSON-файл разметки для конкретного uuid
    if (!selectedCard) return;

    try {
      setIsSavingAnnotations(true);

      const token = localStorage.getItem('authToken');
      // Собираем итоговый список bbox в формате backend:
      // [{ bbox_global: [int, int, int, int] }, ...]
      const detectionsToSave = serializeAnnotationsFromLayer(Number(selectedCard.height));
      console.log('SAVE PAYLOAD:', JSON.stringify(detectionsToSave, null, 2));

      const response = await fetch(`${API_BASE}/detections/${selectedCard.uuid}`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(detectionsToSave),
        mode: 'cors',
      });
      console.log("НОВАЯ РАЗМЕТКА СОХРАНЕНА = ", response);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Ошибка сохранения разметки: ${response.status} ${errorText}`);
      }

      // После успешного сохранения перечитываем backend,
      // чтобы UI показывал то, что реально сохранилось
      let freshDetections = detectionsToSave;
      try {
        const getResponse = await fetch(`${API_BASE}/detections/${selectedCard.uuid}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache' // явно запрещаем кэширование
          },
          mode: 'cors',
          cache: 'no-store' // для fetch API
        });
        if (getResponse.ok) {
          freshDetections = await getResponse.json();
        }
      } catch (readError) {
        console.warn('Не удалось перечитать detections после сохранения, используем локальные данные', readError);
      }

      setImageCards((prev) =>
        prev.map((card) =>
          card.uuid === selectedCard.uuid
            ? {
                ...card,
                detections: freshDetections,
                detectionsTotal: freshDetections.length,
// ===== END page 12 | output L525-586 =====
// ===== BEGIN page 13 | 13.jpg | output L587 =====
                status: freshDetections.length > 0 ? STATUS.PROCESSED : STATUS.NOT_ANNOTATED,
              }
            : card
        )
      );

      // После успешного сохранения обновляем карточку в React state,
      // чтобы sidebar и счётчик bbox показывали уже новые данные.
      setImageCards((prev) =>
        prev.map((card) =>
          card.uuid === selectedCard.uuid
            ? {
                ...card,
                detections: detectionsToSave,
                detectionsTotal: detectionsToSave.length,
                status: detectionsToSave.length > 0 ? STATUS.PROCESSED : STATUS.NOT_ANNOTATED,
              }
            : card
        )
      );

      setIsAnnotationDirty(false);
      disableAllAnnotationInteractions();
      message.success('Разметка сохранена');
    } catch (error) {
      console.error('Ошибка сохранения ручной разметки:', error);
      message.error(error.message || 'Не удалось сохранить разметку');
    } finally {
      setIsSavingAnnotations(false);
    }
  };

  // Опрос готовности предразметки
  const pollDetectStatusUntilReady = async (jobId, opts = {}) => {
    const token = localStorage.getItem('authToken');
    const {
      intervalMs = 1000, // 1 секунду по умолчанию
      timeoutMs = 100 * 60 * 1000, // Таймаут 100 минут
      abortFlag = { aborted: false },
      onProgress,
    } = opts;

    const startedAt = Date.now();

    // Вспомогательная функция для задержки
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// ===== END page 13 | output L587-632 =====
// ===== BEGIN page 14 | 14.jpg | output L633 =====
    const setProgress = (value) => {
      const progress = Number(value);
      // console.log("\n\n\n\n\n\n\n\n\n\n\n", progress);
      if (!Number.isFinite(progress)) return;
      onProgress?.(Math.min(100, Math.max(0, Math.round(progress))));
    };

    while (true) {
      // Проверка флага прерывания
      if (abortFlag?.aborted) {
        console.error("Опрос остановлен по флагу abortFlag");
        throw new Error("Опрос тайлов прерван");
      }

      // Проверка таймаута
      if (Date.now() - startedAt > timeoutMs) {
        console.error("Достигнут таймаут опроса (", timeoutMs / 1000, "сек)");
        throw new Error("Таймаут ожидания готовности тайлов");
      }

      try {
        // Запрашиваем статус у сервера
        const res = await fetch(`${API_BASE}/detections/tasks/${jobId}/result`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          mode: 'cors',
          cache: 'no-store' // благодаря этому получаем результат а не бесконечный круг
        });

        console.log(`Запрос к серверу: jobId=${jobId}, статус=${res.status}`);

        const data = await res.json();
        console.log("Данные ответа:", JSON.stringify(data, null, 2));

        setProgress(data.progress_percent);
        console.log("=======", data.status);

        switch (data.status) {
          case "processing":
            console.log("Задача выполняется...");
            break;
          case "completed":
            console.log("Предразметка готова");
            setProgress(100);
            return data;
          case "failed":
            console.error("Ошибка: задача не выполнена");
            break;
          default:
            console.warn("Неизвестный статус:", data.status);
        }

        // Ждём перед следующим запросом
        console.log("Предразметка не готова. Ожидание...");
        await sleep(intervalMs);
      } catch (error) {
        setIsTilesLoading(false);
        console.error("Критическая ошибка при опросе:", error);
        throw error;
      }
    }
  };
// ===== END page 14 | output L633-697 =====
// ===== BEGIN page 15 | 15.jpg | output L698 =====
  // ======================================================================================================================================== //
  // ===================================
  // ======================================================================================================================================== //
  // ДЕТЕКЦИЯ
  // ======================================================================================================================================== //
  // ======================

  const handleDetectClick = async (uuid) => {
    // Проверяем только загрузку конкретной карточки
    if (detectLoading[uuid]) return;

    try {
      const startedAt = Date.now();
      // Устанавливаем загрузку для конкретной карточки
      setDetectLoading((prev) => ({ ...prev, [uuid]: true }));
      setDetectProgress(prev => ({ ...prev, [uuid]: 0 }));
      setDetectError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/detections/${uuid}/detect`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache' // явно запрещаем кэширование
        },
        body: JSON.stringify({ confidence: 0.6 }),
        mode: 'cors',
        cache: 'no-store' // для fetch API
      });

      if (!response.ok) {
        throw new Error(`Ошибка отправки на предразметку: ${response.status}`);
      }

      const result = await response.json();
      console.log("=-=-=-=-=", result);

      const abortFlag = { aborted: false };
      const manifest = await pollDetectStatusUntilReady(result.task_id, {
        abortFlag,
        onProgress: progress => setDetectProgress(prev => ({ ...prev, [uuid]: progress })),
      });

      console.log("manifest = ", manifest);

      const elapsedDetectMs = Date.now() - startedAt;
      console.log("elapsedDetectMs = ", elapsedDetectMs);

      setImageCards((prev) =>
// ===== END page 15 | output L698-748 =====
// ===== BEGIN page 16 | 16.jpg | output L749 =====
        prev.map((c) =>
          c.uuid === uuid
            ? {
                ...c,
                status: STATUS.PROCESSED,
                detectionsTotal: manifest.result.detections_total,
                detectMs: elapsedDetectMs,
                detections: manifest.result.detections,
              }
            : c
        )
      );

      // После успешной детекции backend уже обновил detect_time,
      // поэтому заново забираем среднее время предразметки.
      await loadStatistics();
      await new Promise(resolve => setTimeout(resolve, 500));

      /***Важно! Не вызываем addDetectionsLayer здесь — он сработает в useEffect***/
      if (uuid === selectedUuid && mapRef.current) {
        // Загружаем detections отдельно, чтобы React успел обновить состояние
        const detectionData = await fetch(`${API_BASE}/detections/${uuid}`, {
          headers: { 'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache', cache: 'no-store'
          }
        }).then(res => res.json());

        setImageCards(prev =>
          prev.map(c =>
            c.uuid === uuid
              ? { ...c, detections: detectionData }
              : c
          )
        );
      }
    } catch (error) {
      console.error(" Ошибка предразметки:", error);
      setDetectError(error.message);
      setImageCards((prev) =>
        prev.map((c) =>
          c.uuid === uuid ? { ...c, status: 'Ошибка предразметки', detectionsTotal: 0 } : c
        )
      );
    } finally {
      // Сбрасываем загрузку только для этой карточки
      setDetectLoading((prev) => {
        const newLoading = { ...prev };
        delete newLoading[uuid];
        return newLoading;
      });
      setDetectProgress(prev => {
        const next = { ...prev };
        delete next[uuid];
        return next;
      });
    }
  };
// ===== END page 16 | output L749-805 =====
// ===== BEGIN page 17 | 17.jpg | output L806 =====
  // Функция для загрузки превью-тайла
  const fetchTilePreview = async (uuid) => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE}/tiles/${uuid}/preview`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tile preview for ${uuid}: ${response.status}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error fetching tile preview:", error.message);
      return null;
    }
  };

  // ФУНКЦИЯ ДЛЯ ВЫХОДА
  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      // Очищаем данные карты
      destroyMap();
      // Перенаправляем на страницу входа
      history.push('/login');
    } catch (err) {
      console.error('Ошибка при выходе:', err);
      message.error('Не удалось выйти из системы');
    }
  };
// ===== END page 17 | output L806-840 =====
// ===== BEGIN page 18 | 18.jpg | output L841 =====
  // ==================================================================================================== //
  // ЗАГРУЗКА И ОТОБРАЖЕНИЕ ВСЕХ КАРТОЧЕК (РАСПИСАТЬ)                                                   //
  // ==================================================================================================== //

  const load_all_cards = async () => {
    const token = localStorage.getItem('authToken');
    setIsLoading(true);

    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const metaResponse = await fetch(`${API_BASE}/metadata?limit=${itemsPerPage}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        mode: 'cors',
      });

      if (!metaResponse.ok) {
        throw new Error(`Ошибка метаданных: ${metaResponse.status}`);
      }

      const metaData = await metaResponse.json();
      const { items, total } = metaData;
      // console.log("metaData", metaData);
      // console.log("items", items);
      console.log("total items = ", total);

      // Функция для проверки наличия предразметки
      const fetchDetectionsForCard = async (uuid) => {
        try {
          const detectionRes = await fetch(`${API_BASE}/detections/${uuid}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' },
            mode: 'cors',
            cache: 'no-store' // для fetch API
          });

          if (detectionRes.ok) {
            const data = await detectionRes.json();
            return { exists: true, detections: data, detections_total: data.length };
          }

          // Если предразметки нет (404 или другая ошибка)
          if (detectionRes.status === 404) {
            return { exists: false, detections: [], detections_total: 0 };
          }

          throw new Error(`Ошибка предразметки: ${detectionRes.status}`);
        } catch (error) {
          console.error("Ошибка проверки предразметки:", error);
          return { exists: false, detections: [], detections_total: 0 };
        }
      };
// ===== END page 18 | output L841-896 =====
// ===== BEGIN page 19 | 19.jpg | output L897 =====
      // Загружаем данные для всех карточек
      const cardsWithPreviews = await Promise.all(
        items.map(async (item) => {
          let manifestData = null;
          let previewUrl = null;
          let { exists, detections, detections_total } = await fetchDetectionsForCard(item.uuid);

          // Проверяем манифест тайлов (если предразметка есть, но тайлы ещё не построены, статус всё равно "Размечено")
          try {
            const manifestResponse = await fetch(`${API_BASE}/tiles/${item.uuid}/manifest`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}` },
              mode: 'cors',
            });

            if (manifestResponse.ok) {
              manifestData = await manifestResponse.json();
              previewUrl = await fetchTilePreview(item.uuid);
            }
          } catch (error) {
            console.error("Manifest/preview error:", error.message);
          }

          const status = exists
            ? STATUS.PROCESSED
            : manifestData
              ? STATUS.NOT_ANNOTATED
              : STATUS.LOADING;

          const sizeInMB = item.size_bytes
            ? (item.size_bytes / (1024 * 1024)).toFixed(2)
            : '-';

          item.tile_build_ms = 2
          item.detect_ms = 3

          return {
            uuid: item.uuid,
            name: item.name,
            date: item.last_updated
              ? new Date(item.last_updated).toLocaleDateString()
              : 'Не указано',
            format: item.format,
            size: `${sizeInMB} MB`,
            width: item.width,
            height: item.height,
            dimensions: `${item.height} x ${item.width} px`,
            status,
            quality: '-',
            tileJobId: null,
            tileManifest: manifestData,
            previewUrl: previewUrl,
            detectionsTotal: detections_total,
            detections: detections,

            // Эти два поля должны приходить из backend в /metadata
            tileBuildMs: item.tile_build_ms ?? null,
            detectMs: item.detect_ms ?? null,
          };
        })
      );
// ===== END page 19 | output L897-957 =====
// ===== BEGIN page 20 | 20.jpg | output L958 =====
      // setImageCards(cardsWithPreviews);
      // setTotalCards(total);
      // setSelectedUuid(cardsWithPreviews.length > 0 ? cardsWithPreviews[0].uuid : null);
      setImageCards(cardsWithPreviews);
      setTotalCards(total);
      setStats((prev) => ({
        ...prev,
        totalProjects: total,
      }));
      setSelectedUuid(cardsWithPreviews.length > 0 ? cardsWithPreviews[0].uuid : null);

      // Подгружаем средние времена с backend
      await loadStatistics({ totalProjects: total });
    } catch (error) {
      console.error("Ошибка загрузки карточек:", error);
      message.error("Не удалось загрузить карточки");
    } finally {
      setIsLoading(false);
    }
  };

  // обработчик смены страницы
  const handlePageChange = (page) => {
    setCurrentPage(page); // Обновляем текущую страницу
    setSelectedUuid(null); // Сбрасываем выбранную карточку (опционально)
  };

  const cleanupTileSourceListeners = () => {
    if (typeof tileSourceCleanupRef.current === 'function') {
      tileSourceCleanupRef.current();
      tileSourceCleanupRef.current = null;
    }
    pendingTileLoadsRef.current = 0;
  };
// ===== END page 20 | output L958-991 =====
// ===== BEGIN page 21 | 21.jpg | output L992 =====
  // ==================================================================================================== //
  // УНИЧТОЖЕНИЕ КАРТЫ
  // ==================================================================================================== //

  const destroyMap = () => {
    // Сначала снимаем listeners тайлов,
    // чтобы после пересоздания карты не было старых обработчиков.
    cleanupTileSourceListeners();

    // ВАЖНО:
    // сначала снимаем слой, и только потом обнуляем mapRef.current
    if (mapRef.current && defaultImageLayer) {
      mapRef.current.removeLayer(defaultImageLayer);
      setDefaultImageLayer(null);
    }

    if (mapRef.current) {
      mapRef.current.setTarget(null);
      mapRef.current = null;
    }
  };

  // ==================================================================================================== //
  // УСТАНОВКА СТАТИЧЕСКОГО ИЗОБРАЖЕНИЯ (TO-DO)
  // ==================================================================================================== //

  const setPreviewImageLayer = (imageUrl, width, height) => {
    destroyMap();

    const extent = [0, 0, width, height];
    const projection = new Projection({
      code: 'IMAGE_PIXELS',
      units: 'pixels',
      extent,
    });

    const map = new Map({
      target: mapContainerRef.current,
      layers: [],
      view: new View({
        center: [width / 2, height / 2],
        zoom: 0,
// ===== END page 21 | output L992-1033 =====
// ===== BEGIN page 22 | 22.jpg | output L1034 =====
        minZoom: 0,
        maxZoom: 24,
        projection,
      }),
    });

    map.addControl(new ScaleLine());
    map.addControl(new FullScreen());
    map.addControl(new Zoom());

    map.addLayer(new ImageLayer({
      source: new ImageStatic({
        url: imageUrl,
        projection,
        imageExtent: extent,
      }),
    }));

    mapRef.current = map;
    viewFit(map, extent);
  };

  // ==================================================================================================== //
  // УСТАНОВКА ТАЙЛОВОГО СЛОЯ С ДЕФОЛТНЫМ ИЗОБРАЖЕНИЕМ (TO-DO)
  // ==================================================================================================== //

  const setTilesLayer = (tilesUuid, levels, tileSize = 256) => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Сначала полностью чистим старую карту и старые listeners
    destroyMap();

    // // Показываем спиннер, пока реально грузятся тайлы
    // setIsTilesLoading(true);

    const { width, height } = getDimsFromLevels(levels);
    const extent = [0, 0, width, height];
    const maxZoom = getMaxZoomFromLevels(levels);

    const projection = new Projection({
      code: 'TILES_PIXELS',
      units: 'pixels',
      extent,
    });

    const resolutions = Array.from(
      { length: maxZoom + 1 },
      (_, z) => Math.pow(2, maxZoom - z)
    );

    const tileGrid = new TileGrid({
      extent,
// ===== END page 22 | output L1034-1086 =====
// ===== BEGIN page 23 | 23.jpg | output L1087 =====
      tileSize,
      minZoom: 0,
      maxZoom,
      resolutions,
    });

    const map = new Map({
      target: container,

      // Эти 2 флага сильно уменьшают появление "пустых" областей
      // во время движения карты и во время zoom.
      loadTilesWhileAnimating: true,
      loadTilesWhileInteracting: true,

      view: new View({
        center: [width / 2, height / 2],
        zoom: 0,
        minZoom: 0,
        maxZoom,
        projection,
      }),
      layers: [],
    });

    mapRef.current = map;
    viewFit(map, extent);

    const tileSource = new TileImage({
      projection,
      tileGrid,
      wrapX: false,
      crossOrigin: 'anonymous',

      tileUrlFunction: (tileCoord) => {
        if (!tileCoord) return undefined;
        const [z, x, y] = tileCoord;
        return `${API_BASE}/tiles/${tilesUuid}/${z}/${y}/${x}`;
      },

      // ГЛАВНОЕ ИСПРАВЛЕНИЕ:
      // tile.setImage(image) вызываем только после image.onload,
      // чтобы OpenLayers не пытался отрисовать ещё не готовую картинку.
      tileLoadFunction: (tile, src) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
          tile.setState(3);
          return;
        }

        fetch(src, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const image = new Image();
          const objectUrl = URL.createObjectURL(blob);

          image.onload = () => {
            tile.setImage(image);
// ===== END page 23 | output L1087-1149 =====
// ===== BEGIN page 24 | 24.jpg | output L1150 =====
            URL.revokeObjectURL(objectUrl);
          };

          image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            tile.setState(3);
          };

          image.src = objectUrl;
        })
        .catch((err) => {
          console.error("Ошибка загрузки тайла:", err);
          tile.setState(3);
        });
      },
    });

    const tilesLayer = new TileLayer({
      source: tileSource,

      // preload ставится на слой, а не на source.
      // Так карта заранее подтягивает соседние тайлы/уровни.
      preload: 2,

      // слой показываем сразу без подложки
      visible: true,
    });

    map.addControl(new ScaleLine());
    map.addControl(new FullScreen());
    map.addControl(new Zoom());

    map.addLayer(tilesLayer);
  };

  // ==================================================================================================== //
  // ЗАГРУЖАЕТ ФАЙЛ НА СЕРВЕР
  // ==================================================================================================== //

  const uploadToServer = async (file) => {
    console.log("uploadToServer");
    const token = localStorage.getItem('authToken');
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_BASE}/ingest/images/ingest?storage=s3&on_conflict=error`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
// ===== END page 24 | output L1150-1201 =====
// ===== BEGIN page 25 | 25.jpg | output L1202 =====
        body: formData,
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`HTTP ошибка ${response.status}: ${errorText}`);
      }

      const result = await response.json(); // Получаем ответ сервера
      const sizeInMB = result.size_bytes ? (result.size_bytes / (1024 * 1024)).toFixed(2) : '-';

      // Формируем данные карточки
      const newCard = {
        uuid: result.uuid,
        name: result.name,
        date: result.last_updated ? new Date(result.last_updated).toLocaleDateString() : 'Не указано',
        format: result.format,
        size: `${sizeInMB} MB`,
        width: result.width,
        height: result.height,
        dimensions: `${result.height} x ${result.width} px`,
        status: 'Загружено (без тайлов)',
        quality: '-',
        isTilesLoading: true,
        isLoading: true,
        tileJobId: null,
        tileManifest: null,
        detectionsTotal: 0
      };

      // Обновляем список карточек
      // setImageCards((prev) => [newCard, ...prev]);
      // setSelectedUuid(result.uuid); // Выбираем новую карточку
      // message.success('Файл успешно загружен');

      setImageCards((prev) => [newCard, ...prev]);

      setTotalCards((prev) => prev + 1);

      setStats((prev) => ({
        ...prev,
        totalProjects: prev.totalProjects + 1,
      }));

      setSelectedUuid(result.uuid);
      message.success('Файл успешно загружен');

      setIsModalVisible(false);
      setLoading(false);

      const uuid = result.uuid;
      const tileBuildStartedAt = Date.now();

      // Обновляем статус карточки
      setImageCards((prev) =>
        prev.map((c) => (c.uuid === uuid ? { ...c, status: 'Подготовка' } : c))
      );

      // Запускаем построение тайлов
      const jobId = await startTileBuild(uuid);
      // setIsTilesLoading(true);
// ===== END page 25 | output L1202-1263 =====
// ===== BEGIN page 26 | 26.jpg | output L1264 =====
      setImageCards((prev) => prev.map((c) => (c.uuid === uuid ? { ...c, tileJobId: jobId } : c)));

      const abortFlag = { aborted: false };
      // pollAbortRef.current.set(uuid, abortFlag);

      // Ожидаем готовности
      const manifest = await pollTileStatusUntilReady(jobId, { abortFlag });
      console.log("manifest = ", manifest);
      // После успешного разбиения backend уже обновил статистику,
      // поэтому заново забираем среднее время тайлинга.
      await loadStatistics();

      const elapsedTileBuildMs = Date.now() - tileBuildStartedAt;

      setImageCards((prev) =>
        prev.map((c) =>
          c.uuid === uuid
            ? {
                ...c,
                status: 'Не размечено',
                tileManifest: manifest,
                previewUrl: manifest.previewUrl,
                isLoading: false,
                tileBuildMs: elapsedTileBuildMs,
              }
            : c
        )
      );

      setTilesLayer(manifest.uuid, manifest.levels, 256);

      setIsTilesLoading(false);
      setCurrentPage(1); // Возвращаемся на первую страницу, чтобы новая карточка была видна
      setSelectedUuid(result.uuid); // Выбираем новое изображение
    } catch (e) {
      console.error(e);
      message.error(`Не удалось загрузить файл: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================================================================== //
  // ЗАПУСКАЕТ ПОСТРОЕНИЕ ТАЙЛОВ
  // ==================================================================================================== //

  const startTileBuild = async (uuid) => {
    setIsTilesLoading(true); // Включаем спиннер перед началом построения
    const token = localStorage.getItem('authToken');
    const url = `${API_BASE}/tiles/${uuid}/build?tile_size=256&fmt=webp&lossless=false`;
    const response = await fetch(url, {
      method: 'POST',
// ===== END page 26 | output L1264-1315 =====
// ===== BEGIN page 27 | 27.jpg | output L1316 =====
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`
      },
      mode: 'cors',
    });

    if (!response.ok) {
      const t = await response.text().catch(() => "");
      throw new Error(`Ошибка запуска build: ${response.status} ${t}`);
    }

    const ct = response.headers.get('content-type') || "";
    if (ct.includes('application/json')) {
      const data = await response.json(); // Получаем данные о задаче
      const job = data?.job_id || data?.task_id || data?.uuid || (typeof data === 'string' ? data : null);
      if (!job) throw new Error('Не удалось извлечь job id из ответа build');
      return job;
    }

    const text = (await response.text()).trim();
    if (!text) throw new Error('Пустой ответ build');
    return text;
  };

  // ==================================================================================================== //
  // ОПРОС ГОТОВНОСТИ ТАЙЛОВ
  // ==================================================================================================== //

  const pollTileStatusUntilReady = async (jobId, opts = {}) => {
    const token = localStorage.getItem('authToken');
    const {
      intervalMs = 1000, // Изменено на 1 секунду по умолчанию
      timeoutMs = 10 * 60 * 1000, // Таймаут 10 минут
      abortFlag = { aborted: false }
    } = opts;

    const startedAt = Date.now();

    // Вспомогательная функция для задержки
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (true) {
      // Проверка флага прерывания
      if (abortFlag?.aborted) {
        console.error("Опрос остановлен по флагу abortFlag");
        throw new Error('Опрос тайлов прерван');
      }

      // Проверка таймаута
      if (Date.now() - startedAt > timeoutMs) {
        console.error("Достигнут таймаут опроса (", timeoutMs / 1000, "сек)");
        throw new Error('Таймаут ожидания готовности тайлов');
      }
// ===== END page 27 | output L1316-1369 =====
// ===== BEGIN page 28 | 28.jpg | output L1370 =====
      try {
        // Запрашиваем статус у сервера
        const res = await fetch(`${API_BASE}/tiles/${jobId}/result`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`
          },
          mode: 'cors'
        });

        console.log(`Запрос к серверу: jobId=${jobId}, статус=${res.status}`);

        const data = await res.json();
        console.log("Данные ответа:", JSON.stringify(data, null, 2));

        // Проверяем, готовы ли тайлы
        if (data?.levels && data?.uuid) {
          console.log("Тайлы готовы! Уникальный идентификатор:", data.uuid);
          console.log("Доступные уровни:", data.levels);
          let previewUrl = await fetchTilePreview(data.uuid);
          setIsTilesLoading(false);

          // Возвращаем данные с превью
          return {
            ...data,
            previewUrl: previewUrl
          };
        }

        // Ждём перед следующим запросом
        console.log("Тайлы не готовы. Ожидание...");
        await sleep(intervalMs);
      } catch (error) {
        setIsTilesLoading(false);
        console.error("Критическая ошибка при опросе:", error);
        throw error;
      }
    }
  };

  // ==================================================================================================== //
  // НАЖАТИЕ НА КАРТОЧКУ
  // ==================================================================================================== //

  const handleCardClick = async (uuid) => {
    setSelectedUuid(uuid);
    setIsTilesLoading(true);

    const card = imageCards.find(c => c.uuid === uuid);
    const { width, height } = card; // Берём размеры из текущей карточки
// ===== END page 28 | output L1370-1420 =====
// ===== BEGIN page 29 | 29.jpg | output L1421 =====
    try {
      const detectionRes = await fetch(`${API_BASE}/detections/${uuid}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Cache-Control': 'no-cache' // явно запрещаем кэширование
        },
        mode: 'cors',
        cache: 'no-store' // для fetch API
      });
      console.log("detectionRes = ", detectionRes);

      let detections = [];

      if (detectionRes.ok) {
        detections = await detectionRes.json();

        // Сохраняем bbox в карточку.
        // Это важно, потому что именно из imageCards/useEffect мы потом
        // будем инициализировать редактируемый слой annotationLayer.
        setImageCards((prev) =>
          prev.map((c) =>
            c.uuid === uuid
              ? {
                  ...c,
                  detections,
                  detectionsTotal: detections.length,
                  status: detections.length > 0 ? STATUS.PROCESSED : c.status,
                }
              : c
          )
        );
      } else if (detectionRes.status === 404) {
        // 404 трактуем как "разметки пока нет" — это не ошибка.
        setImageCards((prev) =>
          prev.map((c) =>
            c.uuid === uuid
              ? {
                  ...c,
                  detections: [],
                  detectionsTotal: 0,
                }
              : c
          )
        );
      }

      if (card?.tileManifest?.uuid && card?.tileManifest?.levels) {
        destroyMap();
        setTilesLayer(card.tileManifest.uuid, card.tileManifest.levels);
      } else if (card?.imageUrl) {
        setPreviewImageLayer(card.imageUrl, width, height);
      } else {
        console.warn("Нет данных для отрисовки:", uuid);
        message.warning("Не удалось загрузить изображение или тайлы");
      }
    } catch (error) {
      console.error("Ошибка загрузки предразметки:", error);
      message.error("Ошибка предразметки: " + error.message);
      // В случае ошибки сбрасываем количество объектов
// ===== END page 29 | output L1421-1481 =====
// ===== BEGIN page 30 | 30.jpg | output L1482 =====
      setImageCards((prev) =>
        prev.map((c) => c.uuid === uuid ? { ...c, detectionsTotal: 0, detections: [] } : c)
      );
    } finally {
      setIsTilesLoading(false);
    }
  };

  // ==================================================================================================== //
  // УДАЛЕНИЕ КАРТОЧКИ
  // ==================================================================================================== //

  const deleteImage = async (uuid) => {
    setDeleting(uuid);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE}/ingest/${uuid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Не удалось удалить изображение: ${response.statusText}`);
      }

      // Удаляем карточку из состояния
      setImageCards(prevCards => {
        const newCards = prevCards.filter(card => card.uuid !== uuid);
        // Если удалили выбранную карточку - сбрасываем выбор
        if (selectedUuid === uuid) setSelectedUuid(newCards.length > 0 ? newCards[0].uuid : null);
        return newCards;
      });

      setTotalCards((prev) => Math.max(prev - 1, 0));

      setStats((prev) => ({
        ...prev,
        totalProjects: Math.max((prev.totalProjects || 0) - 1, 0),
      }));

      await loadStatistics();

      // Если удалили последнюю карточку на странице - сбрасываем пагинацию
      setCurrentPage(prev => Math.min(prev, Math.ceil((imageCards.length - 1) / itemsPerPage) || 1));

      message.success('Изображение успешно удалено');
    } catch (error) {
      message.error(error.message);
      console.error("Ошибка удаления:", error);
    } finally {
      setDeleting(null);
    }
  };
// ===== END page 30 | output L1482-1535 =====
// ===== BEGIN page 31 | 31.jpg | output L1536 =====
  // Функция подгонки вида под область
  const viewFit = (map, extent) => {
    const view = map.getView();
    view.fit(extent, {
      size: map.getSize(),
      padding: [20, 20, 20, 20],
      nearest: true,
    });
  };

  // ==================================================================================================== //
  // ЭФФЕКТЫ
  // ==================================================================================================== //

  useEffect(() => {
    if (!selectedCard) return; // Если нет выбранной карточки — ничего не делаем
    if (!mapRef.current) return; // Карта ещё не создана

    // Здесь мы каждый раз инициализируем ЕДИНЫЙ редактируемый слой аннотаций.
    // Даже если detections пустой массив — слой всё равно создаём,
    // чтобы пользователь мог рисовать bbox вручную.
    addDetectionsLayer(
      selectedCard.detections || [],
      mapRef.current,
      Number(selectedCard.width),
      Number(selectedCard.height)
    );
  }, [imageCards, selectedUuid]); // Срабатывает при изменении карточек или выбора

  // useEffect для обновления карты при выборе карточки
  useEffect(() => {
    // При переключении изображения всегда выходим из draw/delete режима.
    // Иначе пользователь может перейти на новую карточку, а старая интеракция останется активной.
    disableAllAnnotationInteractions();
    setIsAnnotationDirty(false);
// ===== END page 31 | output L1536-1570 =====
// ===== BEGIN page 32 | 32.jpg | output L1571 =====
    if (!selectedCard) return destroyMap();

    if (selectedCard.tileManifest?.uuid && selectedCard.tileManifest?.levels) {
      setTilesLayer(selectedCard.tileManifest.uuid, selectedCard.tileManifest.levels);
    } else if (selectedCard.imageUrl) {
      const w = Number(selectedCard.width);
      const h = Number(selectedCard.height);
      setPreviewImageLayer(selectedCard.imageUrl, w, h);
    }
  }, [selectedUuid]);

  // Полная очистка при размонтировании компонента. Нужна, чтобы не оставлять висячие интеракции и слои.
  useEffect(() => {
    return () => {
      clearAnnotationLayer();
    };
  }, []);

  // Оптимизация пагинации при удалении: После удаления, если текущая страница пустая, переключаемся на предыдущую
  useEffect(() => {
    const totalPages = Math.ceil(totalCards / itemsPerPage);
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [totalCards, itemsPerPage, currentPage]);

  // загрузка только при монтировании (useEffect с пустым массивом зависимостей)**
  useEffect(() => {
    load_all_cards();
  }, []); // Пустой массив — вызов только один раз при загрузке страницы

  // //
  useEffect(() => {
    load_all_cards();
  }, [currentPage]); // Загружаем карточки при изменении страницы

  // useEffect(() => {
  //   load_all_cards();
  // }, [currentPage, itemsPerPage]);

  //
  useEffect(() => {
    // Загружаем данные из localStorage при монтировании
    const savedCards = localStorage.getItem('imageCards');
    const savedPage = localStorage.getItem('currentPage');

    if (savedCards) setImageCards(JSON.parse(savedCards));
    if (savedPage) setCurrentPage(Number(savedPage));

    // Подписываемся на событие изменения страницы (если нужно)
    const handleBeforeUnload = () => {
      localStorage.setItem('imageCards', JSON.stringify(imageCards));
      localStorage.setItem('currentPage', currentPage.toString());
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
// ===== END page 32 | output L1571-1627 =====
// ===== BEGIN page 33 | 33.jpg | output L1628 =====
  // ==================================================================================================== //
  // Drag & Drop
  // ==================================================================================================== //

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadToServer(file);
    }
  };

  // Функция для опроса статуса задачи апрува
  const pollExportTask = async (taskId, uuid) => {
    const token = localStorage.getItem('authToken');
    const abortFlag = { aborted: false };
    const intervalMs = 1000; // Интервал опроса (1 секунда)
    const timeoutMs = 10 * 60 * 1000; // Таймаут (10 минут)
    const startedAt = Date.now();

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (true) {
      if (abortFlag.aborted) {
        throw new Error('Опрос задачи отправки разметки на проверку прерван');
      }

      if (Date.now() - startedAt > timeoutMs) {
        throw new Error('Таймаут ожидания завершения задачи отправки разметки на проверку');
      }

      try {
        const res = await fetch(`${API_BASE}/detections/export/tasks/${taskId}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          mode: 'cors',
        });

        const data = await res.json();
        console.log("\n ", data);

        // Обновляем прогресс для отображения
        setApproveProgress(prev => ({
          ...prev,
          [uuid]: data.progress * 100, // Предполагаем, что progress в долях от 1
        }));

        if (data.status === 'failed') {
          throw new Error(data.error || 'Неизвестная ошибка');
        }

        if (data.status === 'completed') {
          return data.result; // Получаем результат задачи
        }
// ===== END page 33 | output L1628-1684 =====
// ===== BEGIN page 34 | 34.jpg | output L1685 =====
        await sleep(intervalMs);
      } catch (error) {
        throw error;
      }
    }
  };

  /// Функция обработки апрува разметки
  // const handleApproveAnnotations2 = async (uuid) => {
  //
  //   const token = localStorage.getItem('authToken');
  //   const response = await fetch(`${API_BASE}/detections/9876test/${uuid}`, {
  //     method: 'POST',
  //     headers: {
  //       accept: 'application/json',
  //       Authorization: `Bearer ${token}`,
  //     },
  //     mode: 'cors',
  //   });
  //
  //
  //   if (!response.ok) {
  //     throw new Error(`Ошибка запуска задачи отправки на проверку разметки: ${response.status}`);
  //   }
  //
  //   const data = await response.json();
  //   console.log("\n - ", data);
  //   message.success(data.message);
  // };
  const handleApproveAnnotations2 = async (uuid) => {
    const card = imageCards.find((c) => c.uuid === uuid);
    const token = localStorage.getItem('authToken');

    // Дополнительная защита (на случай, если что-то пошло не так)
    if (!card || card.status !== STATUS.PROCESSED) {
      console.warn("Попытка апрува для неподходящего статуса");
      message.warning("Разметка должна быть обработана перед отправкой");
      return;
    }

    // Начинаем загрузку для этого uuid
    setIsApproving(prev => ({ ...prev, [uuid]: true }));

    try {
      const response = await fetch(`${API_BASE}/detections/9876test/${uuid}`, {
        method: 'POST', headers: { accept: 'application/json', Authorization: `Bearer ${token}` }, mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Ошибка запуска задачи отправки на проверку разметки: ${response.status}`);
      }

      const data = await response.json();
      console.log("\n - ", data);
      message.success(data.message);
      // **Обновляем статус карточки на "На проверке"**
      setImageCards((prev) =>
        prev.map((c) =>
          c.uuid === uuid
            ? {
// ===== END page 34 | output L1685-1744 =====
// ===== BEGIN page 35 | 35.jpg | output L1745 =====
              ...c,
              status: STATUS.PENDING_REVIEW,
              detections: [],
              detectionsTotal: 0,
            }
          : c
        )
      );

      // Обновляем статистику после успешного апрува
      await loadStatistics();
    } catch (error) {
      console.error("Ошибка апрува разметки:", error);
      message.error(error.message || "Не удалось отправить разметку на проверку");
    } finally {
      // Разблокируем кнопку
      setIsApproving((prev) => {
        const newApproving = { ...prev };
        delete newApproving[uuid];
        return newApproving;
      });

      // **Фиксация статуса "На проверке" (если нужно)**
      // Если backend не обновляет статус автоматически, можно здесь установить:
      setImageCards((prev) =>
        prev.map((c) =>
          c.uuid === uuid
            ? {
                ...c,
                status: STATUS.PENDING_REVIEW,
              }
            : c
        )
      );
    }
  };

  // Функция обработки апрува разметки
  const handleApproveAnnotations = async (uuid) => {
    if (isApproving[uuid]) return;
    console.log("123");

    try {
      setIsApproving(prev => ({ ...prev, [uuid]: true }));
      setApproveProgress(prev => ({ ...prev, [uuid]: 0 }));
      setApproveTaskId(uuid);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/detections/${uuid}/export`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        mode: 'cors',
      });

      if (!response.ok) {
// ===== END page 35 | output L1745-1802 =====
// ===== BEGIN page 36 | 36.jpg | output L1803 =====
        throw new Error(`Ошибка запуска задачи отправки на проверку разметки: ${response.status}`);
      }

      const data = await response.json();
      console.log("\n - ", data);
      const taskId = data.task_id;

      // Опрашиваем статус задачи
      const result = await pollExportTask(taskId, uuid);
      console.log("\n === ", result);

      // Обновляем карточку
      setImageCards(prev =>
        prev.map(card =>
          card.uuid === uuid
            ? {
                ...card,
                status: 'Разметка отправлена', // Новый статус после успешного апрува
                isApproved: true, // Флаг успешной апрувки
                approveProgress: 100,
              }
            : card
        )
      );

      // Обновляем статистику
      await loadStatistics();
      message.success('Разметка успешно отправлена на проверку разметчику');
    } catch (error) {
      console.error("Ошибка отправки задачи проверки разметки:", error);
      setImageCards(prev =>
        prev.map(card =>
          card.uuid === uuid
            ? {
                ...card,
                approveStatus: 'failed',
                approveError: error.message,
              }
            : card
        )
      );
      message.error(error.message || 'Не удалось отправить на проверку разметку');
    } finally {
      setIsApproving(prev => {
        const newIsApproving = { ...prev };
        delete newIsApproving[uuid];
        return newIsApproving;
      });
      setApproveTaskId(null);
    }
  };

  return (<ConfigProvider locale={ru}>
    <Layout style={{ height: '100vh' }}>
      <Header className="header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
// ===== END page 36 | output L1803-1860 =====
// ===== BEGIN page 37 | 37.jpg | output L1861 =====
        padding: '0 24px',
        backgroundColor: '#fff', // Если нужен светлый фон
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }} >
        <div className="title-container">Tracks</div>
        {/* Кнопка выхода в правом углу */}
        <Button
          type="primary"
          icon={<PoweroffOutlined />}
          onClick={handleLogout}
          style={{
            backgroundColor: '#1890ff',
            borderColor: '#1890ff',
            fontSize: '14px',
          }}
        >
          Выйти
        </Button>
      </Header>
      <Layout>
        <Sider width={470} style={{ background: '#fff', overflow: 'auto' }}>
          <div
            style={{
              margin: '12px 12px 8px',
              padding: '10px 10px',
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 0 }}>
              Сводка
            </div>
            <div style={{ display: 'grid', rowGap: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#595959' }}>Всего проектов</span>
                <span style={{ fontWeight: 600 }}>
                  {statsLoading ? <Spin size="small" /> : stats.totalProjects}
                </span>
              </div>
            </div>

            {/* <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}> */}
            {/*   <span style={{ color: '#595959' }}>Среднее время разбиения на тайлы</span> */}
            {/*   <span style={{ fontWeight: 600 }}> */}
            {/*     {statsLoading ? <Spin size="small" /> : formatDuration(stats.avgTileBuildMs)} */}
            {/*   </span> */}
            {/* </div> */}

            {/* <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}> */}
            {/*   <span style={{ color: '#595959' }}>Среднее время предразметки</span> */}
            {/*   <span style={{ fontWeight: 600 }}> */}
            {/*     {statsLoading ? <Spin size="small" /> : formatDuration(stats.avgDetectMs)} */}
            {/*   </span> */}
            {/* </div> */}
          </div>
// ===== END page 37 | output L1861-1916 =====
// ===== BEGIN page 38 | 38.jpg | output L1917 =====
          {/* </span> */}
          {/* </div> */}

      <Button
        type="primary"
        onClick={showModal}
        style={{
          height: '24px',
          marginLeft: 140,
          padding: '0px 10px', // изменить внутренние отступы
          fontSize: '12px', // размер текста
          borderRadius: '2px', // скругление
          background: 'rgba(241,230,11,0.24)', // цвет фона
          color: '#2f4861'
        }}
      >
        + Загрузить изображение
      </Button>

      {imageCards.length > 0 ? (
        imageCards.map((card) => {
          const hasTiles = !!card.tileManifest;
          return (
            <Card
              key={card.uuid}
              title={
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {card.name}
                  </span>

                  <Button
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      Modal.confirm({
                        title: `Удалить "${card.name}"?`,
                        content: 'Это действие нельзя отменить',
                        onOk: () => deleteImage(card.uuid),
                        okText: 'Удалить',
                        cancelText: 'Отмена',
                        okButtonProps: {
                          danger: true,
                          loading: deleting === card.uuid,
                          disabled: deleting === card.uuid,
                        }
                      });
                    }}
                    disabled={deleting === card.uuid}
                    loading={deleting === card.uuid}
                    danger
                    style={{
                      height: '24px',
                      marginLeft: 40, // Отступ слева от кнопки
                      padding: '0px 10px',
// ===== END page 38 | output L1917-1976 =====
// ===== BEGIN page 39 | 39.jpg | output L1977 =====
                      fontSize: '12px',
                      borderRadius: '2px',
                      background: 'transparent',
                      border: 'none',
                      zIndex: 10,
                    }}
                  />
                </div>
              }
              // =============================
              // СТИЛИ САМОЙ CARD
              // =============================
              bodyStyle={{ padding: 10 }}
              style={{
                marginTop: '8px',
                margin: '16px',
                cursor: 'pointer',
                border: card.uuid === selectedUuid ? '2px solid #1677ff' : undefined,
                minHeight: '220px',
                position: 'relative',
                width: 'calc(100% - 22px)',
              }}
              onClick={() => handleCardClick(card.uuid)}
            >
              {/* ВНУТРЕННЯЯ РАЗМЕТКА КАРТОЧКИ -> FLEX ROW */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  gap: 16,
                }}>
                {/* ЛЕВАЯ КОЛОНКА: ПОЛЯ */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ marginBottom: 3 }}>Дата: {card.date}</p>
                  <p style={{ marginBottom: 3 }}>Формат: {card.format}</p>
                  <p style={{ marginBottom: 3 }}>Размер: {card.size}</p>
                  <p style={{ marginBottom: 3 }}>Размеры: {card.dimensions}</p>
                  <p style={{ marginBottom: 3 }}>Статус:
                    <Tag
                      color={getStatusColor(card.status)}
                      style={{
                        marginLeft: 8,
                        fontSize: '12px',
                        padding: '0 8px',
                        height: '24px',
                        lineHeight: '24px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                      }}
                    >
                      {card.status}
                    </Tag>
                  </p>
                  <p style={{ marginBottom: 3 }}>
                    Найдено объектов: {card.detectionsTotal ?? 0}
                  </p>
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleDetectClick(card.uuid); }}
                    loading={detectLoading[card.uuid]}
                    disabled={detectLoading[card.uuid]}
                    type="primary"
                    // icon={<UploadOutlined />}
// ===== END page 39 | output L1977-2039 =====
// ===== BEGIN page 40 | 40.jpg | output L2040 =====
                    style={{
                      height: '24px',
                      marginTop: '12px', // например, только сверху и снизу
                      marginLeft: 40,
                      padding: '0px 10px', // изменить внутренние отступы
                      fontSize: '12px', // размер текста
                      borderRadius: '2px', // скругление
                      background: 'rgba(241,230,11,0.24)', // цвет фона
                      color: '#2f4861'
                    }}
                  >
                    Обработать
                  </Button>

                  <Button
                    onClick={(e) => { e.stopPropagation(); handleApproveAnnotations2(card.uuid); }}
                    loading={isApproving[card?.uuid]} // Только для текущей карточки
                    // disabled={isApproving[card?.uuid]} // Зависит от того же состояния
                    disabled={ // Блокируем если:
                      !selectedCard || // Нет выбранной карточки
                      selectedCard.status !== STATUS.PROCESSED || // Статус не "Обработано"
                      isApproving[selectedCard.uuid] // Уже выполняется задача для этой карточки
                    }
                    type="primary"
                    title={ // Tooltip для пояснения
                      !selectedCard
                        ? "Выберите изображение"
                        : selectedCard.status !== STATUS.PROCESSED
                          ? "Сначала завершите разметку (статус должен быть 'Обработано')"
                          : isApproving[selectedCard.uuid]
                            ? "Отправка в процессе..."
                            : "Отправить текущую разметку на проверку"
                    }
                    style={{
                      height: '24px',
                      marginTop: '12px', // например, только сверху и снизу
                      marginLeft: 40,
                      padding: '0px 10px', // изменить внутренние отступы
                      fontSize: '12px', // размер текста
                      borderRadius: '2px', // скругление
                      background: 'rgba(241,230,11,0.24)', // цвет фона
                      color: '#2f4861'
                    }}
                  >
                    Отправить на проверку
                  </Button>
                </div>

                {/* ПРАВАЯ КОЛОНКА: ПРЕВЬЮ */}
                <div
                  style={{
                    width: 200,
                    minWidth: 200,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {hasTiles ? (
                    <>
// ===== END page 40 | output L2040-2101 =====
// ===== BEGIN page 41 | 41.jpg | output L2102 =====
                      {(isLoading || !card.previewUrl) && (
                        <div
                          style={{
                            width: '100%',
                            height: 150,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f5f5f5',
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                          }}
                        >
                          <AtomSpinner size={60} animationDuration={1000} />
                        </div>
                      )}

                      <DetectionProgressOverlay percent={detectProgress?.[card.uuid]} />

                      {card.previewUrl ? (
                        <img
                          src={card.previewUrl}
                          alt="Превью"
                          style={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 6,
                            border: '1px solid #f0f0f0',
                            background: '#fafafa',
                          }}
                          onError={() => setImageCards(prev => prev.map(c =>
                            c.uuid === card.uuid ? { ...c, previewUrl: null } : c
                          ))}
                        />
                      ) : null}
                    </>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: 150,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f5f5f5',
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                      }}
                    >
                      <AtomSpinner size={60} animationDuration={1000} />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })
      ) : (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin spinning={isLoading} size="large">
            <p>Нет карточек или идёт загрузка...</p>
          </Spin>
        </div>
      )}
// ===== END page 41 | output L2102-2166 =====
// ===== BEGIN page 42 | 42.jpg | output L2167 =====
      <Pagination
        current={currentPage}
        total={totalCards}
        pageSize={itemsPerPage}
        onChange={handlePageChange}
        style={{ margin: '26px', textAlign: 'center' }}
        showQuickJumper
        showSizeChanger
        onShowSizeChange={(current, size) => setItemsPerPage(size)}
      />
    </Sider>

    <Layout style={{ padding: '24px' }}>
      <Content>
        {selectedCard ? (
          <div
            className="map-container"
            style={{
              width: '100%',
              height: 'calc(100vh - 120px)',
              position: 'relative'
            }}
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: '100%',
                border: '1px solid #ebe6e6',
                borderRadius: 6,
                overflow: 'hidden',
                position: 'relative',
              }}
            />

            {/* Панель разметки с выбором класса */}
            {selectedCard?.tileManifest?.uuid && (
              <div
                style={{
                  position: 'absolute',
                  top: 60,
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1200,
                  display: 'flex',
                  flexDirection: 'column', // Делаем вертикальную группировку
                  gap: 8,
                  padding: '12px 8px',
                  background: 'rgba(255,255,255,0.92)',
                  border: '1px solid #e8e8e8',
                  borderRadius: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
// ===== END page 42 | output L2167-2220 =====
// ===== BEGIN page 43 | 43.jpg | output L2221 =====
                }}
              >
                {/* Группа выбора класса */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Button
                    type={selectedClass === 'Трек' ? 'primary' : 'default'}
                    style={{
                      backgroundColor: selectedClass === 'Трек'
                        ? CLASS_COLORS['Трек']
                        : 'transparent',
                      color: selectedClass === 'Трек' ? 'white' : 'black',
                      border: `1px solid ${CLASS_COLORS['Трек']}`,
                    }}
                    onClick={() => setSelectedClass('Трек')}
                    title="Выделить как 'Трек' (красный)"
                  >
                    Трек
                  </Button>
                  <Button
                    type={selectedClass === 'Фоновый трек' ? 'primary' : 'default'}
                    style={{
                      backgroundColor: selectedClass === 'Фоновый трек'
                        ? CLASS_COLORS['Фоновый трек']
                        : 'transparent',
                      color: selectedClass === 'Фоновый трек' ? 'white' : 'black',
                      border: `1px solid ${CLASS_COLORS['Фоновый трек']}`,
                    }}
                    onClick={() => setSelectedClass('Фоновый трек')}
                    title="Выделить как 'Фоновый трек' (красный)"
                  >
                    Фоновый трек
                  </Button>
                  <Button
                    type={selectedClass === 'Неизвестный объект' ? 'primary' : 'default'}
                    style={{
                      backgroundColor: selectedClass === 'Неизвестный объект'
                        ? CLASS_COLORS['Неизвестный объект']
                        : 'transparent',
                      color: selectedClass === 'Неизвестный объект' ? 'white' : 'black',
                      border: `1px solid ${CLASS_COLORS['Неизвестный объект']}`,
                    }}
                    onClick={() => setSelectedClass('Неизвестный объект')}
                    title="Выделить как 'Неизвестный объект' (синий)"
                  >
                    Неизвестный объект
                  </Button>
                </div>

                {/* Группа режимов разметки */}
                <div style={{ marginLeft: 40, display: 'flex', gap: 8 }}>
                  <Button
                    type={annotationMode === 'draw' ? 'primary' : 'default'}
                    icon={<EditOutlined />}
                    onClick={() => enableDrawMode(selectedClass)}
                    title="Режим рисования новых прямоугольников"
                  />

                  <Button
                    danger={annotationMode === 'delete'}
                    type={annotationMode === 'delete' ? 'primary' : 'default'}
                    icon={<DeleteOutlined />}
                    onClick={enableDeleteMode}
// ===== END page 43 | output L2221-2282 =====
// ===== BEGIN page 44 | 44.jpg | output L2283 =====
                    title="Режим удаления bbox по клику"
                  />

                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={isSavingAnnotations}
                    disabled={!isAnnotationDirty}
                    onClick={saveAnnotations}
                    title="Сохранить текущую разметку"
                  />

                  <Button
                    icon={<CloseOutlined />}
                    onClick={cancelAnnotationMode}
                    title="Выйти из режима редактирования"
                  />
                </div>
              </div>
            )}

            {/* Показываем спиннер поверх карты */}
            {isTilesLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.85)',
                zIndex: 1000,
                backdropFilter: 'blur(2px)',
              }}>
                <AtomSpinner size={100} animationDuration={1200} />
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 24 }}>
            <p>Загрузите изображение, чтобы увидеть его на карте</p>
          </div>
        )}
      </Content>
    </Layout>

    </Layout>

    {/* Модальное окно загрузки */}
    <Modal
      title="Локальная загрузка изображения"
      open={isModalVisible}
      onCancel={handleCancelModal}
      footer={[
        <Button
          key="back"
          onClick={handleCancelModal}
          disabled={loading}
        >
// ===== END page 44 | output L2283-2343 =====
// ===== BEGIN page 45 | 45.jpg | output L2344 =====
          Закрыть
        </Button>,
      ]}
    >
      <div
        style={{
          border: '2px dashed #ccc',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <p>Перетащите файл сюда или нажмите на кнопку ниже</p>

        <Upload
          accept="image/*"
          showUploadList={false}
          disabled={loading}
          customRequest={({ file, onSuccess, onError }) => {
            uploadToServer(file)
              .then(() => onSuccess('ok'))
              .catch((err) => onError(err));
          }}
        >
          <Button loading={loading}>Выбрать файл</Button>
        </Upload>
      </div>
    </Modal>
  </Layout>
</ConfigProvider>);
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/login" component={AuthPage} />

        <Route path="/" render={(routeProps) => (
          <AuthCheck {...routeProps}>
            <App {...routeProps} />
          </AuthCheck>
        )} />

        <Route path="*" render={() => (
          <Redirect to={localStorage.getItem('authToken') ? '/' : '/login'} />
        )} />
      </Switch>
    </BrowserRouter>
  );
};

export default AppRouter;
// ===== END page 45 | output L2344-2398 =====
