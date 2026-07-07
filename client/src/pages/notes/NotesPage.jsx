import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiSearch, FiTag, FiBookmark, FiArchive, FiTrash2, FiEdit2, FiCheck, FiX, FiFileText, FiGrid } from 'react-icons/fi';
import { noteApi } from '../../services/note';

const NotesPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const createRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notes', search, selectedTag],
    queryFn: () => noteApi.getNotes({ search: search || undefined, tag: selectedTag || undefined }),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['note-tags'],
    queryFn: () => noteApi.getTags(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => noteApi.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note-tags'] });
      setShowCreate(false);
      setNewTitle('');
      setNewContent('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => noteApi.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note-tags'] });
      setEditingNoteId(null);
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
    }
  });

  const notes = data?.data?.data || [];
  const tags = tagsData?.data?.data || [];

  const startEdit = (note) => {
    setEditingNoteId(note._id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags((note.tags || []).join(', '));
  };

  const saveEdit = (id) => {
    updateMutation.mutate({
      id,
      data: {
        title: editTitle,
        content: editContent,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean)
      }
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getPreview = (content) => {
    const text = content.replace(/<[^>]*>/g, '');
    return text.slice(0, 120) + (text.length > 120 ? '...' : '');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-950 dark:text-white">
          <FiFileText className="text-cyan-500" />
          Notes
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="primary-button"
        >
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
        <div ref={createRef} className="surface-card space-y-3 p-4">
          <input
            type="text"
            placeholder="Note title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input-shell w-full text-lg font-medium"
            autoFocus
          />
          <textarea
            placeholder="Start writing..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="input-shell min-h-[120px] w-full resize-y"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="secondary-button text-sm">
              <FiX />
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate({ title: newTitle || 'Untitled', content: newContent })}
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
              <div
                key={note._id}
                className={`surface-card group relative flex flex-col p-4 transition-all hover:-translate-y-0.5 ${
                  note.isPinned ? 'ring-1 ring-cyan-500/30' : ''
                }`}
                style={note.color ? { borderTopColor: note.color, borderTopWidth: 3 } : {}}
              >
                {isEditing ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="input-shell w-full text-sm font-medium"
                      autoFocus
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="input-shell min-h-[100px] w-full resize-y text-sm"
                    />
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags (comma separated)"
                      className="input-shell w-full text-xs"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(note._id)} className="primary-button text-xs px-3 py-1.5">
                        <FiCheck />
                        Save
                      </button>
                      <button onClick={() => setEditingNoteId(null)} className="secondary-button text-xs px-3 py-1.5">
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
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => togglePinMutation.mutate({ id: note._id, isPinned: !note.isPinned })}
                          className={`rounded-lg p-1.5 transition-colors hover:bg-[rgb(var(--bg))] ${
                            note.isPinned ? 'text-cyan-500' : 'text-slate-400'
                          }`}
                        >
                          <FiBookmark className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => startEdit(note)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[rgb(var(--bg))]"
                        >
                          <FiEdit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => toggleArchiveMutation.mutate({ id: note._id, isArchived: !note.isArchived })}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[rgb(var(--bg))]"
                        >
                          <FiArchive className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(note._id)}
                          className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-[rgb(var(--bg))]"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {note.content && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{getPreview(note.content)}</p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3">
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotesPage;
