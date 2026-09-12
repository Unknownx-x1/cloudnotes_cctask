export type NoteType = 'note' | 'task' | 'reminder' | 'idea';
export type NoteCategory = 'personal' | 'college' | 'work' | 'projects' | 'ideas' | 'other';
export type NotePriority = 'low' | 'medium' | 'high';

export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  category: NoteCategory;
  priority: NotePriority;
  tags: string[];
  date: string;
  dueDate?: string;
  reminderTime?: string;
  completed: boolean;
  pinned: boolean;
  archived: boolean;
  pageNumber: number;
}

const STORAGE_KEY = 'cloudnotes-local-v1';

const dateOffset = (days: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const starterNotes: Note[] = [
  {
    id: 'aws-assignment',
    title: 'AWS Assignment',
    content:
      'Finish the architecture diagram for the cloud computing assignment. Compare the cost of a serverless approach with a small EC2 setup, then add the rationale to the final page.\n\nThe quiet part is usually the hardest: decide what not to build.',
    type: 'task',
    category: 'college',
    priority: 'high',
    tags: ['cloud', 'university'],
    date: dateOffset(0),
    dueDate: dateOffset(1),
    completed: false,
    pinned: true,
    archived: false,
    pageNumber: 47,
  },
  {
    id: 'morning-pages',
    title: 'A slower morning',
    content:
      'There is a useful kind of momentum that comes from not rushing the first hour. Tea, a clean desk, and one page before the messages begin. I want to keep making space for the thoughts that do not arrive on demand.',
    type: 'note',
    category: 'personal',
    priority: 'low',
    tags: ['reflection', 'morning'],
    date: dateOffset(0),
    completed: false,
    pinned: false,
    archived: false,
    pageNumber: 46,
  },
  {
    id: 'dbms-revision',
    title: 'DBMS Revision',
    content:
      'Review normalization, indexing, and transaction schedules. Make a one-page summary from memory before checking the lecture notes. The examples with lost updates still feel slippery.',
    type: 'task',
    category: 'college',
    priority: 'medium',
    tags: ['revision', 'database'],
    date: dateOffset(-1),
    dueDate: dateOffset(2),
    completed: true,
    pinned: false,
    archived: false,
    pageNumber: 45,
  },
  {
    id: 'project-idea',
    title: 'Project Idea',
    content:
      'A tiny digital garden for half-formed questions. Each note could carry a season, a confidence level, and one generous next step. Keep the interface quiet enough that the idea stays in the foreground.',
    type: 'idea',
    category: 'ideas',
    priority: 'medium',
    tags: ['side project', 'writing'],
    date: dateOffset(-3),
    completed: false,
    pinned: true,
    archived: false,
    pageNumber: 44,
  },
  {
    id: 'weekend-plans',
    title: 'Weekend Plans',
    content:
      'Saturday: walk to the market early, pick up the good bread, and give the apartment a proper reset. Sunday can be for the long reading list and calling home.',
    type: 'reminder',
    category: 'personal',
    priority: 'low',
    tags: ['weekend', 'home'],
    date: dateOffset(-8),
    reminderTime: '09:00',
    completed: false,
    pinned: false,
    archived: false,
    pageNumber: 43,
  },
  {
    id: 'portfolio-notes',
    title: 'Portfolio notes',
    content:
      'The strongest case studies are not a catalogue of features. They are a record of decisions: what changed, what stayed difficult, and what the work made possible for another person.',
    type: 'note',
    category: 'projects',
    priority: 'medium',
    tags: ['portfolio', 'work'],
    date: dateOffset(-26),
    completed: false,
    pinned: false,
    archived: true,
    pageNumber: 38,
  },
  {
    id: 'reading-list',
    title: 'Reading list for spring',
    content:
      'Collect essays about attention, a book on maps, and anything that makes ordinary systems feel newly visible. Start with one chapter each evening.',
    type: 'idea',
    category: 'other',
    priority: 'low',
    tags: ['books'],
    date: dateOffset(-41),
    completed: false,
    pinned: false,
    archived: true,
    pageNumber: 31,
  },
];

const read = (): Note[] => {
  if (typeof window === 'undefined') return starterNotes;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return starterNotes;
  try {
    return JSON.parse(stored) as Note[];
  } catch {
    return starterNotes;
  }
};

const write = (notes: Note[]) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

export const getNotes = (): Note[] => [...read()].sort((a, b) => b.date.localeCompare(a.date) || b.pageNumber - a.pageNumber);

export const getNote = (id: string): Note | undefined => read().find((note) => note.id === id);

export const syncNotesWithBackend = async (): Promise<Note[]> => {
  try {
    const res = await fetch('/api/notes');
    if (res.ok) {
      const serverNotes: Note[] = await res.json();
      if (Array.isArray(serverNotes) && serverNotes.length > 0) {
        const notesWithPages = serverNotes.map((note, index) => ({
          ...note,
          pageNumber: note.pageNumber || (serverNotes.length - index),
        }));
        write(notesWithPages);
        return getNotes();
      } else if (Array.isArray(serverNotes) && serverNotes.length === 0) {
        // Seed starter notes into backend
        for (const note of starterNotes) {
          try {
            await fetch('/api/notes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(note),
            });
          } catch {
            // ignore seed failure
          }
        }
      }
    }
  } catch (err) {
    console.warn('Backend sync unavailable, using local storage:', err);
  }
  return getNotes();
};

export const createNote = (input: Omit<Note, 'id' | 'pageNumber'>): Note => {
  const notes = read();
  const note: Note = {
    ...input,
    id: `note-${Date.now()}`,
    pageNumber: Math.max(0, ...notes.map((item) => item.pageNumber)) + 1,
  };
  write([note, ...notes]);

  fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  }).catch((err) => console.warn('Failed to save to backend:', err));

  return note;
};

export const updateNote = (id: string, changes: Partial<Note>): Note | undefined => {
  const notes = read();
  const updated = notes.map((note) => (note.id === id ? { ...note, ...changes } : note));
  write(updated);

  fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  }).catch((err) => console.warn('Failed to update in backend:', err));

  return updated.find((note) => note.id === id);
};

export const deleteNote = (id: string) => {
  write(read().filter((note) => note.id !== id));

  fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  }).catch((err) => console.warn('Failed to delete in backend:', err));
};

export const searchNotes = (query: string, notes = getNotes()): Note[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return notes;
  return notes.filter((note) =>
    [note.title, note.content, note.type, note.category, note.priority, ...note.tags].join(' ').toLowerCase().includes(needle),
  );
};

export const toggleComplete = (id: string) => updateNote(id, { completed: !getNote(id)?.completed });
export const togglePin = (id: string) => updateNote(id, { pinned: !getNote(id)?.pinned });
export const toggleArchive = (id: string) => updateNote(id, { archived: !getNote(id)?.archived });