import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api/adminApi";

export default function Login() {
  const nav = useNavigate();
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = await adminLogin(username, password);

    if (data.token) {
      sessionStorage.setItem("adminToken", data.token);
      nav("/admin/dashboard");
    } else {
      setError(data.error || "Invalid admin credentials");
    }

    setLoading(false);
  }

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="p-8 w-96 border border-cyan-400 bg-gray-900">
        <h1 className="text-3xl text-center text-cyan-400 font-bold mb-4">
          VAULTIFY ADMIN
        </h1>

        {error && <p className="text-red-400 mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Admin Username"
            className="w-full p-3 bg-black border border-cyan-500"
            onChange={(e) => setUser(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            className="w-full p-3 bg-black border border-cyan-500"
            onChange={(e) => setPass(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 py-2 font-bold"
          >
            {loading ? "Authenticating..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}
