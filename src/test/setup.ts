import '@testing-library/jest-dom';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

// Global setup for Vitest
globalThis.indexedDB = indexedDB;
globalThis.IDBKeyRange = IDBKeyRange;
