import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../../api/auth";
import { errMsg } from "../../api/axios";
import { AuthShell, Button, Input } from "../../components/ui";

export default function Register() {
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await authApi.register({ ...form, username: form.username.trim().toLowerCase(), email: form.email.trim() });
      setDone(true);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Check your email">
        <p className="text-sm text-slate-600">
          Account created. We sent a verification link to <b>{form.email}</b>. Verify it, then log in.
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">Go to login</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      footer={
        <>
          Already registered? <Link className="text-indigo-600 hover:underline" to="/login">Log in</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" value={form.fullName} onChange={set("fullName")} />
        <Input label="Username (lowercase)" required value={form.username} onChange={set("username")} />
        <Input label="Email" type="email" required value={form.email} onChange={set("email")} />
        <Input label="Password" type="password" required value={form.password} onChange={set("password")} />
        <Button type="submit" loading={loading} className="w-full">Register</Button>
      </form>
    </AuthShell>
  );
}
