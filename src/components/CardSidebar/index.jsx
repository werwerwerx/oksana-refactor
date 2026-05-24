import React from 'react';
import { Layout, Button, Card, Modal, Spin, Pagination, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import AtomSpinner from '../AtomSpinner/Atom';
import DetectionProgressOverlay from '../DetectionProgressOverlay';
import { getStatusColor } from '../../hooks/useCards';

const { Sider } = Layout;

const CardSidebar = ({
  imageCards,
  selectedUuid,
  selectedCard,
  onCardClick,
  onDelete,
  deleting,
  isLoading,
  currentPage,
  totalCards,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  onUploadClick,
  stats,
  statsLoading,
  detectLoading,
  detectProgress,
  onDetectClick,
  isApproving,
  onApproveClick,
  statusProcessed,
}) => (
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
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 0 }}>Сводка</div>
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

    <Button
      type="primary"
      onClick={onUploadClick}
      style={{
        height: 24,
        marginLeft: 140,
        padding: '0px 10px', // изменить внутренние отступы
        fontSize: '12px', // размер текста
        borderRadius: 2, // скругление
        background: 'rgba(241,230,11,0.24)', // цвет фона
        color: '#2f4861',
      }}
    >
      + Загрузить изображение
    </Button>

    {imageCards.length > 0 ? (
      imageCards.map((card) => {
        const hasTiles = card.tileManifest;
        return (
          <Card
            key={card.uuid}
            title={(
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{card.name}</span>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    Modal.confirm({
                      title: `Удалить "${card.name}"?`,
                      content: 'Это действие нельзя отменить.',
                      onOk: () => onDelete(card.uuid),
                      okText: 'Удалить',
                      cancelText: 'Отмена',
                      okButtonProps: {
                        danger: true,
                        loading: deleting === card.uuid,
                        disabled: deleting === card.uuid,
                      },
                    });
                  }}
                  disabled={deleting === card.uuid}
                  loading={deleting === card.uuid}
                  danger
                  style={{
                    height: '24px',
                    marginLeft: 40, // Отступ слева от кнопки
                    padding: '0px 10px',
                    fontSize: '12px',
                    borderRadius: 2,
                    background: 'transparent',
                    border: 'none',
                    zIndex: 10,
                  }}
                />
              </div>
            )}
            // =============================
            // СТИЛИ САМОЙ CARD
            // =============================
            style={{
              marginTop: 8,
              margin: '16px',
              cursor: 'pointer',
              border: card.uuid === selectedUuid ? '2px solid #1677ff' : undefined,
              minHeight: '220px',
              position: 'relative',
              width: 'calc(100% - 22px)',
            }}
            onClick={() => onCardClick(card.uuid)}
          >
            {/* ВНУТРЕННЯЯ РАЗМЕТКА КАРТОЧКИ -> FLEX ROW */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                gap: 16,
              }}
            >
              {/* ЛЕВАЯ КОЛОНКА: ПОЛЯ */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ marginBottom: 3 }}>Дата: {card.date}</p>
                <p style={{ marginBottom: 3 }}>Формат: {card.format}</p>
                <p style={{ marginBottom: 3 }}>Размер: {card.size}</p>
                <p style={{ marginBottom: 3 }}>Размеры: {card.dimensions}</p>
                <p style={{ marginBottom: 3 }}>
                  Статус:
                  <Tag
                    color={getStatusColor(card.status)}
                    style={{
                      marginLeft: 8,
                      fontSize: '12px',
                      padding: '0 8px',
                      height: '24px',
                      lineHeight: '24px',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                    }}
                  >
                    {card.status}
                  </Tag>
                </p>
                <p style={{ marginBottom: 3 }}>
                  Найдено объектов: {card.detectionsTotal ?? 0}
                </p>
                <Button
                  onClick={(e) => { e.stopPropagation(); onDetectClick(card.uuid); }}
                  loading={detectLoading[card.uuid]}
                  disabled={detectLoading[card.uuid]}
                  type="primary"
                  // icon={<UploadOutlined />}
                  style={{
                    height: '24px',
                    marginTop: '12px', // например, только сверху и снизу
                    marginLeft: 40,
                    padding: '0px 10px', // изменить внутренние отступы
                    fontSize: '12px', // размер текста
                    borderRadius: 2, // скругление
                    background: 'rgba(241,230,11,0.24)', // цвет фона
                    color: '#2f4861',
                  }}
                >
                  Обработать
                </Button>
                <Button
                  onClick={(e) => { e.stopPropagation(); onApproveClick(card.uuid); }}
                  loading={isApproving[card?.uuid]} // Только для текущей карточки
                  // disabled={isApproving[card?.uuid]} // Зависит от того же состояния
                  disabled={ // Блокируем если:
                    !selectedCard // Нет выбранной карточки
                    || selectedCard.status !== statusProcessed // Статус не "Обработано"
                    || isApproving[selectedCard.uuid] // Уже выполняется задача для этой карточки
                  }
                  type="primary"
                  title={ // Tooltip для пояснения
                    !selectedCard
                      ? 'Выберите изображение'
                      : selectedCard.status !== statusProcessed
                        ? "Сначала завершите разметку (статус должен быть 'Обработано')"
                        : isApproving[selectedCard.uuid]
                          ? 'Отправка в процессе...'
                          : 'Отправить текущую разметку на проверку'
                  }
                  style={{
                    height: '24px',
                    marginTop: '12px', // например, только сверху и снизу
                    marginLeft: 40,
                    padding: '0px 10px', // изменить внутренние отступы
                    fontSize: '12px', // размер текста
                    borderRadius: 2, // скругление
                    background: 'rgba(241,230,11,0.24)', // цвет фона
                    color: '#2f4861',
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

    <Pagination
      current={currentPage}
      total={totalCards}
      pageSize={itemsPerPage}
      onChange={onPageChange}
      style={{ margin: '26px', textAlign: 'center' }}
      showQuickJumper
      showSizeChanger
      onShowSizeChange={(current, size) => onPageSizeChange(size)}
    />
  </Sider>
);

export default CardSidebar;
