let cachedLogo: string | null = null;

export async function loadLogo(): Promise<string> {
  if (cachedLogo) return cachedLogo;
  
  const response = await fetch("/logo.png");
  const blob = await response.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      cachedLogo = reader.result as string;
      resolve(cachedLogo);
    };
    reader.readAsDataURL(blob);
  });
}