import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { useRouter } from "next/router";
import axios from "axios";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { CheckCircle, Lock, Mail, ChevronRight, ChevronLeft, Download } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ResumeBuilder() {
  const user = useSelector(selectuser);
  const router = useRouter();

  // Load Razorpay Script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Multi-step form state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Resume Data
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    objective: "",
    education: [{ degree: "", university: "", year: "" }],
    skills: "",
    experience: [{ role: "", company: "", duration: "", description: "" }],
    projects: [{ title: "", description: "" }],
  });

  // Handle Input Changes
  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (index: number, e: any, field: "education" | "experience" | "projects") => {
    const updatedArray = [...formData[field]] as any;
    updatedArray[index][e.target.name] = e.target.value;
    setFormData({ ...formData, [field]: updatedArray });
  };

  const addArrayItem = (field: "education" | "experience" | "projects", templateItem: any) => {
    setFormData({ ...formData, [field]: [...formData[field], templateItem] });
  };

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Resume Ref for Download
  const resumeRef = useRef<HTMLDivElement>(null);

  // Step 1: Send OTP
  const triggerPaymentFlow = async () => {
    if (!user) {
      toast.error("Please login first to create a premium resume");
      router.push("/");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("https://internshala-clone-ydgs.onrender.com/api/otp/send-otp", {
        email: user.email,
      });

      if (response.data.success) {
        toast.info("📩 OTP sent to your email for security verification!");
        setShowOtpModal(true);
      } else {
        toast.error("Failed to send verification OTP");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Start Razorpay
  const verifyOtpAndPay = async () => {
    setOtpLoading(true);
    try {
      // 1. Verify OTP
      const verifyRes = await axios.post("https://internshala-clone-ydgs.onrender.com/api/otp/verify-otp", {
        email: user.email,
        otp,
      });

      if (!verifyRes.data.success) {
        toast.error("Invalid OTP");
        setOtpLoading(false);
        return;
      }

      toast.success("Security verified!");
      setShowOtpModal(false);

      // 2. Create Razorpay Order & Save Draft Resume
      const orderRes = await axios.post("https://internshala-clone-ydgs.onrender.com/api/resume/create-order", {
        userId: user.uid,
        formData,
      });

      const { order, resumeId } = orderRes.data;

      // 3. Initiate Razorpay Checkout Window
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SeoCFJL6D4KA8l", // Test Key
        amount: order.amount,
        currency: order.currency,
        name: "InternArea Premium",
        description: "Premium Resume Creation",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            toast.info("Verifying payment...");
            // Verify Payment on Backend
            const verification = await axios.post("https://internshala-clone-ydgs.onrender.com/api/resume/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              resumeId,
            });

            if (verification.data.success) {
              toast.success("🎉 Payment Successful! Your resume is premium.");
              downloadPDF();
            }
          } catch (err) {
            console.error(err);
            toast.error("Payment Verification Failed!");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || error.response?.data?.error || "Payment flow error");
    } finally {
      setOtpLoading(false);
    }
  };

  const downloadPDF = () => {
    const element = resumeRef.current;
    if (element) {
      html2canvas(element, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${formData.fullName.replace(" ", "_")}_Resume.pdf`);
        toast.success("Resume Downloaded!");
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex py-10 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Premium Resume Builder | InternArea</title>
      </Head>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT PANEL: Multi-step Form */}
        <div className="bg-white p-8 rounded-2xl shadow-lg h-fit">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Craft Your Story</h2>
            <p className="mt-2 text-sm text-gray-600">Step {step} of 4: Fill in your professional details.</p>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-500"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-6">
            {step === 1 && (
              <div className="animate-fade-in-up">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">1. Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Full Name" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 bg-white placeholder-gray-400" />
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 bg-white placeholder-gray-400" />
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 bg-white placeholder-gray-400" />
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="City, Country" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 bg-white placeholder-gray-400" />
                </div>
                <textarea name="objective" rows={3} value={formData.objective} onChange={handleInputChange} placeholder="Professional Objective (e.g. passionate frontend developer looking for...)" className="w-full mt-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 bg-white placeholder-gray-400" />
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in-up">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">2. Education & Skills</h3>
                <div className="space-y-4">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <input type="text" name="degree" value={edu.degree} onChange={(e) => handleArrayChange(index, e, "education")} placeholder="Degree" className="p-2 border rounded text-gray-900 bg-white placeholder-gray-400" />
                      <input type="text" name="university" value={edu.university} onChange={(e) => handleArrayChange(index, e, "education")} placeholder="University" className="p-2 border rounded text-gray-900 bg-white placeholder-gray-400" />
                      <input type="text" name="year" value={edu.year} onChange={(e) => handleArrayChange(index, e, "education")} placeholder="Graduation Year" className="p-2 border rounded text-gray-900 bg-white placeholder-gray-400" />
                    </div>
                  ))}
                  <button onClick={() => addArrayItem("education", { degree: "", university: "", year: "" })} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">+ Add More Education</button>
                </div>
                <div className="mt-6">
                  <input type="text" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="Core Skills (comma separated)" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-900 bg-white placeholder-gray-400" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in-up">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">3. Experience & Projects</h3>
                <p className="text-sm text-gray-600 font-medium mb-2">Experiences</p>
                <div className="space-y-4 mb-6">
                  {formData.experience.map((exp, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" name="role" value={exp.role} onChange={(e) => handleArrayChange(index, e, "experience")} placeholder="Job Role" className="p-2 border rounded text-gray-900 bg-white placeholder-gray-400" />
                        <input type="text" name="company" value={exp.company} onChange={(e) => handleArrayChange(index, e, "experience")} placeholder="Company" className="p-2 border rounded text-gray-900 bg-white placeholder-gray-400" />
                      </div>
                      <input type="text" name="duration" value={exp.duration} onChange={(e) => handleArrayChange(index, e, "experience")} placeholder="Duration (e.g. Jan 2022 - Present)" className="p-2 border rounded text-gray-900 bg-white placeholder-gray-400" />
                      <textarea name="description" value={exp.description} onChange={(e) => handleArrayChange(index, e, "experience")} placeholder="Key responsibilities..." className="p-2 border rounded text-gray-900 bg-white placeholder-gray-400" rows={2} />
                    </div>
                  ))}
                  <button onClick={() => addArrayItem("experience", { role: "", company: "", duration: "", description: "" })} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">+ Add Experience</button>
                </div>

                <p className="text-sm text-gray-600 font-medium mb-2">Key Projects</p>
                <div className="space-y-4">
                  {formData.projects.map((proj, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <input type="text" name="title" value={proj.title} onChange={(e) => handleArrayChange(index, e, "projects")} placeholder="Project Title" className="p-2 border rounded text-gray-900 bg-white placeholder-gray-400" />
                      <textarea name="description" value={proj.description} onChange={(e) => handleArrayChange(index, e, "projects")} placeholder="Project Description & Tech Stack" className="p-2 border rounded text-gray-900 bg-white placeholder-gray-400" rows={2} />
                    </div>
                  ))}
                  <button onClick={() => addArrayItem("projects", { title: "", description: "" })} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">+ Add Project</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in-up text-center py-6">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Resume Ready!</h3>
                <p className="text-gray-600 mb-6">Review your preview on the right. Once you're satisfied, unlock your high-resolution watermark-free PDF.</p>
                <button
                  onClick={triggerPaymentFlow}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-70 w-full sm:w-auto text-lg"
                >
                  {loading ? (
                    <div className="h-6 w-6 border-b-2 border-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" /> Pay ₹50 & Download PDF
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between items-center border-t border-gray-100 pt-6">
            <button
              onClick={() => setStep(step > 1 ? step - 1 : 1)}
              disabled={step === 1}
              className={`flex items-center px-4 py-2 font-medium rounded-lg transition-colors ${step === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Back
            </button>
            <button
              onClick={() => setStep(step < 4 ? step + 1 : 4)}
              disabled={step === 4}
              className={`flex items-center px-6 py-2 bg-gray-900 text-white font-medium rounded-lg transition-all ${step === 4 ? 'hidden' : 'hover:bg-gray-800 shadow-md hover:shadow-lg'}`}
            >
              Next <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Live Preview */}
        <div className="hidden lg:flex flex-col items-center">
          <div className="sticky top-8 w-full max-w-[210mm]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Live Preview</h2>
              <button onClick={() => toast.info("Go to Step 4 to securely download your high-res Resume!")} className="text-indigo-600 hover:text-indigo-800 p-2"><Download className="w-5 h-5" /></button>
            </div>

            {/* The A4 Resume Preview Box */}
            <div 
              className="shadow-2xl rounded-sm overflow-hidden flex flex-col text-sm"
              style={{ width: "100%", aspectRatio: "1/1.414", padding: "40px", backgroundColor: "#ffffff", color: "#1f2937" }}
              ref={resumeRef}
            >
              <h1 className="text-3xl font-bold uppercase tracking-tight" style={{ color: "#111827" }}>{formData.fullName || "John Doe"}</h1>
              <div className="flex space-x-3 text-xs mt-2 font-medium" style={{ color: "#4f46e5" }}>
                {formData.email && <span>{formData.email}</span>}
                {formData.phone && <span>• {formData.phone}</span>}
                {formData.address && <span>• {formData.address}</span>}
              </div>
              
              {formData.objective && (
                <div className="mt-6">
                  <p className="text-sm leading-relaxed font-serif italic" style={{ color: "#374151" }}>"{formData.objective}"</p>
                </div>
              )}

              {formData.skills && (
                <div className="mt-6 border-b-2 pb-1 mb-3 inline-block" style={{ borderColor: "#111827" }}>
                  <h2 className="font-bold uppercase tracking-wider text-xs" style={{ color: "#111827" }}>Skills</h2>
                </div>
              )}
              {formData.skills && (
                <p className="font-medium text-xs leading-relaxed" style={{ color: "#374151" }}>{formData.skills}</p>
              )}

              {formData.education[0]?.degree && (
                <div className="mt-6 border-b-2 pb-1 mb-3 inline-block" style={{ borderColor: "#111827" }}>
                  <h2 className="font-bold uppercase tracking-wider text-xs" style={{ color: "#111827" }}>Education</h2>
                </div>
              )}
              {formData.education.map((edu, i) => edu.degree && (
                <div key={i} className="mb-2">
                  <h3 className="font-bold" style={{ color: "#1f2937" }}>{edu.degree}</h3>
                  <div className="flex justify-between text-xs" style={{ color: "#4b5563" }}>
                    <span>{edu.university}</span>
                    <span>{edu.year}</span>
                  </div>
                </div>
              ))}

              {formData.experience[0]?.role && (
                <div className="mt-6 border-b-2 pb-1 mb-3 inline-block" style={{ borderColor: "#111827" }}>
                  <h2 className="font-bold uppercase tracking-wider text-xs" style={{ color: "#111827" }}>Experience</h2>
                </div>
              )}
              {formData.experience.map((exp, i) => exp.role && (
                <div key={i} className="mb-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold" style={{ color: "#1f2937" }}>{exp.role}</h3>
                    <span className="text-xs font-medium" style={{ color: "#6b7280" }}>{exp.duration}</span>
                  </div>
                  <h4 className="text-xs font-bold mb-1" style={{ color: "#4f46e5" }}>{exp.company}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{exp.description}</p>
                </div>
              ))}

              {formData.projects[0]?.title && (
                <div className="mt-6 border-b-2 pb-1 mb-3 inline-block" style={{ borderColor: "#111827" }}>
                  <h2 className="font-bold uppercase tracking-wider text-xs" style={{ color: "#111827" }}>Projects</h2>
                </div>
              )}
              {formData.projects.map((proj, i) => proj.title && (
                <div key={i} className="mb-3">
                  <h3 className="font-bold mb-1" style={{ color: "#1f2937" }}>{proj.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{proj.description}</p>
                </div>
              ))}

            </div>
          </div>
        </div>

      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in-up">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Mail className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Security Verification</h2>
            <p className="text-center text-gray-600 mb-6 text-sm">
              To proceed to Razorpay Checkout, please enter the 6-digit OTP sent to <strong className="text-gray-800">{user?.email}</strong>.
            </p>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter OTP"
              className="w-full text-center text-2xl tracking-[0.5em] font-medium p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition mb-6 text-gray-900 bg-white placeholder-gray-400"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={verifyOtpAndPay}
                disabled={otp.length !== 6 || otpLoading}
                className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {otpLoading ? <div className="h-5 w-5 border-b-2 border-white rounded-full animate-spin"></div> : "Verify & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
