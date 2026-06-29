import { useState, useEffect } from "react";

export function useLogoBase64() {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    fetch("/logo-color.png")
      .then(r => r.blob())
      .then(b => {
        const reader = new FileReader();
        reader.onloadend = () => setLogo(reader.result as string);
        reader.readAsDataURL(b);
      })
      .catch(() => setLogo(null));
  }, []);
  return logo;
}
