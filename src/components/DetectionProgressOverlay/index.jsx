import React from 'react';
import { Progress } from 'antd';

const DetectionProgressOverlay = ({ percent }) => {
  if (typeof percent !== 'number') return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '12px 14px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
        }}
      >
        <Progress
          type="circle"
          percent={percent}
          width={72}
          strokeWidth={8}
          strokeColor={{
            '0%': '#1677ff',
            '100%': '#52c41a',
          }}
        />
        <span style={{ fontSize: 12, color: '#595959', fontWeight: 600 }}>
          Предразметка
        </span>
      </div>
    </div>
  );
};

export default DetectionProgressOverlay;
