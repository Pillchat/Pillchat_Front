import React from "react";
import * as S from "../styles/AS";
import HeaderNon from "../components/Header_Non";
import { useRouter } from "next/navigation";

function AS() {
  const router = useRouter();

  return (
    <S.Container>
      <HeaderNon />

      <S.Pharse>
        <S.Success>답변 등록이 완료되었습니다!</S.Success>
        <S.Check src="check_orange.svg" />
      </S.Pharse>

      <S.Btn onClick={() => router.push("/Q")}>다른 질문 답변해주기</S.Btn>
    </S.Container>
  );
}

export default AS;
