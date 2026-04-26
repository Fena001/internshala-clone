import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";

export default function SubscriptionDashboard() {
  const user = useSelector(selectuser);
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) return;
    if (user === false) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        const [subRes, transRes] = await Promise.all([
          axios.get(`https://internshala-clone-ydgs.onrender.com/api/subscription/my-plan/${user.uid}`),
          axios.get(`https://internshala-clone-ydgs.onrender.com/api/subscription/transactions/${user.uid}`)
        ]);
        
        if (subRes.data.success) setSubscription(subRes.data.subscription);
        if (transRes.data.success) setTransactions(transRes.data.transactions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  const limits: any = { Free: 1, Bronze: 3, Silver: 5, Gold: "Unlimited" };
  const currentPlan = subscription?.plan || "Free";
  const usedApplications = subscription?.applicationsThisMonth || 0;
  const limit = limits[currentPlan];
  const remaining = limit === "Unlimited" ? "Unlimited" : Math.max(0, limit - usedApplications);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-10 pb-20">
      <div className="max-w-5xl w-full mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Dashboard</h1>
          <Link href="/subscription" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Upgrade Plan
          </Link>
        </div>

        {/* Current Plan Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Current Active Plan</p>
            <h2 className="text-4xl font-extrabold text-blue-600 flex items-center gap-3">
              {currentPlan}
              {currentPlan !== "Free" && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full border border-green-200 font-semibold tracking-wide">Premium</span>
              )}
            </h2>
            {subscription?.planExpiry && currentPlan !== "Free" && (
              <p className="text-gray-600 mt-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Renews/Expires on: <span className="font-semibold ml-1">{new Date(subscription.planExpiry).toLocaleDateString()}</span>
              </p>
            )}
          </div>
          <div className="mt-6 md:mt-0 bg-blue-50 rounded-xl p-6 border border-blue-100 min-w-[250px] text-center">
            <p className="text-sm text-blue-800 font-medium mb-2">Monthly Usage</p>
            <div className="text-3xl font-bold text-gray-900 mb-1">{usedApplications} / {limit}</div>
            <p className="text-blue-600 font-medium text-sm">Applications used</p>
            <div className="mt-4 w-full bg-blue-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: limit === "Unlimited" ? "100%" : `${Math.min(100, (usedApplications / limit) * 100)}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-3 font-medium">Resets next billing cycle</p>
          </div>
        </div>

        {/* Payment History */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No previous transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Invoice ID</th>
                    <th className="p-4 font-semibold">Plan</th>
                    <th className="p-4 font-semibold">Amount</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="p-4 text-gray-600 font-mono text-xs">{tx.invoiceId}</td>
                      <td className="p-4 font-medium text-gray-900">{tx.planName}</td>
                      <td className="p-4 text-gray-900 font-medium">₹{tx.amount}</td>
                      <td className="p-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          {tx.status}
                        </span>
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
