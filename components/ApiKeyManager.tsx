import React, { useState, useEffect } from 'react';
import Button from './Button';

interface ApiKeyManagerProps {
  onApiKeyChange: (apiKey: string, source: 'manual' | 'google' | 'env') => void;
  currentApiKey?: string;
}

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  isPremium: boolean;
  isProPlus: boolean;
  geminiApiAccess: boolean;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  onApiKeyChange, 
  currentApiKey 
}) => {
  const [manualApiKey, setManualApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar si hay una API key del entorno al cargar
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envApiKey && !currentApiKey) {
      onApiKeyChange(envApiKey, 'env');
    }
  }, []);

  // Simular detección de cuenta premium (en producción esto sería una llamada real a la API)
  const detectPremiumStatus = async (userEmail: string): Promise<Partial<GoogleUser>> => {
    // Simulación: detectar patrones de cuentas premium
    const isPremiumDomain = userEmail.includes('@gmail.com') || userEmail.includes('@googlemail.com');
    
    // En producción, aquí harías una llamada a la API de Google para verificar:
    // - Si tiene Google One Premium
    // - Si tiene acceso a Gemini Advanced
    // - Si tiene billing habilitado en Google Cloud
    
    return {
      isPremium: isPremiumDomain && Math.random() > 0.7, // Simulación
      isProPlus: isPremiumDomain && Math.random() > 0.8, // Simulación
      geminiApiAccess: isPremiumDomain && Math.random() > 0.6 // Simulación
    };
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // En producción, aquí usarías Google OAuth
      // Por ahora simulamos el login
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser = {
        email: 'usuario@gmail.com',
        name: 'Usuario Premium',
        picture: 'https://via.placeholder.com/40',
        isPremium: false,
        isProPlus: false,
        geminiApiAccess: false
      };

      const premiumStatus = await detectPremiumStatus(mockUser.email);
      const user = { ...mockUser, ...premiumStatus };
      
      setGoogleUser(user);

      if (user.geminiApiAccess) {
        // Si tiene acceso premium, generar/obtener su API key automáticamente
        const premiumApiKey = 'AIzaSy_PREMIUM_' + Math.random().toString(36).substring(7);
        onApiKeyChange(premiumApiKey, 'google');
      } else {
        setError('Tu cuenta de Google no tiene acceso premium a Gemini API. Puedes usar el modo Local o ingresar tu propia API key.');
      }
    } catch (err) {
      setError('Error al conectar con Google. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualApiKey = () => {
    if (manualApiKey.trim()) {
      onApiKeyChange(manualApiKey.trim(), 'manual');
      setShowApiKeyInput(false);
      setError(null);
    }
  };

  const handleLogout = () => {
    setGoogleUser(null);
    setManualApiKey('');
    onApiKeyChange('', 'manual');
  };

  const getStatusBadge = () => {
    if (currentApiKey) {
      if (currentApiKey.includes('PREMIUM')) {
        return <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full">Premium</span>;
      } else if (currentApiKey.includes('AIzaSy')) {
        return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">API Key</span>;
      } else {
        return <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">Entorno</span>;
      }
    }
    return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">Sin API</span>;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Configuración de API (Veo/Gemini)</h3>
        {getStatusBadge()}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      {googleUser ? (
        <div className="bg-gray-700 rounded p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={googleUser.picture} 
                alt={googleUser.name}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-white font-medium">{googleUser.name}</p>
                <p className="text-gray-400 text-sm">{googleUser.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {googleUser.isPremium && (
                <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded">Premium</span>
              )}
              {googleUser.isProPlus && (
                <span className="px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded">Pro+</span>
              )}
              <Button
                onClick={handleLogout}
                variant="secondary"
                size="sm"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Conectando...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Conectar con Google</span>
              </div>
            )}
          </Button>

          <div className="text-center text-gray-400 text-sm">o</div>

          {!showApiKeyInput ? (
            <Button
              onClick={() => setShowApiKeyInput(true)}
              variant="secondary"
              className="w-full"
            >
              Ingresar API Key Manualmente
            </Button>
          ) : (
            <div className="space-y-2">
              <input
                type="password"
                value={manualApiKey}
                onChange={(e) => setManualApiKey(e.target.value)}
                placeholder="Pega tu Gemini/Veo API Key aquí..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <div className="flex space-x-2">
                <Button
                  onClick={handleManualApiKey}
                  disabled={!manualApiKey.trim()}
                  className="flex-1"
                >
                  Guardar API Key
                </Button>
                <Button
                  onClick={() => {
                    setShowApiKeyInput(false);
                    setManualApiKey('');
                  }}
                  variant="secondary"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        <p>• <strong>Google Login:</strong> Detecta automáticamente si tienes acceso premium (en desarrollo: OAuth real requerirá CLIENT_ID)</p>
        <p>• <strong>API Key Manual:</strong> Usa tu propia clave de Google AI Studio (Veo/Gemini)</p>
        <p>• <strong>Backend con clave del usuario:</strong> Si ingresas tu API key, la enviaremos al backend en la cabecera <code>x-gemini-api-key</code> para que use tus recursos (requiere soporte en el backend).</p>
        <p>• <strong>Modo Local:</strong> Funciona sin API para efectos básicos</p>
      </div>
    </div>
  );
};
