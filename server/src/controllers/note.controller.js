import * as noteService from '../services/note.service.js';

export const getNotes = async (req, res, next) => {
  try {
    const { includeArchived, tag, search, limit, before } = req.query;
    const notes = await noteService.getNotes(req.user.id, {
      includeArchived: includeArchived === 'true',
      tag,
      search,
      limit,
      before
    });
    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};

export const getNote = async (req, res, next) => {
  try {
    const note = await noteService.getNote(req.params.noteId, req.user.id);
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const note = await noteService.createNote(req.user.id, req.body);
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const note = await noteService.updateNote(req.params.noteId, req.user.id, req.body);
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const result = await noteService.deleteNote(req.params.noteId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getTags = async (req, res, next) => {
  try {
    const tags = await noteService.getTags(req.user.id);
    res.json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
};
