import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { errMsg } from "../../api/axios";
import { AuthShell, Button, Input } from "../../components/ui";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back!");
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      footer={
        <>
          New here? <Link className="text-indigo-600 hover:underline" to="/register">Create an account</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="text-right text-sm">
          <Link className="text-indigo-600 hover:underline" to="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">Log in</Button>
      </form>
    </AuthShell>
  );
}
