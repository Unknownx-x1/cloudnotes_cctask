import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";

// Locate notes.db in the backend folder or from DB_PATH env var
const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), "notes.db");

// Ensure directory exists if custom path provided (e.g. /data/notes.db)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Create the notes table if it does not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'note',
    category TEXT DEFAULT 'personal',
    priority TEXT DEFAULT 'medium',
    tags TEXT DEFAULT '[]',
    date TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    pinned INTEGER DEFAULT 0,
    archived INTEGER DEFAULT 0
  );
`);

export interface NoteRow {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  priority: string;
  tags: string; // JSON array string e.g. '["college","aws"]'
  date: string;
  completed: number;
  pinned: number;
  archived: number;
}

// 1. READ ALL: Fetch all notes ordered newest first
export function getAllNotes(): NoteRow[] {
  const statement = db.prepare("SELECT * FROM notes ORDER BY date DESC");
  return statement.all() as unknown as NoteRow[];
}

// 2. READ ONE: Fetch single note by ID
export function getNoteById(id: string): NoteRow | undefined {
  const statement = db.prepare("SELECT * FROM notes WHERE id = ?");
  return statement.get(id) as unknown as NoteRow | undefined;
}

// 3. CREATE: Insert a new note into SQLite
export function insertNote(note: NoteRow): NoteRow {
  const statement = db.prepare(`
    INSERT INTO notes (id, title, content, type, category, priority, tags, date, completed, pinned, archived)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  statement.run(
    note.id,
    note.title,
    note.content,
    note.type,
    note.category,
    note.priority,
    note.tags,
    note.date,
    note.completed,
    note.pinned,
    note.archived,
  );
  return note;
}

// 4. UPDATE: Modify an existing note in SQLite
export function updateNoteInDb(
  id: string,
  fields: Partial<NoteRow>,
): NoteRow | null {
  const existing = getNoteById(id);
  if (!existing) return null;

  const updated: NoteRow = {
    ...existing,
    ...fields,
  };

  const statement = db.prepare(`
    UPDATE notes
    SET title = ?, content = ?, type = ?, category = ?, priority = ?, tags = ?, completed = ?, pinned = ?, archived = ?
    WHERE id = ?
  `);
  statement.run(
    updated.title,
    updated.content,
    updated.type,
    updated.category,
    updated.priority,
    updated.tags,
    updated.completed,
    updated.pinned,
    updated.archived,
    id,
  );
  return updated;
}

// 5. DELETE: Remove a note by ID
export function deleteNoteFromDb(id: string): boolean {
  const statement = db.prepare("DELETE FROM notes WHERE id = ?");
  const result = statement.run(id);
  return (result.changes as number) > 0;
}
