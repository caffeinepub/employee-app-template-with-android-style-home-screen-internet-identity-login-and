import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

export default function Pottle() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/assets/generated/employee-wallpaper.dim_1920x1080.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => navigate({ to: '/' })}
              className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <img 
                src="/assets/generated/icon-pottle.dim_512x512.png" 
                alt="Pottle"
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-2xl font-bold text-slate-900">Pottle</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Welcome to Pottle</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              This is a placeholder module for Pottle. Here you can add content, features, and functionality specific to this module.
            </p>
            <p className="text-slate-600 text-sm">
              Module content will be implemented based on your specific requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
