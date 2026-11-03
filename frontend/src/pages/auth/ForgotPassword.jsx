import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../../api/auth";
import { errMsg } from "../../api/axios";
import { AuthShell, Button, Input } from "../../components/ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a reset link."
      footer={<Link className="text-indigo-600 hover:underline" to="/login">Back to login</Link>}
    >
      {sent ? (
        <p className="text-sm text-slate-600">If an account exists for <b>{email}</b>, a reset link is on its way.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={loading} className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
