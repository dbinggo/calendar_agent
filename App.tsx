import React, { useState, useEffect } from 'react';
import { DiaryEntry, ChatMessage } from './types';
import { formatDateKey } from './utils/dateUtils';
import Calendar from './components/Calendar';
import ChatInterface from './components/ChatInterface';
import DiaryEntryView from './components/DiaryEntryView';
import { generateAgentResponse } from './services/geminiService';

const App: React.FC = () => {
  // State: Diary Entries (Persisted in LocalStorage)
  const [diaryEntries, setDiaryEntries] = useState<Record<string, DiaryEntry>>(() => {
    const saved = localStorage.getItem('mindful_journal_entries');
    return saved ? JSON.parse(saved) : {};
  });

  // State: Chat History (Persisted)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('mindful_journal_chat');
    return saved ? JSON.parse(saved) : [{
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am your personal diary agent. How was your day? I can help you write your entry for today or find past memories.',
      timestamp: Date.now()
    }];
  });

  // State: UI
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isProcessing, setIsProcessing] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('mindful_journal_entries', JSON.stringify(diaryEntries));
  }, [diaryEntries]);

  useEffect(() => {
    localStorage.setItem('mindful_journal_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleManualSave = (content: string) => {
    const key = formatDateKey(selectedDate);
    const updatedEntry: DiaryEntry = {
      date: key,
      content,
      lastUpdated: Date.now(),
      mood: 'neutral' // Could be enhanced with analysis
    };
    
    setDiaryEntries(prev => ({
      ...prev,
      [key]: updatedEntry
    }));
  };

  const handleSendMessage = async (text: string) => {
    // Optimistic UI update
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const selectedDateKey = formatDateKey(selectedDate);
      
      const { text: responseText, toolCalls } = await generateAgentResponse(
        [...chatHistory, userMsg],
        diaryEntries,
        selectedDateKey,
        text
      );

      // Handle Tool Calls (e.g., Update Diary)
      let finalResponseText = responseText;

      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
          if (call.name === 'updateDiary') {
            const { date, content, mood } = call.args;
            
            // Execute Tool
            setDiaryEntries(prev => ({
              ...prev,
              [date]: {
                date,
                content,
                mood: mood || 'neutral',
                lastUpdated: Date.now()
              }
            }));
            
            // Provide feedback if the model didn't explicitly say something about the update
            if (!finalResponseText) {
                finalResponseText = `I've updated your diary entry for ${date}.`;
            }
            
            // If the updated date is different from selected, switch view? 
            // Optional, but staying on selected is safer or switching to the updated one.
            // Let's switch to the updated date if it's not the current one.
            const updatedDateObj = new Date(date + 'T12:00:00'); // Avoiding timezone shifts
            if (formatDateKey(updatedDateObj) !== selectedDateKey) {
                setSelectedDate(updatedDateObj);
            }
          }
        }
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: finalResponseText || "I've processed that for you.",
        timestamp: Date.now()
      };

      setChatHistory(prev => [...prev, modelMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered an error connecting to my services. Please try again.",
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedDateKey = formatDateKey(selectedDate);
  const currentEntry = diaryEntries[selectedDateKey];

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
             <p className="text-xs text-stone-500 font-medium">AI-Powered Reflection</p>
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
          
          {/* Quick Info / Hints */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
             <h4 className="font-semibold text-stone-700 mb-2 text-sm">Suggestions</h4>
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
