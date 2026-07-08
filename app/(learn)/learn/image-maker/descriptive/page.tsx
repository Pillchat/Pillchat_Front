import { ImageMakerEmptyState } from "../_components/ImageMakerTabShell";

export default function ImageMakerDescriptivePage() {
  return (
    <ImageMakerEmptyState
      activeTab="descriptive"
      icon="pen"
      title="아직 학습할 문제가 없어요"
      description="자료를 업로드하면 서술형 문제가 만들어져요."
      ctaLabel="자료 올리기"
      ctaHref="/learn/image-maker"
    />
  );
}
