import { db } from './firebase';
import { collection, doc, getDocs, setDoc, query, orderBy } from "firebase/firestore";
import { DiaryEntry, ChatMessage } from '../types';

const COLLECTION_DIARY = 'diary_entries';
const COLLECTION_CHAT = 'chat_history';

// Helper to check if we are using Firestore
const isCloudEnabled = () => !!db;

export const storageService = {
  
  async loadEntries(): Promise<Record<string, DiaryEntry>> {
    if (isCloudEnabled()) {
      try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_DIARY));
        const entries: Record<string, DiaryEntry> = {};
        querySnapshot.forEach((doc) => {
          entries[doc.id] = doc.data() as DiaryEntry;
        });
        return entries;
      } catch (e) {
        console.error("Firestore Load Error:", e);
        return {};
      }
    } else {
      // Fallback
      const saved = localStorage.getItem('mindful_journal_entries');
      return saved ? JSON.parse(saved) : {};
    }
  },

  async saveEntry(entry: DiaryEntry): Promise<void> {
    if (isCloudEnabled()) {
      try {
        await setDoc(doc(db, COLLECTION_DIARY, entry.date), entry);
      } catch (e) {
        console.error("Firestore Save Error:", e);
      }
    } else {
      // Fallback
      const saved = localStorage.getItem('mindful_journal_entries');
      const entries = saved ? JSON.parse(saved) : {};
      entries[entry.date] = entry;
      localStorage.setItem('mindful_journal_entries', JSON.stringify(entries));
    }
  },

  async loadChat(): Promise<ChatMessage[]> {
    if (isCloudEnabled()) {
      try {
        // We store chat as a single document for simplicity in this demo, 
        // or a collection of messages. Let's use a collection for scalability.
        const q = query(collection(db, COLLECTION_CHAT), orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);
        const history: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            history.push(doc.data() as ChatMessage);
        });
        
        if (history.length === 0) return [];
        return history;
      } catch (e) {
        console.error("Firestore Chat Load Error:", e);
        return [];
      }
    } else {
      const saved = localStorage.getItem('mindful_journal_chat');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveMessage(message: ChatMessage): Promise<void> {
    if (isCloudEnabled()) {
      try {
        // Use ID as doc ID
        await setDoc(doc(db, COLLECTION_CHAT, message.id), message);
      } catch (e) {
        console.error("Firestore Chat Save Error:", e);
      }
    } else {
      const saved = localStorage.getItem('mindful_journal_chat');
      const history = saved ? JSON.parse(saved) : [];
      history.push(message);
      localStorage.setItem('mindful_journal_chat', JSON.stringify(history));
    }
  }
};