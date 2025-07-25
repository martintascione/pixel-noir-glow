import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';

export const saveImageToGallery = async (blob: Blob): Promise<void> => {
  try {
    // Verificar si estamos en un dispositivo móvil
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Esta funcionalidad solo está disponible en dispositivos móviles');
    }

    // Convertir blob a base64
    const base64Data = await blobToBase64(blob);
    
    // Remover el prefijo data:image/jpeg;base64, si existe
    const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    // Generar nombre único para el archivo
    const fileName = `remito_${Date.now()}.jpg`;

    // Usar el plugin @capacitor-community/media para guardar en galería
    await Media.savePhoto({
      path: base64String,
      albumIdentifier: 'Remitos', // Crear un álbum específico (opcional)
      fileName: fileName
    });

    console.log('Imagen guardada exitosamente en la galería de Fotos');

  } catch (error) {
    console.error('Error al guardar imagen en galería:', error);
    
    // Fallback: guardar como archivo temporal y mostrar mensaje
    try {
      const base64Data = await blobToBase64(blob);
      const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const fileName = `remito_${Date.now()}.jpg`;
      
      await Filesystem.writeFile({
        path: fileName,
        data: base64String,
        directory: Directory.Documents
      });
      
      throw new Error('Se guardó como archivo. Para acceder a Fotos, ve a Configuración > Privacidad > Fotos y permite el acceso a la app.');
    } catch (fallbackError) {
      throw new Error('No se pudo guardar la imagen. Verifica los permisos de la app.');
    }
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