import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#03030b]">
            <Navbar />

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse-glow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-md">
                        <span className="text-blue-400 text-xs font-mono tracking-[0.2em] font-bold">NEXT GEN ATTENDANCE</span>
                    </div>

                    <h1 className="text-6xl md:text-9xl font-black mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 font-orbitron animate-float">
                        DMA
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 mb-12 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
                        Secure. Seamless. <span className="text-blue-400 font-semibold neon-text">Futuristic.</span><br />
                        Experience the next evolution of workplace identity.
                    </p>

                    <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                        <button
                            onClick={() => navigate('/mark-attendance')}
                            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] transform hover:scale-105 active:scale-95"
                        >
                            <span className="mr-2">Initiate System</span>
                            <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </main>

            <footer className="w-full text-center py-6 text-gray-600 text-[10px] font-mono tracking-widest uppercase">
                Secure Access • Biometric Verification • Encrypted • v2.0
            </footer>
        </div>
    );
};

export default LandingPage;
