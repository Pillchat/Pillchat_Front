import React, { useState, useRef, useEffect } from "react";
import * as S from "../styles/Qmodal";
import { useRouter } from "next/navigation";

interface Modalprops {
    onClose: () => void;
}

function QModal({ onClose }: Modalprops) {
    const modalBackground = useRef<HTMLDivElement>(null);

    const [TitleValue, SetTitleValue] = useState('');
    const [ContentValue, SetContentValue] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imageNames, setImageNames] = useState<string[]>([]);
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

        // 이미지 파일들을 FormData에 추가
        imageFiles.forEach((file) => {
            formData.append("files", file);
        });

        // localStorage에 저장
        localStorage.setItem('title', TitleValue);
        localStorage.setItem('content', ContentValue);
        localStorage.setItem('images', JSON.stringify(imageNames));

        router.push("/Submit");
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
                selectedFiles.forEach((file) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImageFiles((prevFiles) => [...prevFiles, file]);
                        setImageNames((prevNames) => [
                            ...prevNames,
                            reader.result as string,
                        ]);
                    };
                    reader.readAsDataURL(file);
                });
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

                <S.TitltArea maxLength={50} placeholder="제목" onChange={handleTitleChange} />
                <S.ContentArea maxLength={1000} placeholder="내용" onChange={handleContentChange} />

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
