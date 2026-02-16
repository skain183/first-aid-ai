
import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Settings, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorType, setErrorType] = useState<'PERMISSION' | 'NOT_FOUND' | 'OTHER' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setErrorType(null);
    setErrorMessage(null);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser does not support camera access");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorType('PERMISSION');
        setErrorMessage("Camera access was denied. Please enable camera permissions in your browser settings to use the injury scanner.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorType('NOT_FOUND');
        setErrorMessage("No camera found on this device.");
      } else {
        setErrorType('OTHER');
        setErrorMessage(err.message || "An unexpected error occurred while accessing the camera.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = dataUrl.split(',')[1];
        onCapture(base64Data);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
      {/* Header */}
      <div className="p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/70 to-transparent absolute top-0 w-full z-10">
        <button onClick={onCancel} className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-bold tracking-wide text-sm">Injury Scanner</span>
          <span className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Live Preview</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-900">
        {errorMessage ? (
          <div className="text-white text-center p-8 max-w-sm animate-fade-in">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Camera Issue</h3>
            <p className="mb-8 text-slate-400 text-sm leading-relaxed">{errorMessage}</p>
            
            <div className="space-y-3">
              <button 
                onClick={startCamera}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Try Again
              </button>
              
              {errorType === 'PERMISSION' && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-left">
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                    <Settings className="w-3 h-3" /> How to fix
                  </p>
                  <p className="text-xs text-slate-300">
                    Click the camera icon in your browser's address bar and select "Always allow", then refresh this page.
                  </p>
                </div>
              )}

              <button 
                onClick={onCancel}
                className="w-full py-3 text-slate-400 font-semibold hover:text-white transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            {/* Overlay Grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 border-b border-white/10"></div>
                <div className="flex-1 border-b border-white/10"></div>
                <div className="flex-1"></div>
              </div>
              <div className="absolute inset-0 flex">
                <div className="flex-1 border-r border-white/10"></div>
                <div className="flex-1 border-r border-white/10"></div>
                <div className="flex-1"></div>
              </div>
            </div>
            
            {/* Targeting Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
              </div>
            </div>

            <div className="absolute bottom-32 left-0 w-full text-center pointer-events-none">
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest drop-shadow-md">
                Center the injury area
              </p>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Footer Controls */}
      {!errorMessage && (
        <div className="p-8 pb-12 flex justify-center items-center bg-gradient-to-t from-black/90 to-transparent absolute bottom-0 w-full">
          <button 
            onClick={handleCapture}
            className="group relative"
          >
            <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-20 group-active:opacity-40 transition-opacity"></div>
            <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-sm active:scale-90 transition-all z-10 overflow-hidden">
               <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                 <Camera className="w-8 h-8 text-white" />
               </div>
            </div>
          </button>
        </div>
      )}
      
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
