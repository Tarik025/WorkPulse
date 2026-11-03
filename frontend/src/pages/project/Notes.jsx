import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { notesApi } from "../../api/notes";
import { errMsg } from "../../api/axios";
import { Button, Card, EmptyState, Input, Modal, Spinner, Textarea } from "../../components/ui";

export default function Notes() {
  const { projectId, isAdmin } = useOutletContext();
  const qc = useQueryClient();
  const [editor, setEditor] = useState(null); // null | {id?, content}

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ["notes", projectId],
    queryFn: () => notesApi.list(projectId),
  });

  const done = (msg) => () => {
    qc.invalidateQueries({ queryKey: ["notes", projectId] });
    toast.success(msg);
    setEditor(null);
  };

  const save = useMutation({
    mutationFn: ({ id, ...body }) => (id ? notesApi.update(projectId, id, body) : notesApi.create(projectId, body)),
    onSuccess: done("Note saved"),
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => notesApi.remove(projectId, id),
    onSuccess: done("Note deleted"),
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notes</h2>
        {isAdmin && <Button onClick={() => setEditor({ content: "" })}>+ New note</Button>}
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">{errMsg(error)}</p>}
      {notes?.length === 0 && <EmptyState>No notes yet.</EmptyState>}

      <div className="grid gap-4 sm:grid-cols-2">
        {notes?.map((n) => (
          <Card key={n._id}>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{n.content}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</span>
              {isAdmin && (
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => setEditor({ id: n._id, content: n.content || "" })}>Edit</Button>
                  <Button
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => window.confirm("Delete this note?") && remove.mutate(n._id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {editor && (
        <Modal title={editor.id ? "Edit note" : "New note"} onClose={() => setEditor(null)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(editor);
            }}
          >
            <Textarea label="Content" required rows={6} value={editor.content} onChange={(e) => setEditor({ ...editor, content: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditor(null)}>Cancel</Button>
              <Button type="submit" loading={save.isPending}>Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
