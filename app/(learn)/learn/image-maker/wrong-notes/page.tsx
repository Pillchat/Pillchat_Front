import { ImageMakerEmptyState } from "../_components/ImageMakerTabShell";

export default function ImageMakerWrongNotesPage() {
  return (
    <ImageMakerEmptyState
      activeTab="wrongNotes"
      icon="notebook"
      title="오답노트가 비어 있어요"
      description="답안을 제출하고 부족한 키워드가 있으면 자동으로 정리됩니다."
    />
  );
}
