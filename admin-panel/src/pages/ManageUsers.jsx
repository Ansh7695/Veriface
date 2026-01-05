import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash, Loader2 } from 'lucide-react';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/users', config);
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser({ ...user });
    };

    const handleSave = async () => {
        try {
            await axios.put(`http://localhost:5000/api/users/${editingUser._id}`, editingUser, config);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            alert('Failed to update user');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/users/${id}`, config);
            fetchUsers();
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    return (
        <div className="p-8">
            <h2 className="text-3xl font-orbitron font-bold text-white mb-8">Manage Users</h2>

            {loading ? <Loader2 className="animate-spin text-blue-500" /> : (
                <div className="glass-panel rounded-3xl overflow-hidden p-6">
                    <table className="w-full text-left text-gray-400">
                        <thead className="uppercase text-xs tracking-wider border-b border-white/10">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map(user => (
                                <tr key={user._id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-white">
                                        {editingUser?._id === user._id ? (
                                            <input
                                                className="bg-black/40 border border-blue-500/50 rounded px-2 py-1 text-white"
                                                value={editingUser.name}
                                                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                            />
                                        ) : user.name}
                                    </td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4">
                                        {editingUser?._id === user._id ? (
                                            <select
                                                className="bg-black/40 border border-blue-500/50 rounded px-2 py-1 text-white"
                                                value={editingUser.role}
                                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="admin">Admin</option>
                                                <option value="intern">Intern</option>
                                            </select>
                                        ) : (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                    user.role === 'intern' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 flex gap-3">
                                        {editingUser?._id === user._id ? (
                                            <button onClick={handleSave} className="text-green-400 font-bold hover:underline">SAVE</button>
                                        ) : (
                                            <button onClick={() => handleEdit(user)} className="text-blue-400 hover:text-blue-300">
                                                <Pencil size={18} />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(user._id)} className="text-red-400 hover:text-red-300">
                                            <Trash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
