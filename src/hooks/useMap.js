import { useState, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import TileImage from 'ol/source/TileImage';
import ImageStatic from 'ol/source/ImageStatic';
import TileGrid from 'ol/tilegrid/TileGrid';
import Projection from 'ol/proj/Projection';
import { ScaleLine, FullScreen, Zoom } from 'ol/control';
import { getMaxZoomFromLevels, getDimsFromLevels, viewFit } from '../utils/mapHelpers';
import { API_BASE } from '../services/api';

const useMap = () => {
  const [isTilesLoading, setIsTilesLoading] = useState(false);
  const [defaultImageLayer, setDefaultImageLayer] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Сколько тайлов сейчас реально грузится. Нужен для корректного показа/скрытия спиннера.
  const pendingTileLoadsRef = useRef(0);

  // Сюда кладём функцию очистки событий tileSource, чтобы при пересоздании карты не копились старые listeners.
  const tileSourceCleanupRef = useRef(null);

  const cleanupTileSourceListeners = () => {
    if (typeof tileSourceCleanupRef.current === 'function') {
      tileSourceCleanupRef.current();
      tileSourceCleanupRef.current = null;
    }
    pendingTileLoadsRef.current = 0;
  };

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
    const projection = new Projection({ code: 'IMAGE_PIXELS', units: 'pixels', extent });
    const map = new Map({
      target: mapContainerRef.current,
      layers: [],
      view: new View({
        center: [width / 2, height / 2],
        zoom: 0,
        minZoom: 0,
        maxZoom: 24,
        projection,
      }),
    });
    map.addControl(new ScaleLine());
    map.addControl(new FullScreen());
    map.addControl(new Zoom());
    const imageLayer = new ImageLayer({
      source: new ImageStatic({ url: imageUrl, projection, imageExtent: extent }),
    });
    map.addLayer(imageLayer);
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
    const projection = new Projection({ code: 'TILES_PIXELS', units: 'pixels', extent });
    const resolutions = Array.from({ length: maxZoom + 1 }, (_, z) => Math.pow(2, maxZoom - z));
    const tileGrid = new TileGrid({ extent, tileSize, minZoom: 0, maxZoom, resolutions });

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
      tileLoadFunction: (tile, src) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
          tile.setState(3);
          return;
        }

        fetch(src, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
          })
          .then((blob) => {
            const image = new Image();
            const objectUrl = URL.createObjectURL(blob);

            // ГЛАВНОЕ ИСПРАВЛЕНИЕ:
            // tile.setImage(image) вызываем только после image.onload,
            // чтобы OpenLayers не пытался отрисовать ещё не готовую картинку.
            image.onload = () => {
              tile.setImage(image);
              URL.revokeObjectURL(objectUrl);
            };
            image.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              tile.setState(3);
            };
            image.src = objectUrl;
          })
          .catch((err) => {
            console.error('Ошибка загрузки тайла:', err);
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

  return {
    mapContainerRef,
    mapRef,
    isTilesLoading,
    setIsTilesLoading,
    destroyMap,
    setPreviewImageLayer,
    setTilesLayer,
  };
};

export default useMap;
