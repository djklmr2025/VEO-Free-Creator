
import { useState, useCallback, useEffect } from 'react';

export const useVeoApiKey = () => {
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkKey = useCallback(async () => {
    setIsChecking(true);
    try {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      } else {
        // Fallback for environments where aistudio is not available
        console.warn("aistudio API not found. Assuming API key is set via environment variable.");
        setIsKeySelected(true); 
      }
    } catch (error) {
      console.error('Error checking for API key:', error);
      setIsKeySelected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const selectKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        // Assume success after opening dialog to handle race condition
        setIsKeySelected(true);
      } catch (error) {
        console.error('Error opening select key dialog:', error);
      }
    } else {
       alert("API key selection is not available in this environment.");
    }
  }, []);
  
  const resetKey = useCallback(() => {
    setIsKeySelected(false);
  }, []);


  useEffect(() => {
    checkKey();
  }, [checkKey]);

  return { isKeySelected, isChecking, selectKey, checkKey, resetKey };
};
