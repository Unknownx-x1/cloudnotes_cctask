import { useEffect, useMemo, useState } from 'react';
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
  syncNotesWithBackend,
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
    <div className="min-h-[100dvh] desk-wood text-foreground flex flex-col items-center justify-start lg:justify-center p-0 lg:p-6 lg:py-8">
      {/* Mobile Top Header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#472617] leather-spine px-5 backdrop-blur-md lg:hidden shadow-lg">
        <Link href="/" className="flex items-center gap-2.5 text-[#f6ebd5]" data-testid="link-mobile-logo">
          <span className="flex size-8 items-center justify-center bg-[#c78f2d] text-[#2a150c] rounded-sm shadow-sm font-display font-bold">
            <BookOpen size={16} strokeWidth={2} />
          </span>
          <span className="font-display tracking-wider text-lg font-semibold text-[#f6ebd5]">CloudNotes</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileNav((open) => !open)}
          aria-label={mobileNav ? 'Close navigation' : 'Open navigation'}
          className="flex size-10 items-center justify-center text-[#cda250] hover:text-[#f6ebd5]"
          data-testid="button-mobile-navigation"
        >
          {mobileNav ? <X size={19} /> : <Menu size={19} />}
        </button>
      </header>

      {/* Main Journal Folio (Desktop Open Book) */}
      <div className="relative w-full max-w-[1360px] min-h-[100dvh] lg:min-h-[880px] flex flex-col lg:flex-row deckle-book rounded-none lg:rounded-2xl overflow-hidden bg-background paper-grain border-0 lg:border-[3px] lg:border-[#381c10]">
        
        {/* Silk Ribbon Bookmark hanging from book top */}
        <div className="hidden lg:block absolute -top-1 left-[270px] z-30 pointer-events-none">
          <div className="w-7 h-28 silk-ribbon rounded-b-sm shadow-xl relative before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0 before:border-l-[14px] before:border-l-transparent before:border-r-[14px] before:border-r-transparent before:border-b-[10px] before:border-b-background" />
        </div>

        {/* Stitched Leather Cover & Spine (Sidebar) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col leather-spine leather-stitching px-6 py-8 transition-transform duration-300 lg:relative lg:translate-x-0 ${
            mobileNav ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="mb-10 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-sm bg-[#c78f2d] text-[#221008] shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-[#e5c158]/50">
              <BookOpen size={20} strokeWidth={2} />
            </span>
            <div>
              <p className="font-display tracking-widest text-[18px] font-bold text-[#f7ecd5] drop-shadow">CloudNotes</p>
              <p className="font-handwriting text-base text-[#cda250] -mt-0.5">Leather-bound Journal</p>
            </div>
          </div>

          <div className="mb-3 px-2 font-mono-note text-[9px] uppercase tracking-[.24em] text-[#cda250]/75 font-semibold">Diary Sections</div>
          <nav className="space-y-1.5" aria-label="Primary navigation">
            <NavItem active={active === 'today'} icon={<BookOpen size={16} />} label="Today's Page" onClick={() => navigate('/')} testId="link-nav-today" />
            <NavItem active={active === 'archive'} icon={<Archive size={16} />} label="Archived Pages" onClick={() => navigate('/archive')} testId="link-nav-archive" />
            <NavItem active={active === 'search'} icon={<Search size={16} />} label="Search Ledger" onClick={() => navigate('/search')} testId="link-nav-search" />
          </nav>

          <div className="my-7 border-t border-[#46291c]" />
          <div className="mb-3 px-2 font-mono-note text-[9px] uppercase tracking-[.24em] text-[#cda250]/75 font-semibold">Ledger Index</div>
          <div className="space-y-2.5 px-2 text-[13px] text-[#cfbca8]">
            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Pin size={13} className="text-[#c78f2d]" />Bookmarked pages</span><span className="font-mono-note text-[11px] font-bold text-[#f7ecd5] bg-[#3a1f14] px-2 py-0.5 rounded-sm">{pinned}</span></div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Layers3 size={13} className="text-[#c78f2d]" />Recorded leaves</span><span className="font-mono-note text-[11px] font-bold text-[#f7ecd5] bg-[#3a1f14] px-2 py-0.5 rounded-sm">{notes.length}</span></div>
          </div>

          <div className="mt-auto border-t border-[#46291c] pt-5">
            <button type="button" onClick={onNew} className="wax-seal group flex w-full items-center justify-between bg-gradient-to-r from-[#801e25] to-[#60141a] px-4 py-3 text-left text-sm font-medium text-[#fff8f0] border border-[#a12830] transition-all hover:brightness-110 active:scale-[0.98]" data-testid="button-sidebar-new-entry">
              <span className="flex items-center gap-2"><Plus size={16} />Write a new page</span>
              <span className="font-mono-note text-[10px] opacity-70 bg-black/20 px-1.5 py-0.5 rounded">N</span>
            </button>
            <p className="mt-5 px-1 font-handwriting text-lg text-[#cda250]/90 leading-snug">"Keep the thoughts that would otherwise drift away into air."</p>
          </div>
        </aside>

        {mobileNav && <button type="button" aria-label="Close navigation overlay" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden" data-testid="button-navigation-overlay" />}

        {/* Center Book Crease / Gutter on Desktop */}
        <div className="hidden lg:block w-[1px] bg-gradient-to-b from-transparent via-[#46291c]/20 to-transparent shadow-[0_0_12px_rgba(40,20,10,0.18)] z-20 pointer-events-none" />

        {/* Open Diary Paper Pages */}
        <main className="flex-1 min-h-[100dvh] lg:min-h-0 pt-[68px] lg:pt-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ active, icon, label, onClick, testId }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[13px] font-medium transition-all rounded-sm ${
        active
          ? 'bg-gradient-to-r from-[#3e2316] to-[#2b170e] text-[#ffd885] border-l-2 border-[#c78f2d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]'
          : 'text-[#c2b09b] hover:text-[#f7ecd5] hover:bg-[#341d13]/70'
      }`}
      data-testid={testId}
    >
      <span className={active ? 'text-[#c78f2d]' : 'opacity-70'}>{icon}</span>
      <span>{label}</span>
      {active && <span className="ml-auto size-1.5 rounded-full bg-[#c78f2d] shadow-[0_0_6px_#c78f2d]" />}
    </button>
  );
}

function App() {
  const [notes, setNotes] = useState<Note[]>(() => getNotes());
  const [modal, setModal] = useState<{ open: boolean; note?: Note }>({ open: false });
  const [toast, setToast] = useState('');

  useEffect(() => {
    syncNotesWithBackend().then((synced) => {
      setNotes(synced);
    });
  }, []);

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
    <header className="mx-auto flex max-w-[1080px] flex-col gap-5 px-6 pb-8 pt-8 sm:px-10 lg:flex-row lg:items-end lg:justify-between lg:px-14 lg:pt-12">
      <div className="fade-up">
        <p className="mb-2 flex items-center gap-2 font-mono-note text-[10px] uppercase tracking-[.25em] text-primary font-semibold">
          <span className="h-px w-6 bg-primary" />{eyebrow}
        </p>
        <h1 className="font-journal text-4xl leading-tight tracking-[-.02em] text-foreground sm:text-5xl font-normal">{title}</h1>
        <p className="mt-1 font-handwriting text-2xl text-muted-foreground">{description}</p>
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
      <PageHeader
        eyebrow={`Your diary · ${selectedDate === today() ? 'open page' : 'browsing'}`}
        title={selectedLabel}
        description={selectedDate === today() ? 'Thoughts and recollections penned for this day.' : dateLabel(selectedDate)}
        action={
          <button
            type="button"
            onClick={onNew}
            className="wax-seal flex items-center gap-2.5 bg-gradient-to-r from-[#801e25] to-[#60141a] px-5 py-3 text-sm font-medium text-[#fff8f0] border border-[#a12830] transition-all hover:brightness-110 active:scale-95 shadow-md"
            data-testid="button-new-entry"
          >
            <Plus size={16} />Write a new page
          </button>
        }
      />
      <div className="mx-auto max-w-[1080px] px-6 sm:px-10 lg:px-14">
        <DateStrip selected={selectedDate} days={days} onSelect={setSelectedDate} />
        <div className="mt-8 flex flex-col gap-4 border-y border-border/80 py-3.5 sm:flex-row sm:items-center sm:justify-between bg-[#f8f2e6]/50 px-3 rounded-xs">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono-note">
            <CalendarDays size={15} className="text-primary" />
            <span className="font-semibold">{dateLabel(selectedDate, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="mx-1 text-border">/</span>
            <span className="text-primary font-bold">{visible.length} {visible.length === 1 ? 'recorded entry' : 'recorded entries'}</span>
          </div>
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
        <section className="mt-8 pb-20" aria-label="Diary entries">
          {visible.length ? (
            <div className="space-y-0">
              {visible.map((note, index) => (
                <NoteCard key={note.id} note={note} index={index} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          ) : (
            <EmptyDay date={selectedDate} onNew={onNew} />
          )}
        </section>
      </div>
    </div>
  );
}

function DateStrip({ selected, days, onSelect }: { selected: string; days: string[]; onSelect: (date: string) => void }) {
  return (
    <div className="flex items-stretch border border-border/90 bg-[#f7f0e3] rounded-sm overflow-hidden shadow-xs" data-testid="date-navigation">
      <button type="button" onClick={() => onSelect(offsetDate(selected, -1))} className="hidden w-11 shrink-0 items-center justify-center border-r border-border text-muted-foreground transition-colors hover:bg-[#ede3d0] hover:text-foreground sm:flex" aria-label="Previous day" data-testid="button-previous-day"><ChevronLeft size={18} /></button>
      <div className="grid flex-1 grid-cols-4 sm:grid-cols-7">
        {days.map((day) => {
          const isSelected = day === selected;
          const date = new Date(`${day}T12:00:00`);
          return (
            <button
              type="button"
              key={day}
              onClick={() => onSelect(day)}
              className={`relative flex min-h-[72px] flex-col items-center justify-center border-r border-border/80 px-1 transition-all last:border-r-0 ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-[#eee4d2] hover:text-foreground'
              }`}
              data-testid={`button-date-${day}`}
            >
              <span className={`font-mono-note text-[9px] uppercase tracking-[.14em] font-semibold ${isSelected ? 'text-[#f5ecd9]' : 'text-muted-foreground'}`}>
                {new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date)}
              </span>
              <span className="mt-1 font-journal text-2xl font-semibold leading-none">{date.getDate()}</span>
              {day === today() && (
                <span className={`absolute bottom-2 size-1.5 rounded-full ${isSelected ? 'bg-[#ffd885]' : 'bg-primary'}`} />
              )}
            </button>
          );
        })}
      </div>
      <button type="button" onClick={() => onSelect(offsetDate(selected, 1))} className="hidden w-11 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-[#ede3d0] hover:text-foreground sm:flex" aria-label="Next day" data-testid="button-next-day"><ChevronRight size={18} /></button>
    </div>
  );
}

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (filters: Filters) => void }) {
  return <div className="flex flex-wrap items-center gap-2"><SlidersHorizontal size={14} className="mr-1 text-muted-foreground" /><select value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value })} className="border-0 bg-transparent py-1 text-xs text-muted-foreground focus:ring-0" aria-label="Filter by type" data-testid="select-filter-type"><option value="all">All types</option><option value="note">Notes</option><option value="task">Tasks</option><option value="reminder">Reminders</option><option value="idea">Ideas</option></select><select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })} className="border-0 bg-transparent py-1 text-xs text-muted-foreground focus:ring-0" aria-label="Filter by category" data-testid="select-filter-category"><option value="all">All categories</option>{['personal', 'college', 'work', 'projects', 'ideas', 'other'].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select><select value={filters.priority} onChange={(event) => onChange({ ...filters, priority: event.target.value })} className="border-0 bg-transparent py-1 text-xs text-muted-foreground focus:ring-0" aria-label="Filter by priority" data-testid="select-filter-priority"><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select></div>;
}

type NoteListProps = { notes: Note[]; onToggle: (action: 'complete' | 'pin' | 'archive', id: string) => void; onEdit: (note: Note) => void; onDelete: (id: string) => void };

function NoteCard({ note, index, onToggle, onEdit, onDelete }: { note: Note; index: number } & Omit<NoteListProps, 'notes'>) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <article
      className="group relative border-b border-border/80 py-7 first:border-t page-in transition-colors hover:bg-black/[0.015]"
      style={{ animationDelay: `${index * 60}ms` }}
      data-testid={`card-note-${note.id}`}
    >
      <div className="grid gap-4 sm:grid-cols-[100px_1fr_auto] sm:gap-6">
        <div className="flex items-start justify-between sm:block">
          <div className="font-mono-note text-[10px] uppercase tracking-[.14em] text-muted-foreground font-semibold">
            {shortDate(note.date)}
          </div>
          <div className="mt-1.5 inline-block font-handwriting text-lg font-bold text-primary px-2 py-0.5 rounded-sm bg-[#f2e7d5] border border-border">
            p. {String(note.pageNumber).padStart(2, '0')}
          </div>
          <div className="mt-3 hidden font-mono-note text-[9px] uppercase tracking-[.14em] text-muted-foreground/80 sm:block">
            {note.type}
          </div>
        </div>

        <div className="min-w-0 margin-rule pl-4 sm:pl-6">
          <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
            {note.priority === 'high' && (
              <span className="wax-seal inline-flex items-center gap-1 bg-[#801e25] text-[#fff8f0] px-2.5 py-0.5 font-mono-note text-[9px] uppercase tracking-[.1em] font-bold border border-[#9c252d]">
                <Bookmark size={10} fill="currentColor" />Urgent
              </span>
            )}
            {note.priority === 'medium' && (
              <span className="wax-seal inline-flex items-center gap-1 bg-[#b36a21] text-[#fff8f0] px-2.5 py-0.5 font-mono-note text-[9px] uppercase tracking-[.1em] font-semibold border border-[#cc7b29]">
                Active
              </span>
            )}
            {note.priority === 'low' && (
              <span className="wax-seal inline-flex items-center gap-1 bg-[#3a5843] text-[#f2f7f4] px-2.5 py-0.5 font-mono-note text-[9px] uppercase tracking-[.1em] font-medium border border-[#486b53]">
                Gentle
              </span>
            )}
            {note.pinned && (
              <span className="inline-flex items-center gap-1 font-mono-note text-[10px] uppercase tracking-[.14em] text-[#b5832c] font-semibold bg-[#faf0dc] px-2 py-0.5 rounded border border-[#deb868]/60">
                <Bookmark size={11} fill="currentColor" />Bookmarked
              </span>
            )}
            <span className="font-mono-note text-[9px] uppercase tracking-[.12em] text-muted-foreground/70 bg-[#ece3d4] px-1.5 py-0.5 rounded">
              {note.category}
            </span>
          </div>

          <Link
            href={`/entry/${note.id}`}
            className={`font-journal text-2xl leading-snug text-foreground underline-offset-4 hover:text-primary hover:underline sm:text-[25px] font-normal tracking-tight block ${
              note.completed ? 'line-through decoration-primary/60 opacity-60' : ''
            }`}
            data-testid={`link-note-${note.id}`}
          >
            {note.title}
          </Link>

          <p className="mt-2 line-clamp-3 max-w-[680px] text-[15px] font-reading leading-7 text-foreground/80">
            {note.content}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 font-mono-note text-[9px] uppercase tracking-[.1em] text-muted-foreground bg-[#ece4d6] px-2 py-0.5 rounded-xs border border-border/70"
              >
                <Tag size={10} className="text-primary/70" />
                {tag}
              </span>
            ))}
            {note.dueDate && (
              <span className="flex items-center gap-1 font-mono-note text-[9px] uppercase tracking-[.1em] text-muted-foreground bg-[#ece4d6] px-2 py-0.5 rounded-xs border border-border/70">
                <Clock3 size={10} className="text-primary/70" />
                due {shortDate(note.dueDate)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:flex-col sm:items-end">
          {note.type === 'task' && (
            <button
              type="button"
              onClick={() => onToggle('complete', note.id)}
              className={`flex size-8 items-center justify-center rounded-sm border transition-all ${
                note.completed
                  ? 'border-accent bg-accent text-accent-foreground shadow-xs'
                  : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'
              }`}
              aria-label={note.completed ? 'Mark task incomplete' : 'Mark task complete'}
              data-testid={`button-complete-${note.id}`}
            >
              {note.completed ? <Check size={16} strokeWidth={2.5} /> : <Circle size={15} strokeWidth={1.5} />}
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggle('pin', note.id)}
            className={`flex size-8 items-center justify-center rounded-sm transition-colors ${
              note.pinned ? 'text-[#c78f2d] bg-[#faf0dc]' : 'text-muted-foreground hover:text-primary hover:bg-[#eee3d0]'
            }`}
            aria-label={note.pinned ? 'Remove bookmark' : 'Bookmark note'}
            data-testid={`button-pin-${note.id}`}
          >
            <Bookmark size={15} fill={note.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => onToggle('archive', note.id)}
            className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-primary hover:bg-[#eee3d0]"
            aria-label={note.archived ? 'Restore from archive' : 'Archive note'}
            data-testid={`button-archive-${note.id}`}
          >
            <Archive size={15} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-[#eee3d0]"
            aria-label="Edit note"
            data-testid={`button-edit-${note.id}`}
          >
            <Pencil size={15} />
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-1 bg-[#fbeaea] p-0.5 rounded border border-[#e8b5b7]">
              <button
                type="button"
                onClick={() => onDelete(note.id)}
                className="px-2 py-1 font-mono-note text-[9px] uppercase font-bold text-destructive hover:underline"
                data-testid={`button-confirm-delete-${note.id}`}
              >
                delete?
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-muted-foreground p-1 hover:text-foreground"
                aria-label="Cancel delete"
                data-testid={`button-cancel-delete-${note.id}`}
              >
                <X size={13} />
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-destructive hover:bg-[#fbeaea]"
              aria-label="Delete note"
              data-testid={`button-delete-${note.id}`}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyDay({ date, onNew }: { date: string; onNew: () => void }) {
  return (
    <div className="margin-rule my-10 flex min-h-[250px] flex-col items-center justify-center bg-[#faf5eb] border border-dashed border-border/90 px-6 py-10 text-center rounded-sm shadow-xs">
      <Inbox size={28} strokeWidth={1.2} className="mb-3 text-primary/70" />
      <h2 className="font-journal text-2xl font-normal text-foreground">A blank page is waiting for your pen.</h2>
      <p className="mt-2 max-w-[360px] font-handwriting text-2xl text-muted-foreground leading-snug">
        {date === today() ? 'What thoughts or reflections would you like to record today?' : 'Nothing was inscribed on this leaf. It is waiting patiently.'}
      </p>
      <button
        type="button"
        onClick={onNew}
        className="wax-seal mt-6 inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 shadow-sm"
        data-testid="button-empty-new-entry"
      >
        <Plus size={14} /> Inscribe on this page
      </button>
    </div>
  );
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
  return (
    <div className="page-in">
      <div className="mx-auto max-w-[960px] px-6 pb-20 pt-8 sm:px-10 lg:px-14 lg:pt-12">
        <button
          type="button"
          onClick={() => setLocation('/')}
          className="mb-8 flex items-center gap-2 font-mono-note text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
          data-testid="button-back-to-diary"
        >
          <ArrowLeft size={16} />Return to today's ledger
        </button>

        <article className="relative bg-[#fffdf8] border border-border/90 px-8 py-10 shadow-lg sm:px-14 sm:py-14 rounded-sm">
          <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-primary/80 rounded-l-sm" />
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-7">
            <div>
              <p className="font-mono-note text-[11px] uppercase tracking-[.22em] text-primary font-semibold">
                {dateLabel(note.date)} · Leaf {String(note.pageNumber).padStart(2, '0')}
              </p>
              <h1 className="mt-3 max-w-[680px] font-journal text-4xl leading-tight sm:text-5xl font-normal text-foreground">
                {note.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {note.pinned && (
                <span className="mr-2 flex items-center gap-1 font-mono-note text-[10px] uppercase tracking-[.14em] text-[#b5832c] font-semibold bg-[#faf0dc] px-2.5 py-1 rounded border border-[#deb868]/60">
                  <Bookmark size={13} fill="currentColor" />Bookmarked
                </span>
              )}
              <button
                type="button"
                onClick={() => onEdit(note)}
                className="flex size-9 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-[#ede3d0]"
                aria-label="Edit entry"
                data-testid={`button-entry-edit-${note.id}`}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => onToggle('archive', note.id)}
                className="flex size-9 items-center justify-center rounded-sm text-muted-foreground hover:text-primary hover:bg-[#ede3d0]"
                aria-label={note.archived ? 'Restore entry' : 'Archive entry'}
                data-testid={`button-entry-archive-${note.id}`}
              >
                {note.archived ? <RotateCcw size={16} /> : <Archive size={16} />}
              </button>
            </div>
          </div>

          <div className="margin-rule mt-8 min-h-[300px] whitespace-pre-line ruled-paper pl-6 font-reading text-lg leading-8 text-foreground/85 sm:pl-8 sm:text-xl">
            {note.content}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border/80 pt-6">
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-border bg-[#faf5eb] px-2.5 py-1 font-mono-note text-[9px] uppercase tracking-[.12em] text-muted-foreground rounded-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {note.type === 'task' && (
                <button
                  type="button"
                  onClick={() => onToggle('complete', note.id)}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-accent bg-[#f8f3e8] px-3 py-1.5 rounded border border-border/80"
                  data-testid={`button-entry-complete-${note.id}`}
                >
                  {note.completed ? <CheckCircle2 size={16} className="text-accent" /> : <Circle size={16} />}
                  {note.completed ? 'Completed' : 'Mark complete'}
                </button>
              )}
              <button
                type="button"
                onClick={() => onToggle('pin', note.id)}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary bg-[#f8f3e8] px-3 py-1.5 rounded border border-border/80"
                data-testid={`button-entry-pin-${note.id}`}
              >
                <Bookmark size={15} fill={note.pinned ? 'currentColor' : 'none'} />
                {note.pinned ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
          </div>
        </article>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="flex items-center gap-2 text-xs font-mono-note uppercase tracking-wider text-muted-foreground hover:text-destructive"
            data-testid={`button-entry-delete-${note.id}`}
          >
            <Trash2 size={14} />Remove this leaf from diary
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteModal({ note, onClose, onCreate, onUpdate }: { note?: Note; onClose: () => void; onCreate: (input: Omit<Note, 'id' | 'pageNumber'>) => void; onUpdate: (id: string, changes: Partial<Note>) => void }) {
  const [form, setForm] = useState({
    title: note?.title ?? '',
    content: note?.content ?? '',
    type: note?.type ?? ('note' as NoteType),
    category: note?.category ?? ('personal' as NoteCategory),
    priority: note?.priority ?? ('low' as NotePriority),
    tags: note?.tags.join(', ') ?? '',
    date: note?.date ?? today(),
    dueDate: note?.dueDate ?? '',
    reminderTime: note?.reminderTime ?? '',
  });

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    const common = {
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      category: form.category,
      priority: form.priority,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      date: form.date,
      dueDate: form.dueDate || undefined,
      reminderTime: form.reminderTime || undefined,
      completed: note?.completed ?? false,
      pinned: note?.pinned ?? false,
      archived: note?.archived ?? false,
    };
    if (note) onUpdate(note.id, common);
    else onCreate(common);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
    >
      <div className="max-h-[92dvh] w-full max-w-[720px] overflow-y-auto bg-[#fffdf8] border-2 border-[#472617] rounded-none sm:rounded-xl shadow-2xl page-in">
        <div className="flex items-center justify-between leather-spine border-b border-[#472617] px-6 py-5">
          <div>
            <p className="font-mono-note text-[10px] uppercase tracking-[.22em] text-[#cda250] font-semibold">
              {note ? 'Revising Entry' : 'Inscribing New Leaf'}
            </p>
            <h2 id="note-modal-title" className="mt-1 font-journal text-2xl text-[#f7ecd5] font-normal">
              {note ? 'Amend your reflections' : 'What is on your mind today?'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-sm text-[#cda250] hover:text-[#f7ecd5] hover:bg-[#3d2014]"
            aria-label="Close dialog"
            data-testid="button-close-note-modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-6 px-6 py-7 sm:px-8 bg-background paper-grain">
          <div>
            <label htmlFor="note-title" className="mb-2 block font-mono-note text-[10px] uppercase tracking-[.18em] text-primary font-semibold">
              Entry Title
            </label>
            <input
              id="note-title"
              autoFocus
              value={form.title}
              onChange={(event) => set('title', event.target.value)}
              placeholder="Give this thought a title..."
              className="w-full border-0 border-b-2 border-border/80 bg-transparent px-0 py-2.5 font-journal text-3xl placeholder:text-muted-foreground/45 focus:border-primary focus:ring-0 text-foreground"
              required
              data-testid="input-note-title"
            />
          </div>

          <div>
            <label htmlFor="note-content" className="mb-2 block font-mono-note text-[10px] uppercase tracking-[.18em] text-primary font-semibold">
              Journal Leaf
            </label>
            <textarea
              id="note-content"
              value={form.content}
              onChange={(event) => set('content', event.target.value)}
              placeholder="Pen your thoughts here on these ruled lines..."
              rows={8}
              className="ruled-paper margin-rule w-full resize-y border border-border/80 bg-[#fffdf8] p-4 pl-6 font-reading text-base leading-8 placeholder:font-handwriting placeholder:text-2xl placeholder:text-muted-foreground/50 focus:border-primary focus:ring-0 rounded-xs text-foreground"
              required
              data-testid="textarea-note-content"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FieldSelect label="Type" value={form.type} onChange={(value) => set('type', value)} options={['note', 'task', 'reminder', 'idea']} testId="select-note-type" />
            <FieldSelect label="Category" value={form.category} onChange={(value) => set('category', value)} options={['personal', 'college', 'work', 'projects', 'ideas', 'other']} testId="select-note-category" />
            <FieldSelect label="Priority" value={form.priority} onChange={(value) => set('priority', value)} options={['low', 'medium', 'high']} testId="select-note-priority" />
            <div>
              <label htmlFor="note-date" className="mb-2 block font-mono-note text-[10px] uppercase tracking-[.14em] text-muted-foreground font-semibold">
                Date
              </label>
              <input
                id="note-date"
                type="date"
                value={form.date}
                onChange={(event) => set('date', event.target.value)}
                className="w-full border border-border bg-[#faf5eb] px-3 py-2 text-xs focus:border-primary focus:ring-0 rounded-xs"
                data-testid="input-note-date"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="note-tags" className="mb-2 block font-mono-note text-[10px] uppercase tracking-[.14em] text-muted-foreground font-semibold">
                Tags <span className="normal-case tracking-normal opacity-70">(comma separated)</span>
              </label>
              <input
                id="note-tags"
                value={form.tags}
                onChange={(event) => set('tags', event.target.value)}
                placeholder="reflection, aws, ideas"
                className="w-full border border-border bg-[#faf5eb] px-3 py-2 text-xs focus:border-primary focus:ring-0 rounded-xs"
                data-testid="input-note-tags"
              />
            </div>
            <div>
              <label htmlFor="note-due" className="mb-2 block font-mono-note text-[10px] uppercase tracking-[.14em] text-muted-foreground font-semibold">
                Due date <span className="normal-case tracking-normal opacity-70">(optional)</span>
              </label>
              <input
                id="note-due"
                type="date"
                value={form.dueDate}
                onChange={(event) => set('dueDate', event.target.value)}
                className="w-full border border-border bg-[#faf5eb] px-3 py-2 text-xs focus:border-primary focus:ring-0 rounded-xs"
                data-testid="input-note-due-date"
              />
            </div>
            <div>
              <label htmlFor="note-reminder" className="mb-2 block font-mono-note text-[10px] uppercase tracking-[.14em] text-muted-foreground font-semibold">
                Reminder time
              </label>
              <input
                id="note-reminder"
                type="time"
                value={form.reminderTime}
                onChange={(event) => set('reminderTime', event.target.value)}
                className="w-full border border-border bg-[#faf5eb] px-3 py-2 text-xs focus:border-primary focus:ring-0 rounded-xs"
                data-testid="input-note-reminder-time"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono-note uppercase tracking-wider text-muted-foreground hover:text-foreground"
              data-testid="button-cancel-note"
            >
              Discard
            </button>
            <button
              type="submit"
              className="wax-seal flex items-center gap-2.5 bg-gradient-to-r from-[#801e25] to-[#5d1419] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#fff8f0] border border-[#a12830] shadow-md hover:brightness-110 active:scale-95"
              data-testid="button-save-note"
            >
              <Check size={16} />
              {note ? 'Save changes' : 'Seal in diary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldSelect({ label, value, onChange, options, testId }: { label: string; value: string; onChange: (value: string) => void; options: string[]; testId: string }) {
  return <div><label className="mb-2 block font-mono-note text-[9px] uppercase tracking-[.12em] text-muted-foreground">{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-border bg-transparent px-2 py-2 text-xs capitalize focus:border-primary focus:ring-0" data-testid={testId}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}

function NotFound() {
  return <div className="flex min-h-[70dvh] items-center justify-center px-6 text-center"><div><Sparkles size={24} className="mx-auto mb-4 text-primary" strokeWidth={1.2} /><h1 className="font-journal text-3xl">This page has not been written.</h1><p className="mt-3 text-sm text-muted-foreground">The address is right in spirit, but not in the notebook.</p><Link href="/" className="mt-6 inline-flex border-b border-primary pb-1 text-xs text-primary" data-testid="link-not-found-home">Return to today</Link></div></div>;
}

export default App;