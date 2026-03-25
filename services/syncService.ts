
import { diagnoseCrop } from './geminiService';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface SyncItem {
  id: string;
  type: 'DIAGNOSIS' | 'MARKET_LISTING' | 'FORUM_QUESTION';
  payload: any;
  timestamp: number;
}

const STORAGE_KEY = 'shega_farm_sync_queue';

export const SyncService = {
  getQueue(): SyncItem[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  enqueue(item: Omit<SyncItem, 'id' | 'timestamp'>) {
    const queue = this.getQueue();
    const newItem: SyncItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    queue.push(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return newItem;
  },

  async processQueue(onProgress: (id: string, success: boolean) => void, language: string = 'English'): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    const remainingQueue: SyncItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'DIAGNOSIS') {
          const result = await diagnoseCrop(item.payload.image, item.payload.cropType, language);
          await addDoc(collection(db, "diagnoses"), {
            ...item.payload,
            result,
            syncedAt: serverTimestamp(),
            language
          });
        } else if (item.type === 'MARKET_LISTING') {
          await addDoc(collection(db, "market_listings"), {
            ...item.payload,
            syncedAt: serverTimestamp()
          });
        } else if (item.type === 'FORUM_QUESTION') {
          await addDoc(collection(db, "forum_questions"), {
            ...item.payload,
            syncedAt: serverTimestamp()
          });
        }
        onProgress(item.id, true);
      } catch (err) {
        console.error(`Sync failed for item ${item.id}:`, err);
        remainingQueue.push(item);
        onProgress(item.id, false);
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue));
  },

  hasPending(): boolean {
    return this.getQueue().length > 0;
  }
};
