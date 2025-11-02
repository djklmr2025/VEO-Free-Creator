
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the prefix 'data:image/jpeg;base64,'
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
