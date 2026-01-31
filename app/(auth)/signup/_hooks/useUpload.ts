// import { useState } from "react";

// export const useUpload = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const onUpload = async (file: File, type: "student" | "professional") => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("type", type);

//       const response = await fetch("/api/upload", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         setError(data.error || "이미지 업로드 실패");
//         return null;
//       }

//       return data;
//     } catch (err: any) {
//       console.error("이미지 업로드 실패:", err);
//       setError(err.message || "이미지 업로드 실패");
//       return null;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return { onUpload, isLoading, error };
// };

import { useState } from "react";

export const useUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpload = async (file: File, type: "student" | "professional") => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "이미지 업로드 실패");
        return null;
      }

      return data;
    } catch (err: any) {
      console.error("이미지 업로드 실패:", err);
      setError(err.message || "이미지 업로드 실패");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { onUpload, isLoading, error };
};
