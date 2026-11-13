"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import type {
  ExternalLink,
  ExternalLinkInput,
  ProfileEntry,
  ProfileEntryInput,
  ProfileEntryType,
  Technology,
  TechnologyCategory,
  TechnologyInput,
} from "./admin-types";
import DialogFrame from "@/components/ui/dialog-frame";
import styles from "./admin.module.css";

type EditorState<T> = { item?: T } | null;

type ProfileFieldConfig = {
  title: string;
  organization: string;
  periodText: string;
  description: string;
  role?: string;
  achievement?: string;
};

const PROFILE_FIELD_CONFIG: Record<ProfileEntryType, ProfileFieldConfig> = {
  EDUCATION: {
    title: "학교·학력명",
    organization: "학교명",
    periodText: "재학·졸업 기간",
    description: "상태·설명",
  },
  EXPERIENCE: {
    title: "경력명",
    organization: "회사·기관",
    role: "담당 역할",
    periodText: "근무 기간",
    description: "담당 업무",
    achievement: "주요 성과",
  },
  ACTIVITY: {
    title: "활동명",
    organization: "주관·소속 기관",
    role: "담당 역할",
    periodText: "활동 기간",
    description: "활동 내용",
    achievement: "활동 성과",
  },
  AWARD: {
    title: "수상명",
    organization: "주최·주관 기관",
    periodText: "수상 시기",
    description: "수상 설명",
  },
  CERTIFICATE: {
    title: "자격·교육명",
    organization: "발급·교육 기관",
    periodText: "취득·교육 시기",
    description: "상세 설명",
  },
};

// Dialog Form 내부 입력 목적 구분
function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={styles.editorFormSection}><h3 className="type-small">{title}</h3><div className={styles.editorFormFields}>{children}</div></section>;
}

// 학력·경력·활동·수상·자격·교육 Backend Model 기반 Editor
export function ProfileEditor({
  state,
  busy = false,
  onClose,
  onSubmit,
}: {
  state: EditorState<ProfileEntry>;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: ProfileEntryInput, item?: ProfileEntry) => void;
}) {
  const item = state?.item;
  const [entryType, setEntryType] = useState<ProfileEntryType>(item?.entryType || "EXPERIENCE");
  const [periodText, setPeriodText] = useState(item?.periodText || "");
  const [title, setTitle] = useState(item?.title || "");
  const [organization, setOrganization] = useState(item?.organization || "");
  const [role, setRole] = useState(item?.role || "");
  const [description, setDescription] = useState(item?.description || "");
  const [achievement, setAchievement] = useState(item?.achievement || "");
  const [enabled, setEnabled] = useState(item?.enabled ?? true);
  const [error, setError] = useState("");
  const fields = PROFILE_FIELD_CONFIG[entryType];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }

    onSubmit({
      entryType,
      periodText: periodText.trim() || null,
      title: title.trim(),
      organization: organization.trim() || null,
      role: role.trim() || null,
      description: description.trim() || null,
      achievement: achievement.trim() || null,
      enabled,
    }, item);
  };

  return (
    <DialogFrame
      open={state !== null}
      variant="admin"
      title={item ? "이력 수정" : "이력 추가"}
      onClose={busy ? () => undefined : onClose}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      footer={(
        <>
          <Button variant="secondary" type="button" disabled={busy} onClick={onClose}>취소</Button>
          <Button type="button" disabled={busy} onClick={() => (document.getElementById("profile-entry-form") as HTMLFormElement | null)?.requestSubmit()}>저장</Button>
        </>
      )}
    >
      <form id="profile-entry-form" className={styles.editorForm} onSubmit={handleSubmit}>
        <EditorSection title="기본 정보">
          <label className={styles.formField}>
            <span className="type-small">유형</span>
            <Select aria-label="이력 유형" value={entryType} disabled={busy} onValueChange={(value) => setEntryType(value as ProfileEntryType)} options={[{ value: "EDUCATION", label: "학력" }, { value: "EXPERIENCE", label: "경력" }, { value: "ACTIVITY", label: "활동" }, { value: "AWARD", label: "수상" }, { value: "CERTIFICATE", label: "자격·교육" }]} />
          </label>
          <label className={styles.formField}><span className="type-small">{fields.title}</span><input className="type-body" value={title} disabled={busy} onChange={(event) => setTitle(event.currentTarget.value)} required /></label>
          <label className={styles.formField}><span className="type-small">{fields.organization}</span><input className="type-body" value={organization} disabled={busy} onChange={(event) => setOrganization(event.currentTarget.value)} /></label>
          {fields.role ? <label className={styles.formField}><span className="type-small">{fields.role}</span><input className="type-body" value={role} disabled={busy} onChange={(event) => setRole(event.currentTarget.value)} /></label> : null}
        </EditorSection>
        <EditorSection title="기간"><label className={styles.formField}><span className="type-small">{fields.periodText}</span><input className="type-body" value={periodText} disabled={busy} onChange={(event) => setPeriodText(event.currentTarget.value)} placeholder="화면 표시 문자열" /></label></EditorSection>
        <EditorSection title="상세 설명">
          <label className={styles.formField}><span className="type-small">{fields.description}</span><textarea className="type-body" rows={4} value={description} disabled={busy} onChange={(event) => setDescription(event.currentTarget.value)} /></label>
          {fields.achievement ? <label className={styles.formField}><span className="type-small">{fields.achievement}</span><textarea className="type-body" rows={3} value={achievement} disabled={busy} onChange={(event) => setAchievement(event.currentTarget.value)} /></label> : null}
        </EditorSection>
        <EditorSection title="노출 설정">
          <label className={styles.checkboxField}><input type="checkbox" checked={enabled} disabled={busy} onChange={(event) => setEnabled(event.currentTarget.checked)} /><span className="type-body">공개 여부</span></label>
        </EditorSection>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}

