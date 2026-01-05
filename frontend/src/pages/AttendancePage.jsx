import React, { useState } from 'react';
import axios from 'axios';
import FaceCapture from '../components/FaceCapture';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const AttendancePage = () => {
    const navigate = useNavigate();
    const [method, setMethod] = useState(null); // 'FACE', 'OTP', or null
    const [step, setStep] = useState('SELECT'); // 'SELECT', 'PROCESS', 'SUCCESS', 'ERROR'
    const [message, setMessage] = useState('');
    const [userName, setUserName] = useState('');

    // OTP State
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const reset = () => {
        setMethod(null);
        setStep('SELECT');
        setMessage('');
        setUserName('');
        setEmail('');
        setOtp('');
        setOtpSent(false);
    };

    const handleFaceCapture = async (imageSrc) => {
        if (!imageSrc) return;
        setStep('PROCESS');
        setMessage('Scanning Biometrics...');

        try {
            // Convert to Blob
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const file = new File([blob], "face.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append('image', file);

            const { data } = await axios.post('http://localhost:5000/api/attendance/mark-face-public', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setUserName(data.user);
            setMessage(`Attendance Marked: ${data.time}`);
            setStep('SUCCESS');

            // Auto reset after 3 seconds
            setTimeout(reset, 4000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Verification Failed. Try Again.');
            setStep('ERROR');
        }
    };

    const handleSendOtp = async () => {
        if (!email) return;
        setStep('PROCESS');
        setMessage('Sending OTP...');
        try {
            await axios.post('http://localhost:5000/api/attendance/send-otp-public', { email });
            setOtpSent(true);
            setStep('PROCESS'); // Stay in process to show input
            setMessage('OTP Sent to ' + email);
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
            setUserName(data.user);
            setMessage(`Attendance Marked: ${data.time}`);
            setStep('SUCCESS');
            setTimeout(reset, 4000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Invalid OTP');
            setStep('ERROR');
        }
    };

    return (
        <div className="min-h-screen flex flex-col pt-24 pb-12 px-4 relative bg-[#03030b]">
            <Navbar />

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyan-500 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse-glow"></div>
                <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="max-w-4xl w-full mx-auto relative z-10 flex-1 flex flex-col justify-center">

                {step === 'SELECT' && (
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-orbitron">Identification Mode</h2>
                        <p className="text-gray-400">Select your preferred verification method</p>
                    </div>
                )}

                {step === 'SUCCESS' ? (
                    <div className="glass-panel p-12 rounded-3xl text-center border-2 border-green-500/30 shadow-[0_0_100px_rgba(34,197,94,0.15)] animate-float max-w-lg mx-auto">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 font-orbitron">Welcome, {userName}!</h2>
                        <div className="text-green-400 font-mono text-lg bg-green-500/10 inline-block px-4 py-1 rounded-full border border-green-500/20 mt-2">{message}</div>
                    </div>
                ) : step === 'ERROR' ? (
                    <div className="glass-panel p-12 rounded-3xl text-center border-2 border-red-500/30 max-w-lg mx-auto shadow-[0_0_50px_rgba(239,68,68,0.15)]">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 font-orbitron">Verification Failed</h2>
                        <p className="text-lg text-red-400 mb-8">{message}</p>
                        <button onClick={reset} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all border border-white/10 hover:border-white/30">Try Again</button>
                    </div>
                ) : method === null ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto w-full">
                        <button
                            onClick={() => setMethod('FACE')}
                            className="group glass-panel p-10 rounded-3xl hover:bg-blue-600/10 transition-all duration-300 text-center flex flex-col items-center gap-6 border border-white/5 hover:border-blue-500/50 hover:shadow-[0_0_50px_rgba(37,99,235,0.15)]"
                        >
                            <div className="w-40 h-40 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                                <svg className="w-16 h-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2 font-orbitron tracking-wide">Face Scan</h3>
                                <p className="text-gray-500 text-sm">Biometric Authentication</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setMethod('OTP')}
                            className="group glass-panel p-10 rounded-3xl hover:bg-purple-600/10 transition-all duration-300 text-center flex flex-col items-center gap-6 border border-white/5 hover:border-purple-500/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.15)]"
                        >
                            <div className="w-40 h-40 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(168,85,247,0.1)] group-hover:shadow-[0_0_50px_rgba(168,85,247,0.3)]">
                                <svg className="w-16 h-16 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 17h.01M9 17h.01M9 13H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2 font-orbitron tracking-wide">Passcode</h3>
                                <p className="text-gray-500 text-sm">Secure OTP Verification</p>
                            </div>
                        </button>
                    </div>
                ) : method === 'FACE' ? (
                    <div className="glass-panel p-8 rounded-3xl max-w-xl mx-auto w-full border border-blue-500/20 shadow-[0_0_60px_rgba(59,130,246,0.1)]">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold font-orbitron mb-2">Initialize Scanner</h2>
                            <p className="text-gray-400 text-sm">Align your face within the frame</p>
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-blue-500/30 relative bg-black/50">
                            <FaceCapture onCapture={handleFaceCapture} />

                            {/* Futuristic Overlay UI */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-blue-500 rounded-tl-lg"></div>
                                <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-blue-500 rounded-br-lg"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-blue-500/20 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <button onClick={() => setMethod(null)} className="mt-8 w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold transition-all">Cancel Operation</button>
                    </div>
                ) : (
                    <div className="glass-panel p-10 rounded-3xl max-w-md mx-auto w-full border border-purple-500/20 shadow-[0_0_60px_rgba(168,85,247,0.1)]">
                        <h2 className="text-2xl font-bold text-center mb-8 font-orbitron tracking-wide">Identity Verification</h2>
                        {!otpSent ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-2 tracking-widest uppercase">Registered Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors placeholder:text-gray-700"
                                        placeholder="user@dma.system"
                                    />
                                </div>
                                <button
                                    onClick={handleSendOtp}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all transform active:scale-95"
                                >
                                    Transmit Code
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-2 tracking-widest uppercase">Authentication Code</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-3xl font-mono tracking-[0.5em] focus:border-green-500 focus:outline-none transition-colors placeholder:text-gray-800"
                                        placeholder="......"
                                        maxLength={6}
                                    />
                                    <p className="text-[10px] text-center text-gray-500 mt-3 font-mono">Code sent to {email}</p>
                                </div>
                                <button
                                    onClick={handleVerifyOtp}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform active:scale-95"
                                >
                                    Authenticate
                                </button>
                            </div>
                        )}
                        <button onClick={reset} className="mt-6 w-full text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Abort</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendancePage;
