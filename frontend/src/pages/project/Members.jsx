import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { projectsApi } from "../../api/projects";
import { errMsg } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Button, Card, EmptyState, Input, Modal, RoleBadge, ROLES, Select } from "../../components/ui";

export default function Members() {
  const { projectId, members, isAdmin } = useOutletContext();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "member" });

  const refresh = () => qc.invalidateQueries({ queryKey: ["members", projectId] });

  const add = useMutation({
    mutationFn: () => projectsApi.addMember(projectId, form),
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Member added");
      setOpen(false);
      setForm({ email: "", role: "member" });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }) => projectsApi.updateMemberRole(projectId, userId, role),
    onSuccess: () => {
      refresh();
      toast.success("Role updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: (userId) => projectsApi.removeMember(projectId, userId),
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Member removed");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const myId = String(user?._id || user?.id);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team ({members.length})</h2>
        {isAdmin && <Button onClick={() => setOpen(true)}>+ Add member</Button>}
      </div>

      {members.length === 0 && <EmptyState>No members yet.</EmptyState>}

      <Card className="divide-y divide-slate-100 p-0">
        {members.map((m) => {
          const isMe = String(m.userId) === myId;
          return (
            <div key={m.userId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {m.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {m.name} {isMe && <span className="text-xs text-slate-400">(you)</span>}
                  </p>
                  <p className="text-xs text-slate-500">{m.email || m.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && !isMe ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => changeRole.mutate({ userId: m.userId, role: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r.replace("_", " ")}</option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => window.confirm(`Remove ${m.name}?`) && remove.mutate(m.userId)}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <RoleBadge role={m.role} />
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {open && (
        <Modal title="Add member" onClose={() => setOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              add.mutate();
            }}
          >
            <Input label="Email (must be a registered user)" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace("_", " ")}</option>
              ))}
            </Select>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={add.isPending}>Add</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
