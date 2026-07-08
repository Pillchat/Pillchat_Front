import { ImageMakerEmptyState } from "../_components/ImageMakerTabShell";

export default function ImageMakerMaterialsPage() {
  return (
    <ImageMakerEmptyState
      activeTab="materials"
      icon="folder"
      title="저장된 자료가 없어요"
      description="자료를 올리면 자동으로 만들어진 문제들과 함께 정리돼요."
      ctaLabel="자료 올리기"
      ctaHref="/learn/image-maker"
    />
  );
}
