import { useEffect, useState } from 'react';

export const useAdminResource = (factory, deps = []) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    window.setTimeout(() => {
      if (!mounted) return;
      try {
        setData(factory());
      } catch (resourceError) {
        setError(resourceError.message || 'No pudimos cargar la informacion.');
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      mounted = false;
    };
  }, deps);

  return { data, setData, isLoading, error };
};
