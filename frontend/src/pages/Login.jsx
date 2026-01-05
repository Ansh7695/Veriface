import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // In real app, use env var for API URL
            const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('userInfo', JSON.stringify(data));

            if (data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/employee');
            }
        } catch (error) {
            alert('Invalid credentials');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-4 text-2xl font-bold text-center">Login</h2>
                <div className="mb-4">
                    <label className="block mb-2 text-sm font-bold">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block mb-2 text-sm font-bold">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <button type="submit" className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600">
                    Sign In
                </button>
            </form>
        </div>
    );
};

export default Login;
