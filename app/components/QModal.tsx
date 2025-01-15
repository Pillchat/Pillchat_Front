import React, { useState, useRef, useEffect } from "react";
import * as S from "../styles/Qmodal";
import axios from "axios";
import { useRouter } from "next/navigation";

interface Modalprops {
    onClose: () => void;
}

function QModal({ onClose }: Modalprops) {
    const modalBackground = useRef<HTMLDivElement>(null);

    const [TitleValue, SetTitleValue] = useState('');
    const [ContentValue, SetContentValue] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]); // 파일 배열 상태
    const [imageNames, setImageNames] = useState<string[]>([]); // 파일명 배열 상태
    const [isClient, setIsClient] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSubmit = async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("title", TitleValue);
        formData.append("content", ContentValue);

        // 파일들을 FormData에 추가
        imageFiles.forEach((file) => {
            formData.append("files", file);
        });

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/???`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true,
                }   
            );

            router.push("/submit");

        } catch (error) {
            console.log("질문 및 이미지 업로드 실패:", error);
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        SetTitleValue(e.target.value);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        SetContentValue(e.target.value);
    };

    const handleImageUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            if (selectedFiles.length + imageFiles.length <= 10) {
                setImageFiles([...imageFiles, ...selectedFiles]);
                setImageNames([
                    ...imageNames,
                    ...selectedFiles.map(file => file.name),
                ]);
            } else {
                alert("최대 10장의 이미지만 업로드할 수 있습니다.");
            }
        }
    };

    if (!isClient) return null;

    return (
        <S.background
            ref={modalBackground}
            onClick={(e) => {
                if (e.target === modalBackground.current) {
                    onClose();
                }
            }}
        >
            <S.ModalContainer>
                <S.BoxTitle>오늘의 질문 처방전</S.BoxTitle>
                <S.BoxTitleLine />

                <S.TitltArea placeholder="제목" onChange={handleTitleChange} />
                <S.ContentArea placeholder="내용" onChange={handleContentChange} />

                <S.BtnDiv>
                    <S.CameraBtn onClick={handleImageUploadClick}>
                        <S.CameraSVG src="Camera.svg" />
                    </S.CameraBtn>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                        multiple
                    />
                    <S.ArrowBtn onClick={handleSubmit}>
                        <S.ArrowSVG src="Arrow.svg" />
                    </S.ArrowBtn>
                </S.BtnDiv>

                {imageNames.length > 0 && (
                    <S.FileNames>
                        {imageNames.map((name, index) => (
                            <S.FileName key={index}>{name}</S.FileName>
                        ))}
                    </S.FileNames>
                )}
            </S.ModalContainer>
        </S.background>
    );
}

export default QModal;
