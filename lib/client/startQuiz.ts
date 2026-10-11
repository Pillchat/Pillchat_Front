import { getCurrentUserId } from "@/lib/client/auth";
import { LearningCommands } from "@/lib/learning/api";
const pending = new Map<string, LearningCommands>();
const running = new Map<string, Promise<any>>();
/** Reuse a start key only while its outcome is uncertain; new starts get new keys. */
export function startQuiz(body: Record<string, unknown>): Promise<any> {
  const signature = JSON.stringify([getCurrentUserId(), body]);
  const active = running.get(signature);
  if (active) return active;
  const command = pending.get(signature) ?? new LearningCommands();
  pending.set(signature, command);
  const request = (
    command.pending
      ? command.retry()
      : command.send("/api/questionbank/quiz", "POST", body)
  ).finally(() => {
    running.delete(signature);
    if (!command.pending) pending.delete(signature);
  });
  running.set(signature, request);
  return request;
}
