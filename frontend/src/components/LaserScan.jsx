import React from 'react';
import { motion } from 'framer-motion';

const LaserScan = () => {
    return (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
            {/* Moving Laser Line */}
            <motion.div
                className="w-full h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)]"
                animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ position: 'absolute' }}
            />

            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 text-[10px] font-mono text-blue-400 tracking-widest opacity-80">
                SCANNING_BIOMETRICS...
            </div>
            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-green-400 tracking-widest opacity-80">
                SYSTEM_ACTIVE
            </div>

            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/50 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/50 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500/50 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500/50 rounded-br-lg"></div>
        </div>
    );
};

export default LaserScan;
