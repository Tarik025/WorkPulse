import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../../api/auth";
import { errMsg } from "../../api/axios";
import { AuthShell, Button, Input } from "../../components/ui";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await authApi.resetPassword(token, { newPassword });
      toast.success("Password updated. Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Set a new password" footer={<Link className="text-indigo-600 hover:underline" to="/login">Back to login</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="New password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Input label="Confirm password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" loading={loading} className="w-full">Reset password</Button>
      </form>
    </AuthShell>
  );
}
