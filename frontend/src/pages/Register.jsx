import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FaceCapture from '../components/FaceCapture';
import { UserPlus, ArrowLeft, Building2, User, Mail, Shield, AlertCircle, CheckCircle, ScanFace } from 'lucide-react';
import { motion } from 'framer-motion';
import { loadModels, getFaceDescriptor } from '../utils/faceService';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee'
    });
    const [image, setImage] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    React.useEffect(() => {
        loadModels().then(() => setModelsLoaded(true));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('password', formData.password);
        data.append('role', formData.role);
        if (image) {
            // Client-Side Face AI: Calculate Descriptor
            try {
                const img = await new Promise((resolve, reject) => {
                    const i = new Image();
                    i.crossOrigin = "anonymous";
                    i.onload = () => resolve(i);
                    i.onerror = reject;
                    i.src = image;
                });

                // Get 128-float descriptor
                const descriptor = await getFaceDescriptor(img);
                data.append('faceDescriptor', JSON.stringify(descriptor));

                const res = await fetch(image);
                const blob = await res.blob();
                data.append('image', blob, 'face.jpg');
            } catch (err) {
                setMessage({ type: 'error', text: 'Face not detected clearly. Please retake photo.' });
                setLoading(false);
                return;
            }
        }

        try {
            await axios.post('http://localhost:5000/api/auth/register-employee', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Employee registered successfully!' });
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Registration failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020205] text-white p-6 flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10"
            >
                {/* Form Section */}
                <div className="glass-panel p-8 rounded-3xl border border-white/5 relative">
                    <button onClick={() => navigate('/')} className="absolute top-8 right-8 text-gray-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>

                    <h2 className="text-3xl font-orbitron font-bold mb-2 flex items-center gap-3">
                        <UserPlus className="text-blue-500" /> New Registration
                    </h2>
                    <p className="text-gray-500 mb-8">Create a new employee profile</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full bg-[#0a0a12] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="john@company.com"
                                    className="w-full bg-[#0a0a12] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">Role</label>
                            <div className="relative group">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                <select
                                    className="w-full bg-[#0a0a12] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-blue-500/50 focus:outline-none transition-all appearance-none cursor-pointer"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="employee">Employee</option>
                                    <option value="intern">Intern</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/40 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Registering...' : 'Register Employee'}
                        </button>
                    </form>
                </div>

                {/* Face Capture Section */}
                <div className="flex flex-col justify-center">
                    <div className="glass-panel p-1 rounded-[2rem] border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4 font-orbitron text-center text-blue-300">Biometric Registration</h3>
                            <div className="rounded-2xl overflow-hidden relative">
                                <FaceCapture onCapture={setImage} />
                                {!image && (
                                    <div className="absolute inset-0 pointer-events-none border-[2px] border-blue-500/30 rounded-2xl m-4">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg"></div>
                                    </div>
                                )}
                            </div>
                            <p className="text-center text-gray-500 text-sm mt-4">
                                {image ? 'Face Captured Successfully' : 'Position face within the frame and click Capture'}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
