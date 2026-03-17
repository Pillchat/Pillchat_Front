export type ReportReasonType =
  | "ABUSE"
  | "SPAM"
  | "INAPPROPRIATE_CONTENT"
  | "HARASSMENT"
  | "FALSE_INFO"
  | "COPYRIGHT"
  | "IMPERSONATION"
  | "MEDICAL_ADVICE"
  | "OTHER"
  | "ETC";

export type TargetType = "QUESTION" | "ANSWER" | "USER";

export type ReportCreateRequest = {
  targetType: TargetType;
  targetId: number;
  reasonType: ReportReasonType;
  reasonDetail?: string;
};