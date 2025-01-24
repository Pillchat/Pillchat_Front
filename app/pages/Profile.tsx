'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as S from "../styles/Profile";
import HeaderNon from "../components/Header_Non";
import axios from "axios";

function Profile() {
    const [profileImage, setProfileImage] = useState(""); // 프로필 이미지 URL 상태
    const [previewImage, setPreviewImage] = useState<string | null>(""); // 미리보기 이미지 상태
    const [username, setUsername] = useState(""); // 닉네임 상태
    const [school, setSchool] = useState(""); // 학교 상태
    const [grade, setGrade] = useState(""); // 학년 상태

    // API에서 프로필 데이터 가져오기
    const fetchProfileData = async () => {
        const token = localStorage.getItem("access_token");

        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/profile/me`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        "ngrok-skip-browser-warning": "69420",
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );
            const { username, school, grade, profileImage } = response.data;
    
            // 상태 업데이트
            setUsername(username);
            setSchool(school);
            setGrade(grade);
            setProfileImage(profileImage || "default-profile.png"); // 프로필 이미지가 없으면 기본 이미지 설정
    
            console.log(response.data);
        } catch (error) {
            console.error("프로필 데이터를 가져오는 중 오류 발생:", error);
        }
    };
    

    // 이미지 업로드 핸들러
    const handleImageChange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        // 미리보기 이미지 설정
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);

        const formData = new FormData();
        formData.append("profileImage", file);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/profile/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setProfileImage(response.data.imageUrl); // 새로운 프로필 이미지 설정
            setPreviewImage(null); // 미리보기 초기화
        } catch (error) {
            console.error("이미지 업로드 중 오류 발생:", error);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    return (
        <S.Container>
            <HeaderNon />

            <S.MYpage>마이페이지</S.MYpage>
            <S.Alarm src="Bell.svg" />

            <S.ProfileWrapper>
                <label htmlFor="profile-upload">
                    <S.ProfileImg
                        src={previewImage || profileImage || "default-profile.png"}
                    />
                </label>
                <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                />
            </S.ProfileWrapper>

            <S.ID>{username}</S.ID>
            <S.SN>
                {`${school}/${grade}학년`}
            </S.SN>


            <S.ForthBox>
                <S.ContentBox>
                    <S.ContentTitle>주문내역</S.ContentTitle>
                    <S.ContentNumber>0</S.ContentNumber>
                </S.ContentBox>

                <S.ContentBox>
                    <S.ContentTitle>내 팜머니</S.ContentTitle>
                    <S.ContentNumber>0</S.ContentNumber>
                </S.ContentBox>

                <S.ContentBox>
                    <S.ContentTitle>질문 티켓</S.ContentTitle>
                    <S.ContentNumber>0</S.ContentNumber>
                </S.ContentBox>

                <S.ContentBox>
                    <S.ContentTitle>문의</S.ContentTitle>
                    <S.ContentNumber>0</S.ContentNumber>
                </S.ContentBox>

                <S.LineW />
                <S.LineH />
            </S.ForthBox>

            <S.MenuDiv>
                <S.DivTitle>팜머니 관리</S.DivTitle>
                <S.MenuContent>
                    <S.MenuSVG src="Coffee.svg" />
                    <S.MenuLine>
                        <S.MenuTitle>팜머니 상점</S.MenuTitle>
                        <S.MenuDes>정성스레 모은 팜머니로 flex!</S.MenuDes>
                    </S.MenuLine>
                </S.MenuContent>
                <S.MenuContent>
                    <S.MenuSVG src="Card.svg" />
                    <S.MenuLine>
                        <S.MenuTitle>팜머니 및 질문권 구입</S.MenuTitle>
                        <S.MenuDes>Yakchat을 100% 활용하기 위한 필수템을 구입해보세요</S.MenuDes>
                    </S.MenuLine>
                </S.MenuContent>
            </S.MenuDiv>

            <S.MenuDiv>
                <S.DivTitle>정보</S.DivTitle>
                <S.MenuContent>
                    <S.MenuSVG src="folder.svg" />
                    <S.MenuLine>
                        <S.MenuTitle>내 자료 관리</S.MenuTitle>
                        <S.MenuDes>Yakchat에서 학습자료를 구입/판매해보세요</S.MenuDes>
                    </S.MenuLine>
                </S.MenuContent>
                <S.MenuContent>
                    <S.MenuSVG src="Gift.svg" />
                    <S.MenuLine>
                        <S.MenuTitle>맞춤 정보</S.MenuTitle>
                        <S.MenuDes>더 유용한 정보를 얻고 싶다면?</S.MenuDes>
                    </S.MenuLine>
                </S.MenuContent>
            </S.MenuDiv>

            <S.MenuDiv>
                <S.DivTitle>도움말</S.DivTitle>
                <S.MenuContent>
                    <S.MenuSVG src="Bell.svg" />
                    <S.MenuLine>
                        <S.MenuTitle>고객센터</S.MenuTitle>
                    </S.MenuLine>
                </S.MenuContent>
                <S.MenuContent>
                    <S.MenuSVG src="Bell.svg" />
                    <S.MenuLine>
                        <S.MenuTitle>공지사항</S.MenuTitle>
                    </S.MenuLine>
                </S.MenuContent>
                <S.MenuContent>
                    <S.MenuSVG src="Bell.svg" />
                    <S.MenuLine>
                        <S.MenuTitle>개인정보처리방침</S.MenuTitle>
                    </S.MenuLine>
                </S.MenuContent>
                <S.MenuContent>
                    <S.MenuSVG src="Bell.svg" />
                    <S.MenuLine>
                        <S.MenuTitle>서비스 이용 약관</S.MenuTitle>
                    </S.MenuLine>
                </S.MenuContent>
                <S.MenuContent>
                    <S.MenuSVG src="Bell.svg" />
                    <S.MenuLine>
                        <S.MenuTitle>오픈소스라이센스</S.MenuTitle>
                    </S.MenuLine>
                </S.MenuContent>
                <S.MenuContent>
                    <S.MenuSVG src="Bell.svg" />
                    <S.MenuLine>
                        <S.MenuTitle>버전정보</S.MenuTitle>
                    </S.MenuLine>
                </S.MenuContent>
            </S.MenuDiv>
        </S.Container>
    );
}

export default Profile;
