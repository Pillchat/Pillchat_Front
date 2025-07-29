"use client";

import { FC } from "react";
import { useState } from "react";
import { Step, useStep } from "./_hooks";

import { RoleCard, SolidButton, StrokeButton } from "@/components/atoms";
import { StepHeader, InputField, IconInputField } from "@/components/molecules";
import { VerifyInputField } from "@/components/organisms";
import CameraPage from "@/components/organisms/CameraPage";

export type SignupFormData = {
  email: string;
  password: string;
  username: string;
  school: string;
  grade: string;
  age: number;
};

const SignupPage: FC = () => {
  const { step, nextStep, prevStep, setStep } = useStep();

  const [route, setRoute] = useState("");
  const [valueBadge, setValueBadge] = useState("");
  const [roleImg, setRoleImg] = useState("");
  const [checked, seChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRe, setShowPasswordRe] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRe, setPasswordRe] = useState("");
  const [nickname, setNickname] = useState("");

  return (
    <div className="flex min-h-screen flex-col items-center">
      {step === Step.Role && (
        <>
          <StepHeader content="직장 확인" onIconClick={prevStep} />
          <div className="mt-[5rem] text-xl font-semibold">
            <p>현재 어떤 직종에</p>
            <p>일하고 계신가요?</p>
          </div>

          <div className="mt-5 flex flex-row gap-[15px]">
            <RoleCard
              title="학생"
              imageSrc="/Student.svg"
              onClick={() => {
                setRoute("학생");
                setValueBadge("학생증");
                setRoleImg("/StudentCard.svg");
                nextStep();
              }}
            />

            <RoleCard
              title="전문가"
              imageSrc="/Specialist.svg"
              onClick={() => {
                setRoute("전문가");
                setValueBadge("약사 면허증");
                setRoleImg("/DoctorCard.svg");
                nextStep();
              }}
            />
          </div>
        </>
      )}

      {step === Step.Guide && (
        <>
          <StepHeader content={`${route} 확인`} onIconClick={prevStep} />

          <div className="mt-[1rem] flex w-[90%] flex-col items-center gap-[12px]">
            <div className="ml-[0.25rem] w-full items-start text-xl font-semibold">
              <p>{route} 인증을 위해선</p>
              <p>본인의 {valueBadge}이 필요해요.</p>
            </div>

            <div className="ml-[0.25rem] w-full items-start text-base font-medium text-button-foreground">
              <p>{valueBadge}을 준비해주세요.</p>
            </div>

            <div className="mb-[3rem] mt-[1rem] flex h-[200px] w-full items-center justify-center">
              <img src={`${roleImg}`} />
            </div>

            <div className="ml-[0.25rem] flex w-full flex-col items-start gap-[0.25rem] text-[14px] font-medium text-button-foreground">
              <p>
                1. {valueBadge}을 어두운 바닥에 두고 가이드에 맞춰 촬영해주세요.
              </p>
              <p>2. 반사광을 최소화하고 정보가 잘 보이게 해주세요.</p>
              <p>3. 훼손이 심한 {valueBadge}은 거절될 수 있습니다.</p>
            </div>

            <div className="mt-[1rem] w-full" onClick={() => setStep(3)}>
              <StrokeButton content="카메라로 촬영하기" variant="stroke-brand" />
            </div>
          </div>
        </>
      )}

      {step === Step.Ocr && (
        <>
          {route === "학생" ? (
            <>
              <StepHeader
                content={`${route} 인증`}
                onIconClick={prevStep}
                dark={true}
              />

              <CameraPage />
            </>
          ) : route === "전문가" ? (
            <>
              <StepHeader
                content={`${route} 인증`}
                onIconClick={prevStep}
                dark={true}
              />

              <CameraPage />
            </>
          ) : null}
        </>
      )}

      {step === Step.DepartMent && (
        <>
          {route === "학생" ? (
            <>
              <StepHeader content={`${route} 인증`} onIconClick={prevStep} />

              <div className="mt-[1rem] flex w-[90%] flex-col">
                <div className="flex flex-col gap-[20px]">
                  <InputField content="성명" disabled={true} />
                  <InputField content="학교명" disabled />
                  <InputField content="학과" disabled />
                  <InputField content="학번" disabled />
                </div>

                <div className="item-center mt-[2rem] flex w-full flex-col justify-center gap-[15px]">
                  <StrokeButton content="다시 촬영하기" variant="stroke-brand" />
                  <SolidButton content="인증하기" variant={"brand"} />
                </div>
              </div>
            </>
          ) : route === "전문가" ? (
            <>
              <StepHeader content={`${route} 인증`} onIconClick={prevStep} />

              <div className="mt-[1rem] flex w-[90%] flex-col">
                <div className="flex flex-col gap-[20px]">
                  <InputField content="성명" disabled />
                  <InputField content="면허번호" disabled />
                  <InputField content="발행날짜" disabled />
                </div>

                <div className="mt-[8rem] flex w-full flex-col gap-[15px]">
                  <StrokeButton content="다시 촬영하기" variant="stroke-brand" />
                  <SolidButton content="인증하기" variant={"brand"} />
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {step === Step.ServiceRule && (
        <>
          <StepHeader content="서비스 이용약관" onIconClick={prevStep} />

          <div className="flex w-[90%] flex-col items-center">
            <textarea
              className="scrollbar-hide h-[450px] w-full gap-[2rem] overflow-y-auto whitespace-pre-wrap bg-white text-[13px] font-medium"
              readOnly
              disabled
              value={`제 1 조 (목적)  본 약관은 필챗 (이하 '필챗')의 이용과 관련하여 사용자와 서비스 제공자 간의 권리, 의무 및 책임사항을 규정하는 것을 목적으로 합니다.\n\n제 2 조 (개인 정보 수집 및 이용) 1. 서비스는 사용자의 개인 정보를 수집할 수 있습니다. 2. 수집된 개인 정보는 서비스 제공을 위한 목적으로만 사용되며, 관련 법규를 준수하여 보호됩니다. 3. 사용자는 언제든지 본인의 개인 정보에 대해 열람, 수정, 삭제를 요청할 수 있습니다.\n\n제 3 조 (학습 자료의 사용) 1. 사용자는 본 서비스 내 학습 자료를 타인에게 제공하거나, 무단으로 배포하지 않도록 해야 합니다. 2. 본 서비스 내에 출제된 문제와 관련된 학습 자료에 대해서는 절대로 "출제 약시 문제"를 올려서는 안 됩니다. 3. 사용자가 "출제 약시 문제"를 올리거나 이를 유포할 경우, 해당 사용자에게 법적 책임이 발생하며, 서비스는 이에 대한 책임을 지지 않습니다.\n\n제 4 조 (커뮤니티 이용 규칙) 1. 서비스 내 커뮤니티에서는 사용자 간의 존중을 바탕으로 대화해야 하며, 욕설, 비방, 불쾌감을 줄 수 있는 언행은 엄격히 금지됩니다. 2. 욕설 또는 부적절한 언행이 발견될 경우, 해당 사용자는 경고, 이용 정지 또는 서비스 이용 제한 등의 조치를 받을 수 있습니다.\n\n제 5 조 (서비스의 이용과 제한) 1. 서비스는 사용자에게 제공되는 서비스를 일정한 기준에 따라 제한할 수 있으며, 서비스 이용을 위한 기술적, 운영적 조치를 취할 수 있습니다. 2. 서비스 이용에 따른 권리 또는 혜택은 타인에게 양도하거나 공유할 수 없습니다.\n\n제 6 조 (서비스 제공자의 권리) 1. 서비스 제공자는 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 사용자에게 안내됩니다. 2. 본 약관의 변경 후, 사용자가 서비스를 지속적으로 이용할 경우 변경된 약관에 동의한 것으로 간주됩니다.\n\n제 7 조 (면책 조항) 1. 서비스는 사용자가 제공한 정보의 정확성, 신뢰성, 적법성 등에 대해 책임지지 않습니다. 2. 서비스 이용 중 발생하는 손해에 대해 서비스 제공자는 책임을 지지 않으며, 사용자는 이를 충분히 이해하고 동의합니다.\n\n제 8 조 (기타) 1. 본 약관에 명시되지 않은 사항은 관련 법령에 따릅니다. 2. 본 약관에 대한 분쟁이 발생할 경우, 서비스 제공자의 본사 소재지를 관할하는 법원을 제1심 법원으로 합니다.`}
            />
          </div>

          <div className="z-[1] flex w-full flex-col items-center bg-[linear-gradient(to_top,_#FFFFFF_0%,_#FFFFFF_24%,_transparent_100%)] shadow-[0_-22px_24px_rgba(255,255,255,0.3),_0_-50px_40px_rgba(255,255,255,0.6)]">
            <div className="mt-[1rem] flex flex-row items-center justify-center gap-[0.15rem]">
              <img
                className="h-[26px] w-[26px]"
                src={checked ? "/CheckedIcon.svg" : "/UncheckIcon.svg"}
                onClick={() => seChecked(!checked)}
                alt="icon"
              />
              <div className="flex flex-row text-sm font-medium">
                <p className="text-brand underline underline-offset-2">
                  서비스 이용약관
                </p>
                <p>에 동의합니다.</p>
              </div>
            </div>

            <div className="font-regular mt-[1rem] w-[90%]">
              <SolidButton
                content="다음"
                variant={checked ? "brand" : "disabled"}
                disabled={!checked}
              />
            </div>
          </div>
        </>
      )}

      {step === Step.Email && (
        <>
          <StepHeader content="회원가입" onIconClick={prevStep} />

          <div className="mt-[2rem] flex w-[90%] flex-col gap-[20px]">
            <p className="text-xl font-semibold">이메일을 입력해주세요.</p>

            <IconInputField
              content="이메일"
              iconAsButton={true}
              inputValue={email}
              onChange={(e) => setEmail(e.target.value)}
              onIconClick={() => setEmail("")}
              type="email"
              iconPosition="right"
              iconSrc="/Cancel.svg"
              iconSize="20"
              placeholder="이메일을 적어주세요"
              autoFocus={true}
            />

            <VerifyInputField
              content="이메일 인증"
              placeholder="인증번호를 적어주세요"
            />

            <div className="mt-[9rem]">
              <SolidButton
                content="인증하기"
                variant={email ? "brand" : "disabled"}
                disabled={email ? true : false}
              />
            </div>
          </div>
        </>
      )}

      {step === Step.Password && (
        <>
          <StepHeader content="회원가입" onIconClick={prevStep} />

          <div className="mt-[2rem] flex w-[90%] flex-col gap-[20px]">
            <p className="text-xl font-semibold">비밀번호를 입력해주세요.</p>

            <div className="flex flex-col gap-[5px]">
              <IconInputField
                content="비밀번호"
                iconAsButton={true}
                inputValue={password}
                onChange={(e) => setPassword(e.target.value)}
                onIconClick={() => setShowPassword(!showPassword)}
                iconPosition="right"
                iconSrc={showPassword ? "/ClosedEye.svg" : "/OpenEye.svg"}
                iconSize="20"
                placeholder="비밀번호를 적어주세요"
                autoFocus={true}
                type={showPassword ? "text" : "password"}
                minLength={8}
                maxLength={8}
              />

              <p className="font-regular text-[14px] text-border">
                영어, 숫자, 특수문자를 조합한 최소 8자리
              </p>
            </div>

            {password.length >= 8 && (
              <div className="flex flex-col gap-[5px]">
                <IconInputField
                  content="비밀번호 확인"
                  iconAsButton={true}
                  inputValue={passwordRe}
                  onChange={(e) => setPasswordRe(e.target.value)}
                  onIconClick={() => setShowPasswordRe(!showPasswordRe)}
                  iconPosition="right"
                  iconSrc={showPasswordRe ? "/ClosedEye.svg" : "/OpenEye.svg"}
                  iconSize="20"
                  placeholder="비밀번호를 적어주세요"
                  type={showPasswordRe ? "text" : "password"}
                  minLength={8}
                  maxLength={8}
                />

                <p className="font-regular text-sm text-border">
                  비밀번호를 한 번 더 입력해주세요.
                </p>
              </div>
            )}

            {passwordRe.length >= 8 && password === passwordRe && (
              <div className="mt-[4rem]">
                <SolidButton
                  content="다음"
                  variant={passwordRe ? "brand" : "disabled"}
                  disabled={passwordRe ? true : false}
                />
              </div>
            )}
          </div>
        </>
      )}

      {step === Step.Nickname && (
        <>
          <StepHeader content="회원가입" onIconClick={prevStep} />

          <div className="mt-[2rem] flex w-[90%] flex-col gap-[20px]">
            <p className="text-xl font-semibold">
              필챗에서 활동할 닉네임을 입력해주세요.
            </p>

            <div className="flex flex-col gap-[5px]">
              <IconInputField
                content="닉네임"
                iconAsButton={true}
                inputValue={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onIconClick={() => setNickname("")}
                iconPosition="right"
                iconSrc="Cancel.svg"
                iconSize="20"
                placeholder="닉네임을 적어주세요"
                autoFocus={true}
              />

              <p className="font-regular text-sm text-border">
                영어, 숫자를 조합한 최소 2자리
              </p>
            </div>

            <div className="mt-[9rem]">
              <SolidButton
                content="다음"
                variant={nickname ? "brand" : "disabled"}
                disabled={email ? true : false}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SignupPage;
