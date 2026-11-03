import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authApi } from "../../api/auth";
import { errMsg } from "../../api/axios";
import { AuthShell } from "../../components/ui";

export default function VerifyEmail() {
  const { token } = useParams();
  const [state, setState] = useState({ status: "loading", message: "" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // avoid double call in React StrictMode (token is single-use)
    ran.current = true;
    authApi
      .verifyEmail(token)
      .then(() => setState({ status: "ok", message: "Your email is verified. You can log in now." }))
      .catch((err) => setState({ status: "error", message: errMsg(err) }));
  }, [token]);

  return (
    <AuthShell title="Email verification">
      <p className={`text-sm ${state.status === "error" ? "text-red-600" : "text-slate-600"}`}>
        {state.status === "loading" ? "Verifying…" : state.message}
      </p>
      {state.status !== "loading" && (
        <Link to="/login" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">Go to login</Link>
      )}
    </AuthShell>
  );
}
