
import { Reading } from '../types';

const DB_NAME = 'JiramaDB';
const STORE_NAME = 'readings';
const DRAFT_KEY = 'draft_reading';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const storageService = {
  saveReading: async (reading: Reading) => {
    const db = await openDB();
    // Fix: Using 'readwrite' instead of 'read-write' which is the correct IDBTransactionMode
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).put(reading);
    storageService.clearDraft();
  },

  updateReading: async (reading: Reading) => {
    const db = await openDB();
    // Fix: Using 'readwrite' instead of 'read-write' which is the correct IDBTransactionMode
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).put(reading);
    storageService.clearDraft();
  },

  getAllReadings: async (): Promise<Reading[]> => {
    const db = await openDB();
    return new Promise((resolve) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
    });
  },

  deleteReading: async (id: string) => {
    const db = await openDB();
    // Fix: Using 'readwrite' instead of 'read-write' which is the correct IDBTransactionMode
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    const draft = storageService.getDraft();
    if (draft && draft.id === id) storageService.clearDraft();
  },

  saveDraft: (reading: Reading) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(reading));
  },

  getDraft: (): Reading | null => {
    const data = localStorage.getItem(DRAFT_KEY);
    return data ? JSON.parse(data) : null;
  },

  clearDraft: () => {
    localStorage.removeItem(DRAFT_KEY);
  },

  groupPhotosByDept: (reading: Reading) => {
    const grouped: Record<string, string[]> = {};
    reading.photos.forEach(p => {
      if (!grouped[p.department]) grouped[p.department] = [];
      grouped[p.department].push(p.dataUrl);
    });
    return grouped;
  }
};
