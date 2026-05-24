import React from 'react';
import { Button } from 'antd';
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { CLASS_COLORS } from '../../utils/annotationHelpers';

const MapToolbar = ({
  visible,
  annotationMode,
  isAnnotationDirty,
  isSavingAnnotations,
  selectedClass,
  onSelectedClassChange,
  onDraw,
  onDelete,
  onSave,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    // Панель разметки с выбором класса
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
      }}
    >
      {/* Группа выбора класса */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Button
          type={selectedClass === 'Трек' ? 'primary' : 'default'}
          style={{
            backgroundColor: selectedClass === 'Трек' ? CLASS_COLORS['Трек'] : 'transparent',
            color: selectedClass === 'Трек' ? 'white' : 'black',
            border: `1px solid ${CLASS_COLORS['Трек']}`,
          }}
          onClick={() => onSelectedClassChange('Трек')}
          title="Выделить как 'Трек' (красный)"
        >
          Трек
        </Button>
        <Button
          type={selectedClass === 'Фоновый трек' ? 'primary' : 'default'}
          style={{
            backgroundColor: selectedClass === 'Фоновый трек' ? CLASS_COLORS['Фоновый трек'] : 'transparent',
            color: selectedClass === 'Фоновый трек' ? 'white' : 'black',
            border: `1px solid ${CLASS_COLORS['Фоновый трек']}`,
          }}
          onClick={() => onSelectedClassChange('Фоновый трек')}
          title="Выделить как 'Фоновый трек' (красный)"
        >
          Фоновый трек
        </Button>
        <Button
          type={selectedClass === 'Неизвестный объект' ? 'primary' : 'default'}
          style={{
            backgroundColor: selectedClass === 'Неизвестный объект' ? CLASS_COLORS['Неизвестный объект'] : 'transparent',
            color: selectedClass === 'Неизвестный объект' ? 'white' : 'black',
            border: `1px solid ${CLASS_COLORS['Неизвестный объект']}`,
          }}
          onClick={() => onSelectedClassChange('Неизвестный объект')}
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
    </div>
  );
};

export default MapToolbar;
