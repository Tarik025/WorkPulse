import api, { unwrap } from "./axios";

export const notesApi = {
  async list(projectId) {
    const data = unwrap(await api.get(`/notes/${projectId}`));
    return Array.isArray(data) ? data : [];
  },
  async get(projectId, noteId) {
    return unwrap(await api.get(`/notes/${projectId}/n/${noteId}`));
  },
  async create(projectId, body) {
    return unwrap(await api.post(`/notes/${projectId}`, body));
  },
  async update(projectId, noteId, body) {
    return unwrap(await api.put(`/notes/${projectId}/n/${noteId}`, body));
  },
  async remove(projectId, noteId) {
    return unwrap(await api.delete(`/notes/${projectId}/n/${noteId}`));
  },
};
