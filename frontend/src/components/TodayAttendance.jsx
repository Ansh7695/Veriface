import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TodayAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTodayAttendance = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/attendance/today');
                setAttendance(res.data);
            } catch (error) {
                console.error("Error fetching today's attendance:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTodayAttendance();
        // Auto-refresh every 30 seconds to keep it updated
        const interval = setInterval(fetchTodayAttendance, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="text-center py-4 text-gray-500">Loading today's records...</div>;

    return (
        <div className="mt-8 w-full max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="text-indigo-600" />
                Today's Attendance
            </h2>

            {attendance.length === 0 ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                    No attendance marked yet today.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Method</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendance.map((record, index) => (
                                    <motion.tr
                                        key={record._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {record.userId?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="font-medium text-gray-700">
                                                    {record.userId?.name || 'Unknown User'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                            {record.time}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.status === 'ON_TIME' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle size={12} /> On Time
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                                    <XCircle size={12} /> Late
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 uppercase">
                                            {record.method}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodayAttendance;
