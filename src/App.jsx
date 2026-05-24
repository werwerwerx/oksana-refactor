import React, { useState } from 'react';
import { Layout, ConfigProvider } from 'antd';
import ru from 'antd/lib/locale/ru_RU';
import 'antd/dist/antd.css';
import 'ol/ol.css';

import AppHeader from './components/AppHeader';
import CardSidebar from './components/CardSidebar';
import MapArea from './components/MapArea';
import UploadModal from './components/UploadModal';

import useMap from './hooks/useMap';
import useCards, { STATUS } from './hooks/useCards';
import useMapAnnotations from './hooks/useMapAnnotations';

const { Content } = Layout;

const App = ({ history }) => {
  const {
    mapContainerRef,
    mapRef,
    isTilesLoading,
    setIsTilesLoading,
    destroyMap,
    setPreviewImageLayer,
    setTilesLayer,
  } = useMap();

  const {
    isModalVisible,
    setIsModalVisible,
    imageCards,
    setImageCards,
    selectedCard,
    loading,
    isLoading,
    deleting,
    stats,
    statsLoading,
    detectLoading,
    detectProgress,
    isApproving,
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
    selectedUuid,
  } = useCards({
    mapRef,
    setPreviewImageLayer,
    setTilesLayer,
    destroyMap,
    setIsTilesLoading,
  });

  const [selectedClass, setSelectedClass] = useState('Трек');

  const {
    annotationMode,
    isAnnotationDirty,
    isSavingAnnotations,
    enableDrawMode,
    enableDeleteMode,
    cancelAnnotationMode,
    saveAnnotations,
    clearAnnotationLayer,
  } = useMapAnnotations({
    mapRef,
    selectedCard,
    selectedUuid,
    imageCards,
    setImageCards,
  });

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      // Очищаем данные карты
      clearAnnotationLayer();
      destroyMap();
      // Перенаправляем на страницу входа
      history.push('/login');
    } catch (err) {
      console.error('Ошибка при выходе:', err);
    }
  };

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

  return (
    <ConfigProvider locale={ru}>
      <Layout style={{ height: '100vh' }}>
        <AppHeader onLogout={handleLogout} />
        <Layout>
          <CardSidebar
            imageCards={imageCards}
            selectedUuid={selectedUuid}
            selectedCard={selectedCard}
            onCardClick={handleCardClick}
            onDelete={deleteImage}
            deleting={deleting}
            isLoading={isLoading}
            currentPage={currentPage}
            totalCards={totalCards}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onPageSizeChange={setItemsPerPage}
            onUploadClick={() => setIsModalVisible(true)}
            stats={stats}
            statsLoading={statsLoading}
            detectLoading={detectLoading}
            detectProgress={detectProgress}
            onDetectClick={handleDetectClick}
            isApproving={isApproving}
            onApproveClick={handleApproveAnnotations2}
            statusProcessed={STATUS.PROCESSED}
          />
          <Layout style={{ padding: '24px' }}>
            <Content>
              <MapArea
                selectedCard={selectedCard}
                mapContainerRef={mapContainerRef}
                isTilesLoading={isTilesLoading}
                onDrop={handleFileDrop}
                annotationMode={annotationMode}
                isAnnotationDirty={isAnnotationDirty}
                isSavingAnnotations={isSavingAnnotations}
                selectedClass={selectedClass}
                onSelectedClassChange={setSelectedClass}
                onDrawAnnotations={() => enableDrawMode(selectedClass)}
                onDeleteAnnotations={enableDeleteMode}
                onSaveAnnotations={saveAnnotations}
                onCancelAnnotations={cancelAnnotationMode}
              />
            </Content>
          </Layout>
        </Layout>
        <UploadModal
          visible={isModalVisible}
          loading={loading}
          onCancel={() => setIsModalVisible(false)}
          onUpload={uploadToServer}
          onDrop={handleFileDrop}
        />
      </Layout>
    </ConfigProvider>
  );
};

export default App;
