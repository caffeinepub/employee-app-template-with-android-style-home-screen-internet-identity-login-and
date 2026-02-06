import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useGetCustomModule } from '../../hooks/useQueries';
import { useState, useEffect } from 'react';
import { createImageUrl, revokeImageUrl } from '../../utils/customModuleImage';

export default function CustomModulePlaceholder() {
  const navigate = useNavigate();
  const { moduleId } = useParams({ from: '/modules/$moduleId' });
  const { data: module, isLoading } = useGetCustomModule(moduleId);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (module?.image) {
      const url = createImageUrl(module.image);
      setImageUrl(url);
      return () => {
        revokeImageUrl(url);
      };
    }
  }, [module?.image]);

  // Module not found
  if (!isLoading && !module) {
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
        
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Module Not Found</h1>
            <p className="text-slate-600 mb-6">
              The module you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate({ to: '/' })}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
              </div>
            ) : module ? (
              <div className="flex items-center gap-3">
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt={module.title}
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                )}
                <h1 className="text-2xl font-bold text-slate-900">{module.title}</h1>
              </div>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
          {isLoading ? (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl">
              <div className="space-y-4">
                <div className="h-6 bg-slate-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
                <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
              </div>
            </div>
          ) : module ? (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Welcome to {module.title}</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                This is a placeholder module for {module.title}. Here you can add content, features, and functionality specific to this module.
              </p>
              <p className="text-slate-600 text-sm">
                Module content will be implemented based on your specific requirements.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
