import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  FiArchive,
  FiBookOpen,
  FiCheck,
  FiChevronLeft,
  FiEye,
  FiFileText,
  FiGrid,
  FiPlus,
  FiRotateCcw,
  FiRotateCw,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
  FiEdit2,
  FiBookmark
} from 'react-icons/fi';

import { noteApi } from '../../services/note';
import { shareService } from '../../services/share';

const MAX_HISTORY = 50;

const emptyDraft = { title: '', content: '', tags: '' };

const draftsEqual = (first, second) =>
  first.title === second.title && first.content === second.content && first.tags === second.tags;

const parseTags = (tagsValue) =>
  tagsValue
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

const formatReadableDate = (date) => {
  if (!date) return 'Not set yet';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
};

const isImageUrl = (value) => /^https?:\/\/\S+\.(png|jpg|jpeg|gif|webp|svg)(\?\S*)?$/i.test(value.trim());
const imageMarkdownPattern = /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/i;
const tableSeparatorPattern = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/;
const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const rawUrlPattern = /(https?:\/\/[^\s<]+)/g;

const splitTableRow = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

const renderInlineContent = (text) => {
  const parts = [];
  let cursor = 0;
  const pattern = new RegExp(`${markdownLinkPattern.source}|${rawUrlPattern.source}`, 'g');
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index));
    }

    const label = match[1];
    const markdownUrl = match[2];
    const rawUrl = match[3];
    const href = markdownUrl || rawUrl;
    const content = label || rawUrl;

    parts.push(
      <a
        key={`${href}-${match.index}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-cyan-500 underline decoration-cyan-400/40 underline-offset-4 transition-colors hover:text-cyan-400"
      >
        {content}
      </a>
    );
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
};

const parseNoteContent = (content = '') => {
  const lines = String(content).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
    paragraph = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      i += 1;
      continue;
    }

    if (/^```/.test(trimmed)) {
      flushParagraph();
      const language = trimmed.slice(3).trim();
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'code', language, code: codeLines.join('\n') });
      i += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2]
      });
      i += 1;
      continue;
    }

    const imageMatch = trimmed.match(imageMarkdownPattern);
    if (imageMatch || (isImageUrl(trimmed) && !trimmed.includes(' '))) {
      flushParagraph();
      blocks.push({
        type: 'image',
        alt: imageMatch?.[1] || 'Note image',
        src: imageMatch?.[2] || trimmed
      });
      i += 1;
      continue;
    }

    const checklistMatch = trimmed.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/);
    if (checklistMatch) {
      flushParagraph();
      const items = [];
      while (i < lines.length) {
        const currentTrimmed = lines[i].trim();
        const itemMatch = currentTrimmed.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/);
        if (!itemMatch) break;
        items.push({
          checked: itemMatch[1].toLowerCase() === 'x',
          text: itemMatch[2]
        });
        i += 1;
      }
      blocks.push({ type: 'checklist', items });
      continue;
    }

    if (trimmed.includes('|') && i + 1 < lines.length && tableSeparatorPattern.test(lines[i + 1].trim())) {
      flushParagraph();
      const header = splitTableRow(trimmed);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    paragraph.push(line);
    i += 1;
  }

  flushParagraph();
  return blocks;
};

