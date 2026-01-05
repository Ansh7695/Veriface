import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, LogOut, UserPlus, FileText, CheckCircle, XCircle, Search, Menu, LayoutDashboard, Settings, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FaceCapture from '../components/FaceCapture';
import ManageUsers from './ManageUsers';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' });
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        if (!token) navigate('/login');
        if (activeTab === 'list') fetchAttendance();
    }, [activeTab, token]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('http://localhost:5000/api/attendance/all', config);
            setAttendance(data);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('password', formData.password);
            data.append('role', formData.role);

            if (formData.image) {
                const res = await fetch(formData.image);
                const blob = await res.blob();
                data.append('image', blob, 'face.jpg');
            }

            await axios.post('http://localhost:5000/api/auth/register-employee', data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage('Employee Registered Successfully');
            setFormData({ name: '', email: '', password: '', role: 'employee' });
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Registration Failed');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const filteredAttendance = Array.isArray(attendance) ? attendance.filter(record =>
        (record.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.status || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="min-h-screen bg-[#020205] text-white font-sans flex overflow-hidden selection:bg-blue-500/30">
            {/* Sidebar */}
            <aside className="w-80 bg-[#0b0f1a] border-r border-white/5 flex flex-col relative z-20">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <LayoutDashboard className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-orbitron tracking-wide">DMA ACCESS</h1>
                            <p className="text-[10px] text-gray-500 font-mono tracking-[0.2em] uppercase">Control Center</p>
                        </div>
                    </div>
                </div>

                <div className="px-4 space-y-2 flex-1">
                    <SidebarButton
                        icon={<Calendar size={20} />}
                        label="Attendance Logs"
                        active={activeTab === 'list'}
                        onClick={() => setActiveTab('list')}
                    />
                    <SidebarButton
                        icon={<UserPlus size={20} />}
                        label="Register Employee"
                        active={activeTab === 'register'}
                        onClick={() => setActiveTab('register')}
                    />
                    <SidebarButton
                        icon={<Settings size={20} />}
                        label="Manage Users"
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                    />
                </div>

                <div className="p-4 border-t border-white/5">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                    <div className="mt-4 px-4 text-xs text-center text-gray-700 font-mono">
                        v4.0.0 • DMA SYSTEMS
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Background Glow */}
                <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="p-10 max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-3xl font-bold font-orbitron mb-2">
                                {activeTab === 'list' && 'Attendance Overview'}
                                {activeTab === 'register' && 'New Registration'}
                                {activeTab === 'users' && 'Manage Users'}
                            </h2>
                            <p className="text-gray-400">Welcome back, Administrator.</p>
                        </div>
                        {activeTab === 'list' && (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-[#151a25] border border-white/10 rounded-full px-5 pl-12 py-3 text-sm min-w-[300px] focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400"
                            >
                                <CheckCircle size={20} /> {message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {activeTab === 'list' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <div className="bg-[#0b0f1a]/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl min-h-[400px]">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full py-20">
                                        <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                                        <p className="text-gray-400">Loading attendance data...</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-[#151a25]/80 border-b border-white/5 text-gray-400 font-mono text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="p-6 font-semibold">Employee Profile</th>
                                                <th className="p-6 font-semibold">Date</th>
                                                <th className="p-6 font-semibold">Time In</th>
                                                <th className="p-6 font-semibold">Method</th>
                                                <th className="p-6 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredAttendance.map((record, index) => (
                                                <motion.tr
                                                    key={record._id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-gray-400 text-sm">
                                                                {record.userId?.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white">{record.userId?.name || 'Unknown User'}</div>
                                                                <div className="text-xs text-gray-500 font-mono">ID: {record.userId?._id?.slice(-6) || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-gray-400 font-mono text-sm">{record.date}</td>
                                                    <td className="p-6 font-mono text-blue-300 font-bold">{record.time}</td>
                                                    <td className="p-6">
                                                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${record.method === 'FACE' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                                                            {record.method === 'FACE' ? <Users size={12} /> : <Lock size={12} />}
                                                            {record.method}
                                                        </span>
                                                    </td>
                                                    <td className="p-6">
                                                        {record.status === 'ON TIME' ? (
                                                            <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-bold"><CheckCircle size={12} /> ON TIME</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full text-xs font-bold"><XCircle size={12} /> {record.status}</span>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            ))}

                                            {filteredAttendance.length === 0 && (
                                                <tr>
                                                    <td colspan="5" className="p-12 text-center text-gray-600">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-600">
                                                                <Search size={24} />
                                                            </div>
                                                            <p>No records found matching your criteria.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'register' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >
                            <div className="lg:col-span-2">
                                <div className="bg-[#0b0f1a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
                                    <div className="mb-8 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500">
                                            <UserPlus size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Employee Details</h3>
                                            <p className="text-gray-500 text-sm">Enter personal information and credentials setup.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleRegister} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <InputGroup label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                                            <InputGroup label="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@dma.com" type="email" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <InputGroup label="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" type="password" />
                                            <div>
                                                <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2 ml-1">Access Role</label>
                                                <div className="relative">
                                                    <select
                                                        value={formData.role}
                                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                        className="w-full bg-[#151a25] border border-white/10 rounded-xl px-5 py-3.5 text-white appearance-none focus:border-blue-500 focus:outline-none transition-colors"
                                                    >
                                                        <option value="intern">Intern</option>
                                                        <option value="employee">Employee</option>
                                                        <option value="admin">Administrator</option>
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                        <Menu size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5">
                                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all active:scale-[0.98]">
                                                CREATE ACCOUNT
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <div className="lg:col-span-1">
                                <div className="bg-[#0b0f1a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-1 overflow-hidden h-full flex flex-col">
                                    <div className="p-6 bg-white/5 border-b border-white/5">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <Users size={18} className="text-purple-400" /> Biometric Data
                                        </h3>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col items-center justify-center relative">
                                        <div className="w-full aspect-[4/5] bg-black/40 rounded-2xl border-2 border-dashed border-white/10 overflow-hidden relative group">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <FaceCapture onCapture={(img) => setFormData(prev => ({ ...prev, image: img }))} />
                                            </div>
                                        </div>
                                        <p className="text-xs text-center text-gray-500 mt-6 max-w-[200px] leading-relaxed">
                                            Position employee face within the frame. Ensure even lighting for best recognition accuracy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <ManageUsers />
                    )}
                </div>
            </main >
        </div >
    );
};

const SidebarButton = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all duration-300 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
    >
        <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
        <span className="font-medium tracking-wide text-sm">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]"></div>}
    </button>
);

const InputGroup = ({ label, value, onChange, placeholder, type = "text" }) => (
    <div>
        <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            className="w-full bg-[#151a25] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:bg-[#1a202e] transition-all"
            placeholder={placeholder}
            required
        />
    </div>
);

export default AdminDashboard;
