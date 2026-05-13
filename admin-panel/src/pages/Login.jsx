import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });

            if (data.role !== 'admin') {
                setError('Access Restricted: Admins Only');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard');
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid credentials');
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#020205] relative overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-500/5 rotate-45 blur-[80px]"></div>
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-1"
            >
                {/* Border Gradient Container */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/30 to-indigo-500/10 rounded-3xl blur-sm"></div>

                <div className="relative bg-[#0b0f1a]/80 backdrop-blur-2xl rounded-3xl p-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 rotate-3"
                        >
                            <Shield className="text-white w-10 h-10" strokeWidth={1.5} />
                        </motion.div>
                        <h2 className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400">Admin Portal</h2>
                        <p className="text-blue-200/40 text-sm mt-3 font-mono tracking-widest uppercase">Restricted Access Level 1</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                        >
                            <div className="w-1 h-8 bg-red-500 rounded-full"></div>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-blue-300/70 uppercase tracking-wider ml-1">Identity</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#151a25]/50 border border-blue-500/20 rounded-xl px-5 py-4 text-white placeholder-blue-500/20 focus:border-blue-500 focus:bg-[#151a25] focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                                    placeholder="admin@dma.com"
                                    required
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500/30 group-focus-within:bg-blue-400 group-focus-within:shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all"></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono text-blue-300/70 uppercase tracking-wider ml-1">Security Key</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#151a25]/50 border border-blue-500/20 rounded-xl px-5 py-4 text-white placeholder-blue-500/20 focus:border-blue-500 focus:bg-[#151a25] focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/30 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all flex items-center justify-center gap-2 group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    AUTHENTICATE
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
