import React, { useState, useEffect } from "react";
import Navbar from "@/Components/Navbar";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

export default function SubscriptionPage() {
  const user = useSelector(selectuser);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Free");

  useEffect(() => {
    if (user) {
      axios.get(`https://internshala-clone-ydgs.onrender.com/api/subscription/my-plan/${user.uid}`)
        .then(res => {
          if (res.data.success && res.data.subscription) {
            setCurrentPlan(res.data.subscription.plan);
          }
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (planName: string, amount: number) => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    if (planName === "Free") {
      toast.info("You are already on the Free plan.");
      return;
    }

    setLoading(true);
    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setLoading(false);
        return;
      }

      const orderRes = await axios.post("https://internshala-clone-ydgs.onrender.com/api/subscription/create-order", {
        amount,
        planName
      });

      if (!orderRes.data.success) {
        toast.error("Failed to create order");
        setLoading(false);
        return;
      }

      const options = {
        key: "rzp_test_SeoCFJL6D4KA8l", // Hardcoded from .env for frontend
        amount: amount * 100,
        currency: "INR",
        name: "Internshala Premium",
        description: `${planName} Subscription`,
        order_id: orderRes.data.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await axios.post("https://internshala-clone-ydgs.onrender.com/api/subscription/verify-payment", {
              ...response,
              amount,
              planName,
              userUid: user.uid,
              userEmail: user.email
            });
            if (verifyRes.data.success) {
              toast.success("Payment successful! Plan activated.");
              router.push("/subscription/dashboard");
            }
          } catch (err: any) {
            toast.error(err.response?.data?.error || "Payment verification failed");
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: user.phoneNumber || ""
        },
        theme: {
          color: "#008BDC"
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { name: "Free", price: 0, limits: "1 internship per month", features: ["Basic support", "Apply to 1 internship"] },
    { name: "Bronze", price: 100, limits: "3 internships per month", features: ["Priority support", "Apply to 3 internships"] },
    { name: "Silver", price: 300, limits: "5 internships per month", features: ["Premium support", "Apply to 5 internships", "Profile highlighting"] },
    { name: "Gold", price: 1000, limits: "Unlimited applications", features: ["Dedicated manager", "Unlimited applications", "Top placement on resumes"] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-grow pt-10 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Choose Your Premium Plan</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock your full career potential. Upgrade your plan to apply to more internships and get hired faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-2xl shadow-lg border-2 flex flex-col overflow-hidden transition-transform transform hover:-translate-y-2 ${currentPlan === plan.name ? 'border-blue-500 relative' : 'border-gray-100'}`}>
              {currentPlan === plan.name && (
                <div className="bg-blue-500 text-white text-xs font-bold uppercase tracking-wider text-center py-1 absolute top-0 w-full">
                  Current Plan
                </div>
              )}
              <div className="p-8 flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 mt-4">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
                <p className="text-blue-600 font-semibold mb-6">{plan.limits}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 text-green-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 pt-0 mt-auto">
                <button
                  onClick={() => handlePayment(plan.name, plan.price)}
                  disabled={loading || currentPlan === plan.name}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
                    currentPlan === plan.name
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  {currentPlan === plan.name ? "Active" : `Upgrade to ${plan.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
