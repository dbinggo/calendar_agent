import React from 'react';
import { DiaryEntry } from '../types';

interface DiaryEntryViewProps {
  date: Date;
  entry?: DiaryEntry;
  onSave: (content: string) => void;
}

const DiaryEntryView: React.FC<DiaryEntryViewProps> = ({ date, entry, onSave }) => {
  const [content, setContent] = React.useState(entry?.content || '');
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    setContent(entry?.content || '');
    // If no entry exists, we might want to default to editing mode, or just view blank
    setIsEditing(false);
  }, [entry, date]);

  const handleSave = () => {
    onSave(content);
    setIsEditing(false);
  };

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white h-full rounded-xl shadow-sm border border-stone-200 flex flex-col relative overflow-hidden">
        {/* Paper texture overlay effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/cream-paper.png')` }}>
        </div>

      <div className="p-8 border-b border-stone-100 flex justify-between items-start z-10">
        <div>
          <h1 className="text-3xl font-serif text-stone-800 mb-1">{formattedDate}</h1>
          <p className="text-stone-400 text-sm font-medium uppercase tracking-wide">
            {entry?.mood ? `Mood: ${entry.mood}` : 'Daily Entry'}
          </p>
        </div>
        
        <button
          onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
          }}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${isEditing 
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}
          `}
        >
          {isEditing ? 'Save Entry' : 'Edit'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 z-10">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none outline-none font-serif text-lg text-stone-700 leading-loose bg-transparent placeholder-stone-300"
            placeholder="Start writing your day here..."
            autoFocus
          />
        ) : (
          <div className="prose prose-stone max-w-none">
             {content ? (
                 content.split('\n').map((paragraph, idx) => (
                     <p key={idx} className="font-serif text-lg text-stone-700 leading-loose mb-4">
                         {paragraph}
                     </p>
                 ))
             ) : (
                 <div className="flex flex-col items-center justify-center h-64 text-stone-300">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                     </svg>
                     <p>Page is empty.</p>
                     <p className="text-sm">Write manually or ask the agent to help.</p>
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryEntryView;
