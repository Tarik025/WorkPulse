import { useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { projectsApi } from "../../api/projects";
import { errMsg } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Modal, RoleBadge, Spinner, Textarea } from "../../components/ui";

export default function ProjectLayout() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const project = useQuery({ queryKey: ["project", projectId], queryFn: () => projectsApi.get(projectId) });
  const members = useQuery({ queryKey: ["members", projectId], queryFn: () => projectsApi.members(projectId) });

  // Your role in THIS project: from the members list, falling back to the project payload.
  const me = members.data?.find((m) => String(m.userId) === String(user?._id || user?.id));
  const role = me?.role || project.data?.role || "member";
  const isAdmin = role === "admin";
  const canManageTasks = role === "admin" || role === "project_admin";

  const update = useMutation({
    mutationFn: (body) => projectsApi.update(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
      setEditing(false);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: () => projectsApi.remove(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
      navigate("/");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (project.isLoading || members.isLoading) return <Spinner />;
  if (project.error) return <p className="text-sm text-red-600">{errMsg(project.error)}</p>;

  const tab = ({ isActive }) =>
    `border-b-2 px-1 pb-2 text-sm font-medium ${
      isActive ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
    }`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.data?.name}</h1>
            <RoleBadge role={role} />
          </div>
          <p className="mt-1 text-sm text-slate-600">{project.data?.description}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setForm({ name: project.data?.name || "", description: project.data?.description || "" });
                setEditing(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => window.confirm("Delete this project and everything in it?") && remove.mutate()}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <nav className="mb-6 flex gap-6 border-b border-slate-200">
        <NavLink to="tasks" className={tab}>Tasks</NavLink>
        <NavLink to="members" className={tab}>Members</NavLink>
        <NavLink to="notes" className={tab}>Notes</NavLink>
      </nav>

      <Outlet context={{ projectId, project: project.data, members: members.data || [], role, isAdmin, canManageTasks }} />

      {editing && (
        <Modal title="Edit project" onClose={() => setEditing(false)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate(form);
            }}
          >
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" loading={update.isPending}>Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
