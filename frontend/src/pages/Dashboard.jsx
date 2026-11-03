import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { projectsApi } from "../api/projects";
import { errMsg } from "../api/axios";
import { Button, Card, EmptyState, Input, Modal, RoleBadge, Spinner, Textarea } from "../components/ui";

export default function Dashboard() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
  });

  const create = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      setOpen(false);
      setForm({ name: "", description: "" });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your projects</h1>
          <p className="text-sm text-slate-500">
            {projects ? `${projects.length} project${projects.length === 1 ? "" : "s"}` : " "}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>+ New project</Button>
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">{errMsg(error)}</p>}
      {projects?.length === 0 && <EmptyState>No projects yet. Create your first one.</EmptyState>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p) => (
          <Link key={p.id} to={`/projects/${p.id}`}>
            <Card className="h-full transition hover:border-indigo-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{p.name}</h2>
                <RoleBadge role={p.role} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.description || "No description"}</p>
              {p.members !== undefined && (
                <p className="mt-4 text-xs text-slate-500">
                  👥 {p.members} member{p.members === 1 ? "" : "s"}
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {open && (
        <Modal title="New project" onClose={() => setOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate(form);
            }}
          >
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={create.isPending}>Create</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
