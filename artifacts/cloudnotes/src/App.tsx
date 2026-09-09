import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Archive,
  ArrowLeft,
  Bookmark,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Command,
  Inbox,
  Layers3,
  Menu,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  createNote,
  deleteNote,
  getNotes,
  searchNotes,
  toggleArchive,
  toggleComplete,
  togglePin,
  updateNote,
  type Note,
  type NoteCategory,
  type NotePriority,
  type NoteType,
} from '@/lib/notes-service';

const queryClient = new QueryClient();

const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = (value: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en', options ?? { weekday: 'long', month: 'long', day: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );
const shortDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
const monthLabel = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(`${value}-01T12:00:00`));
const offsetDate = (base: string, offset: number) => {
  const result = new Date(`${base}T12:00:00`);
  result.setDate(result.getDate() + offset);
  return result.toISOString().slice(0, 10);
};

type Filters = { type: string; category: string; priority: string };

function AppShell({
  children,
  notes,
  onNew,
}: {
  children: React.ReactNode;
  notes: Note[];
  onNew: () => void;
}) {
  const [location, setLocation] = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  const active = location === '/' ? 'today' : location.startsWith('/archive') ? 'archive' : 'search';
  const pinned = notes.filter((note) => note.pinned && !note.archived).length;

  const navigate = (path: string) => {
    setLocation(path);
    setMobileNav(false);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground paper-grain">
      <header className="fixed inset-x-0 top-0 z-30 flex h-[68px] items-center justify-between border-b border-border/80 bg-[hsl(var(--background)/.94)] px-5 backdrop-blur-md lg:hidden">
        <Link href="/" className="flex items-center gap-2 text-foreground" data-testid="link-mobile-logo">
          <span className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
            <BookOpen size={16} strokeWidth={1.8} />
          </span>
          <span className="font-journal text-lg">CloudNotes</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileNav((open) => !open)}
          aria-label={mobileNav ? 'Close navigation' : 'Open navigation'}
          className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"
          data-testid="button-mobile-navigation"
        >
          {mobileNav ? <X size={19} /> : <Menu size={19} />}
        </button>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-border bg-sidebar px-6 py-7 transition-transform duration-300 lg:translate-x-0 ${
          mobileNav ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="mb-12 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center bg-primary text-primary-foreground">
            <BookOpen size={18} strokeWidth={1.7} />
          </span>
          <div>
            <p className="font-journal text-[17px] leading-none">CloudNotes</p>
            <p className="mt-1 font-mono-note text-[9px] uppercase tracking-[.18em] text-muted-foreground">personal edition</p>
          </div>
        </div>

        <div className="mb-3 px-2 font-mono-note text-[9px] uppercase tracking-[.2em] text-muted-foreground">Your notebook</div>
        <nav className="space-y-1" aria-label="Primary navigation">
          <NavItem active={active === 'today'} icon={<BookOpen size={16} />} label="Today" onClick={() => navigate('/')} testId="link-nav-today" />
          <NavItem active={active === 'archive'} icon={<Archive size={16} />} label="Archive" onClick={() => navigate('/archive')} testId="link-nav-archive" />
          <NavItem active={active === 'search'} icon={<Search size={16} />} label="Search pages" onClick={() => navigate('/search')} testId="link-nav-search" />
        </nav>

        <div className="my-8 border-t border-sidebar-border" />
        <div className="mb-3 px-2 font-mono-note text-[9px] uppercase tracking-[.2em] text-muted-foreground">A little index</div>
        <div className="space-y-2 px-2 text-[12px] text-muted-foreground">
          <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Pin size={13} />Pinned pages</span><span className="font-mono-note text-[10px]">{pinned}</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Layers3 size={13} />All pages</span><span className="font-mono-note text-[10px]">{notes.length}</span></div>
        </div>

        <div className="mt-auto border-t border-sidebar-border pt-5">
          <button type="button" onClick={onNew} className="group flex w-full items-center justify-between border border-primary/40 px-3 py-3 text-left text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground" data-testid="button-sidebar-new-entry">
            <span className="flex items-center gap-2"><Plus size={15} />New page</span>
            <span className="font-mono-note text-[10px] opacity-60">N</span>
          </button>
          <p className="mt-5 px-1 font-journal text-[12px] italic leading-relaxed text-muted-foreground">Keep the thoughts that would otherwise drift away.</p>
        </div>
      </aside>

      {mobileNav && <button type="button" aria-label="Close navigation overlay" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" data-testid="button-navigation-overlay" />}
      <main className="min-h-[100dvh] pt-[68px] lg:ml-[248px] lg:pt-0">{children}</main>
    </div>
  );
}

function NavItem({ active, icon, label, onClick, testId }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; testId: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`} data-testid={testId}>
      {icon}<span>{label}</span>{active && <span className="ml-auto size-1 rounded-full bg-primary-foreground" />}
    </button>
  );
}

function App() {
  const [notes, setNotes] = useState<Note[]>(() => getNotes());
  const [modal, setModal] = useState<{ open: boolean; note?: Note }>({ open: false });
  const [toast, setToast] = useState('');

  const refresh = (message?: string) => {
    setNotes(getNotes());
    if (message) {
      setToast(message);
      window.setTimeout(() => setToast(''), 2200);
    }
  };
  const handleCreate = (input: Omit<Note, 'id' | 'pageNumber'>) => {
    const created = createNote(input);
    setModal({ open: false });
    refresh('Page added to your notebook');
    return created;
  };
  const handleUpdate = (id: string, changes: Partial<Note>) => {
    updateNote(id, changes);
    refresh('Page saved');
  };
  const handleDelete = (id: string) => {
    deleteNote(id);
    refresh('Page removed');
  };
  const handleToggle = (action: 'complete' | 'pin' | 'archive', id: string) => {
    if (action === 'complete') toggleComplete(id);
    if (action === 'pin') togglePin(id);
    if (action === 'archive') toggleArchive(id);
    refresh(action === 'complete' ? 'Task updated' : action === 'pin' ? 'Bookmark updated' : 'Archive updated');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppShell notes={notes} onNew={() => setModal({ open: true })}>
            <RoutedErrorBoundary>
              <Switch>
                <Route path="/">
                  <HomePage notes={notes} onNew={() => setModal({ open: true })} onToggle={handleToggle} onEdit={(note) => setModal({ open: true, note })} onDelete={handleDelete} />
                </Route>
                <Route path="/entry/:id">
                  <EntryPage notes={notes} onToggle={handleToggle} onEdit={(note) => setModal({ open: true, note })} onDelete={handleDelete} />
                </Route>
                <Route path="/archive">
                  <ArchivePage notes={notes} onToggle={handleToggle} onEdit={(note) => setModal({ open: true, note })} onDelete={handleDelete} />
                </Route>
                <Route path="/search">
                  <SearchPage notes={notes} onToggle={handleToggle} onEdit={(note) => setModal({ open: true, note })} onDelete={handleDelete} />
                </Route>
                <Route component={NotFound} />
              </Switch>
            </RoutedErrorBoundary>
          </AppShell>
          {modal.open && <NoteModal note={modal.note} onClose={() => setModal({ open: false })} onCreate={handleCreate} onUpdate={handleUpdate} />}
          {toast && <div role="status" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 border border-primary/20 bg-foreground px-4 py-3 text-xs text-background shadow-xl page-in" data-testid="status-toast">{toast}</div>}
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <header className="mx-auto flex max-w-[1080px] flex-col gap-5 px-5 pb-8 pt-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-14 lg:pt-16">
      <div className="fade-up">
        <p className="mb-3 flex items-center gap-2 font-mono-note text-[10px] uppercase tracking-[.2em] text-primary"><span className="h-px w-6 bg-primary" />{eyebrow}</p>
        <h1 className="font-journal text-4xl leading-tight tracking-[-.025em] text-foreground sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-[530px] text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action && <div className="fade-up-delay">{action}</div>}
    </header>
  );
}

function HomePage({ notes, onNew, onToggle, onEdit, onDelete }: NoteListProps & { onNew: () => void }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [filters, setFilters] = useState<Filters>({ type: 'all', category: 'all', priority: 'all' });
  const visible = useMemo(() => notes.filter((note) => note.date === selectedDate && !note.archived && (filters.type === 'all' || note.type === filters.type) && (filters.category === 'all' || note.category === filters.category) && (filters.priority === 'all' || note.priority === filters.priority)), [notes, selectedDate, filters]);
  const selectedLabel = selectedDate === today() ? 'Today' : dateLabel(selectedDate, { weekday: 'long' });
  const days = Array.from({ length: 7 }, (_, index) => offsetDate(today(), index - 2));

  return (
    <div className="page-in">
      <PageHeader eyebrow={`Your diary · ${selectedDate === today() ? 'open page' : 'browsing'}`} title={selectedLabel} description={selectedDate === today() ? 'A small place for what is on your mind today.' : dateLabel(selectedDate)} action={<button type="button" onClick={onNew} className="flex items-center gap-2 bg-primary px-4 py-3 text-sm text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-new-entry"><Plus size={16} />Write a new page</button>} />
      <div className="mx-auto max-w-[1080px] px-5 sm:px-8 lg:px-14">
        <DateStrip selected={selectedDate} days={days} onSelect={setSelectedDate} />
        <div className="mt-9 flex flex-col gap-4 border-y border-border py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays size={15} className="text-primary" /><span>{dateLabel(selectedDate, { month: 'long', day: 'numeric', year: 'numeric' })}</span><span className="mx-1 text-border">/</span><span>{visible.length} {visible.length === 1 ? 'page' : 'pages'}</span></div>
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
        <section className="mt-8 pb-20" aria-label="Diary entries">
          {visible.length ? <div className="space-y-0">{visible.map((note, index) => <NoteCard key={note.id} note={note} index={index} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}</div> : <EmptyDay date={selectedDate} onNew={onNew} />}
        </section>
      </div>
    </div>
  );
}

function DateStrip({ selected, days, onSelect }: { selected: string; days: string[]; onSelect: (date: string) => void }) {
  return (
    <div className="flex items-stretch border border-border bg-card" data-testid="date-navigation">
      <button type="button" onClick={() => onSelect(offsetDate(selected, -1))} className="hidden w-10 shrink-0 items-center justify-center border-r border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex" aria-label="Previous day" data-testid="button-previous-day"><ChevronLeft size={17} /></button>
      <div className="grid flex-1 grid-cols-4 sm:grid-cols-7">
        {days.map((day) => {
          const isSelected = day === selected;
          const date = new Date(`${day}T12:00:00`);
          return <button type="button" key={day} onClick={() => onSelect(day)} className={`relative flex min-h-[68px] flex-col items-center justify-center border-r border-border px-1 transition-colors last:border-r-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} data-testid={`button-date-${day}`}>
            <span className={`font-mono-note text-[9px] uppercase tracking-[.12em] ${isSelected ? 'opacity-75' : ''}`}>{new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date)}</span>
            <span className="mt-1 font-journal text-xl">{date.getDate()}</span>
            {day === today() && <span className={`absolute bottom-2 size-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />}
          </button>;
        })}
      </div>
      <button type="button" onClick={() => onSelect(offsetDate(selected, 1))} className="hidden w-10 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex" aria-label="Next day" data-testid="button-next-day"><ChevronRight size={17} /></button>
    </div>
  );
}

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (filters: Filters) => void }) {
  return <div className="flex flex-wrap items-center gap-2"><SlidersHorizontal size={14} className="mr-1 text-muted-foreground" /><select value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value })} className="border-0 bg-transparent py-1 text-xs text-muted-foreground focus:ring-0" aria-label="Filter by type" data-testid="select-filter-type"><option value="all">All types</option><option value="note">Notes</option><option value="task">Tasks</option><option value="reminder">Reminders</option><option value="idea">Ideas</option></select><select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })} className="border-0 bg-transparent py-1 text-xs text-muted-foreground focus:ring-0" aria-label="Filter by category" data-testid="select-filter-category"><option value="all">All categories</option>{['personal', 'college', 'work', 'projects', 'ideas', 'other'].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select><select value={filters.priority} onChange={(event) => onChange({ ...filters, priority: event.target.value })} className="border-0 bg-transparent py-1 text-xs text-muted-foreground focus:ring-0" aria-label="Filter by priority" data-testid="select-filter-priority"><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select></div>;
}

type NoteListProps = { notes: Note[]; onToggle: (action: 'complete' | 'pin' | 'archive', id: string) => void; onEdit: (note: Note) => void; onDelete: (id: string) => void };

function NoteCard({ note, index, onToggle, onEdit, onDelete }: { note: Note; index: number } & Omit<NoteListProps, 'notes'>) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return <article className="group relative border-b border-border/80 py-6 first:border-t page-in" style={{ animationDelay: `${index * 70}ms` }} data-testid={`card-note-${note.id}`}>
    <div className="grid gap-4 sm:grid-cols-[90px_1fr_auto] sm:gap-6">
      <div className="flex items-start justify-between sm:block"><div className="font-mono-note text-[10px] uppercase tracking-[.12em] text-muted-foreground">{shortDate(note.date)}</div><div className="mt-1 font-mono-note text-[10px] text-primary/75">p. {String(note.pageNumber).padStart(2, '0')}</div><div className="mt-3 hidden font-mono-note text-[9px] uppercase tracking-[.1em] text-muted-foreground sm:block">{note.type}</div></div>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2"><span className={`size-2 ${note.type === 'task' ? 'bg-primary' : note.type === 'idea' ? 'bg-accent' : note.type === 'reminder' ? 'bg-[hsl(29_67%_58%)]' : 'border border-primary/50'}`} />{note.pinned && <span className="flex items-center gap-1 font-mono-note text-[9px] uppercase tracking-[.1em] text-primary"><Bookmark size={11} fill="currentColor" />saved</span>}{note.priority === 'high' && <span className="font-mono-note text-[9px] uppercase tracking-[.1em] text-[hsl(3_49%_43%)]">important</span>}</div>
        <Link href={`/entry/${note.id}`} className={`font-journal text-xl leading-snug text-foreground underline-offset-4 hover:text-primary hover:underline sm:text-[22px] ${note.completed ? 'line-through decoration-primary/50 opacity-60' : ''}`} data-testid={`link-note-${note.id}`}>{note.title}</Link>
        <p className="mt-2 line-clamp-2 max-w-[680px] text-sm leading-6 text-muted-foreground">{note.content}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">{note.tags.map((tag) => <span key={tag} className="flex items-center gap-1 font-mono-note text-[9px] uppercase tracking-[.08em] text-muted-foreground"><Tag size={10} />{tag}</span>)}{note.dueDate && <span className="flex items-center gap-1 font-mono-note text-[9px] uppercase tracking-[.08em] text-muted-foreground"><Clock3 size={10} />due {shortDate(note.dueDate)}</span>}</div>
      </div>
      <div className="flex items-center gap-1 self-start sm:flex-col sm:items-end">
        {note.type === 'task' && <button type="button" onClick={() => onToggle('complete', note.id)} className={`flex size-8 items-center justify-center border transition-colors ${note.completed ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`} aria-label={note.completed ? 'Mark task incomplete' : 'Mark task complete'} data-testid={`button-complete-${note.id}`}>{note.completed ? <Check size={15} /> : <Circle size={14} />}</button>}
        <button type="button" onClick={() => onToggle('pin', note.id)} className={`flex size-8 items-center justify-center transition-colors ${note.pinned ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} aria-label={note.pinned ? 'Remove bookmark' : 'Bookmark note'} data-testid={`button-pin-${note.id}`}><Bookmark size={15} fill={note.pinned ? 'currentColor' : 'none'} /></button>
        <button type="button" onClick={() => onToggle('archive', note.id)} className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-primary" aria-label={note.archived ? 'Restore from archive' : 'Archive note'} data-testid={`button-archive-${note.id}`}><Archive size={14} /></button>
        <button type="button" onClick={() => onEdit(note)} className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground" aria-label="Edit note" data-testid={`button-edit-${note.id}`}><Pencil size={14} /></button>
        {confirmDelete ? <span className="flex items-center gap-1"><button type="button" onClick={() => onDelete(note.id)} className="px-2 py-1 font-mono-note text-[9px] uppercase text-destructive hover:underline" data-testid={`button-confirm-delete-${note.id}`}>delete?</button><button type="button" onClick={() => setConfirmDelete(false)} className="text-muted-foreground" aria-label="Cancel delete" data-testid={`button-cancel-delete-${note.id}`}><X size={13} /></button></span> : <button type="button" onClick={() => setConfirmDelete(true)} className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-destructive" aria-label="Delete note" data-testid={`button-delete-${note.id}`}><Trash2 size={14} /></button>}
      </div>
    </div>
  </article>;
}

function EmptyDay({ date, onNew }: { date: string; onNew: () => void }) {
  return <div className="margin-rule my-10 flex min-h-[240px] flex-col items-center justify-center bg-card/40 px-6 text-center"><Inbox size={24} strokeWidth={1.2} className="mb-4 text-primary/70" /><h2 className="font-journal text-xl">A blank page is still a beginning.</h2><p className="mt-2 max-w-[330px] text-sm leading-6 text-muted-foreground">{date === today() ? 'What is asking for your attention today?' : 'Nothing was written on this day. It is waiting patiently.'}</p><button type="button" onClick={onNew} className="mt-5 border-b border-primary pb-1 text-xs text-primary hover:text-foreground" data-testid="button-empty-new-entry">Write on this page</button></div>;
}

function ArchivePage({ notes, onToggle, onEdit, onDelete }: NoteListProps) {
  const archived = notes.filter((note) => note.archived);
  const months = [...new Set(archived.map((note) => note.date.slice(0, 7)))];
  return <div className="page-in"><PageHeader eyebrow="The back pages" title="Archive" description="Older pages kept close, but out of today's way." /><div className="mx-auto max-w-[1080px] px-5 pb-20 sm:px-8 lg:px-14">{archived.length ? months.map((month) => <section key={month} className="mb-12" data-testid={`section-archive-${month}`}><div className="mb-2 flex items-center gap-3 border-b border-border pb-3"><Calendar size={15} className="text-primary" /><h2 className="font-mono-note text-[11px] uppercase tracking-[.18em] text-muted-foreground">{monthLabel(month)}</h2><span className="h-px flex-1 bg-border" /></div>{archived.filter((note) => note.date.startsWith(month)).map((note, index) => <NoteCard key={note.id} note={note} index={index} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}</section>) : <div className="margin-rule bg-card/40 py-20 text-center"><Archive size={28} className="mx-auto mb-4 text-primary/70" strokeWidth={1.2} /><h2 className="font-journal text-xl">Your archive is still quiet.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">When a page has finished its season, archive it here. Nothing is lost.</p></div>}</div></div>;
}

function SearchPage({ notes, onToggle, onEdit, onDelete }: NoteListProps) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const results = searchNotes(submitted, notes);
  return <div className="page-in"><PageHeader eyebrow="The index" title="Search your pages" description="A word, a feeling, a half-remembered thought — look around." /><div className="mx-auto max-w-[1080px] px-5 pb-20 sm:px-8 lg:px-14"><form onSubmit={(event) => { event.preventDefault(); setSubmitted(query); }} className="relative flex max-w-[720px] border-b-2 border-primary/50" role="search"><Search size={18} className="absolute left-0 top-3 text-primary" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full border-0 bg-transparent py-3 pl-8 pr-20 text-base placeholder:text-muted-foreground/70 focus:ring-0" placeholder="Search titles, words, tags..." aria-label="Search diary pages" data-testid="input-search-notes" />{query && <button type="button" onClick={() => { setQuery(''); setSubmitted(''); }} className="absolute right-16 top-2.5 p-1 text-muted-foreground" aria-label="Clear search" data-testid="button-clear-search"><X size={15} /></button>}<button type="submit" className="absolute right-0 top-2 border-l border-border px-3 py-1.5 text-xs text-primary hover:text-foreground" data-testid="button-submit-search">Find</button></form><div className="mt-10 flex items-center justify-between border-b border-border pb-3"><p className="font-mono-note text-[10px] uppercase tracking-[.16em] text-muted-foreground">{submitted ? `${results.length} pages for “${submitted}”` : `${results.length} pages in your index`}</p><Command size={15} className="text-muted-foreground" /></div><section className="mt-1">{results.length ? results.map((note, index) => <NoteCard key={note.id} note={note} index={index} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />) : <div className="py-20 text-center"><Search size={26} className="mx-auto mb-4 text-primary/70" strokeWidth={1.2} /><h2 className="font-journal text-xl">No page found for that.</h2><p className="mt-2 text-sm text-muted-foreground">Try a title, tag, or a less exact phrase.</p></div>}</section></div></div>;
}

function EntryPage({ notes, onToggle, onEdit, onDelete }: NoteListProps) {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const note = notes.find((item) => item.id === id);
  if (!note) return <NotFound />;
  return <div className="page-in"><div className="mx-auto max-w-[920px] px-5 pb-20 pt-10 sm:px-8 lg:px-14 lg:pt-16"><button type="button" onClick={() => setLocation('/')} className="mb-12 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-primary" data-testid="button-back-to-diary"><ArrowLeft size={15} />Back to today's pages</button><article className="relative bg-card px-6 py-8 shadow-[0_8px_28px_hsl(25_28%_18%/.06)] sm:px-12 sm:py-12"><div className="absolute bottom-0 left-0 top-0 w-1 bg-primary/70" /><div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-7"><div><p className="font-mono-note text-[10px] uppercase tracking-[.18em] text-primary">{dateLabel(note.date)} · page {String(note.pageNumber).padStart(2, '0')}</p><h1 className="mt-4 max-w-[680px] font-journal text-3xl leading-tight sm:text-5xl">{note.title}</h1></div><div className="flex items-center gap-1">{note.pinned && <span className="mr-2 flex items-center gap-1 font-mono-note text-[9px] uppercase tracking-[.1em] text-primary"><Bookmark size={13} fill="currentColor" />saved</span>}<button type="button" onClick={() => onEdit(note)} className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Edit entry" data-testid={`button-entry-edit-${note.id}`}><Pencil size={15} /></button><button type="button" onClick={() => onToggle('archive', note.id)} className="flex size-9 items-center justify-center text-muted-foreground hover:text-primary" aria-label={note.archived ? 'Restore entry' : 'Archive entry'} data-testid={`button-entry-archive-${note.id}`}>{note.archived ? <RotateCcw size={15} /> : <Archive size={15} />}</button></div></div><div className="margin-rule mt-8 min-h-[280px] whitespace-pre-line ruled-paper pl-5 font-journal text-[17px] leading-8 text-foreground/85 sm:pl-8 sm:text-lg">{note.content}</div><div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"><div className="flex flex-wrap gap-2">{note.tags.map((tag) => <span key={tag} className="border border-border px-2 py-1 font-mono-note text-[9px] uppercase tracking-[.1em] text-muted-foreground">{tag}</span>)}</div><div className="flex items-center gap-3">{note.type === 'task' && <button type="button" onClick={() => onToggle('complete', note.id)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-accent" data-testid={`button-entry-complete-${note.id}`}>{note.completed ? <CheckCircle2 size={16} className="text-accent" /> : <Circle size={16} />} {note.completed ? 'Completed' : 'Mark complete'}</button>}<button type="button" onClick={() => onToggle('pin', note.id)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary" data-testid={`button-entry-pin-${note.id}`}><Bookmark size={15} fill={note.pinned ? 'currentColor' : 'none'} />{note.pinned ? 'Bookmarked' : 'Bookmark'}</button></div></div></article><div className="mt-5 flex justify-end"><button type="button" onClick={() => onDelete(note.id)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive" data-testid={`button-entry-delete-${note.id}`}><Trash2 size={13} />Delete this page</button></div></div></div>;
}

function NoteModal({ note, onClose, onCreate, onUpdate }: { note?: Note; onClose: () => void; onCreate: (input: Omit<Note, 'id' | 'pageNumber'>) => void; onUpdate: (id: string, changes: Partial<Note>) => void }) {
  const [form, setForm] = useState({ title: note?.title ?? '', content: note?.content ?? '', type: note?.type ?? 'note' as NoteType, category: note?.category ?? 'personal' as NoteCategory, priority: note?.priority ?? 'low' as NotePriority, tags: note?.tags.join(', ') ?? '', date: note?.date ?? today(), dueDate: note?.dueDate ?? '', reminderTime: note?.reminderTime ?? '' });
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    const common = { title: form.title.trim(), content: form.content.trim(), type: form.type, category: form.category, priority: form.priority, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), date: form.date, dueDate: form.dueDate || undefined, reminderTime: form.reminderTime || undefined, completed: note?.completed ?? false, pinned: note?.pinned ?? false, archived: note?.archived ?? false };
    if (note) onUpdate(note.id, common); else onCreate(common);
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="note-modal-title"><div className="max-h-[92dvh] w-full max-w-[680px] overflow-y-auto bg-card shadow-2xl page-in"><div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7"><div><p className="font-mono-note text-[9px] uppercase tracking-[.18em] text-primary">{note ? 'Edit page' : 'New page'}</p><h2 id="note-modal-title" className="mt-1 font-journal text-xl">{note ? 'Make a note of it' : 'What is on your mind?'}</h2></div><button type="button" onClick={onClose} className="flex size-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Close dialog" data-testid="button-close-note-modal"><X size={18} /></button></div><form onSubmit={submit} className="space-y-5 px-5 py-6 sm:px-7"><div><label htmlFor="note-title" className="mb-2 block font-mono-note text-[9px] uppercase tracking-[.16em] text-muted-foreground">Title</label><input id="note-title" autoFocus value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="Give this thought a name" className="w-full border-0 border-b border-border bg-transparent px-0 py-2 font-journal text-2xl placeholder:text-muted-foreground/50 focus:border-primary focus:ring-0" required data-testid="input-note-title" /></div><div><label htmlFor="note-content" className="mb-2 block font-mono-note text-[9px] uppercase tracking-[.16em] text-muted-foreground">Your page</label><textarea id="note-content" value={form.content} onChange={(event) => set('content', event.target.value)} placeholder="Start writing..." rows={7} className="ruled-paper w-full resize-y border border-border bg-background/40 p-3 font-journal text-[15px] leading-8 placeholder:font-ui placeholder:text-muted-foreground/60 focus:border-primary focus:ring-0" required data-testid="textarea-note-content" /></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-4"><FieldSelect label="Type" value={form.type} onChange={(value) => set('type', value)} options={['note', 'task', 'reminder', 'idea']} testId="select-note-type" /><FieldSelect label="Category" value={form.category} onChange={(value) => set('category', value)} options={['personal', 'college', 'work', 'projects', 'ideas', 'other']} testId="select-note-category" /><FieldSelect label="Priority" value={form.priority} onChange={(value) => set('priority', value)} options={['low', 'medium', 'high']} testId="select-note-priority" /><div><label htmlFor="note-date" className="mb-2 block font-mono-note text-[9px] uppercase tracking-[.12em] text-muted-foreground">Date</label><input id="note-date" type="date" value={form.date} onChange={(event) => set('date', event.target.value)} className="w-full border border-border bg-transparent px-2 py-2 text-xs focus:border-primary focus:ring-0" data-testid="input-note-date" /></div></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3"><div><label htmlFor="note-tags" className="mb-2 block font-mono-note text-[9px] uppercase tracking-[.12em] text-muted-foreground">Tags <span className="normal-case tracking-normal">(comma separated)</span></label><input id="note-tags" value={form.tags} onChange={(event) => set('tags', event.target.value)} placeholder="reading, personal" className="w-full border border-border bg-transparent px-2 py-2 text-xs focus:border-primary focus:ring-0" data-testid="input-note-tags" /></div><div><label htmlFor="note-due" className="mb-2 block font-mono-note text-[9px] uppercase tracking-[.12em] text-muted-foreground">Due date <span className="normal-case tracking-normal">(optional)</span></label><input id="note-due" type="date" value={form.dueDate} onChange={(event) => set('dueDate', event.target.value)} className="w-full border border-border bg-transparent px-2 py-2 text-xs focus:border-primary focus:ring-0" data-testid="input-note-due-date" /></div><div><label htmlFor="note-reminder" className="mb-2 block font-mono-note text-[9px] uppercase tracking-[.12em] text-muted-foreground">Reminder time</label><input id="note-reminder" type="time" value={form.reminderTime} onChange={(event) => set('reminderTime', event.target.value)} className="w-full border border-border bg-transparent px-2 py-2 text-xs focus:border-primary focus:ring-0" data-testid="input-note-reminder-time" /></div></div><div className="flex items-center justify-end gap-3 border-t border-border pt-5"><button type="button" onClick={onClose} className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground" data-testid="button-cancel-note">Cancel</button><button type="submit" className="flex items-center gap-2 bg-primary px-4 py-2.5 text-xs text-primary-foreground hover:bg-primary/90" data-testid="button-save-note"><Check size={15} />{note ? 'Save changes' : 'Add to diary'}</button></div></form></div></div>;
}

function FieldSelect({ label, value, onChange, options, testId }: { label: string; value: string; onChange: (value: string) => void; options: string[]; testId: string }) {
  return <div><label className="mb-2 block font-mono-note text-[9px] uppercase tracking-[.12em] text-muted-foreground">{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-border bg-transparent px-2 py-2 text-xs capitalize focus:border-primary focus:ring-0" data-testid={testId}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}

function NotFound() {
  return <div className="flex min-h-[70dvh] items-center justify-center px-6 text-center"><div><Sparkles size={24} className="mx-auto mb-4 text-primary" strokeWidth={1.2} /><h1 className="font-journal text-3xl">This page has not been written.</h1><p className="mt-3 text-sm text-muted-foreground">The address is right in spirit, but not in the notebook.</p><Link href="/" className="mt-6 inline-flex border-b border-primary pb-1 text-xs text-primary" data-testid="link-not-found-home">Return to today</Link></div></div>;
}

export default App;