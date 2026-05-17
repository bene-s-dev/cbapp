import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onCropAreaComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      canvas.width = 400; // Fixed size for avatars
      canvas.height = 400;

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        400,
        400
      );

      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      }, 'image/jpeg', 0.8);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="relative flex-1">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={onCropChange}
          onCropComplete={onCropAreaComplete}
          onZoomChange={setZoom}
          cropShape="round"
          showGrid={false}
        />
      </div>
      <div className="bg-black/80 backdrop-blur-md p-6 pb-12 flex items-center justify-between gap-4">
        <button 
          onClick={onCancel}
          className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" /> Abbrechen
        </button>
        <button 
          onClick={getCroppedImg}
          className="flex-1 bg-[var(--secondary)] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" /> Speichern
        </button>
      </div>
    </div>
  );
}
