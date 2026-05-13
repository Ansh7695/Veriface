import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FaceCapture from '../components/FaceCapture';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('list'); // 'list', 'register'
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [todaysWifi, setTodaysWifi] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' });
    const [faceImage, setFaceImage] = useState(null);
    const [message, setMessage] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchEmployees = async () => {
        // Mock or implement GET /api/users
        // For now, let's fetch attendance history as "Reports"
    };

    const fetchAttendance = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/attendance/all', config);
            setAttendance(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTodaysWifi = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/attendance/today', config);
            const wifiOnly = (data || []).filter(rec => rec.method === 'WIFI');
            setTodaysWifi(wifiOnly);
        } catch (error) {
            console.error('Failed to fetch today\'s attendance', error);
        }
    };

    const exportCsv = (rows, filename) => {
        if (!rows || rows.length === 0) return;
        const headers = ['Employee', 'Date', 'Time', 'Device', 'IP', 'Status'];
        const csvRows = [headers.join(',')];
        rows.forEach(r => {
            const name = r.userId?.name || '';
            const date = r.date || '';
            const time = r.time || '';
            const device = r.deviceInfo || '';
            const ip = r.ipAddress || '';
            const status = r.status || '';
            const row = [name, date, time, device, ip, status].map(field => `"${('' + field).replace(/"/g, '""')}"`).join(',');
            csvRows.push(row);
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'attendance.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (activeTab === 'list') {
            fetchAttendance();
            fetchTodaysWifi();
        }
    }, [activeTab]);

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('password', formData.password);
            data.append('role', formData.role);
            if (faceImage) {
                // Convert Base64 to Blob
                const res = await fetch(faceImage);
                const blob = await res.blob();
                data.append('image', blob, 'face.jpg');
            }

            await axios.post('http://localhost:5000/api/auth/register-employee', data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage('Employee Registered Successfully!');
            setFormData({ name: '', email: '', password: '', role: 'employee' });
            setFaceImage(null);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Registration Failed');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-4 py-2 rounded ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Attendance Reports
                </button>
                <button
                    onClick={() => setActiveTab('register')}
                    className={`px-4 py-2 rounded ${activeTab === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Register Employee
                </button>
            </div>

            {message && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">{message}</div>}

            {activeTab === 'register' && (
                <div className="bg-white p-6 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4">Employee Details</h2>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold">Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold">Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold">Password</label>
                                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold">Role</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-2 border rounded">
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Register Employee</button>
                        </form>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-4">Face Registration (Optional)</h2>
                        <FaceCapture onCapture={setFaceImage} />
                    </div>
                </div>
            )}

            {activeTab === 'list' && (
                <div className="bg-white p-6 rounded shadow overflow-x-auto">
                    <h2 className="text-xl font-bold mb-4">Daily Attendance Report</h2>
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Employee</th>
                                <th className="p-2">Date</th>
                                <th className="p-2">Time</th>
                                <th className="p-2">Method</th>
                                <th className="p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map(record => (
                                <tr key={record._id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-medium">{record.userId?.name || 'Unknown'}</td>
                                    <td className="p-2">{record.date}</td>
                                    <td className="p-2">{record.time}</td>
                                    <td className="p-2">{record.method}</td>
                                    <td className={`p-2 ${record.status === 'LATE' ? 'text-red-500' : 'text-green-500'}`}>{record.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'list' && (
                <div className="bg-white p-6 rounded shadow overflow-x-auto mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Today's WiFi Attendance</h2>
                        <div className="space-x-2">
                            <button onClick={fetchTodaysWifi} className="px-3 py-1 bg-blue-500 text-white rounded">Refresh</button>
                            <button onClick={() => exportCsv(todaysWifi, `wifi-attendance-${new Date().toISOString().slice(0,10)}.csv`)} className="px-3 py-1 bg-green-600 text-white rounded">Export CSV</button>
                        </div>
                    </div>
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Employee</th>
                                <th className="p-2">Time</th>
                                <th className="p-2">Device (MAC)</th>
                                <th className="p-2">IP</th>
                                <th className="p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todaysWifi.map(record => (
                                <tr key={record._id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-medium">{record.userId?.name || 'Unknown'}</td>
                                    <td className="p-2">{record.time}</td>
                                    <td className="p-2">{record.deviceInfo || '-'}</td>
                                    <td className="p-2">{record.ipAddress || '-'}</td>
                                    <td className={`p-2 ${record.status === 'LATE' ? 'text-red-500' : 'text-green-500'}`}>{record.status}</td>
                                </tr>
                            ))}
                            {todaysWifi.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-sm text-gray-500">No WiFi attendance recorded today.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
