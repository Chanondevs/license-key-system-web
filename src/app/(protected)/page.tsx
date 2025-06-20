"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ActiveSystem = { id: number; system_name: string };
type License = { license_key: string; active_system: string | null; create_at: string };

const BACKEND_URL = "https://license-key-system.onrender.com";

function isErrorWithName(err: unknown): err is { name: string } {
  return typeof err === "object" && err !== null && "name" in err && typeof (err as { name?: unknown }).name === "string";
}

export default function Home() {
  const router = useRouter();
  const [systems, setSystems] = useState<ActiveSystem[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [systemName, setSystemName] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<number>();
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;


  const fetchWithAuth = (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const loadData = async () => {
    if (!token) {
      router.push("/login");
      return;
    }

    const controller = new AbortController();
    setLoadingFetch(true);

    try {
      const [sysRes, licRes] = await Promise.all([
        fetchWithAuth(`${BACKEND_URL}/active_system`, { signal: controller.signal }),
        fetchWithAuth(`${BACKEND_URL}/licenses`, { signal: controller.signal }),
      ]);

      if (sysRes.status === 401 || licRes.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const [sys, lic] = await Promise.all([sysRes.json(), licRes.json()]);
      setSystems(sys);
      setLicenses(lic);
    } catch (err: unknown) {
      if (isErrorWithName(err) && err.name !== "AbortError") {
        console.error("โหลดข้อมูลล้มเหลว", err);
      }
    } finally {
      setLoadingFetch(false);
    }

    return () => controller.abort();
  };

  useEffect(() => {
    loadData();
  }, []);

  const addSystem = async () => {
    setLoadingAdd(true);
    try {
      await fetchWithAuth(`${BACKEND_URL}/active_system`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_name: systemName }),
      });
      setSystemName("");
      await loadData();
    } finally {
      setLoadingAdd(false);
    }
  };

  const generateKey = async () => {
    if (!selectedSystem) return;
    setLoadingGenerate(true);
    try {
      await fetchWithAuth(`${BACKEND_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_system_id: selectedSystem }),
      });
      await loadData();
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const filteredLicenses = licenses.filter((lic) =>
    lic.license_key.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLicenses.length / pageSize);
  const displayedLicenses = filteredLicenses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => setCurrentPage(1), [search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg w-full max-w-4xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">🔑 License Key System</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>

        {/* เพิ่มระบบ */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">เพิ่มระบบ (Active System)</h2>
          <div className="flex gap-2">
            <input
              className="w-full px-3 py-1.5 rounded-md border border-gray-300 bg-white text-black shadow-sm focus:outline-none focus:ring-2 transition duration-200"
              placeholder="ชื่อระบบ"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition duration-200 ease-in-out whitespace-nowrap cursor-pointer"
              onClick={addSystem}
              disabled={loadingAdd || !systemName.trim()}
            >
              {loadingAdd ? "เพิ่ม..." : "เพิ่ม"}
            </button>
          </div>
        </div>

        {/* สร้าง License */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">สร้าง License Key</h2>
          <div className="flex gap-2">
            <select
              className="w-full px-3 py-1.5 rounded-md border border-gray-300 bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200"
              onChange={(e) => setSelectedSystem(Number(e.target.value))}
              value={selectedSystem ?? ""}
            >
              <option value="" disabled className="text-gray-400">
                เลือกระบบ
              </option>
              {systems.map((sys) => (
                <option key={sys.id} value={sys.id}>
                  {sys.system_name}
                </option>
              ))}
            </select>

            <button
              className="bg-green-600 text-white px-4 h-10 rounded hover:bg-green-700 disabled:opacity-50 transition duration-200 ease-in-out whitespace-nowrap cursor-pointer"
              onClick={generateKey}
              disabled={loadingGenerate || !selectedSystem}
            >
              {loadingGenerate ? "กำลังสร้าง..." : "สร้าง Key"}
            </button>

          </div>
        </div>


        {/* Skeleton Loading */}
        {loadingFetch ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-700 rounded animate-pulse" />
            ))}
            <div className="h-32 bg-gray-700 rounded animate-pulse" />
          </div>
        ) : (
          <>
            {/* ระบบทั้งหมด */}
            <div>
              <h2 className="text-xl font-semibold mb-2">ระบบทั้งหมด</h2>
              <ul className="list-disc list-inside space-y-1">
                {systems.map((s) => (
                  <li key={s.id}>{s.system_name}</li>
                ))}
              </ul>
            </div>

            {/* ค้นหา License Key */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">ค้นหา License Key</h2>
              <input
                type="text"
                placeholder="ค้นหา License Key"
                className="w-full px-3 py-1.5 rounded-md border border-gray-300 bg-white text-black shadow-sm focus:outline-none focus:ring-2 transition duration-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* License Keys */}
            <div>
              <h2 className="text-xl font-semibold mb-2">License Keys</h2>
              <div className="overflow-x-auto rounded border border-gray-600">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="p-2 border">Key</th>
                      <th className="p-2 border">System</th>
                      <th className="p-2 border">Create At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedLicenses.length > 0 ? (
                      displayedLicenses.map((lic) => (
                        <tr key={lic.license_key} className="even:bg-gray-700">
                          <td className="p-2 border">{lic.license_key}</td>
                          <td className="p-2 border">{lic.active_system || "-"}</td>
                          <td className="p-2 border">
                            {new Date(lic.create_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center p-4 text-gray-400">
                          ไม่พบข้อมูล
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center text-sm mt-2">
                <span>หน้า {currentPage} / {totalPages || 1}</span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer"
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    disabled={currentPage === 1}
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
