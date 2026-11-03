import { Link } from "react-router-dom";

export function Button({ variant = "primary", className = "", loading, children, ...props }) {
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function Input({ label, ...props }) {
  return (
    <Field label={label}>
      <input {...props} className={inputCls} />
    </Field>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <Field label={label}>
      <textarea rows={4} {...props} className={inputCls} />
    </Field>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <Field label={label}>
      <select {...props} className={inputCls}>
        {children}
      </select>
    </Field>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className={`mt-12 w-full rounded-xl bg-white p-6 shadow-xl ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Card({ className = "", children }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function Spinner({ label = "Loading…" }) {
  return <div className="py-10 text-center text-sm text-slate-500">{label}</div>;
}

export function EmptyState({ children }) {
  return <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">{children}</div>;
}

const roleColors = {
  admin: "bg-purple-100 text-purple-700",
  project_admin: "bg-blue-100 text-blue-700",
  member: "bg-slate-100 text-slate-600",
};

export function RoleBadge({ role }) {
  if (!role) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[role] || roleColors.member}`}>
      {role.replace("_", " ")}
    </span>
  );
}

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center text-2xl font-bold text-indigo-600">
          ⛺ Project Camp
        </Link>
        <Card>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </Card>
        {footer && <p className="mt-4 text-center text-sm text-slate-600">{footer}</p>}
      </div>
    </div>
  );
}

export const ROLES = ["admin", "project_admin", "member"];
export const STATUSES = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];
