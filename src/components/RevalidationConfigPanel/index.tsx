'use client';

import { useState } from 'react';
import { REVALIDATION_CONFIG, updateRevalidationConfig } from '../../services/api.service';

interface RevalidationConfigPanelProps {
  className?: string;
}

export default function RevalidationConfigPanel({ className = '' }: RevalidationConfigPanelProps) {
  const [config, setConfig] = useState(REVALIDATION_CONFIG);
  const [showPanel, setShowPanel] = useState(false);

  const handleConfigChange = (key: keyof typeof REVALIDATION_CONFIG, value: boolean | number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateRevalidationConfig({ [key]: value });
  };

  const formatTime = (milliseconds: number) => {
    const minutes = milliseconds / (1000 * 60);
    return minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes.toFixed(0)}m`;
  };

  if (!showPanel) {
    return (
      <div className={`fixed bottom-4 right-4 ${className}`}>
        <button
          onClick={() => setShowPanel(true)}
          className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          title="Configuración de Revalidación"
        >
          ⚙️ Auth Config
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Configuración de Autenticación</h3>
        <button
          onClick={() => setShowPanel(false)}
          className="text-gray-500 hover:text-gray-700 text-lg leading-none"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3 text-xs">
        {/* Habilitar revalidación por visibilidad */}
        <div className="flex items-center justify-between">
          <label className="text-gray-700">Revalidar al cambiar pestaña</label>
          <input
            type="checkbox"
            checked={config.ENABLE_VISIBILITY_REVALIDATION}
            onChange={(e) => handleConfigChange('ENABLE_VISIBILITY_REVALIDATION', e.target.checked)}
            className="rounded"
          />
        </div>

        {/* Debug revalidación */}
        <div className="flex items-center justify-between">
          <label className="text-gray-700">Debug logs</label>
          <input
            type="checkbox"
            checked={config.DEBUG_REVALIDATION}
            onChange={(e) => handleConfigChange('DEBUG_REVALIDATION', e.target.checked)}
            className="rounded"
          />
        </div>

        {/* Umbral de inactividad */}
        <div>
          <label className="block text-gray-700 mb-1">
            Inactividad requerida: {formatTime(config.LONG_INACTIVITY_THRESHOLD)}
          </label>
          <input
            type="range"
            min="300000" // 5 minutos
            max="7200000" // 2 horas
            step="300000" // 5 minutos
            value={config.LONG_INACTIVITY_THRESHOLD}
            onChange={(e) => handleConfigChange('LONG_INACTIVITY_THRESHOLD', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Intervalo mínimo */}
        <div>
          <label className="block text-gray-700 mb-1">
            Intervalo mínimo: {formatTime(config.MIN_REVALIDATION_INTERVAL)}
          </label>
          <input
            type="range"
            min="300000" // 5 minutos
            max="7200000" // 2 horas
            step="300000" // 5 minutos
            value={config.MIN_REVALIDATION_INTERVAL}
            onChange={(e) => handleConfigChange('MIN_REVALIDATION_INTERVAL', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
          <p><strong>Modo actual:</strong> {config.ENABLE_VISIBILITY_REVALIDATION ? 'Revalidación activa' : 'Solo carga inicial'}</p>
          <p className="mt-1">
            {config.ENABLE_VISIBILITY_REVALIDATION 
              ? `Se revalidará tras ${formatTime(config.LONG_INACTIVITY_THRESHOLD)} de inactividad`
              : 'No hay revalidación automática (recomendado)'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
