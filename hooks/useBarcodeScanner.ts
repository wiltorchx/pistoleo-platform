"use client";

import { useEffect } from 'react';

export function useBarcodeScanner(onScan: (upc: string) => void) {
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // USB Scanners act as keyboards and type very fast.
      // If time between keys is > 50ms, it's likely manual typing.
      if (currentTime - lastKeyTime > 50) {
        buffer = ""; 
      }
      
      if (e.key === 'Enter') {
        if (buffer.length > 0) {
          onScan(buffer);
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
      
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);
}
