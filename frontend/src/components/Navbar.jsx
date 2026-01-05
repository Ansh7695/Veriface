import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 w-full z-50 flex justify-center py-6 pointer-events-none"
        >
            <div className="glass-panel pointer-events-auto px-8 py-3 rounded-full flex items-center gap-8 border border-blue-500/20 bg-[#0a0a12]/80 backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <div
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 cursor-pointer group"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-lg blur opacity-40 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
                            <Building2 size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold font-orbitron tracking-wider text-white group-hover:text-blue-400 transition-colors">
                            DMA
                        </h1>
                        <p className="text-[9px] text-gray-400 font-mono tracking-[0.2em] uppercase">Global Systems</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4 border-l border-white/10 pl-6">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-mono text-green-400 tracking-wider">ONLINE</span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 tracking-wider">
                        v2.4.0
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
