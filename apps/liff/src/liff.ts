import liff from '@line/liff';
import type { Liff } from '@line/liff';

let liffObject: Liff | null = null;
let initPromise: Promise<void> | null = null;

export const initializeLiff = (): Promise<void> => {
  if (initPromise) {
    return initPromise;
  }
  const liffId = import.meta.env.VITE_LIFF_ID;
  if (!liffId) {
    console.error('VITE_LIFF_ID is not set.');
    return Promise.reject(new Error('LIFF ID not configured.'));
  }
  console.log('Initializing LIFF...', liffId);
  initPromise = liff.init({ liffId })
    .then(() => {
      liffObject = liff;
      console.log('LIFF initialized successfully.');
    })
    .catch((error: Error) => {
      console.error('LIFF initialization failed', error);
      initPromise = null;
      throw error;
    });
  return initPromise;
};

export const getLiff = (): Liff => {
  if (!liffObject) {
    throw new Error('LIFF is not initialized. Call initializeLiff() first.');
  }
  return liffObject;
}; 