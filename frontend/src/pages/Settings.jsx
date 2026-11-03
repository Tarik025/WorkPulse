import { useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../api/auth";
import { errMsg } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Input } from "../components/ui";

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.changePassword(form);
      toast.success("Password changed");
      setForm({ oldPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authApi.resendVerification();
      toast.success("Verification email sent");
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <h1 className="text-lg font-semibold">Account</h1>
        <dl className="mt-3 space-y-1 text-sm text-slate-600">
          <div><dt className="inline font-medium text-slate-800">Name: </dt><dd className="inline">{user?.fullName || "—"}</dd></div>
          <div><dt className="inline font-medium text-slate-800">Username: </dt><dd className="inline">{user?.username}</dd></div>
          <div><dt className="inline font-medium text-slate-800">Email: </dt><dd className="inline">{user?.email}</dd></div>
          <div>
            <dt className="inline font-medium text-slate-800">Verified: </dt>
            <dd className="inline">{user?.isEmailVerified ? "Yes" : "No"}</dd>
          </div>
        </dl>
        {user && user.isEmailVerified === false && (
          <Button variant="secondary" className="mt-3" onClick={resend}>Resend verification email</Button>
        )}
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">Change password</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Input label="Current password" type="password" required value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} />
          <Input label="New password" type="password" required value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          <Button type="submit" loading={loading}>Update password</Button>
        </form>
      </Card>
    </div>
  );
}
