// 'use client';

// import React, { useEffect, useState } from "react";
// import * as S from "../styles/Profile";
// import HeaderNon from "../components/Header_Non";
// import Footer from "../components/Footer";
// import axios from "axios";

// function Profile() {
//     const [profileImage, setProfileImage] = useState<string>(""); // 실제 프로필 이미지 URL 상태
//     const [previewImage, setPreviewImage] = useState<string | null>(null); // 미리보기 이미지 상태
//     const [username, setUsername] = useState(""); // 닉네임 상태
//     const [school, setSchool] = useState(""); // 학교 상태
//     const [grade, setGrade] = useState(""); // 학년 상태

//     const handleImageChange = async (e: any) => {
//         const token = localStorage.getItem("access_token");
//         const file = e.target.files[0];
//         if (!file) return;

//         // 미리보기 이미지 설정
//         const previewUrl = URL.createObjectURL(file);
//         setPreviewImage(previewUrl);

//         // 이미지 파일을 Base64로 변환
//         const reader = new FileReader();
//         reader.onloadend = async () => {
//             const base64Image = reader.result as string;

//             // 업로드 요청 보내기
//             const formData = new FormData();
//             formData.append("images", base64Image);

//             try {
//                 const response = await axios.put(
//                     `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/profile/update`,
//                     formData,
//                     {
//                         headers: {
//                             Authorization: `Bearer ${token}`,
//                             "Content-Type": "multipart/form-data",
//                             "ngrok-skip-browser-warning": "69420",
//                         },
//                         withCredentials: true,
//                     }
//                 );

//                 // 서버에서 업로드된 이미지 URL을 받아와서 프로필 이미지 설정
//                 const newImageUrl = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/images/${response.data.images[0].url}`;
//                 setProfileImage(newImageUrl); // 프로필 이미지를 업데이트
//                 setPreviewImage(null); // 미리보기 이미지 초기화
//             } catch (error) {
//                 console.error("이미지 업로드 중 오류 발생:", error);
//             }
//         };

//         reader.readAsDataURL(file); // 파일을 Base64 형식으로 읽음
//     };

//     // 프로필 데이터 가져오기
//     useEffect(() => {
//         fetchProfileData();
//         const interval = setInterval(() => {
//             fetchProfileData(); // 1분마다 프로필 이미지 업데이트
//         }, 60000);

//         return () => clearInterval(interval); // 컴포넌트가 언마운트 될 때 interval 해제
//     }, []);

//     // API에서 프로필 데이터 가져오기
//     const fetchProfileData = async () => {
//         const token = localStorage.getItem("access_token");
    
//         try {
//             const response = await axios.get(
//                 `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/profile/me`,
//                 {
//                     headers: {
//                         'Content-Type': 'application/json',
//                         "ngrok-skip-browser-warning": "69420",
//                         Authorization: `Bearer ${token}`,
//                     },
//                     withCredentials: true,
//                 }
//             );

//             const { username, school, grade, profileImage, images } = response.data;
    
//             setUsername(username);
//             setSchool(school);
//             setGrade(grade);
            
//             if (images && images[0]?.url) {
//                 setProfileImage(`${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/images/${images[0].url}`);
//             } else {
//                 setProfileImage(profileImage || "default-profile.png");
//             }
//         } catch (error) {
//             console.error("프로필 데이터를 가져오는 중 오류 발생:", error);
//         }
//     };    

//     return (
//         <>
//         <S.Container>
//             <HeaderNon />

//             <S.MYpage>마이페이지</S.MYpage>
//             <S.Alarm src="Bell.svg" />

//             <S.ProfileWrapper>
//                 <label htmlFor="profile-upload">
//                     <S.ProfileImg
//                         src={previewImage || profileImage || "default-profile.png"} // 미리보기 또는 프로필 이미지
//                     />
//                 </label>
//                 <input
//                     id="profile-upload"
//                     type="file"
//                     accept="image/*"
//                     onChange={handleImageChange}
//                     style={{ display: "none" }}
//                 />
//             </S.ProfileWrapper>
            
//             <S.Wrapper>
//                 <S.ID>{username}</S.ID>
//                 <S.SN>
//                     {`${school}/${grade}학년`}
//                 </S.SN>
//             </S.Wrapper>

//             <S.ForthBox>
//                 <S.ContentBox>
//                     <S.ContentTitle>주문내역</S.ContentTitle>
//                     <S.ContentNumber>0</S.ContentNumber>
//                 </S.ContentBox>

//                 <S.ContentBox>
//                     <S.ContentTitle>내 팜머니</S.ContentTitle>
//                     <S.ContentNumber>0</S.ContentNumber>
//                 </S.ContentBox>

//                 <S.ContentBox>
//                     <S.ContentTitle>질문 티켓</S.ContentTitle>
//                     <S.ContentNumber>0</S.ContentNumber>
//                 </S.ContentBox>

//                 <S.ContentBox>
//                     <S.ContentTitle>문의</S.ContentTitle>
//                     <S.ContentNumber>0</S.ContentNumber>
//                 </S.ContentBox>

//                 <S.LineW />
//                 <S.LineH />
//             </S.ForthBox>

//             <S.MenuDiv>
//                 <S.DivTitle>팜머니 관리</S.DivTitle>
//                 <S.MenuContent>
//                     <S.MenuSVG src="Coffee.svg" />
//                     <S.MenuLine>
//                         <S.MenuTitle>팜머니 상점</S.MenuTitle>
//                         <S.MenuDes>정성스레 모은 팜머니로 flex!</S.MenuDes>
//                     </S.MenuLine>
//                 </S.MenuContent>
//                 <S.MenuContent>
//                     <S.MenuSVG src="Card.svg" />
//                     <S.MenuLine>
//                         <S.MenuTitle>팜머니 및 질문권 구입</S.MenuTitle>
//                         <S.MenuDes>Yakchat을 100% 활용하기 위한 필수템을 구입해보세요</S.MenuDes>
//                     </S.MenuLine>
//                 </S.MenuContent>
//             </S.MenuDiv>

