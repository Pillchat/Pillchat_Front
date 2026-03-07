"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomHeader, TabsWithUnderline } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchAPI, isCurrentUserAdmin } from "@/lib/functions";
import { formatDiffDate } from "@/lib/functions";
import { useNotifications } from "@/hooks/useNotifications";
import { useAtom } from "jotai";
import { pushHistoryAtom } from "@/store/notification";
import { PushHistory, PushSendType } from "@/types/notification";
import { Separator } from "@/components/ui/separator";

const TABS = [
  { value: "send", label: "푸시 발송" },
  { value: "history", label: "발송 이력" },
];

const PUSH_TYPE_LABELS: Record<PushSendType, string> = {
  all: "전체 발송",
  personal: "개인 발송",
  topic: "토픽 발송",
};

const SendPushSection: FC<{
  onSent: (history: PushHistory) => void;
}> = ({ onSent }) => {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [pushType, setPushType] = useState<PushSendType>("all");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkURL, setLinkURL] = useState("");
  const [userIds, setUserIds] = useState("");
  const [topicName, setTopicName] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      setResult({ type: "error", message: "제목과 내용을 입력해주세요." });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      let endpoint = "";
      const payload: Record<string, any> = { title, content };

      if (linkURL.trim()) payload.linkURL = linkURL;

      const historyEntry: PushHistory = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        sendType: pushType,
        title,
        content,
        linkURL: linkURL || undefined,
        sentAt: new Date().toISOString(),
      };

      switch (pushType) {
        case "all":
          endpoint = "/api/push/send-all";
          if (scheduleTime) payload.scheduleTime = scheduleTime;
          break;
        case "personal":
          if (!userIds.trim()) {
            setResult({ type: "error", message: "유저 ID를 입력해주세요." });
            setIsSending(false);
            return;
          }
          endpoint = "/api/push/send";
          payload.userIds = userIds.split(",").map((id) => id.trim());
          historyEntry.targetUserIds = payload.userIds;
          break;
        case "topic":
          if (!topicName.trim()) {
            setResult({ type: "error", message: "토픽 이름을 입력해주세요." });
            setIsSending(false);
            return;
          }
          endpoint = "/api/push/send-topic";
          payload.topicName = topicName;
          historyEntry.topicName = topicName;
          break;
      }

      await fetchAPI(endpoint, "POST", payload);

      addNotification({
        type: "SYSTEM",
        title,
        content,
        link: linkURL || undefined,
      });

      onSent(historyEntry);
      router.push("/mypage");
    } catch (error: any) {
      setResult({
        type: "error",
        message: error?.message || "발송 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 px-6 py-5">
      {/* 발송 타입 선택 */}
      <div className="space-y-2">
        <Label>발송 타입</Label>
        <div className="flex gap-2">
          {(Object.keys(PUSH_TYPE_LABELS) as PushSendType[]).map((type) => (
            <Button
              key={type}
              variant={pushType === type ? "brand" : "outline"}
              size="sm"
              onClick={() => setPushType(type)}
            >
              {PUSH_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>

      {/* 개인 발송 - 유저 ID */}
      {pushType === "personal" && (
        <div className="space-y-2">
          <Label htmlFor="userIds">유저 ID (쉼표로 구분)</Label>
          <Input
            id="userIds"
            placeholder="user1, user2, user3"
            value={userIds}
            onChange={(e) => setUserIds(e.target.value)}
          />
        </div>
      )}

      {/* 토픽 발송 - 토픽 이름 */}
      {pushType === "topic" && (
        <div className="space-y-2">
          <Label htmlFor="topicName">토픽 이름</Label>
          <Input
            id="topicName"
            placeholder="TOPIC_NAME"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
          />
        </div>
      )}

      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title">알림 제목</Label>
        <Input
          id="title"
          placeholder="알림 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* 내용 */}
      <div className="space-y-2">
        <Label htmlFor="content">알림 내용</Label>
        <Textarea
          id="content"
          placeholder="알림 내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
      </div>

      {/* 링크 URL */}
      <div className="space-y-2">
        <Label htmlFor="linkURL">링크 URL (선택)</Label>
        <Input
          id="linkURL"
          placeholder="https://..."
          value={linkURL}
          onChange={(e) => setLinkURL(e.target.value)}
        />
      </div>

      {/* 전체 발송 - 예약 시간 */}
      {pushType === "all" && (
        <div className="space-y-2">
          <Label htmlFor="scheduleTime">예약 발송 (선택)</Label>
          <Input
            id="scheduleTime"
            type="datetime-local"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            비워두면 즉시 발송됩니다.
          </p>
        </div>
      )}

      {/* 결과 메시지 */}
      {result && (
        <div
          className={`rounded-lg p-3 text-sm ${
            result.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {result.message}
        </div>
      )}

      {/* 발송 버튼 */}
      <Button
        variant="brand"
        className="h-14 w-full text-lg font-medium"
        onClick={handleSend}
        disabled={isSending}
      >
        {isSending ? "발송 중..." : "푸시 알림 발송"}
      </Button>
    </div>
  );
};

const HistorySection: FC<{
  history: PushHistory[];
  onClear: () => void;
}> = ({ history, onClear }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <img
          src="/Bell.svg"
          alt="no history"
          className="mb-4 h-12 w-12 opacity-30"
        />
        <p className="text-sm text-border">발송 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {history.length}건
        </p>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          전체 삭제
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {history.map((item) => (
          <div key={item.id}>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {PUSH_TYPE_LABELS[item.sendType]}
                </span>
                <span className="text-xs text-border">
                  {formatDiffDate(item.sentAt)}
                </span>
              </div>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.content}</p>
              {item.targetUserIds && (
                <p className="text-xs text-border">
                  대상: {item.targetUserIds.join(", ")}
                </p>
              )}
              {item.topicName && (
                <p className="text-xs text-border">
                  토픽: {item.topicName}
                </p>
              )}
              {item.linkURL && (
                <p className="truncate text-xs text-blue-500">
                  {item.linkURL}
                </p>
              )}
            </div>
            <Separator className="mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminPage: FC = () => {
  const [currentTab, setCurrentTab] = useState("send");
  const [pushHistory, setPushHistory] = useAtom(pushHistoryAtom);
  const isAdmin = isCurrentUserAdmin();

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <CustomHeader title="관리자" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">접근 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  const handlePushSent = (entry: PushHistory) => {
    setPushHistory((prev) => [entry, ...prev]);
  };

  const handleClearHistory = () => {
    setPushHistory([]);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <CustomHeader title="푸시 알림 관리" />
      <TabsWithUnderline
        className="px-6"
        tabs={TABS}
        defaultValue={currentTab}
        onValueChange={setCurrentTab}
      />

      <div className="flex-1">
        {currentTab === "send" ? (
          <SendPushSection onSent={handlePushSent} />
        ) : (
          <HistorySection
            history={pushHistory}
            onClear={handleClearHistory}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPage;
