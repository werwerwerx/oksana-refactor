import { useState, useEffect } from 'react';
import { message } from 'antd';
import {
  deleteImageRequest,
  fetchTilePreviewUrl,
  fetchCardsMetadata,
  fetchManifest,
  uploadImageRequest,
  startTileBuildRequest,
  fetchTileStatusRequest,
  fetchDetectionsRequest,
  fetchDetectionsRaw,
  startDetectionRequest,
  fetchDetectionTaskStatusRequest,
  startApproveTestRequest,
  fetchDetectionExportRequest,
  fetchExportTaskStatusRequest,
  API_BASE,
} from '../services/api';
import { getFallbackImageUrl, toNullableNumber } from '../utils/mapHelpers';

export const STATUS = {
  PROCESSED: 'Обработано',
  NOT_ANNOTATED: 'Не размечено',
  LOADING: 'Загружается',
  ERROR: 'Ошибка',
  PENDING_REVIEW: 'На проверке',
};

// ПОЛУЧЕНИЕ ЦВЕТА СТАТУСА
export const getStatusColor = (status) => {
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
      return 'orange';
    default:
      return 'default';
  }
};

const useCards = ({
  mapRef,
  setPreviewImageLayer,
  setTilesLayer,
  destroyMap,
  setIsTilesLoading,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [imageCards, setImageCards] = useState([]);
  const [selectedUuid, setSelectedUuid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Текущая страница
  const [totalCards, setTotalCards] = useState(0); // Общее количество карточек
  const [itemsPerPage, setItemsPerPage] = useState(5); // Количество карточек на странице
  const [deleting, setDeleting] = useState(null); // Хранит UUID удаляемого изображения

  // статистика
  const [stats, setStats] = useState({ totalProjects: 0, avgTileBuildMs: null, avgDetectMs: null });
  const [statsLoading, setStatsLoading] = useState(false);

  // состояние для отслеживания процесса предразметки:
  const [detectLoading, setDetectLoading] = useState({});
  const [detectProgress, setDetectProgress] = useState({});
  const [detectError, setDetectError] = useState(null);
  const [isApproving, setIsApproving] = useState({});
  const [approveTaskId, setApproveTaskId] = useState(null);
  const [approveProgress, setApproveProgress] = useState({});

  const selectedCard = imageCards.find((c) => c.uuid === selectedUuid) || null;

  // ПОДГРУЗКА СТАТИСТИКИ В ИНФОРМАЦИОННОЕ ПОЛЕ
  const loadStatistics = async ({ totalProjects } = {}) => {
    const token = localStorage.getItem('authToken');
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
      console.log('URL запроса:', response.url);
      const responseText = await response.text(); // Читаем текст до JSON
      console.log('Raw ответ сервера:', responseText);

      if (!response.ok) {
        // const errorText = await response.text().catch(() => "");
        // throw new Error(`1/ Ошибка загрузки статистики: ${response.status} ${errorText}`);
        console.error('Ошибка сервера:', response.status);
        throw new Error(responseText);
      }

      // const data = await response.json();
      // Теперь можно парсить JSON из уже сохраненного текста
      const data = JSON.parse(responseText);
      console.log('Парсинг JSON успешен:', data);

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

  // ==================================================================================================== //
  // УДАЛЕНИЕ КАРТОЧКИ
  // ==================================================================================================== //
  const deleteImage = async (uuid) => {
    setDeleting(uuid);
    const token = localStorage.getItem('authToken');
    try {
      await deleteImageRequest(uuid, token);
      // Удаляем карточку из состояния
      setImageCards((prevCards) => {
        const newCards = prevCards.filter((card) => card.uuid !== uuid);
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
      setCurrentPage((prev) => Math.min(prev, Math.ceil((imageCards.length - 1) / itemsPerPage) || 1));
      message.success('Изображение успешно удалено');
    } catch (error) {
      message.error(error.message);
      console.error('Ошибка удаления:', error);
    } finally {
      setDeleting(null);
    }
  };

  // ==================================================================================================== //
  // ЗАГРУЗКА И ОТОБРАЖЕНИЕ ВСЕХ КАРТОЧЕК (РАСПИСАТЬ)                                                   //
  // ==================================================================================================== //
  const loadAllCards = async () => {
    const token = localStorage.getItem('authToken');
    setIsLoading(true);
    try {
      const data = await fetchCardsMetadata(token, currentPage, itemsPerPage);
      const { items, total } = data;
      // console.log("metaData", metaData);
      // console.log("items", items);

      // Функция для проверки наличия предразметки
      const fetchDetectionsForCard = async (uuid) => {
        try {
          return await fetchDetectionsRequest(uuid, token);
        } catch (error) {
          console.error('Ошибка проверки предразметки:', error);
          return { exists: false, detections: [], detectionsTotal: 0 };
        }
      };

      // Загружаем данные для всех карточек
      const cardsWithPreviews = await Promise.all(
        items.map(async (item) => {
          let manifestData = null;
          let previewUrl = null;
          let { exists, detections, detectionsTotal } = await fetchDetectionsForCard(item.uuid);

          // Проверяем манифест тайлов (если предразметка есть, но тайлы ещё не построены, статус всё равно "Размечено")
          try {
            manifestData = await fetchManifest(item.uuid, token);
            if (manifestData) previewUrl = await fetchTilePreviewUrl(item.uuid, token);
          } catch (error) {
            console.error('Manifest/preview error:', error.message);
          }

          const status = exists
            ? STATUS.PROCESSED
            : manifestData
              ? STATUS.NOT_ANNOTATED
              : STATUS.LOADING;

          const sizeInMB = item.size_bytes
            ? (item.size_bytes / (1024 * 1024)).toFixed(2)
            : '—';

          item.tile_build_ms = 2;
          item.detect_ms = 3;

          return {
            uuid: item.uuid,
            name: item.name,
            date: item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'Не указано',
            format: item.format,
            size: `${sizeInMB} MB`,
            width: item.width,
            height: item.height,
            dimensions: `${item.height} × ${item.width} px`,
            status,
            quality: '—',
            tileJobId: null,
            tileManifest: manifestData,
            previewUrl,
            detectionsTotal,
            detections,

            // Эти два поля должны приходить из backend в /metadata
            tileBuildMs: item.tile_build_ms ?? null,
            detectMs: item.detect_ms ?? null,
          };
        })
      );

      // setImageCards(cardsWithPreviews);
      // setTotalCards(total);
      // setSelectedUuid(cardsWithPreviews.length > 0 ? cardsWithPreviews[0].uuid : null);
      setImageCards(cardsWithPreviews);
      setTotalCards(total);
      setStats((prev) => ({ ...prev, totalProjects: total }));
      setSelectedUuid(cardsWithPreviews.length > 0 ? cardsWithPreviews[0].uuid : null);

      // Подгружаем средние времена с backend
      await loadStatistics({ totalProjects: total });
    } catch (error) {
      console.error('Ошибка загрузки карточек:', error);
      message.error('Не удалось загрузить карточки');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================================================================================================== //
  // ОПРОС ГОТОВНОСТИ ТАЙЛОВ
  // ==================================================================================================== //
  const pollTileStatusUntilReady = async (jobId, opts = {}) => {
    const token = localStorage.getItem('authToken');
    const { intervalMs = 1000, timeoutMs = 10 * 60 * 1000, abortFlag = { aborted: false } } = opts;
    const startedAt = Date.now();

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchPreviewWithRetry = async (uuid, maxAttempts = 10, intervalMs = 1000) => {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const previewUrl = await fetchTilePreviewUrl(uuid, token);
        if (previewUrl) return previewUrl;
        if (attempt < maxAttempts - 1) await sleep(intervalMs);
      }
      return null;
    };

    while (true) {
      // Проверка флага прерывания
      if (abortFlag?.aborted) throw new Error('Опрос тайлов прерван');
      // Проверка таймаута
      if (Date.now() - startedAt > timeoutMs) throw new Error('Таймаут ожидания готовности тайлов');

      const data = await fetchTileStatusRequest(jobId, token);
      // Проверяем, готовы ли тайлы
      if (data?.levels && data?.uuid) {
        const previewUrl = await fetchPreviewWithRetry(data.uuid);
        setIsTilesLoading(false);

        return { ...data, previewUrl };
      }

      // Ждём перед следующим запросом
      await sleep(intervalMs);
    }
  };

  // ==================================================================================================== //
  // ЗАГРУЖАЕТ ФАЙЛ НА СЕРВЕР
  // ==================================================================================================== //
  const uploadToServer = async (file) => {
    console.log('uploadToServer');
    const token = localStorage.getItem('authToken');
    setLoading(true);
    let uploadUuid = null;
    try {
      const result = await uploadImageRequest(file, token);
      uploadUuid = result.uuid;
      const sizeInMB = result.size_bytes ? (result.size_bytes / (1024 * 1024)).toFixed(2) : '—';

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
        quality: '—',
        isTilesLoading: true,
        isLoading: true,
        tileJobId: null,
        tileManifest: null,
        detectionsTotal: 0,
        detections: [],
      };

      // Обновляем список карточек
      // setImageCards((prev) => [newCard, ...prev]);
      // setSelectedUuid(result.uuid); // Выбираем новую карточку
      // message.success('Файл успешно загружен');

      setImageCards((prev) => [newCard, ...prev]);
      setTotalCards((prev) => prev + 1);
      setStats((prev) => ({ ...prev, totalProjects: prev.totalProjects + 1 }));
      setSelectedUuid(result.uuid);
      message.success('Файл успешно загружен');
      setIsModalVisible(false);
      setLoading(false);

      const uuid = result.uuid;
      const tileBuildStartedAt = Date.now();

      // Обновляем статус карточки
      setImageCards((prev) => prev.map((c) => (c.uuid === uuid ? { ...c, status: 'Подготовка' } : c)));

      // Запускаем построение тайлов
      const jobId = await startTileBuildRequest(uuid, token);
      setIsTilesLoading(true);
      setImageCards((prev) => prev.map((c) => (c.uuid === uuid ? { ...c, tileJobId: jobId } : c)));

      const abortFlag = { aborted: false };
      // pollAbortRef.current.set(uuid, abortFlag);

      // Ожидаем готовности
      const manifest = await pollTileStatusUntilReady(jobId, { abortFlag });
      // После успешного разбиения backend уже обновил статистику,
      // поэтому заново забираем среднее время тайлинга.
      await loadStatistics();

      const elapsedTileBuildMs = Date.now() - tileBuildStartedAt;
      setImageCards((prev) =>
        prev.map((c) =>
          c.uuid === uuid
            ? {
              ...c,
              status: STATUS.NOT_ANNOTATED,
              tileManifest: manifest,
              previewUrl: manifest.previewUrl,
              isLoading: false,
              tileJobId: null,
              tileBuildMs: elapsedTileBuildMs,
            }
            : c
        )
      );

      setTilesLayer(manifest.uuid, manifest.levels, 256);
      setIsTilesLoading(false);
      if (currentPage !== 1) setCurrentPage(1);
      setSelectedUuid(result.uuid);
    } catch (e) {
      console.error(e);
      message.error(`Не удалось загрузить файл: ${e.message}`);
      setImageCards((prev) =>
        prev.map((c) =>
          c.uuid === uploadUuid
            ? { ...c, status: STATUS.ERROR, isLoading: false, tileJobId: null }
            : c
        )
      );
      setIsTilesLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================================================================== //
  // НАЖАТИЕ НА КАРТОЧКУ
  // ==================================================================================================== //
  const handleCardClick = async (uuid) => {
    setSelectedUuid(uuid);
    setIsTilesLoading(true);

    const card = imageCards.find((c) => c.uuid === uuid);
    const { width, height } = card || {}; // Берём размеры из текущей карточки

    try {
      const token = localStorage.getItem('authToken');
      const detectionRes = await fetch(`${API_BASE}/detections/${uuid}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        mode: 'cors',
        cache: 'no-store',
      });
      console.log('detectionRes = ', detectionRes);

      if (detectionRes.ok) {
        const detections = await detectionRes.json();

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
              ? { ...c, detections: [], detectionsTotal: 0 }
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
        console.warn('Нет данных для отрисовки:', uuid);
        message.warning('Не удалось загрузить изображение или тайлы');
      }
    } catch (error) {
      console.error('Ошибка загрузки предразметки:', error);
      message.error(`Ошибка предразметки: ${error.message}`);
      // В случае ошибки сбрасываем количество объектов
      setImageCards((prev) =>
        prev.map((c) => (c.uuid === uuid ? { ...c, detectionsTotal: 0, detections: [] } : c))
      );
    } finally {
      setIsTilesLoading(false);
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
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const setProgress = (value) => {
      const progress = Number(value);
      // console.log("\n\n\n\n\n\n\n\n\n\n\n", progress);
      if (!Number.isFinite(progress)) return;
      onProgress?.(Math.min(100, Math.max(0, Math.round(progress))));
    };

    while (true) {
      // Проверка флага прерывания
      if (abortFlag?.aborted) throw new Error('Опрос предразметки прерван');
      // Проверка таймаута
      if (Date.now() - startedAt > timeoutMs) throw new Error('Таймаут ожидания предразметки');

      const data = await fetchDetectionTaskStatusRequest(jobId, token);
      setProgress(data.progress_percent);

      switch (data.status) {
        case 'processing':
          break;
        case 'completed':
          setProgress(100);
          return data;
        case 'failed':
          throw new Error('Задача предразметки завершилась ошибкой');
        default:
          break;
      }

      await sleep(intervalMs);
    }
  };

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
      setDetectProgress((prev) => ({ ...prev, [uuid]: 0 }));
      setDetectError(null);

      const token = localStorage.getItem('authToken');
      const result = await startDetectionRequest(uuid, token);
      console.log('=-=-=-=-=', result);

      const manifest = await pollDetectStatusUntilReady(result.task_id, {
        abortFlag: { aborted: false },
        onProgress: (progress) => setDetectProgress((prev) => ({ ...prev, [uuid]: progress })),
      });

      console.log('manifest = ', manifest);
      const elapsedDetectMs = Date.now() - startedAt;
      console.log('elapsedDetectMs = ', elapsedDetectMs);

      setImageCards((prev) =>
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
      await new Promise((resolve) => setTimeout(resolve, 500));

      /***Важно! Не вызываем addDetectionsLayer здесь — он сработает в useEffect***/
      if (uuid === selectedUuid && mapRef?.current) {
        // Загружаем detections отдельно, чтобы React успел обновить состояние
        const detectionData = await fetchDetectionsRaw(uuid, token);
        setImageCards((prev) =>
          prev.map((c) => (c.uuid === uuid ? { ...c, detections: detectionData } : c))
        );
      }
    } catch (error) {
      console.error(' Ошибка предразметки:', error);
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
      setDetectProgress((prev) => {
        const next = { ...prev };
        delete next[uuid];
        return next;
      });
    }
  };

  // Функция для опроса статуса задачи апрува
  const pollExportTask = async (taskId, uuid) => {
    const token = localStorage.getItem('authToken');
    const intervalMs = 1000; // Интервал опроса (1 секунда)
    const timeoutMs = 10 * 60 * 1000; // Таймаут (10 минут)
    const startedAt = Date.now();
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (true) {
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error('Таймаут ожидания завершения задачи отправки разметки на проверку');
      }

      const data = await fetchExportTaskStatusRequest(taskId, token);
      console.log('\n ', data);

      // Обновляем прогресс для отображения
      setApproveProgress((prev) => ({
        ...prev,
        [uuid]: data.progress * 100, // Предполагаем, что progress в долях от 1
      }));

      if (data.status === 'failed') {
        throw new Error(data.error || 'Неизвестная ошибка');
      }

      if (data.status === 'completed') {
        return data.result; // Получаем результат задачи
      }

      await sleep(intervalMs);
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
      console.warn('Попытка апрува для неподходящего статуса');
      message.warning('Разметка должна быть обработана перед отправкой');
      return;
    }

    // Начинаем загрузку для этого uuid
    setIsApproving((prev) => ({ ...prev, [uuid]: true }));

    try {
      const data = await startApproveTestRequest(uuid, token);
      console.log('\n - ', data);
      message.success(data.message);

      // **Обновляем статус карточки на "На проверке"**
      setImageCards((prev) =>
        prev.map((c) =>
          c.uuid === uuid
            ? {
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
      console.error('Ошибка апрува разметки:', error);
      message.error(error.message || 'Не удалось отправить разметку на проверку');
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
          c.uuid === uuid ? { ...c, status: STATUS.PENDING_REVIEW } : c
        )
      );
    }
  };

  // Функция обработки апрува разметки
  const handleApproveAnnotations = async (uuid) => {
    if (isApproving[uuid]) return;
    console.log('123');

    try {
      setIsApproving((prev) => ({ ...prev, [uuid]: true }));
      setApproveProgress((prev) => ({ ...prev, [uuid]: 0 }));
      setApproveTaskId(uuid);

      const token = localStorage.getItem('authToken');
      const data = await fetchDetectionExportRequest(uuid, token);
      console.log('\n - ', data);
      const taskId = data.task_id;

      // Опрашиваем статус задачи
      const result = await pollExportTask(taskId, uuid);
      console.log('\n === ', result);

      // Обновляем карточку
      setImageCards((prev) =>
        prev.map((card) =>
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
      console.error('Ошибка отправки задачи проверки разметки:', error);
      setImageCards((prev) =>
        prev.map((card) =>
          card.uuid === uuid
            ? { ...card, approveStatus: 'failed', approveError: error.message }
            : card
        )
      );
      message.error(error.message || 'Не удалось отправить на проверку разметку');
    } finally {
      setIsApproving((prev) => {
        const newIsApproving = { ...prev };
        delete newIsApproving[uuid];
        return newIsApproving;
      });
      setApproveTaskId(null);
    }
  };

  // обработчик смены страницы
  const handlePageChange = (page) => {
    setCurrentPage(page); // Обновляем текущую страницу
    setSelectedUuid(null); // Сбрасываем выбранную карточку (опционально)
  };

  // ==================================================================================================== //
  // ЭФФЕКТЫ
  // ==================================================================================================== //
  useEffect(() => {
    if (!selectedCard) {
      destroyMap();
      return;
    }
    if (selectedCard.tileManifest?.uuid && selectedCard.tileManifest?.levels) {
      setTilesLayer(selectedCard.tileManifest.uuid, selectedCard.tileManifest.levels);
    } else if (selectedCard.imageUrl) {
      const w = Number(selectedCard.width);
      const h = Number(selectedCard.height);
      setPreviewImageLayer(selectedCard.imageUrl, w, h);
    }
  }, [selectedUuid]);

  // Оптимизация пагинации при удалении: После удаления, если текущая страница пустая, переключаемся на предыдущую
  useEffect(() => {
    const totalPages = Math.ceil(totalCards / itemsPerPage);
    if (currentPage > totalPages) setCurrentPage(totalPages || 1);
  }, [totalCards, itemsPerPage, currentPage]);

  // загрузка только при монтировании (useEffect с пустым массивом зависимостей)**
  useEffect(() => { loadAllCards(); }, []); // Пустой массив — вызов только один раз при загрузке страницы

  // //
  useEffect(() => { loadAllCards(); }, [currentPage]); // Загружаем карточки при изменении страницы

  // useEffect(() => {
  //   loadAllCards();
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

  return {
    isModalVisible,
    setIsModalVisible,
    imageCards,
    setImageCards,
    selectedUuid,
    selectedCard,
    loading,
    isLoading,
    deleting,
    stats,
    statsLoading,
    detectLoading,
    detectProgress,
    detectError,
    isApproving,
    approveProgress,
    currentPage,
    totalCards,
    itemsPerPage,
    setItemsPerPage,
    deleteImage,
    uploadToServer,
    handleCardClick,
    handlePageChange,
    handleDetectClick,
    handleApproveAnnotations2,
    handleApproveAnnotations,
  };
};

export default useCards;
