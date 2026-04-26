import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { useRouter } from "next/router";

export default function LoginHistoryPage() {
  const user = useSelector(selectuser);
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) {
      // Still checking
      return;
    }
    if (user === false) {
      router.push("/");
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`https://internshala-clone-ydgs.onrender.com/api/auth/login-history/${user.uid}`);
        if (res.data.success) {
          setHistory(res.data.history);
        }
      } catch (err) {
        console.error("Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-6xl w-full mx-auto p-6 mt-10 flex-grow">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Login History</h1>
        <p className="text-gray-600 mb-8">
          Monitor your recent account activity and login attempts.
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No login history found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                    <th className="p-4 font-semibold">Date & Time</th>
                    <th className="p-4 font-semibold">Browser</th>
                    <th className="p-4 font-semibold">OS</th>
                    <th className="p-4 font-semibold">Device</th>
                    <th className="p-4 font-semibold">IP Address</th>
                    <th className="p-4 font-semibold">Status & Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {history.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-800">
                        {new Date(record.loginDate).toLocaleString()}
                      </td>
                      <td className="p-4 text-gray-600">{record.browser || "Unknown"}</td>
                      <td className="p-4 text-gray-600">{record.os || "Unknown"}</td>
                      <td className="p-4 text-gray-600">{record.deviceType || "Unknown"}</td>
                      <td className="p-4 text-gray-600">{record.ipAddress || "Unknown"}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium mb-1 ${
                          record.status === "Success" ? "bg-green-100 text-green-700" :
                          record.status === "Failed" ? "bg-red-100 text-red-700" :
                          record.status === "Pending OTP" ? "bg-yellow-100 text-yellow-700" :
                          "bg-orange-100 text-orange-700" // Blocked
                        }`}>
                          {record.status}
                        </span>
                        <div className="text-xs text-gray-500">{record.reason}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
