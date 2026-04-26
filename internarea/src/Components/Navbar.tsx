import React, { useState } from "react";
import logo from "../Assets/logo.png";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth, provider } from "../firebase/firebase";
import { Search, Globe } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { selectuser, login } from "@/Feature/Userslice";
import { useTranslation } from "react-i18next";
import axios from "axios";

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'hi', label: 'Hindi' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'fr', label: 'French' },
];

const Navbar = () => {
  const user = useSelector(selectuser);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showLoginOtpModal, setShowLoginOtpModal] = useState(false);
  const [loginOtpInput, setLoginOtpInput] = useState("");
  const [loginPendingEmail, setLoginPendingEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isCustomLoggingIn, setIsCustomLoggingIn] = useState(false);
  const dispatch = useDispatch();

  const handlelogin = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Log the OAuth login in the backend
      try {
        await axios.post("https://internshala-clone-ydgs.onrender.com/api/auth/log-oauth-login", {
          uid: result.user.uid,
          email: result.user.email
        });
      } catch (err) {
        console.error("Failed to log OAuth login", err);
      }

      toast.success("logged in successfully");
      setShowLoginModal(false);
      router.push("/");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        toast.info("Login cancelled by user");
      } else if (error.code === 'auth/popup-blocked') {
        toast.error("Popup blocked by browser. Please allow popups for this site.");
      } else {
        toast.error("Login failed");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Please enter email and password");
      return;
    }
    setIsCustomLoggingIn(true);
    try {
      const res = await axios.post("https://internshala-clone-ydgs.onrender.com/api/auth/login", {
        type: "email",
        value: loginEmail,
        password: loginPassword
      });
      if (res.data.success && res.data.requireOtp) {
        setLoginPendingEmail(res.data.email);
        setShowLoginOtpModal(true);
        setShowLoginModal(false);
        toast.success(res.data.message);
      } else if (res.data.success) {
        toast.success("Logged in successfully");
        localStorage.setItem("customAuth", JSON.stringify(res.data.user));
        dispatch(login(res.data.user));
        setShowLoginModal(false);
        setLoginEmail("");
        setLoginPassword("");
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setIsCustomLoggingIn(false);
    }
  };

  const verifyLoginOtp = async () => {
    if (!loginOtpInput || loginOtpInput.length !== 6) return toast.error("Enter 6-digit OTP");
    setIsCustomLoggingIn(true);
    try {
      const res = await axios.post("https://internshala-clone-ydgs.onrender.com/api/auth/verify-login-otp", {
        email: loginPendingEmail,
        otp: loginOtpInput
      });
      if (res.data.success) {
        toast.success("Login verified successfully");
        localStorage.setItem("customAuth", JSON.stringify(res.data.user));
        dispatch(login(res.data.user));
        setShowLoginOtpModal(false);
        setLoginOtpInput("");
        setLoginPendingEmail("");
        setLoginEmail("");
        setLoginPassword("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "OTP verification failed");
    } finally {
      setIsCustomLoggingIn(false);
    }
  };

  const handlelogout = () => {
    localStorage.removeItem("customAuth");
    signOut(auth).catch(() => {
        // Fallback for custom user
        window.location.reload();
    });
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    
    if (lang === 'fr') {
      if (!user) {
        toast.error("Please login first to switch to French.");
        e.target.value = i18n.language; // Reset dropdown
        return;
      }
      setShowOtpModal(true);
      sendOtp();
    } else {
      i18n.changeLanguage(lang);
      localStorage.setItem("i18nextLng", lang);
    }
  };

  const sendOtp = async () => {
    setIsLoadingOtp(true);
    try {
      const res = await axios.post("https://internshala-clone-ydgs.onrender.com/api/otp/send-otp", { email: user.email });
      if (res.data.success) {
        setOtpSent(true);
        toast.success("OTP sent to your email! (Check backend console if email is not setup)");
      }
    } catch (err) {
      toast.error("Failed to send OTP.");
      setShowOtpModal(false);
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpInput) {
      toast.error("Please enter the OTP.");
      return;
    }
    setIsLoadingOtp(true);
    try {
      const res = await axios.post("https://internshala-clone-ydgs.onrender.com/api/otp/verify-otp", {
        email: user.email,
        otp: otpInput
      });
      if (res.data.success) {
        toast.success("OTP verified! Language switched to French.");
        i18n.changeLanguage("fr");
        localStorage.setItem("i18nextLng", "fr");
        setShowOtpModal(false);
        setOtpSent(false);
        setOtpInput("");
      }
    } catch (err) {
      toast.error("Invalid or expired OTP.");
    } finally {
      setIsLoadingOtp(false);
    }
  };

  return (
    <div className="relative">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-blue-600">
                <img src={logo.src} alt="Logo" className="h-16" />
              </Link>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/internship"}>
                  <span>{t("Internships")}</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/job"}>
                  <span>{t("Jobs")}</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/public-space"}>
                  <span>{t("Public Space") || "Public Space"}</span>
                </Link>
              </button>
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder={t("Search")}
                  className="ml-2 bg-transparent focus:outline-none text-sm w-48"
                />
              </div>
            </div>

            {/* Auth Buttons & Lang Selector */}
            <div className="flex items-center space-x-4">
              
              {/* Language Selector */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                <Globe size={18} className="text-gray-500 mr-1" />
                <select 
                  onChange={handleLanguageChange} 
                  value={i18n.language}
                  className="bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>

              {user ? (
                <div className="relative flex items-center space-x-4">
                  <Link href={"/profile"} className="shrink-0 flex items-center">
                    <img
                      src={user.photo}
                      alt=""
                      className="w-8 h-8 rounded-full border border-gray-200"
                    />
                  </Link>
                  <Link href={"/login-history"} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    Login History
                  </Link>
                  <Link href={"/subscription"} className="text-sm font-medium text-yellow-600 hover:text-yellow-700 transition-colors flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>
                    Premium
                  </Link>
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={handlelogout}
                  >
                    {t("Logout")}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">{t("Login")}</span>
                  </button>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2">
                    Forgot Password?
                  </Link>
                  <a href="/adminlogin" className="text-sm font-medium text-gray-600 hover:text-gray-800">
                    {t("Admin")}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login OTP Modal */}
      {showLoginOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] p-6 text-center shadow-lg relative">
            <button 
              onClick={() => {
                setShowLoginOtpModal(false);
                setLoginOtpInput("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Login</h2>
            <p className="text-gray-600 text-sm mb-6">
              You are logging in from Chrome. Please enter the OTP sent to {loginPendingEmail}
            </p>

            <input 
              type="text"
              placeholder="Enter 6-digit OTP"
              value={loginOtpInput}
              onChange={(e) => setLoginOtpInput(e.target.value)}
              className="w-full text-center text-gray-900 placeholder-gray-400 text-xl tracking-widest px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4"
              maxLength={6}
            />

            <button
              onClick={verifyLoginOtp}
              disabled={isCustomLoggingIn}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isCustomLoggingIn ? "Verifying..." : "Verify & Login"}
            </button>
          </div>
        </div>
      )}

      {/* Language OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] p-6 text-center shadow-lg relative">
            <button 
              onClick={() => {
                setShowOtpModal(false);
                setOtpSent(false);
                setOtpInput("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify French Access</h2>
            <p className="text-gray-600 text-sm mb-6">
              To proceed in French, please enter the OTP sent to {user?.email}
            </p>

            <input 
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="w-full text-center text-gray-900 placeholder-gray-400 text-xl tracking-widest px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4"
              maxLength={6}
            />

            <button
              onClick={verifyOtp}
              disabled={isLoadingOtp}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoadingOtp ? "Verifying..." : "Verify & Switch Language"}
            </button>
            
            <button
              onClick={sendOtp}
              disabled={isLoadingOtp}
              className="mt-4 text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] p-6 text-center shadow-lg relative">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>
            
            <button
              onClick={handlelogin}
              disabled={isSigningIn}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-6 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">{isSigningIn ? "Logging in..." : "Continue with Google"}</span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-gray-400 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-4">
              <input 
                type="email"
                placeholder="Email Address"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full text-gray-900 placeholder-gray-400 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <input 
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full text-gray-900 placeholder-gray-400 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <button
                type="submit"
                disabled={isCustomLoggingIn}
                className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isCustomLoggingIn ? "Logging in..." : "Login with Email"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;