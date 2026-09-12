import { Router } from "express";
import {
  getAllNotes,
  getNoteById,
  insertNote,
  updateNoteInDb,
  deleteNoteFromDb,
  type NoteRow,
} from "../lib/database";

const router = Router();

// Helper: Convert SQLite row to clean JSON for the client
function formatNote(row: NoteRow) {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags || "[]");
  } catch {
    tags = [];
  }
  return {
    ...row,
    tags,
    completed: Boolean(row.completed),
    pinned: Boolean(row.pinned),
    archived: Boolean(row.archived),
  };
}

// 1. GET /api/notes - Fetch all notes
router.get("/", (_req, res) => {
  const rows = getAllNotes();
  res.json(rows.map(formatNote));
});

// 2. GET /api/notes/:id - Fetch single note
router.get("/:id", (req, res) => {
  const row = getNoteById(req.params.id);
  if (!row) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json(formatNote(row));
});

// 3. POST /api/notes - Create a new note
router.post("/", (req, res) => {
  const { title, content, type, category, priority, tags, date } = req.body;

  if (!title || !content) {
    res.status(400).json({ error: "Title and content are required." });
    return;
  }

  const newNote: NoteRow = {
    id: req.body.id || `note-${Date.now()}`,
    title,
    content,
    type: type || "note",
    category: category || "personal",
    priority: priority || "medium",
    tags: JSON.stringify(Array.isArray(tags) ? tags : []),
    date: date || new Date().toISOString().slice(0, 10),
    completed: req.body.completed ? 1 : 0,
    pinned: req.body.pinned ? 1 : 0,
    archived: req.body.archived ? 1 : 0,
  };

  insertNote(newNote);
  res.status(201).json(formatNote(newNote));
});

// 4. PUT /api/notes/:id - Update an existing note
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const updates: Partial<NoteRow> = {};

  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.content !== undefined) updates.content = req.body.content;
  if (req.body.type !== undefined) updates.type = req.body.type;
  if (req.body.category !== undefined) updates.category = req.body.category;
  if (req.body.priority !== undefined) updates.priority = req.body.priority;
  if (req.body.tags !== undefined) {
    updates.tags = JSON.stringify(Array.isArray(req.body.tags) ? req.body.tags : []);
  }
  if (req.body.date !== undefined) updates.date = req.body.date;
  if (req.body.completed !== undefined) updates.completed = req.body.completed ? 1 : 0;
  if (req.body.pinned !== undefined) updates.pinned = req.body.pinned ? 1 : 0;
  if (req.body.archived !== undefined) updates.archived = req.body.archived ? 1 : 0;

  const updated = updateNoteInDb(id, updates);
  if (!updated) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(formatNote(updated));
});

// 5. DELETE /api/notes/:id - Delete a note
router.delete("/:id", (req, res) => {
  const success = deleteNoteFromDb(req.params.id);
  if (!success) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json({ success: true, message: `Note ${req.params.id} deleted.` });
});

export default router;
