import Note from '../models/Note.js';
import User from '../models/User.js';

export const getNotes = async (userId, options = {}) => {
  const { includeArchived = false, tag, search, limit = 50, before } = options;

  const filter = {
    author: userId,
    isDeleted: false,
    isArchived: includeArchived ? undefined : false
  };

  Object.keys(filter).forEach((k) => filter[k] === undefined && delete filter[k]);

  if (tag) {
    filter.tags = tag;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }

  if (before) {
    filter.updatedAt = { $lt: new Date(before) };
  }

  const notes = await Note.find(filter)
    .sort({ isPinned: -1, updatedAt: -1 })
    .limit(parseInt(limit))
    .lean();

  return notes;
};

export const getNote = async (noteId, userId) => {
  const note = await Note.findOne({ _id: noteId, author: userId, isDeleted: false }).lean();
  if (!note) {
    throw Object.assign(new Error('Note not found'), { statusCode: 404 });
  }
  return note;
};

export const createNote = async (userId, data) => {
  const note = await Note.create({
    author: userId,
    title: data.title || 'Untitled',
    content: data.content || '',
    tags: data.tags || [],
    color: data.color || ''
  });

  await User.findByIdAndUpdate(userId, { $inc: { 'stats.notesCreated': 1 } });

  return note.toObject();
};

export const updateNote = async (noteId, userId, data) => {
  const allowed = ['title', 'content', 'tags', 'color', 'isPinned', 'isArchived'];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      update[key] = data[key];
    }
  }

  const note = await Note.findOneAndUpdate(
    { _id: noteId, author: userId, isDeleted: false },
    { $set: update },
    { new: true, runValidators: true }
  ).lean();

  if (!note) {
    throw Object.assign(new Error('Note not found'), { statusCode: 404 });
  }
  return note;
};

export const deleteNote = async (noteId, userId) => {
  const note = await Note.findOneAndUpdate(
    { _id: noteId, author: userId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  ).lean();

  if (!note) {
    throw Object.assign(new Error('Note not found'), { statusCode: 404 });
  }
  return { success: true };
};

export const getTags = async (userId) => {
  const notes = await Note.find({ author: userId, isDeleted: false })
    .select('tags')
    .lean();

  const tagMap = new Map();
  for (const note of notes) {
    for (const tag of note.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }

  return Array.from(tagMap.entries()).map(([name, count]) => ({ name, count }));
};
