import React, { useState } from "react";
import Head from "next/head";
import { toast } from "react-toastify";
import axios from "axios";
import { Mail, Phone, ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function ForgotPassword() {
  const router = useRouter();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim()) {
      toast.error(`Please enter a valid ${method}`);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("https://internshala-clone-ydgs.onrender.com/api/auth/forgot-password", {
        type: method,
        value: value.trim()
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setIsSuccess(true);
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "An error occurred while resetting password.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Head>
        <title>Forgot Password | InternArea</title>
      </Head>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transform transition-all animate-fade-in-up">
        
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <KeyRound className="h-8 w-8" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Forgot Password
        </h2>

        {!isSuccess ? (
          <>
            <p className="text-center text-gray-500 mb-8 text-sm">
              Don't worry! It happens. Choose how you want to reset your password and we'll send you a securely generated new one.
            </p>

            {/* Toggle System */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${
                  method === "email" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => { setMethod("email"); setValue(""); }}
              >
                <Mail className="h-4 w-4 mr-2" /> Email
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${
                  method === "phone" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => { setMethod("phone"); setValue(""); }}
              >
                <Phone className="h-4 w-4 mr-2" /> Phone
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {method === "email" ? "Email Address" : "Phone Number"}
                </label>
                <input
                  type={method === "email" ? "email" : "tel"}
                  required
                  placeholder={method === "email" ? "e.g. user@gmail.com" : "e.g. +91 9876543210"}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 placeholder-gray-400"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70"
              >
                {loading ? (
                  <div className="h-5 w-5 border-b-2 border-white rounded-full animate-spin"></div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Check your {method}!</h3>
            <p className="text-gray-600 text-sm mb-6">
              We have dispatched a new securely generated password. You can only use this feature once per day!
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 px-4 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition-all"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
