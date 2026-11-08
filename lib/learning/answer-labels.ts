export function historyAnswerLabel(
  choices: { id: string }[],
  answer: string | null,
) {
  if (answer == null || answer === "") return null;
  if (!choices.length) return answer;
  const index = choices.findIndex((choice) => choice.id === answer);
  return index < 0 ? "확인할 수 없음" : `${index + 1}번`;
}
