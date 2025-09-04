import { ProfileImg, TextBadge } from "../atoms";
import { useAtom } from "jotai";
import { gradeAtom, nicknameAtom, schoolAtom } from "@/store/profile";

interface option {
  onIconClick?: () => void;
}

export function UserInfoField({ onIconClick }: option) {
  const [nickname, setNickname] = useAtom(nicknameAtom);
  const [school, setSchool] = useAtom(schoolAtom);
  const [grade, setGrade] = useAtom(gradeAtom);

  return (
    <div className="mt-3 flex w-[90%] flex-row gap-5">
      <ProfileImg />
      <div className="flex flex-col py-2">
        <div className="flex flex-row items-center justify-center gap-1">
          <p className="text-xl font-bold">{nickname}</p>
          <TextBadge />
        </div>

        <p className="text-sm font-light">
          {school} / {grade}
        </p>
      </div>
      <img src={"/ArrowIcon.svg"} className="ml-auto" onClick={onIconClick} />
    </div>
  );
}
