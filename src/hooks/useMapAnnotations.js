import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import Draw, { createBox } from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import { click } from 'ol/events/condition';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {
  createFeatureFromBBox,
  detectionToBBox,
  featureToDetection,
  getAnnotationFeatureStyle,
} from '../utils/annotationHelpers';
import { fetchDetectionsRequest, saveDetectionsRequest } from '../services/api';

const useMapAnnotations = ({ mapRef, selectedCard, selectedUuid, imageCards, setImageCards }) => {
  // ============================= РУЧНАЯ РАЗМЕТКА =============================
  // блок логики для ручной работы с bbox
  //
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
  //
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

  // ВЫКЛЮЧАЕТ РЕЖИМЫ РАЗМЕТКИ
  const disableAllAnnotationInteractions = useCallback(() => {
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
  }, [mapRef]);

  // Удаляет слой аннотаций целиком.
  const clearAnnotationLayer = useCallback(() => {
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
  }, [disableAllAnnotationInteractions, mapRef]);

  // Собирает ВСЕ bbox с классами для сохранения
  const serializeAnnotationsFromLayer = useCallback((imageHeight) => {
    if (!annotationSourceRef.current) return [];
    return annotationSourceRef.current
      .getFeatures()
      .map((feature) => featureToDetection(feature, imageHeight))
      .filter(Boolean);
  }, []);

  // Инициализирует единый слой аннотаций с поддержкой трёх классов
  const addDetectionsLayer = useCallback((detections, map, imageWidth, imageHeight) => {
    if (!map || !imageWidth || !imageHeight) return;
    clearAnnotationLayer();

    const vectorSource = new VectorSource();
    (detections || []).forEach((detection, index) => {
      const feature = createFeatureFromBBox(
        detectionToBBox(detection),
        imageHeight,
        {
          id: detection?.id || `pred-${index}`,
          sourceType: detection?.source || 'predicted',
          detect_class: detection.class || detection.detect_class || 'Трек', // По умолчанию "трэк" для предразметки
        }
      );
      if (feature) vectorSource.addFeature(feature);
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
  }, [clearAnnotationLayer]);

  // Включает режим рисования с указанием класса
  const enableDrawMode = useCallback((classType) => {
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
  }, [addDetectionsLayer, disableAllAnnotationInteractions, mapRef, selectedCard]);

  // ВКЛЮЧАЕТ РЕЖИМЫ УДАЛЕНИЯ BBOX (логика осталась прежней, но теперь учитывает класс)
  const enableDeleteMode = useCallback(() => {
    if (!mapRef.current || !annotationLayerRef.current || !annotationSourceRef.current) return;

    disableAllAnnotationInteractions();

    const select = new Select({
      condition: click,
      layers: [annotationLayerRef.current],
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
  }, [disableAllAnnotationInteractions, mapRef]);

  // Просто выйти из режима draw/delete и вернуться в обычный просмотр.
  const cancelAnnotationMode = useCallback(() => {
    if (annotationSourceRef.current) {
      annotationSourceRef.current.getFeatures().forEach((feature) => {
        feature.set('isSelectedForDelete', false);
      });
    }
    disableAllAnnotationInteractions();
  }, [disableAllAnnotationInteractions]);

  // Сохраняет ВСЮ текущую разметку текущего изображения
  const saveAnnotations = useCallback(async () => {
    // ВАЖНО:
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

      await saveDetectionsRequest(selectedCard.uuid, detectionsToSave, token);

      // После успешного сохранения перечитываем backend,
      // чтобы UI показывал то, что реально сохранилось
      let freshDetections = detectionsToSave;
      try {
        const response = await fetchDetectionsRequest(selectedCard.uuid, token);
        freshDetections = response.detections;
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
              status: freshDetections.length > 0 ? 'Обработано' : 'Не размечено',
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
              status: detectionsToSave.length > 0 ? 'Обработано' : 'Не размечено',
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
  }, [disableAllAnnotationInteractions, selectedCard, serializeAnnotationsFromLayer, setImageCards]);

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
  }, [addDetectionsLayer, imageCards, mapRef, selectedCard, selectedUuid]); // Срабатывает при изменении карточек или выбора

  // useEffect для обновления карты при выборе карточки
  useEffect(() => {
    // При переключении изображения всегда выходим из draw/delete режима.
    // Иначе пользователь может перейти на новую карточку, а старая интеракция останется активной.
    disableAllAnnotationInteractions();
    setIsAnnotationDirty(false);
  }, [disableAllAnnotationInteractions, selectedUuid]);

  // Полная очистка при размонтировании компонента. Нужна, чтобы не оставлять висячие интеракции и слои.
  useEffect(() => () => {
    clearAnnotationLayer();
  }, [clearAnnotationLayer]);

  return {
    annotationMode,
    isAnnotationDirty,
    isSavingAnnotations,
    enableDrawMode,
    enableDeleteMode,
    cancelAnnotationMode,
    saveAnnotations,
    clearAnnotationLayer,
  };
};

export default useMapAnnotations;
