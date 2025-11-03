import { useState, useEffect } from 'react';

export interface UserPermissions {
  canUseDirectAPI: boolean;
  canUsePuterJS: boolean;
  canUseLocal: boolean;
  hasUnlimitedQuota: boolean;
  maxVideosPerDay: number;
  canUseAdvancedModels: boolean;
}

export interface AuthState {
  apiKey: string | null;
  apiKeySource: 'manual' | 'google' | 'env' | null;
  isAuthenticated: boolean;
  permissions: UserPermissions;
  userEmail?: string;
  userName?: string;
  isPremium: boolean;
  isProPlus: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  canUseDirectAPI: false,
  canUsePuterJS: true, // Siempre disponible como fallback
  canUseLocal: true,   // Siempre disponible
  hasUnlimitedQuota: false,
  maxVideosPerDay: 5,  // Límite para usuarios sin API
  canUseAdvancedModels: false
};

const PREMIUM_PERMISSIONS: UserPermissions = {
  canUseDirectAPI: true,
  canUsePuterJS: true,
  canUseLocal: true,
  hasUnlimitedQuota: false,
  maxVideosPerDay: 50,
  canUseAdvancedModels: true
};

const PRO_PLUS_PERMISSIONS: UserPermissions = {
  canUseDirectAPI: true,
  canUsePuterJS: true,
  canUseLocal: true,
  hasUnlimitedQuota: true,
  maxVideosPerDay: -1, // Ilimitado
  canUseAdvancedModels: true
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    apiKey: null,
    apiKeySource: null,
    isAuthenticated: false,
    permissions: DEFAULT_PERMISSIONS,
    isPremium: false,
    isProPlus: false
  });

  const [dailyUsage, setDailyUsage] = useState(0);

  // Cargar estado desde localStorage al inicializar
  useEffect(() => {
    const savedAuth = localStorage.getItem('veo_auth_state');
    const savedUsage = localStorage.getItem('veo_daily_usage');
    const today = new Date().toDateString();
    const lastUsageDate = localStorage.getItem('veo_usage_date');

    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        setAuthState(parsedAuth);
      } catch (error) {
        console.error('Error parsing saved auth state:', error);
      }
    }

    // Resetear uso diario si es un nuevo día
    if (lastUsageDate !== today) {
      setDailyUsage(0);
      localStorage.setItem('veo_daily_usage', '0');
      localStorage.setItem('veo_usage_date', today);
    } else if (savedUsage) {
      setDailyUsage(parseInt(savedUsage, 10) || 0);
    }
  }, []);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('veo_auth_state', JSON.stringify(authState));
  }, [authState]);

  const updateApiKey = (apiKey: string, source: 'manual' | 'google' | 'env') => {
    let permissions = DEFAULT_PERMISSIONS;
    let isPremium = false;
    let isProPlus = false;

    if (apiKey) {
      if (source === 'google') {
        // Detectar nivel basado en la API key de Google
        if (apiKey.includes('PREMIUM')) {
          isPremium = true;
          permissions = PREMIUM_PERMISSIONS;
        }
        if (apiKey.includes('PRO_PLUS')) {
          isProPlus = true;
          permissions = PRO_PLUS_PERMISSIONS;
        }
      } else if (source === 'manual' || source === 'env') {
        // Para API keys manuales, asumir permisos premium básicos
        permissions = PREMIUM_PERMISSIONS;
      }
    }

    setAuthState(prev => ({
      ...prev,
      apiKey,
      apiKeySource: source,
      isAuthenticated: !!apiKey,
      permissions,
      isPremium,
      isProPlus
    }));
  };

  const updateUserInfo = (email: string, name: string, isPremium: boolean, isProPlus: boolean) => {
    setAuthState(prev => ({
      ...prev,
      userEmail: email,
      userName: name,
      isPremium,
      isProPlus,
      permissions: isProPlus ? PRO_PLUS_PERMISSIONS : 
                   isPremium ? PREMIUM_PERMISSIONS : 
                   DEFAULT_PERMISSIONS
    }));
  };

  const incrementDailyUsage = () => {
    const newUsage = dailyUsage + 1;
    setDailyUsage(newUsage);
    localStorage.setItem('veo_daily_usage', newUsage.toString());
    localStorage.setItem('veo_usage_date', new Date().toDateString());
  };

  const canGenerateVideo = (): { allowed: boolean; reason?: string } => {
    const { permissions } = authState;
    
    if (permissions.hasUnlimitedQuota) {
      return { allowed: true };
    }

    if (permissions.maxVideosPerDay === -1) {
      return { allowed: true };
    }

    if (dailyUsage >= permissions.maxVideosPerDay) {
      return { 
        allowed: false, 
        reason: `Has alcanzado el límite diario de ${permissions.maxVideosPerDay} videos. ${
          !authState.isAuthenticated ? 'Conecta tu cuenta Google o ingresa una API key para aumentar el límite.' : 
          'Intenta mañana o actualiza a Pro+ para uso ilimitado.'
        }`
      };
    }

    return { allowed: true };
  };

  const getAvailableMethods = () => {
    const methods = [];
    
    if (authState.permissions.canUseDirectAPI && authState.apiKey) {
      methods.push({
        id: 'direct',
        name: 'Direct API',
        description: 'Usa tu API key directamente',
        premium: authState.isPremium || authState.isProPlus
      });
    }

    if (authState.permissions.canUsePuterJS) {
      methods.push({
        id: 'puter',
        name: 'Via Puter.js',
        description: 'Método alternativo (puede tener límites)',
        premium: false
      });
    }

    if (authState.permissions.canUseLocal) {
      methods.push({
        id: 'local',
        name: 'Local (sin API)',
        description: 'Efectos básicos sin usar cuota',
        premium: false
      });
    }

    return methods;
  };

  const logout = () => {
    setAuthState({
      apiKey: null,
      apiKeySource: null,
      isAuthenticated: false,
      permissions: DEFAULT_PERMISSIONS,
      isPremium: false,
      isProPlus: false
    });
    localStorage.removeItem('veo_auth_state');
  };

  return {
    ...authState,
    dailyUsage,
    updateApiKey,
    updateUserInfo,
    incrementDailyUsage,
    canGenerateVideo,
    getAvailableMethods,
    logout
  };
};