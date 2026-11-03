import api, { unwrap } from "./axios";

const clean = (values, isUpdate) =>
  Object.fromEntries(
    Object.entries(values).filter(([k, v]) => v !== undefined && v !== null && (v !== "" || (isUpdate && k === "assignedTo"))),
  );

// on update an empty assignedTo means "unassign", so it must be sent
const keepEmpty = (k, isUpdate) => isUpdate && k === "assignedTo";

const toFormData = (values, files, isUpdate) => {
  const fd = new FormData();
  Object.entries(values).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (v !== "" || keepEmpty(k, isUpdate)) fd.append(k, v);
  });
  (files || []).forEach((f) => fd.append("attachments", f));
  return fd;
};

export const tasksApi = {
  async list(projectId) {
    const data = unwrap(await api.get(`/tasks/${projectId}`));
    return Array.isArray(data) ? data : [];
  },
  async get(projectId, taskId) {
    return unwrap(await api.get(`/tasks/${projectId}/t/${taskId}`));
  },
  // JSON when there are no files (works with any body parser setup),
  // multipart/form-data only when attachments are included.
  async create(projectId, values, files) {
    const body = files?.length ? toFormData(values, files) : clean(values);
    return unwrap(await api.post(`/tasks/${projectId}`, body));
  },
  async update(projectId, taskId, values, files) {
    const body = files?.length ? toFormData(values, files, true) : clean(values, true);
    return unwrap(await api.put(`/tasks/${projectId}/t/${taskId}`, body));
  },
  async remove(projectId, taskId) {
    return unwrap(await api.delete(`/tasks/${projectId}/t/${taskId}`));
  },
  async createSubtask(projectId, taskId, body) {
    return unwrap(await api.post(`/tasks/${projectId}/t/${taskId}/subtasks`, body));
  },
  async updateSubtask(projectId, subTaskId, body) {
    return unwrap(await api.put(`/tasks/${projectId}/st/${subTaskId}`, body));
  },
  async removeSubtask(projectId, subTaskId) {
    return unwrap(await api.delete(`/tasks/${projectId}/st/${subTaskId}`));
  },
};
