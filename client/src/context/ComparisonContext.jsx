import React, { createContext, useContext, useState, useEffect } from 'react';
import { compareSamples, compareFiles } from '../services/api.js';

const ComparisonContext = createContext(null);

export function ComparisonProvider({ children }) {
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-load financial sample on first mount so user instantly experiences active intelligence
  useEffect(() => {
    async function initSample() {
      try {
        setIsLoading(true);
        const data = await compareSamples('financial');
        setComparisonData(data);
      } catch (err) {
        console.warn('Initial sample load failed, awaiting user upload:', err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (!comparisonData) {
      initSample();
    }
  }, []);

  const loadSample = async (sampleKey) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await compareSamples(sampleKey);
      setComparisonData(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAndCompare = async (originalFile, modifiedFile) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await compareFiles(originalFile, modifiedFile);
      setComparisonData(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setComparisonData(null);
    setError(null);
  };

  return (
    <ComparisonContext.Provider
      value={{
        comparisonData,
        isLoading,
        error,
        loadSample,
        uploadAndCompare,
        clearData
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}