//             <S.MenuDiv>
//                 <S.DivTitle>정보</S.DivTitle>
//                 <S.MenuContent>
//                     <S.MenuSVG src="folder.svg" />
//                     <S.MenuLine>
//                         <S.MenuTitle>내 자료 관리</S.MenuTitle>
//                         <S.MenuDes>Yakchat에서 학습자료를 구입/판매해보세요</S.MenuDes>
//                     </S.MenuLine>
//                 </S.MenuContent>
//                 <S.MenuContent>
//                     <S.MenuSVG src="Gift.svg" />
//                     <S.MenuLine>
//                         <S.MenuTitle>맞춤 정보</S.MenuTitle>
//                         <S.MenuDes>더 유용한 정보를 얻고 싶다면?</S.MenuDes>
//                     </S.MenuLine>
//                 </S.MenuContent>
//             </S.MenuDiv>

//             <S.MenuDiv>
//                 <S.DivTitle>도움말</S.DivTitle>
//                 <S.MenuContent>
//                     <S.MenuSVG src="Bell.svg" />
//                     <S.MenuLine>
//                         <S.MenuTitle>고객센터</S.MenuTitle>
//                     </S.MenuLine>
//                 </S.MenuContent>
//                 <S.MenuContent>
//                     <S.MenuSVG src="Bell.svg" />
//                     <S.MenuLine>
//                         <S.MenuTitle>공지사항</S.MenuTitle>
//                     </S.MenuLine>
//                 </S.MenuContent>
//                 <S.MenuContent>
//                     <S.MenuSVG src="Bell.svg" />
//                     <S.MenuLine>
//                         <S.MenuTitle>개인정보처리방침</S.MenuTitle>
//                     </S.MenuLine>
//                 </S.MenuContent>
//                 <S.MenuContent>
//                     <S.MenuSVG src="Bell.svg" />
//                     <S.MenuLine>
//                         <S.MenuTitle>서비스 이용 약관</S.MenuTitle>
//                     </S.MenuLine>
//                 </S.MenuContent>
//                 <S.MenuContent>
//                     <S.MenuSVG src="Bell.svg" />
//                     <S.MenuLine>
//                         <S.MenuTitle>오픈소스라이센스</S.MenuTitle>
//                     </S.MenuLine>
//                 </S.MenuContent>
//                 <S.MenuContent>
//                     <S.MenuSVG src="Bell.svg" />
//                     <S.MenuLine>
//                         <S.MenuTitle>버전정보</S.MenuTitle>
//                     </S.MenuLine>
//                 </S.MenuContent>
//             </S.MenuDiv>

//             <Footer />
//         </S.Container>
//         </>
//     );
// }

// export default Profile;

'use client';

import React, { useEffect, useState } from "react";
import * as S from "../styles/Profile";
import HeaderNon from "../components/Header_Non";
import Footer from "../components/Footer";
import axios from "axios";

function Profile() {
    const [profileImage, setProfileImage] = useState<string>("");
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const [school, setSchool] = useState("");
    const [grade, setGrade] = useState("");

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const token = localStorage.getItem("access_token");
        const file = e.target.files?.[0];
        if (!file) return;
    
        // 미리보기 이미지 설정
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
    
        // FormData 객체 생성 및 파일 추가
        const formData = new FormData();
        formData.append("images", file);
    
        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/profile/update`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                        "ngrok-skip-browser-warning": "69420",
                    },
                    withCredentials: true,
                }
            );
    
            // 서버에서 업로드된 이미지 URL을 받아와서 프로필 이미지 설정
            const newImageUrl = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/images/${response.data.images[0].url}`;
            setProfileImage(newImageUrl);
            setPreviewImage(null);
        } catch (error) {
            console.error("이미지 업로드 중 오류 발생:", error);
        }
    };    

    useEffect(() => {
        fetchProfileData();
        const interval = setInterval(fetchProfileData, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchProfileData = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/profile/me`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        "ngrok-skip-browser-warning": "69420",
                    },
                    withCredentials: true,
                }
            );
    
            const { username, school, grade, images } = response.data;
            setUsername(username);
            setSchool(school);
            setGrade(grade);
            
            if (images && images.length > 0) {
                setProfileImage(`${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/images/${images.url}`);
            } else {
                setProfileImage("YakChat.svg");
            }
        } catch (error) {
            console.error("프로필 데이터를 가져오는 중 오류 발생:", error);
        }
    };   

    useEffect(() => {
        if (profileImage) {
            axios
                .get(profileImage, { responseType: "blob" }) // 이미지 데이터를 Blob으로 요청
                .then((response) => {
                    if (response.status !== 200) {
                        throw new Error("이미지를 불러오는 데 실패했습니다.");
                    }
                })
                .catch((err) => console.error("이미지 로드 오류:", err));
        }
    }, [profileImage]);
    
    

    return (
        <>
        <S.Container>
            <HeaderNon />

            <S.MYpage>마이페이지</S.MYpage>
            <S.Alarm src="Bell.svg" />

            <S.ProfileWrapper>
                <label htmlFor="profile-upload">
                    <S.ProfileImg
                        src={ profileImage || "YakChat.svg"} // 미리보기 또는 프로필 이미지
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
            
            <S.Wrapper>
                <S.ID>{username}</S.ID>
                <S.SN>
                    {`${school}/${grade}학년`}
                </S.SN>
            </S.Wrapper>

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

            <Footer />
        </S.Container>
        </>
    );
}

export default Profile;