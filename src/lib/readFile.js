// Lee un archivo con progreso real (bytes leídos/total), a diferencia de
// file.arrayBuffer() que no expone ningún evento de avance.
export function readFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo"));
    reader.readAsArrayBuffer(file);
  });
}
