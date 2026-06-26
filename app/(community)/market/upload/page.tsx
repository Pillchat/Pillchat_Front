"use client";

import { FileVideo, ImagePlus, Tags } from "lucide-react";
import { FormEvent, KeyboardEvent, useMemo, useState } from "react";

import { Toast } from "@/components/atoms";
import { AppShell, CustomHeader } from "@/components/molecules";

const categories = ["노트", "요약", "족보", "문제집"];
const tags = ["약물학", "유기화학", "약제학", "병태생리", "생화학", "약리학"];

export default function MarketUploadPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  const priceNumber = Number(price);
  const formValid = useMemo(
    () =>
      title.trim().length > 0 &&
      price !== "" &&
      !Number.isNaN(priceNumber) &&
      priceNumber >= 0,
    [price, priceNumber, title],
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (!tag) return;
    setSelectedTags((current) =>
      current.includes(tag) ? current : [...current, tag],
    );
    setCustomTag("");
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || isComposing) return;
    event.preventDefault();
    addCustomTag();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValid) return;
    setToastOpen(true);
  };

  return (
    <AppShell>
      <CustomHeader title="자료 등록" />

      <main className="px-6 pb-8 pt-4">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-title-small text-foreground">제목</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-12 rounded-xl border border-input bg-card px-4 text-body-medium outline-none focus:border-brand focus:ring-1 focus:ring-ring"
              placeholder="자료 제목을 입력해주세요"
              aria-invalid={title.trim().length === 0}
            />
          </label>

          <fieldset>
            <legend className="text-title-small text-foreground">
              분류
            </legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {categories.map((item) => (
                <label
                  key={item}
                  className={`flex h-10 items-center justify-center rounded-xl text-label-medium ${
                    category === item
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={item}
                    checked={category === item}
                    onChange={() => setCategory(item)}
                    className="sr-only"
                  />
                  {item}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-2">
            <span className="text-title-small text-foreground">
              가격(원)
            </span>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="h-12 rounded-xl border border-input bg-card px-4 text-body-medium outline-none focus:border-brand focus:ring-1 focus:ring-ring"
              placeholder="0원은 무료 자료로 등록됩니다"
              aria-invalid={
                price !== "" &&
                (!Number.isFinite(priceNumber) || priceNumber < 0)
              }
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-label-medium text-muted-foreground"
            >
              <ImagePlus
                aria-hidden="true"
                className="h-8 w-8 text-brand"
                strokeWidth={1.5}
              />
              커버 이미지
            </button>
            <button
              type="button"
              className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-label-medium text-muted-foreground"
            >
              <FileVideo
                aria-hidden="true"
                className="h-8 w-8 text-brand"
                strokeWidth={1.5}
              />
              PDF/이미지/영상
            </button>
          </div>

          <section>
            <div className="flex items-center gap-2 text-title-small text-foreground">
              <Tags aria-hidden="true" className="h-4 w-4 text-brand" strokeWidth={1.5} />
              태그
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                  className={`h-8 rounded-full border px-3 text-label-medium ${
                    selectedTags.includes(tag)
                      ? "border-brand bg-primary-980 text-brand"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={customTag}
                onChange={(event) => setCustomTag(event.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyDown={handleTagKeyDown}
                className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-body-medium outline-none focus:border-brand focus:ring-1 focus:ring-ring"
                placeholder="태그 직접 입력"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="h-10 rounded-xl border border-border px-3 text-label-medium text-foreground active:scale-[0.98]"
              >
                추가
              </button>
            </div>
            {selectedTags.length > 0 && (
              <p className="mt-2 text-body-small text-muted-foreground">
                선택된 태그: {selectedTags.join(", ")}
              </p>
            )}
          </section>

          <label className="flex flex-col gap-2">
            <span className="text-title-small text-foreground">
              본문 설명
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-32 rounded-xl border border-input bg-card px-4 py-3 text-body-medium outline-none focus:border-brand focus:ring-1 focus:ring-ring"
              placeholder="간단한 강의도 판매할 수 있어요. 아이패드 화면 녹화 자료, 풀이 영상 등 자료 구성을 설명해주세요."
            />
            <span className="self-end text-body-small text-muted-foreground">
              {description.length}/500
            </span>
          </label>

          <button
            type="submit"
            disabled={!formValid}
            className="h-[3.625rem] rounded-xl bg-primary text-label-large text-primary-foreground active:scale-[0.98] disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-500"
          >
            자료 등록하기
          </button>
        </form>
      </main>

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        message="필수 정보를 확인했습니다."
      />
    </AppShell>
  );
}
