import { QuestionDetailPage } from "./_components/QuestionDetailPage";
import { FC } from "react";

type QuestionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const QuestionPage: FC<QuestionPageProps> = async ({ params }) => {
  const { id } = await params;

  return <QuestionDetailPage questionId={id} />;
};

export default QuestionPage;