const NoteContentRenderer = ({ content }) => {
  const blocks = useMemo(() => parseNoteContent(content), [content]);

  if (!blocks.length) {
    return <p className="text-sm leading-7 text-slate-500">This note is empty.</p>;
  }

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const HeadingTag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4';
          const headingClass =
            block.level === 1
              ? 'text-2xl font-semibold tracking-tight'
              : block.level === 2
                ? 'text-xl font-semibold tracking-tight'
                : 'text-lg font-semibold';
          return (
            <HeadingTag key={`${block.type}-${index}`} className={`${headingClass} text-slate-950 dark:text-white`}>
              {renderInlineContent(block.text)}
            </HeadingTag>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p
              key={`${block.type}-${index}`}
              className="whitespace-pre-wrap text-[15px] leading-8 text-slate-600 dark:text-slate-300"
            >
              {renderInlineContent(block.text)}
            </p>
          );
        }

        if (block.type === 'image') {
          return (
            <figure key={`${block.type}-${index}`} className="overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))]">
              <img src={block.src} alt={block.alt} className="max-h-[34rem] w-full object-cover" />
              {block.alt && (
                <figcaption className="border-t border-[rgb(var(--border))] px-4 py-3 text-xs text-slate-500">
                  {block.alt}
                </figcaption>
              )}
            </figure>
          );
        }

        if (block.type === 'checklist') {
          return (
            <div key={`${block.type}-${index}`} className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <div
                  key={`${item.text}-${itemIndex}`}
                  className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-4 py-3"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      item.checked
                        ? 'border-cyan-500 bg-cyan-500 text-white'
                        : 'border-slate-300 text-transparent dark:border-slate-600'
                    }`}
                  >
                    <FiCheck className="h-3 w-3" />
                  </span>
                  <p className={`text-sm leading-7 ${item.checked ? 'text-slate-500 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                    {renderInlineContent(item.text)}
                  </p>
                </div>
              ))}
            </div>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={`${block.type}-${index}`} className="overflow-x-auto rounded-3xl border border-[rgb(var(--border))]">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-[rgb(var(--bg-elevated))]">
                  <tr>
                    {block.header.map((cell, cellIndex) => (
                      <th key={`${cell}-${cellIndex}`} className="border-b border-[rgb(var(--border))] px-4 py-3 font-semibold text-slate-950 dark:text-white">
                        {renderInlineContent(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="odd:bg-[rgb(var(--bg))]">
                      {row.map((cell, cellIndex) => (
                        <td key={`${rowIndex}-${cellIndex}`} className="border-b border-[rgb(var(--border))] px-4 py-3 text-slate-600 dark:text-slate-300">
                          {renderInlineContent(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'code') {
          return (
            <div key={`${block.type}-${index}`} className="overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-slate-950 shadow-lg">
              {block.language && (
                <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {block.language}
                </div>
              )}
              <pre className="overflow-x-auto px-4 py-4 text-sm leading-7 text-slate-100">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

const NotesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const currentUser = outletContext?.currentUser || null;
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [editHistory, setEditHistory] = useState({ past: [], future: [] });
  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState(emptyDraft);
  const [createHistory, setCreateHistory] = useState({ past: [], future: [] });
  const [confirmDialog, setConfirmDialog] = useState(null);

  const readingMode = searchParams.get('mode') === 'read';
  const noteViewId = searchParams.get('view');
  const sharedOwnerId = searchParams.get('sharedOwnerId');
  const sharedOwnerName = searchParams.get('sharedOwnerName');
  const sharedContentType = searchParams.get('contentType');

  const { data, isLoading } = useQuery({
    queryKey: ['notes', search, selectedTag],
    queryFn: () => noteApi.getNotes({ search: search || undefined, tag: selectedTag || undefined })
  });

  const { data: tagsData } = useQuery({
    queryKey: ['note-tags'],
    queryFn: () => noteApi.getTags()
  });

  const sharedNotesQuery = useQuery({
    queryKey: ['shared-notes', sharedOwnerId, sharedContentType],
    queryFn: () => shareService.viewSharedData(sharedOwnerId, sharedContentType),
    enabled: readingMode && !!sharedOwnerId && sharedContentType === 'notes'
  });

  const noteViewQuery = useQuery({
    queryKey: ['note-view', noteViewId],
    queryFn: () => noteApi.getNote(noteViewId),
    enabled: readingMode && !!noteViewId && !sharedOwnerId
  });

  const createMutation = useMutation({
    mutationFn: (payload) => noteApi.createNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note-tags'] });
      setShowCreate(false);
      setCreateDraft(emptyDraft);
      setCreateHistory({ past: [], future: [] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: payload }) => noteApi.updateNote(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note-tags'] });
      setEditingNoteId(null);
      setEditDraft(emptyDraft);
      setEditHistory({ past: [], future: [] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => noteApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note-tags'] });
    }
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, isPinned }) => noteApi.updateNote(id, { isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: ({ id, isArchived }) => noteApi.updateNote(id, { isArchived }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note-tags'] });
    }
  });

  const notes = data?.data?.data || [];
  const tags = tagsData?.data?.data || [];
  const readingNote = noteViewQuery.data?.data?.data || null;
  const sharedNotes = sharedNotesQuery.data?.data?.items || [];

  const formatDate = (date) => {
    const value = new Date(date);
    const now = new Date();
    const diff = now - value;
    if (diff < 86400000) return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return value.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getPreview = (content) => {
    const text = String(content || '').replace(/<[^>]*>/g, '');
    return text.slice(0, 120) + (text.length > 120 ? '...' : '');
  };

  const applyDraftUpdate = (mode, nextDraft) => {
    if (mode === 'create') {
      if (draftsEqual(createDraft, nextDraft)) return;
      setCreateHistory((history) => ({
        past: [...history.past.slice(-MAX_HISTORY + 1), createDraft],
        future: []
      }));
      setCreateDraft(nextDraft);
      return;
    }

    if (draftsEqual(editDraft, nextDraft)) return;
    setEditHistory((history) => ({
      past: [...history.past.slice(-MAX_HISTORY + 1), editDraft],
      future: []
    }));
    setEditDraft(nextDraft);
  };

  const undoDraft = (mode) => {
    if (mode === 'create') {
      setCreateHistory((history) => {
        if (!history.past.length) return history;
        const previous = history.past[history.past.length - 1];
        setCreateDraft(previous);
        return {
          past: history.past.slice(0, -1),
          future: [createDraft, ...history.future].slice(0, MAX_HISTORY)
        };
      });
      return;
    }

    setEditHistory((history) => {
      if (!history.past.length) return history;
      const previous = history.past[history.past.length - 1];
      setEditDraft(previous);
      return {
        past: history.past.slice(0, -1),
        future: [editDraft, ...history.future].slice(0, MAX_HISTORY)
      };
    });
  };

  const redoDraft = (mode) => {
    if (mode === 'create') {
      setCreateHistory((history) => {
        if (!history.future.length) return history;
        const [next, ...remaining] = history.future;
        setCreateDraft(next);
        return {
          past: [...history.past, createDraft].slice(-MAX_HISTORY),
          future: remaining
        };
      });
      return;
    }

    setEditHistory((history) => {
      if (!history.future.length) return history;
      const [next, ...remaining] = history.future;
      setEditDraft(next);
      return {
        past: [...history.past, editDraft].slice(-MAX_HISTORY),
        future: remaining
      };
    });
  };

  const handleDraftChange = (mode, field, value) => {
    if (mode === 'create') {
      applyDraftUpdate('create', { ...createDraft, [field]: value });
      return;
    }

    applyDraftUpdate('edit', { ...editDraft, [field]: value });
  };

  const handleDraftKeyDown = (mode) => (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        redoDraft(mode);
      } else {
        undoDraft(mode);
      }
    }

    if (event.key.toLowerCase() === 'y') {
      event.preventDefault();
      redoDraft(mode);
    }
  };

  const startEdit = (note) => {
    setEditingNoteId(note._id);
    const nextDraft = {
      title: note.title || '',
      content: note.content || '',
      tags: (note.tags || []).join(', ')
    };
    setEditDraft(nextDraft);
    setEditHistory({ past: [], future: [] });
  };

  const saveEdit = (id) => {
    updateMutation.mutate({
      id,
      data: {
        title: editDraft.title.trim() || 'Untitled',
        content: editDraft.content,
        tags: parseTags(editDraft.tags)
      }
    });
  };

  const saveNewNote = () => {
    createMutation.mutate({
      title: createDraft.title.trim() || 'Untitled',
      content: createDraft.content,
      tags: parseTags(createDraft.tags)
    });
  };

  const openReadingMode = (noteId) => {
    const params = new URLSearchParams(searchParams);
    params.set('mode', 'read');
    params.set('view', noteId);
    params.delete('sharedOwnerId');
    params.delete('sharedOwnerName');
    params.delete('contentType');
    setSearchParams(params, { replace: false });
  };

  const closeReadingMode = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('mode');
    params.delete('view');
    params.delete('sharedOwnerId');
    params.delete('sharedOwnerName');
    params.delete('contentType');
    setSearchParams(params, { replace: false });
  };

  const beginCreate = () => {
    setShowCreate(true);
    setCreateDraft(emptyDraft);
    setCreateHistory({ past: [], future: [] });
  };

  const cancelCreate = () => {
    setShowCreate(false);
    setCreateDraft(emptyDraft);
    setCreateHistory({ past: [], future: [] });
  };

  const requestConfirm = (action, note) => {
    setConfirmDialog({ action, note });
  };

  const confirmAction = () => {
    if (!confirmDialog) return;
    const { action, note } = confirmDialog;

    if (action === 'edit') {
      startEdit(note);
    } else if (action === 'delete') {
      deleteMutation.mutate(note._id);
    } else if (action === 'archive') {
      toggleArchiveMutation.mutate({ id: note._id, isArchived: !note.isArchived });
    }

    setConfirmDialog(null);
  };

  const cancelConfirm = () => {
    setConfirmDialog(null);
  };

  const isReadingSharedNotes = readingMode && !!sharedOwnerId && sharedContentType === 'notes';
  const isReadingSingleNote = readingMode && !!noteViewId && !sharedOwnerId;

  const readingHeader = useMemo(() => {
    if (isReadingSharedNotes) {
      return {
        title: `${sharedOwnerName || 'Shared'} notes`,
        description: 'Reading mode keeps the view clean and distraction-free.'
      };
    }

    return {
      title: 'Reading mode',
      description: 'Review this note without editing controls.'
    };
  }, [isReadingSharedNotes, sharedOwnerName]);

  const readingAuthorName =
    readingNote?.author?.name ||
    sharedOwnerName ||
    currentUser?.name ||
    'You';

  if (readingMode) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-label w-fit">Notes</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{readingHeader.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{readingHeader.description}</p>
          </div>
          <button type="button" onClick={closeReadingMode} className="secondary-button">
            <FiChevronLeft />
            Back to notes
          </button>
        </div>

        {isReadingSharedNotes ? (
          <div className="surface-card p-6">
            {sharedNotesQuery.isLoading ? (
              <div className="py-16 text-center text-sm text-slate-500">Loading shared notes...</div>
            ) : sharedNotes.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">No shared notes are available right now.</div>
            ) : (
              <div className="grid gap-4">
                {sharedNotes.map((note) => (
                  <article key={note._id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{note.title || 'Untitled'}</h2>
                        <p className="mt-1 text-xs text-slate-500">{sharedOwnerName || note.author?.name || 'Shared user'}</p>
                      </div>
                      {note.isPinned && <span className="nav-chip">Pinned</span>}
                    </div>
                    {note.content && (
                      <div className="mt-4">
                        <NoteContentRenderer content={note.content} />
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {(note.tags || []).map((tag) => (
                        <span key={tag} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-500">
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs text-slate-500">{formatReadableDate(note.createdAt)}</span>
                      <span className="text-xs text-slate-500">{formatReadableDate(note.updatedAt)}</span>
                      {note.wordCount > 0 && <span className="text-xs text-slate-500">{note.wordCount} words</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="surface-card p-6">
            {noteViewQuery.isLoading ? (
              <div className="py-16 text-center text-sm text-slate-500">Loading note...</div>
            ) : readingNote ? (
              <article>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{readingNote.title || 'Untitled'}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>By {readingAuthorName}</span>
                      <span>Created {formatReadableDate(readingNote.createdAt)}</span>
                      <span>Edited {formatReadableDate(readingNote.updatedAt)}</span>
                      {readingNote.wordCount > 0 && <span>{readingNote.wordCount} words</span>}
                    </div>
                  </div>
                  <span className="nav-chip">Read only</span>
                </div>
                <div className="mt-6">
                  <NoteContentRenderer content={readingNote.content} />
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {(readingNote.tags || []).map((tag) => (
                    <span key={tag} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-500">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ) : (
              <div className="py-16 text-center text-sm text-slate-500">This note could not be loaded.</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-950 dark:text-white">
            <FiFileText className="text-cyan-500" />
            Notes
          </h1>
          <p className="mt-1 text-sm text-slate-500">Capture ideas, pin what matters, and read shared notes in a clean mode.</p>
        </div>
        <button onClick={beginCreate} className="primary-button">
          <FiPlus />
          New note
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="input-shell flex flex-1 items-center gap-2">
          <FiSearch className="text-slate-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedTag === tag.name
                  ? 'bg-cyan-500/20 text-cyan-500'
                  : 'bg-[rgb(var(--bg-elevated))] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FiTag className="h-3 w-3" />
              {tag.name}
              <span className="text-[10px] opacity-60">({tag.count})</span>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="surface-card space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Create note</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => undoDraft('create')}
                disabled={!createHistory.past.length}
                className="secondary-button text-xs px-3 py-1.5 disabled:opacity-50"
              >
                <FiRotateCcw />
                Undo
              </button>
              <button
                type="button"
                onClick={() => redoDraft('create')}
                disabled={!createHistory.future.length}
                className="secondary-button text-xs px-3 py-1.5 disabled:opacity-50"
              >
                <FiRotateCw />
                Redo
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Note title..."
            value={createDraft.title}
            onChange={(e) => handleDraftChange('create', 'title', e.target.value)}
            onKeyDown={handleDraftKeyDown('create')}
            className="input-shell w-full text-lg font-medium"
            autoFocus
          />
          <textarea
            placeholder="Start writing..."
            value={createDraft.content}
            onChange={(e) => handleDraftChange('create', 'content', e.target.value)}
            onKeyDown={handleDraftKeyDown('create')}
            className="input-shell min-h-[140px] w-full resize-y"
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={createDraft.tags}
            onChange={(e) => handleDraftChange('create', 'tags', e.target.value)}
            onKeyDown={handleDraftKeyDown('create')}
            className="input-shell w-full text-xs"
          />
          <div className="flex justify-end gap-2">
            <button onClick={cancelCreate} className="secondary-button text-sm">
              <FiX />
              Cancel
            </button>
            <button
              onClick={saveNewNote}
              className="primary-button text-sm"
              disabled={createMutation.isPending}
            >
              <FiCheck />
              Create
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-16 text-sm text-slate-500">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--bg-elevated))]">
              <FiGrid className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No notes yet. Create your first one!</p>
          </div>
        ) : (
          notes.map((note) => {
            const isEditing = editingNoteId === note._id;
            return (
              <article
                key={note._id}
                role="button"
                tabIndex={0}
                onClick={() => openReadingMode(note._id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openReadingMode(note._id);
                  }
                }}
                className={`surface-card group relative flex flex-col p-4 transition-all hover:-translate-y-0.5 ${
                  note.isPinned ? 'ring-1 ring-cyan-500/30' : ''
                }`}
                style={note.color ? { borderTopColor: note.color, borderTopWidth: 3 } : {}}
              >
                {isEditing ? (
                  <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Edit note</h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => undoDraft('edit')}
                          disabled={!editHistory.past.length}
                          className="secondary-button text-xs px-3 py-1.5 disabled:opacity-50"
                        >
                          <FiRotateCcw />
                          Undo
                        </button>
                        <button
                          type="button"
                          onClick={() => redoDraft('edit')}
                          disabled={!editHistory.future.length}
                          className="secondary-button text-xs px-3 py-1.5 disabled:opacity-50"
                        >
                          <FiRotateCw />
                          Redo
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editDraft.title}
                      onChange={(e) => handleDraftChange('edit', 'title', e.target.value)}
                      onKeyDown={handleDraftKeyDown('edit')}
                      className="input-shell w-full text-sm font-medium"
                      autoFocus
                    />
                    <textarea
                      value={editDraft.content}
                      onChange={(e) => handleDraftChange('edit', 'content', e.target.value)}
                      onKeyDown={handleDraftKeyDown('edit')}
                      className="input-shell min-h-[120px] w-full resize-y text-sm"
                    />
                    <input
                      type="text"
                      value={editDraft.tags}
                      onChange={(e) => handleDraftChange('edit', 'tags', e.target.value)}
                      onKeyDown={handleDraftKeyDown('edit')}
                      placeholder="Tags (comma separated)"
                      className="input-shell w-full text-xs"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(note._id)} className="primary-button text-xs px-3 py-1.5">
                        <FiCheck />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditDraft(emptyDraft);
                          setEditHistory({ past: [], future: [] });
                        }}
                        className="secondary-button text-xs px-3 py-1.5"
                      >
                        <FiX />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                        {note.title || 'Untitled'}
                      </h3>
                      <div
                        className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openReadingMode(note._id)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[rgb(var(--bg))]"
                          title="Reading mode"
                        >
                          <FiEye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePinMutation.mutate({ id: note._id, isPinned: !note.isPinned })}
                          className={`rounded-lg p-1.5 transition-colors hover:bg-[rgb(var(--bg))] ${
                            note.isPinned ? 'text-cyan-500' : 'text-slate-400'
                          }`}
                          title="Pin"
                        >
                          <FiBookmark className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestConfirm('edit', note)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[rgb(var(--bg))]"
                          title="Edit"
                        >
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestConfirm('archive', note)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[rgb(var(--bg))]"
                          title={note.isArchived ? 'Unarchive' : 'Archive'}
                        >
                          <FiArchive className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestConfirm('delete', note)}
                          className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-[rgb(var(--bg))]"
                          title="Delete"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {note.content && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{getPreview(note.content)}</p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {note.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-500"
                          >
                            {tag}
                          </span>
                        ))}
                        {(note.tags?.length || 0) > 3 && (
                          <span className="text-[10px] text-slate-500">+{note.tags.length - 3}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        {note.wordCount > 0 && <span>{note.wordCount} words</span>}
                        <span>{formatDate(note.updatedAt)}</span>
                      </div>
                    </div>
                  </>
                )}
              </article>
            );
          })
        )}
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {confirmDialog.action === 'delete'
                ? 'Delete note?'
                : confirmDialog.action === 'edit'
                  ? 'Edit note?'
                  : 'Archive note?'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {confirmDialog.action === 'delete'
                ? 'Are you sure you want to delete this note?'
                : confirmDialog.action === 'edit'
                  ? 'Are you sure you want to edit this note?'
                  : 'Are you sure you want to archive this note?'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="secondary-button" onClick={cancelConfirm}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={confirmAction}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
