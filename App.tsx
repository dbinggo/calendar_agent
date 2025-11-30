import React, { useState, useEffect } from 'react';
import { DiaryEntry, ChatMessage } from './types';
import { formatDateKey } from './utils/dateUtils';
import Calendar from './components/Calendar';
import ChatInterface from './components/ChatInterface';
import DiaryEntryView from './components/DiaryEntryView';
import { generateAgentResponse } from './services/geminiService';
import { storageService } from './services/storage';

const App: React.FC = () => {
  // State
  const [diaryEntries, setDiaryEntries] = useState<Record<string, DiaryEntry>>({});
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [entries, chat] = await Promise.all([
          storageService.loadEntries(),
          storageService.loadChat()
        ]);
        
        setDiaryEntries(entries);
        
        if (chat.length === 0) {
            setChatHistory([{
                id: 'welcome',
                role: 'model',
                text: 'Hello! I am your personal diary agent. I am connected to your Google Database. How was your day?',
                timestamp: Date.now()
            }]);
        } else {
            setChatHistory(chat);
        }
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleManualSave = async (content: string) => {
    const key = formatDateKey(selectedDate);
    const updatedEntry: DiaryEntry = {
      date: key,
      content,
      lastUpdated: Date.now(),
      mood: 'neutral'
    };
    
    // Optimistic Update
    setDiaryEntries(prev => ({ ...prev, [key]: updatedEntry }));
    
    // Persist
    await storageService.saveEntry(updatedEntry);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    
    // Optimistic & Persist User Msg
    setChatHistory(prev => [...prev, userMsg]);
    storageService.saveMessage(userMsg); // Fire and forget
    
    setIsProcessing(true);

    try {
      const selectedDateKey = formatDateKey(selectedDate);
      
      const { text: responseText, toolCalls } = await generateAgentResponse(
        [...chatHistory, userMsg],
        diaryEntries,
        selectedDateKey,
        text
      );

      let finalResponseText = responseText;

      // Handle Tool Calls (Database Updates)
      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
          if (call.name === 'updateDiary') {
            const { date, content, mood } = call.args;
            
            const updatedEntry: DiaryEntry = {
                date,
                content,
                mood: mood || 'neutral',
                lastUpdated: Date.now()
            };

            // Update State
            setDiaryEntries(prev => ({
              ...prev,
              [date]: updatedEntry
            }));
            
            // Persist to DB
            await storageService.saveEntry(updatedEntry);
            
            if (!finalResponseText) {
                finalResponseText = `I've saved that entry for ${date}.`;
            }
            
            const updatedDateObj = new Date(date + 'T12:00:00');
            if (formatDateKey(updatedDateObj) !== selectedDateKey) {
                setSelectedDate(updatedDateObj);
            }
          }
        }
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: finalResponseText || "I've processed that.",
        timestamp: Date.now()
      };

      setChatHistory(prev => [...prev, modelMsg]);
      await storageService.saveMessage(modelMsg);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered an error interacting with the database/agent. Please try again.",
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedDateKey = formatDateKey(selectedDate);
  const currentEntry = diaryEntries[selectedDateKey];

  if (isLoadingData) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-stone-100 text-stone-500">
              <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p>Loading your journal...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
             <h1 className="text-xl font-bold text-stone-800 tracking-tight">MindfulJournal</h1>
             <p className="text-xs text-stone-500 font-medium">AI Agent + Google Firestore</p>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Sidebar: Calendar & Stats (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-1">
          <Calendar 
            currentDate={new Date()} 
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect} 
            entries={diaryEntries}
          />
          
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
             <h4 className="font-semibold text-stone-700 mb-2 text-sm">Ask your Journal</h4>
             <ul className="text-sm text-stone-500 space-y-2">
                 <li className="flex gap-2 items-start cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSendMessage("What did I do last weekend?")}>
                    <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                    "What did I do last weekend?"
                 </li>
                 <li className="flex gap-2 items-start cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSendMessage("Write a diary entry about a peaceful morning coffee.")}>
                    <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                    "Write an entry about coffee."
                 </li>
                 <li className="flex gap-2 items-start cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSendMessage("Analyze my mood over the last few entries.")}>
                    <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                    "Analyze my mood."
                 </li>
             </ul>
          </div>
        </div>

        {/* Center: Chat (4 Cols) */}
        <div className="lg:col-span-4 h-full min-h-[500px]">
          <ChatInterface 
            messages={chatHistory} 
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
          />
        </div>

        {/* Right: Diary View (5 Cols) */}
        <div className="lg:col-span-5 h-full min-h-[500px]">
          <DiaryEntryView 
            date={selectedDate} 
            entry={currentEntry} 
            onSave={handleManualSave}
          />
        </div>

      </div>
    </div>
  );
};

export default App;