// 6개 기술 분류와 iconUrl 기반 기술 사전 Editor
export function TechnologyEditor({
  state,
  busy = false,
  onClose,
  onSubmit,
}: {
  state: EditorState<Technology>;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: TechnologyInput, item?: Technology) => void;
}) {
  const item = state?.item;
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState<TechnologyCategory>(item?.category || "LANGUAGE");
  const [iconUrl, setIconUrl] = useState(item?.iconUrl || "");
  const [enabled, setEnabled] = useState(item?.enabled ?? true);
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("기술명을 입력해 주세요.");
      return;
    }
    onSubmit({ name: name.trim(), category, iconUrl: iconUrl.trim() || null, enabled }, item);
  };

  return (
    <DialogFrame
      open={state !== null}
      variant="admin"
      title={item ? "기술 수정" : "기술 추가"}
      onClose={busy ? () => undefined : onClose}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      footer={(
        <>
          <Button variant="secondary" type="button" disabled={busy} onClick={onClose}>취소</Button>
          <Button type="button" disabled={busy} onClick={() => (document.getElementById("technology-form") as HTMLFormElement | null)?.requestSubmit()}>저장</Button>
        </>
      )}
    >
      <form id="technology-form" className={styles.editorForm} onSubmit={handleSubmit}>
        <EditorSection title="기본 정보">
          <label className={styles.formField}><span className="type-small">기술명</span><input className="type-body" value={name} disabled={busy} onChange={(event) => setName(event.currentTarget.value)} required /></label>
          <label className={styles.formField}><span className="type-small">분류</span><Select aria-label="기술 분류" value={category} disabled={busy} onValueChange={(value) => setCategory(value as TechnologyCategory)} options={[{ value: "LANGUAGE", label: "LANGUAGE" }, { value: "BACKEND", label: "BACKEND" }, { value: "DATABASE", label: "DATABASE" }, { value: "FRONTEND", label: "FRONTEND" }, { value: "INFRA", label: "INFRA" }, { value: "DEVOPS", label: "DEVOPS" }]} /></label>
          <label className={`${styles.formField} ${styles.wideField}`}><span className="type-small">Icon URL</span><input className="type-body" value={iconUrl} disabled={busy} onChange={(event) => setIconUrl(event.currentTarget.value)} placeholder="/icons/tech/example.svg" /></label>
        </EditorSection>
        <EditorSection title="노출 설정"><label className={styles.checkboxField}><input type="checkbox" checked={enabled} disabled={busy} onChange={(event) => setEnabled(event.currentTarget.checked)} /><span className="type-body">신규 연결 가능</span></label></EditorSection>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}

// http/https 공개 URL만 허용하는 외부 링크 Editor
export function ExternalLinkEditor({
  state,
  busy = false,
  onClose,
  onSubmit,
}: {
  state: EditorState<ExternalLink>;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: ExternalLinkInput, item?: ExternalLink) => void;
}) {
  const item = state?.item;
  const [name, setName] = useState(item?.name || "");
  const [url, setUrl] = useState(item?.url || "");
  const [enabled, setEnabled] = useState(item?.enabled ?? true);
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("링크 이름을 입력해 주세요.");
      return;
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error();
      }
    } catch {
      setError("http 또는 https URL을 입력해 주세요. 이메일은 연락처에서 관리합니다.");
      return;
    }

    onSubmit({ name: name.trim(), url: url.trim(), enabled }, item);
  };

  return (
    <DialogFrame
      open={state !== null}
      variant="admin"
      title={item ? "외부 링크 수정" : "외부 링크 추가"}
      onClose={busy ? () => undefined : onClose}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      footer={(
        <>
          <Button variant="secondary" type="button" disabled={busy} onClick={onClose}>취소</Button>
          <Button type="button" disabled={busy} onClick={() => (document.getElementById("external-link-form") as HTMLFormElement | null)?.requestSubmit()}>저장</Button>
        </>
      )}
    >
      <form id="external-link-form" className={styles.editorForm} onSubmit={handleSubmit}>
        <EditorSection title="기본 정보"><label className={styles.formField}><span className="type-small">이름</span><input className="type-body" value={name} disabled={busy} onChange={(event) => setName(event.currentTarget.value)} required /></label><label className={`${styles.formField} ${styles.wideField}`}><span className="type-small">URL</span><input className="type-body" type="url" value={url} disabled={busy} onChange={(event) => setUrl(event.currentTarget.value)} placeholder="https://" required /></label></EditorSection>
        <EditorSection title="노출 설정"><label className={styles.checkboxField}><input type="checkbox" checked={enabled} disabled={busy} onChange={(event) => setEnabled(event.currentTarget.checked)} /><span className="type-body">공개 여부</span></label></EditorSection>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}
