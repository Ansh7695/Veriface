import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FaceCapture from '../components/FaceCapture';
import DeviceRegistration from '../components/DeviceRegistration';

const EmployeeDashboard = () => {
    const [method, setMethod] = useState(null); // 'FACE' or 'OTP'
    const [message, setMessage] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [history, setHistory] = useState([]);

    const token = localStorage.getItem('token');
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/attendance/history', config);
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history', error);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleFaceCapture = async (imageSrc) => {
        if (!imageSrc) return;

        try {
            setMessage('Verifying Face...');

            // Convert Base64 to Blob
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const file = new File([blob], "face.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append('image', file);

            await axios.post('http://localhost:5000/api/attendance/mark-face', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage('Attendance Marked Successfully (Face)!');
            fetchHistory();
            setMethod(null);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Face Verification Failed');
        }
    };

    const sendOtp = async () => {
        try {
            await axios.post('http://localhost:5000/api/attendance/send-otp', {}, config);
            setOtpSent(true);
            setMessage('OTP sent to your registered email.');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to send OTP');
        }
    };

    const verifyOtp = async () => {
        try {
            await axios.post('http://localhost:5000/api/attendance/verify-otp', { otp }, config);
            setMessage('Attendance Marked Successfully (OTP)!');
            fetchHistory();
            setMethod(null);
            setOtpSent(false);
            setOtp('');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Invalid OTP');
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Employee Dashboard</h1>

            <DeviceRegistration onChange={fetchHistory} />

            {message && (
                <div className={`p-4 mb-4 rounded ${message.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {message}
                </div>
            )}

            {!method ? (
                <div className="flex space-x-4 mb-8">
                    <button
                        onClick={() => setMethod('FACE')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow"
                    >
                        Mark with Face
                    </button>
                    <button
                        onClick={() => setMethod('OTP')}
                        className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 shadow"
                    >
                        Mark with OTP
                    </button>
                </div>
            ) : (
                <div className="mb-8 p-6 bg-white rounded shadow">
                    <button onClick={() => { setMethod(null); setMessage(''); }} className="text-sm text-gray-500 mb-4 underline">Cancel</button>

                    {method === 'FACE' && (
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Face Recognition</h3>
                            <FaceCapture onCapture={handleFaceCapture} />
                        </div>
                    )}

                    {method === 'OTP' && (
                        <div>
                            <h3 className="text-xl font-semibold mb-4">OTP Verification</h3>
                            {!otpSent ? (
                                <button
                                    onClick={sendOtp}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Send OTP
                                </button>
                            ) : (
                                <div className="flex flex-col max-w-xs">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter OTP"
                                        className="p-2 border rounded mb-2"
                                    />
                                    <button
                                        onClick={verifyOtp}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        Submit OTP
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Attendance History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-3 border">Date</th>
                                <th className="p-3 border">Time</th>
                                <th className="p-3 border">Method</th>
                                <th className="p-3 border">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((record) => (
                                <tr key={record._id} className="text-center">
                                    <td className="p-3 border">{record.date}</td>
                                    <td className="p-3 border">{record.time}</td>
                                    <td className="p-3 border">{record.method}</td>
                                    <td className={`p-3 border ${record.status === 'LATE' ? 'text-red-500' : 'text-green-500'}`}>
                                        {record.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
