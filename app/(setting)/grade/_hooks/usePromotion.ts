import { useState, useCallback } from "react";
import { fetchAPI } from "@/lib/functions";

interface PromotionData {
  currentGrade: string;
  nextGrade: string;
  progress: number;
  target: number;
  rate: number;
}

export const usePromotion = () => {
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotion = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAPI('/api/profile/promotion', 'GET');

      if (result.success) {
        const data = result.data ?? {};
        
        setPromotionData({
          currentGrade: data.currentGrade || '',
          nextGrade: data.nextGrade || '',
          progress: data.progress || 0,
          target: data.target || 100,
          rate: data.rate || 0
        });
        
        return data;
      } else {
        throw new Error(result.message || '승급 정보 조회에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('승급 정보 조회 실패:', err);
      const errorMessage = err?.message || '승급 정보 조회에 실패했습니다. 다시 시도해주세요.';
      setError(errorMessage);
      
      // 인증 에러인 경우 처리
      if (err?.message?.includes('로그인') || err?.message?.includes('인증') || err?.message?.includes('401')) {
        console.log('인증 에러 감지 - 로그인 필요');
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { 
    fetchPromotion,
    promotionData,
    isLoading, 
    error
  };
};