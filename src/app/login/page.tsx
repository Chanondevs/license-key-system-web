"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "https://license-key-system.onrender.com";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch(`${BACKEND_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">🔐 Login License System</h1>

        <div className="space-y-3">
          <input
            className="border border-gray-600 bg-gray-900 text-white rounded px-3 py-2 w-full focus:outline-none focus:ring focus:ring-blue-500"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="border border-gray-600 bg-gray-900 text-white rounded px-3 py-2 w-full focus:outline-none focus:ring focus:ring-blue-500"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded w-full font-medium cursor-pointer"
            onClick={handleLogin}
          >
            Login
          </button>
          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
        </div>
      </div>
    </div>
  );
}
