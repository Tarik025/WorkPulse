import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { tasksApi } from "../../api/tasks";
import { errMsg, fileUrl } from "../../api/axios";
import { Button, Card, EmptyState, Input, Modal, Select, Spinner, STATUSES, Textarea } from "../../components/ui";

const assigneeId = (t) => (t.assignedTo && typeof t.assignedTo === "object" ? t.assignedTo._id : t.assignedTo) || "";
const assigneeName = (t, members) => {
  if (t.assignedTo && typeof t.assignedTo === "object") return t.assignedTo.fullName || t.assignedTo.username;
  return members.find((m) => String(m.userId) === String(t.assignedTo))?.name;
};
const fmtSize = (n) => (n ? (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`) : "");

export default function Tasks() {
  const { projectId, members, canManageTasks } = useOutletContext();
  const qc = useQueryClient();
  const [form, setForm] = useState(null); // create/edit modal state
  const [detailId, setDetailId] = useState(null);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => tasksApi.list(projectId),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    qc.invalidateQueries({ queryKey: ["task", projectId] });
  };

  const save = useMutation({
    mutationFn: ({ id, files, ...values }) =>
      id ? tasksApi.update(projectId, id, values, files) : tasksApi.create(projectId, values, files),
    onSuccess: () => {
      refresh();
      toast.success("Task saved");
      setForm(null);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }) => tasksApi.update(projectId, id, { status }),
    onSuccess: refresh,
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => tasksApi.remove(projectId, id),
    onSuccess: () => {
      refresh();
      toast.success("Task deleted");
      setDetailId(null);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const openEdit = (t) =>
    setForm({
      id: t._id,
      title: t.title || "",
      description: t.description || "",
      assignedTo: assigneeId(t),
      status: t.status || "todo",
      files: [],
    });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        {canManageTasks && (
          <Button onClick={() => setForm({ title: "", description: "", assignedTo: "", status: "todo", files: [] })}>
            + New task
          </Button>
        )}
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">{errMsg(error)}</p>}
      {tasks?.length === 0 && <EmptyState>No tasks yet.</EmptyState>}

      {tasks?.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {STATUSES.map((col) => {
            const items = tasks.filter((t) => (t.status || "todo") === col.value);
            return (
              <div key={col.value} className="rounded-xl bg-slate-100 p-3">
                <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                  {col.label}
                  <span className="rounded-full bg-white px-2 text-xs">{items.length}</span>
                </h3>
                <div className="space-y-3">
                  {items.map((t) => (
                    <Card key={t._id} className="p-3">
                      <button className="w-full text-left" onClick={() => setDetailId(t._id)}>
                        <p className="text-sm font-medium">{t.title}</p>
                        {t.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.description}</p>}
                      </button>
                      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span>👤 {assigneeName(t, members) || "Unassigned"}</span>
                        {t.attachments?.length > 0 && <span>📎 {t.attachments.length}</span>}
                      </div>
                      {canManageTasks && (
                        <select
                          value={t.status || "todo"}
                          onChange={(e) => setStatus.mutate({ id: t._id, status: e.target.value })}
                          className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                        >
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Edit task" : "New task"} onClose={() => setForm(null)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select label="Assign to" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.name}</option>
              ))}
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Attachments</span>
              <input
                type="file"
                multiple
                onChange={(e) => setForm({ ...form, files: Array.from(e.target.files) })}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={save.isPending}>Save</Button>
            </div>
          </form>
        </Modal>
      )}

      {detailId && (
        <TaskDetail
          projectId={projectId}
          taskId={detailId}
          members={members}
          canManage={canManageTasks}
          onClose={() => setDetailId(null)}
          onEdit={(t) => {
            setDetailId(null);
            openEdit(t);
          }}
          onDelete={(id) => window.confirm("Delete this task?") && remove.mutate(id)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function TaskDetail({ projectId, taskId, members, canManage, onClose, onEdit, onDelete, onChanged }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const { data: task, isLoading, error } = useQuery({
    queryKey: ["task", projectId, taskId],
    queryFn: () => tasksApi.get(projectId, taskId),
  });

  const reload = () => {
    qc.invalidateQueries({ queryKey: ["task", projectId, taskId] });
    onChanged();
  };

  const addSub = useMutation({
    mutationFn: () => tasksApi.createSubtask(projectId, taskId, { title }),
    onSuccess: () => {
      setTitle("");
      reload();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const toggle = useMutation({
    mutationFn: (st) => tasksApi.updateSubtask(projectId, st._id, { isCompleted: !st.isCompleted }),
    onSuccess: reload,
    onError: (e) => toast.error(errMsg(e)),
  });

  const delSub = useMutation({
    mutationFn: (id) => tasksApi.removeSubtask(projectId, id),
    onSuccess: reload,
    onError: (e) => toast.error(errMsg(e)),
  });

  const subtasks = task?.subtasks || [];
  const doneCount = subtasks.filter((s) => s.isCompleted).length;

  return (
    <Modal title="Task details" onClose={onClose} wide>
      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">{errMsg(error)}</p>}
      {task && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-semibold">{task.title}</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{task.description || "No description"}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>Status: <b>{STATUSES.find((s) => s.value === task.status)?.label || task.status}</b></span>
              <span>Assignee: <b>{assigneeName(task, members) || "Unassigned"}</b></span>
            </div>
          </div>

          {task.attachments?.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Attachments</h4>
              <ul className="space-y-1 text-sm">
                {task.attachments.map((a, i) => (
                  <li key={a._id || i}>
                    <a href={fileUrl(a.url)} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                      📎 {(a.url || "").split("/").pop() || `File ${i + 1}`}
                    </a>
                    <span className="ml-2 text-xs text-slate-400">{fmtSize(a.size)} {a.mimetype}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold">
              Subtasks {subtasks.length > 0 && <span className="font-normal text-slate-400">({doneCount}/{subtasks.length})</span>}
            </h4>
            {subtasks.length === 0 && <p className="text-sm text-slate-400">No subtasks.</p>}
            <ul className="space-y-1">
              {subtasks.map((st) => (
                <li key={st._id} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!st.isCompleted} onChange={() => toggle.mutate(st)} />
                    <span className={st.isCompleted ? "text-slate-400 line-through" : ""}>{st.title}</span>
                  </label>
                  {canManage && (
                    <button className="text-xs text-red-600 hover:underline" onClick={() => delSub.mutate(st._id)}>
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {canManage && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (title.trim()) addSub.mutate();
                }}
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Add a subtask…"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
                <Button type="submit" loading={addSub.isPending}>Add</Button>
              </form>
            )}
          </div>

          {canManage && (
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="secondary" onClick={() => onEdit(task)}>Edit</Button>
              <Button variant="danger" onClick={() => onDelete(task._id)}>Delete</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
