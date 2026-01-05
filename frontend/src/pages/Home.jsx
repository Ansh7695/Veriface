import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, Lock, X, Check, AlertCircle, Loader2, UserPlus, User } from 'lucide-react';
import FaceCapture from '../components/FaceCapture';
import Navbar from '../components/Navbar';
import Background from '../components/Background';
import FutureStyleTable from '../components/TodayAttendance'; // Using an alias for the styled component
import { loadModels, getFaceDescriptor } from '../utils/faceService';

const Home = () => {
    const [method, setMethod] = useState(null); // 'FACE', 'OTP', or null
    const [step, setStep] = useState('SELECT'); // 'SELECT', 'PROCESS', 'SUCCESS', 'ERROR'
    const [message, setMessage] = useState('');
    const [userName, setUserName] = useState('');
    const [attendanceTime, setAttendanceTime] = useState('');
    const [attendanceStatus, setAttendanceStatus] = useState('');

    // OTP State
    const [name, setName] = useState(''); // Changed from Email to Name
    const [email, setEmail] = useState(''); // Hidden, set by backend response
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Load Models on Mount
    React.useEffect(() => {
        loadModels();
    }, []);

    const reset = () => {
        setMethod(null);
        setStep('SELECT');
        setMessage('');
        setUserName('');
        setEmail('');
        setOtp('');
        setOtpSent(false);
    };

    const processSuccess = (data) => {
        setUserName(data.user);
        setAttendanceTime(data.time);

        const [hours, minutes] = data.time.split(':').map(Number);
        const isLate = hours > 10 || (hours === 10 && minutes > 0);

        setAttendanceStatus(isLate ? 'LATE' : 'ON_TIME');
        setStep('SUCCESS');
        setTimeout(reset, 6000);
    };

    const handleFaceCapture = async (imageSrc) => {
        if (!imageSrc) return;
        setStep('PROCESS');
        setMessage('Scanning Biometrics...');

        try {
            // Client-Side AI: Get Descriptor from Image
            const img = await new Promise((resolve, reject) => {
                const i = new Image();
                i.crossOrigin = "anonymous";
                i.onload = () => resolve(i);
                i.onerror = reject;
                i.src = imageSrc;
            });

            // Get Descriptor
            const descriptor = await getFaceDescriptor(img);

            // Create File for Upload
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const file = new File([blob], "face.jpg", { type: "image/jpeg" });

            // Prepare FormData
            const formData = new FormData();
            formData.append('image', file);
            formData.append('faceDescriptor', JSON.stringify(descriptor));

            // Send to Backend
            const { data } = await axios.post('http://localhost:5000/api/attendance/mark-face-public', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            processSuccess(data);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Verification Failed. Try Again.');
            setStep('ERROR');
        }
    };

    const handleSendOtp = async () => {
        if (!name) return;
        setStep('PROCESS');
        setMessage('Searching User & Sending OTP...');
        try {
            // Send Name, Backend finds Email
            const { data } = await axios.post('http://localhost:5000/api/attendance/send-otp-public', { name });
            setEmail(data.email); // Store returned email (hidden)
            setOtpSent(true);
            setStep('PROCESS');
            setMessage(`OTP Sent to registered email for ${name}`);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to send OTP');
            setStep('ERROR');
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return;
        setMessage('Verifying Code...');
        try {
            const { data } = await axios.post('http://localhost:5000/api/attendance/verify-otp-public', { email, otp });
            processSuccess(data);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Invalid OTP');
            setStep('ERROR');
        }
    };

    return (
        <div className="min-h-screen text-white font-sans overflow-hidden">
            <Background />
            <Navbar />

            <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">

                {/* Hero Text */}
                <AnimatePresence>
                    {step === 'SELECT' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-5xl md:text-7xl font-black mb-6 font-orbitron tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                                MARK ATTENDANCE
                            </h2>
                            <p className="text-blue-200/60 text-lg uppercase tracking-[0.4em] font-mono">
                                Secure • Fast • Reliable
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Selection Cards */}
                <AnimatePresence mode="wait">
                    {step === 'SELECT' && (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        >
                            <Card
                                title="Face Attendance"
                                subtitle="Biometric Scan"
                                icon={<ScanFace size={48} />}
                                color="blue"
                                onClick={() => setMethod('FACE')}
                            />
                            <Card
                                title="OTP Attendance"
                                subtitle="Secure Code"
                                icon={<Lock size={48} />}
                                color="indigo"
                                onClick={() => setMethod('OTP')}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modals & Popups */}
                <AnimatePresence>
                    {(method || step === 'SUCCESS' || step === 'ERROR') && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Face Modal */}
                            {method === 'FACE' && (step === 'SELECT' || step === 'PROCESS') && (
                                <motion.div
                                    className="w-full max-w-2xl bg-[#0a0a12] rounded-3xl border border-blue-500/30 p-1 relative overflow-hidden"
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                >
                                    <div className="p-8 relative z-10">
                                        <button onClick={reset} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                                            <X />
                                        </button>
                                        <h2 className="text-2xl font-bold text-center mb-6 font-orbitron text-blue-400">Biometric Scan</h2>
                                        <div className="relative rounded-2xl overflow-hidden border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                                            <FaceCapture onCapture={handleFaceCapture} />
                                            <div className="absolute top-0 w-full h-1 bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan"></div>
                                        </div>
                                    </div>
                                    {/* Modal Background Glow */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-3xl -z-0"></div>
                                </motion.div>
                            )}

                            {/* OTP Modal */}
                            {method === 'OTP' && step !== 'SUCCESS' && (
                                <motion.div
                                    className="w-full max-w-md bg-[#0a0a12] rounded-3xl border border-indigo-500/30 p-10 relative overflow-hidden"
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                >
                                    <button onClick={reset} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                                        <X />
                                    </button>
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                                            <Lock size={32} />
                                        </div>
                                        <h2 className="text-2xl font-bold font-orbitron text-white">Verification</h2>
                                    </div>

                                    {!otpSent ? (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs font-mono text-indigo-400 tracking-widest uppercase mb-2 block">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-[#151520] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                                    placeholder="Enter your name"
                                                />
                                            </div>
                                            <button
                                                onClick={handleSendOtp}
                                                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wide shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
                                            >
                                                SEND CODE
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs font-mono text-indigo-400 tracking-widest uppercase mb-2 block">Enter Code</label>
                                                <input
                                                    type="text"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    className="w-full bg-[#151520] border border-white/10 rounded-xl px-5 py-4 text-white text-center text-3xl font-mono tracking-[0.5em] focus:border-indigo-500 focus:outline-none transition-colors"
                                                    maxLength={6}
                                                />
                                                <p className="text-xs text-center text-gray-500 mt-4">Check your email for the code</p>
                                            </div>
                                            <button
                                                onClick={handleVerifyOtp}
                                                className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold tracking-wide shadow-lg shadow-green-900/40 transition-all active:scale-95"
                                            >
                                                VERIFY
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Success Popup */}
                            {step === 'SUCCESS' && (
                                <motion.div
                                    className="bg-[#0a0a12] p-10 rounded-[2rem] text-center border border-green-500/30 shadow-[0_0_100px_rgba(34,197,94,0.2)] max-w-md w-full relative overflow-hidden"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-emerald-400"></div>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-green-500/40"
                                    >
                                        <Check size={48} className="text-white" strokeWidth={3} />
                                    </motion.div>

                                    <h2 className="text-3xl font-bold text-white mb-2 font-orbitron">Hi {userName}!</h2>
                                    <p className="text-gray-400 mb-8">Attendance Recorded Successfully</p>

                                    <div className={`rounded-xl p-4 border ${attendanceStatus === 'ON_TIME' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                        <p className={`font-bold text-lg ${attendanceStatus === 'ON_TIME' ? 'text-green-400' : 'text-red-400'}`}>
                                            {attendanceStatus === 'ON_TIME' ? "You're On Time! 🚀" : "You're Late! ⏰"}
                                        </p>
                                    </div>
                                    <p className="mt-6 text-xs text-gray-600 font-mono tracking-widest uppercase">Logged at {attendanceTime}</p>
                                </motion.div>
                            )}

                            {/* Error Popup */}
                            {step === 'ERROR' && (
                                <motion.div
                                    className="bg-[#0a0a12] p-8 rounded-3xl text-center border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] max-w-sm w-full"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center text-red-500">
                                        <AlertCircle size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
                                    <p className="text-red-300/80 mb-6 text-sm">{message}</p>
                                    <button onClick={reset} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-white text-sm font-semibold transition-colors">Dismiss</button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Register Employee Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-12"
                >
                    <a
                        href="/register"
                        className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-full flex items-center gap-2 transition-all hover:bg-blue-900/20"
                    >
                        <span className="absolute inset-0 border border-blue-500/30 rounded-full group-hover:border-blue-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"></span>
                        <UserPlus size={16} className="text-blue-500 group-hover:text-blue-400" />
                        <span className="text-sm font-mono text-blue-500 tracking-widest uppercase group-hover:text-blue-400">Register New Employee</span>
                    </a>
                </motion.div>

                {/* Today's Attendance Table */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="w-full max-w-5xl mt-16 pb-12"
                >
                    <FutureStyleTable />
                </motion.div>
            </main>
        </div>
    );
};

// Reusable Tilt Card Component
const Card = ({ title, subtitle, icon, color, onClick }) => {
    return (
        <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`group relative h-80 rounded-[2rem] bg-gradient-to-b from-[#11111a] to-[#05050a] border border-white/5 hover:border-${color}-500/50 cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-colors`}
        >
            <div className={`absolute inset-0 bg-${color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className={`w-32 h-32 rounded-3xl bg-${color}-500/10 flex items-center justify-center mb-6 text-${color}-500 group-hover:scale-110 group-hover:bg-${color}-500 group-hover:text-white transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-white font-orbitron mb-2 relative z-10">{title}</h3>
            <p className="text-gray-500 text-sm relative z-10 group-hover:text-gray-300 transition-colors">{subtitle}</p>
        </motion.div>
    );
};

export default Home;
