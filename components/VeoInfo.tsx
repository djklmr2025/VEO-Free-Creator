import React, { useState } from 'react';

const VeoInfo: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-lg font-semibold text-white">🎬 Veo 3 Information & Access Methods</h3>
        <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-4 text-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gemini-blue mb-2">🚀 Veo 3.1 Fast</h4>
              <ul className="text-sm space-y-1">
                <li>• Resolución: 720p</li>
                <li>• Velocidad: ~30-60 segundos</li>
                <li>• Ideal para: Prototipos rápidos</li>
                <li>• Costo: Menor</li>
              </ul>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gemini-blue mb-2">⭐ Veo 3.1 Standard</h4>
              <ul className="text-sm space-y-1">
                <li>• Resolución: 1080p</li>
                <li>• Velocidad: ~2-5 minutos</li>
                <li>• Ideal para: Producción final</li>
                <li>• Costo: Mayor</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-4">
            <h4 className="font-semibold text-white mb-3">🔗 Métodos de Acceso a Veo 3:</h4>
            
            <div className="space-y-3">
              <div className="bg-green-900/20 border border-green-700 p-3 rounded-lg">
                <h5 className="font-semibold text-green-400">✅ Direct API (Recomendado)</h5>
                <p className="text-sm text-gray-300 mt-1">
                  Acceso directo a través de la API de Gemini. Máximo control y funcionalidad completa.
                </p>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-700 p-3 rounded-lg">
                <h5 className="font-semibold text-blue-400">🧪 Via Puter.js (Experimental)</h5>
                <p className="text-sm text-gray-300 mt-1">
                  Usa Puter.js como intermediario. Útil cuando la API directa no está disponible.
                </p>
              </div>
              
              <div className="bg-purple-900/20 border border-purple-700 p-3 rounded-lg">
                <h5 className="font-semibold text-purple-400">🌐 Otras Opciones</h5>
                <ul className="text-sm text-gray-300 mt-1 space-y-1">
                  <li>• Google AI Studio (interfaz web)</li>
                  <li>• Vertex AI (para empresas)</li>
                  <li>• Integración con otras plataformas</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-900/20 border border-yellow-700 p-3 rounded-lg">
            <h5 className="font-semibold text-yellow-400">💡 Tip Pro</h5>
            <p className="text-sm text-gray-300">
              Veo 3 es accesible desde múltiples puntos porque todas las rutas convergen en la misma infraestructura de Gemini AI. 
              ¡Puedes forzar llamadas desde cualquier cliente que tenga acceso a Gemini!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeoInfo;