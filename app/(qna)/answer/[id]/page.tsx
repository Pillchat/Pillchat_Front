import { AnswerForm } from "./_components/AnswerForm";

type AnswerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const AnswerPage = async ({ params }: AnswerPageProps) => {
  const { id } = await params;

  return <AnswerForm questionId={id} />;
};

export default AnswerPage;
