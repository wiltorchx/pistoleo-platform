'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface InventoryItem {
  upc: string;
  description: string;
  quantity: number;
}

interface InventoryWizardContextType {
  pendingItems: InventoryItem[];
  setPendingItems: (items: InventoryItem[]) => void;
  clearPendingItems: () => void;
  currentBatchId: string | null;
  setCurrentBatchId: (batchId: string | null) => void;
}

const InventoryWizardContext = createContext<InventoryWizardContextType | null>(null);

export function InventoryWizardProvider({ children }: { children: ReactNode }) {
  const [pendingItems, setPendingItemsState] = useState<InventoryItem[]>([]);
  const [currentBatchId, setCurrentBatchIdState] = useState<string | null>(null);

  const setPendingItems = useCallback((items: InventoryItem[]) => {
    setPendingItemsState(items);
  }, []);

  const clearPendingItems = useCallback(() => {
    setPendingItemsState([]);
    setCurrentBatchIdState(null);
  }, []);

  const setCurrentBatchId = useCallback((batchId: string | null) => {
    setCurrentBatchIdState(batchId);
  }, []);

  return (
    <InventoryWizardContext.Provider value={{
      pendingItems,
      setPendingItems,
      clearPendingItems,
      currentBatchId,
      setCurrentBatchId,
    }}>
      {children}
    </InventoryWizardContext.Provider>
  );
}

export function useInventoryWizard() {
  const context = useContext(InventoryWizardContext);
  if (!context) {
    throw new Error('useInventoryWizard must be used within an InventoryWizardProvider');
  }
  return context;
}