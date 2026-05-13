import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DeviceRegistration = ({ onChange }) => {
    const token = localStorage.getItem('token');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo._id;

    const config = { headers: { Authorization: `Bearer ${token}` } };

    const [mac, setMac] = useState('');
    const [name, setName] = useState('');
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`http://localhost:5000/api/users/${userId}`, config);
            setDevices(data.devices || []);
        } catch (err) {
            console.error('Failed to fetch devices', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchDevices();
    }, [userId]);

    const addDevice = async (e) => {
        e.preventDefault();
        if (!mac) return setMessage('MAC required');
        try {
            setMessage('');
            await axios.post(`http://localhost:5000/api/users/${userId}/devices`, { mac, name }, config);
            setMac(''); setName('');
            fetchDevices();
            if (onChange) onChange();
            setMessage('Device added');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to add');
        }
    };

    const removeDevice = async (macToRemove) => {
        try {
            await axios.delete(`http://localhost:5000/api/users/${userId}/devices/${encodeURIComponent(macToRemove)}`, config);
            fetchDevices();
            if (onChange) onChange();
            setMessage('Device removed');
        } catch (err) {
            setMessage('Failed to remove device');
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow mb-8">
            <h3 className="text-xl font-semibold mb-4">Register Your Device (WiFi Auto-Mark)</h3>
            {message && <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded">{message}</div>}

            <form onSubmit={addDevice} className="flex flex-col md:flex-row md:items-end md:space-x-4">
                <div className="flex-1 mb-2">
                    <label className="block text-sm font-medium mb-1">MAC Address</label>
                    <input value={mac} onChange={e => setMac(e.target.value)} placeholder="00-11-22-33-44-55" className="w-full p-2 border rounded" />
                </div>
                <div className="flex-1 mb-2">
                    <label className="block text-sm font-medium mb-1">Device Name (optional)</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="My Phone" className="w-full p-2 border rounded" />
                </div>
                <div>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Add Device</button>
                </div>
            </form>

            <div className="mt-6">
                <h4 className="font-semibold mb-2">Registered Devices</h4>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <ul className="space-y-2">
                        {devices.length === 0 && <li className="text-sm text-gray-500">No devices registered.</li>}
                        {devices.map(d => (
                            <li key={d.mac} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                    <div className="font-medium">{d.name || 'Unnamed'}</div>
                                    <div className="text-sm text-gray-500">{d.mac}</div>
                                </div>
                                <button onClick={() => removeDevice(d.mac)} className="text-sm text-red-600 hover:underline">Remove</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default DeviceRegistration;
