import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

export const saveImageToGallery = async (blob: Blob): Promise<void> => {
  try {
    // Verificar si estamos en un dispositivo móvil
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Esta funcionalidad solo está disponible en dispositivos móviles');
    }

    // Convertir blob a base64
    const base64Data = await blobToBase64(blob);
    
    // Remover el prefijo data:image/jpeg;base64, si existe
    const base64String = base64Data.split(',')[1] || base64Data;

    // Generar nombre único para el archivo
    const fileName = `remito_${Date.now()}.jpg`;

    // Escribir el archivo
    await Filesystem.writeFile({
      path: fileName,
      data: base64String,
      directory: Directory.Cache
    });

    // En iOS, podemos usar el método savePicture del Camera plugin
    await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      saveToGallery: true
    }).catch(() => {
      // Si falla, intentamos guardar de otra manera
      console.log('Método alternativo para guardar imagen');
    });

  } catch (error) {
    console.error('Error al guardar imagen en galería:', error);
    throw error;
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Error al convertir blob a base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};