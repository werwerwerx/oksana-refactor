import React from 'react';
import { Button } from 'antd';
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from '@ant-design/icons';

const MapToolbar = ({
  visible,
  annotationMode,
  isAnnotationDirty,
  isSavingAnnotations,
  onDraw,
  onDelete,
  onSave,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 35,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1200,
        display: 'flex',
        gap: 8,
        padding: 8,
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
      }}
    >
      <Button
        type={annotationMode === 'draw' ? 'primary' : 'default'}
        icon={<EditOutlined />}
        onClick={onDraw}
        title="Режим рисования новых прямоугольников"
      />
      <Button
        danger={annotationMode === 'delete'}
        type={annotationMode === 'delete' ? 'primary' : 'default'}
        icon={<DeleteOutlined />}
        onClick={onDelete}
        title="Режим удаления bbox по клику"
      />
      <Button
        type="primary"
        icon={<SaveOutlined />}
        loading={isSavingAnnotations}
        disabled={!isAnnotationDirty}
        onClick={onSave}
        title="Сохранить текущую разметку"
      />
      <Button
        icon={<CloseOutlined />}
        onClick={onCancel}
        title="Выйти из режима редактирования"
      />
    </div>
  );
};

export default MapToolbar;
