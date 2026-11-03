import api, { unwrap } from "./axios";

// The list endpoint may return flat projects or membership rows wrapping a project.
// This normalizer accepts both shapes.
export const normProject = (p) => {
  const base = p?.project && typeof p.project === "object" ? p.project : p;
  return {
    id: base?._id,
    name: base?.name,
    description: base?.description,
    members: typeof p?.members === "number" ? p.members : p?.memberCount ?? (typeof base?.members === "number" ? base.members : undefined),
    role: p?.role,
    createdAt: base?.createdAt,
  };
};

export const normMember = (m) => {
  const u = m?.user && typeof m.user === "object" ? m.user : {};
  return {
    userId: u._id ?? m?.user,
    name: u.fullName || u.username || u.email || "Unknown",
    username: u.username,
    email: u.email,
    avatar: u.avatar?.url ?? u.avatar,
    role: m?.role,
  };
};

export const projectsApi = {
  async list() {
    const data = unwrap(await api.get("/projects"));
    return (Array.isArray(data) ? data : []).map(normProject);
  },
  async get(id) {
    const data = unwrap(await api.get(`/projects/${id}`));
    return normProject(data);
  },
  async create(body) {
    return unwrap(await api.post("/projects", body));
  },
  async update(id, body) {
    return unwrap(await api.put(`/projects/${id}`, body));
  },
  async remove(id) {
    return unwrap(await api.delete(`/projects/${id}`));
  },
  async members(id) {
    const data = unwrap(await api.get(`/projects/${id}/members`));
    return (Array.isArray(data) ? data : []).map(normMember);
  },
  async addMember(id, body) {
    return unwrap(await api.post(`/projects/${id}/members`, body));
  },
  async updateMemberRole(id, userId, role) {
    // sends both keys so it works whichever your controller reads
    return unwrap(await api.put(`/projects/${id}/members/${userId}`, { newRole: role, role }));
  },
  async removeMember(id, userId) {
    return unwrap(await api.delete(`/projects/${id}/members/${userId}`));
  },
};
