"use client";

import { useState } from "react";
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
import DialogFrame from "./dialog-frame";
import { SubmitButton } from "./admin-ui";
import styles from "./admin.module.css";

type EditorState<T> = { item?: T } | null;

// 학력·경력·활동·수상·자격·교육 Backend Model 기반 Editor
export function ProfileEditor({
  state,
  onClose,
  onSubmit,
}: {
  state: EditorState<ProfileEntry>;
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
  const [displayOrder, setDisplayOrder] = useState(item?.displayOrder || 0);
  const [enabled, setEnabled] = useState(item?.enabled ?? true);
  const [error, setError] = useState("");

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
      displayOrder,
      enabled,
    }, item);
  };

  return (
    <DialogFrame
      open={state !== null}
      title={item ? "프로필 항목 수정" : "프로필 항목 추가"}
      description="Public의 학력·경력·활동·수상·자격·교육 영역에 연결되는 반복 항목"
      onClose={onClose}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onClose}>취소</button>
          <SubmitButton busy={false} type="button" onClick={() => (document.getElementById("profile-entry-form") as HTMLFormElement | null)?.requestSubmit()}>저장</SubmitButton>
        </>
      )}
    >
      <form id="profile-entry-form" className={styles.editorForm} onSubmit={handleSubmit}>
        <div className={styles.formColumns}>
          <label className={styles.formField}>
            <span className="type-small">유형</span>
            <select className="type-body" value={entryType} onChange={(event) => setEntryType(event.currentTarget.value as ProfileEntryType)}>
              <option value="EDUCATION">학력</option>
              <option value="EXPERIENCE">경력</option>
              <option value="ACTIVITY">활동</option>
              <option value="AWARD">수상</option>
              <option value="CERTIFICATE">자격·교육</option>
            </select>
          </label>
          <label className={styles.formField}>
            <span className="type-small">기간</span>
            <input className="type-body" value={periodText} onChange={(event) => setPeriodText(event.currentTarget.value)} placeholder="화면 표시 문자열" />
          </label>
        </div>
        <label className={styles.formField}>
          <span className="type-small">제목</span>
          <input className="type-body" value={title} onChange={(event) => setTitle(event.currentTarget.value)} required />
        </label>
        <div className={styles.formColumns}>
          <label className={styles.formField}>
            <span className="type-small">기관</span>
            <input className="type-body" value={organization} onChange={(event) => setOrganization(event.currentTarget.value)} />
          </label>
          <label className={styles.formField}>
            <span className="type-small">역할</span>
            <input className="type-body" value={role} onChange={(event) => setRole(event.currentTarget.value)} />
          </label>
        </div>
        <label className={styles.formField}>
          <span className="type-small">설명</span>
          <textarea className="type-body" rows={4} value={description} onChange={(event) => setDescription(event.currentTarget.value)} />
        </label>
        <label className={styles.formField}>
          <span className="type-small">성과</span>
          <textarea className="type-body" rows={3} value={achievement} onChange={(event) => setAchievement(event.currentTarget.value)} />
        </label>
        <label className={styles.formField}>
          <span className="type-small">표시 순서</span>
          <input className="type-body" type="number" min="0" value={displayOrder} onChange={(event) => setDisplayOrder(Number(event.currentTarget.value))} />
        </label>
        <div className={styles.checkRow}>
          <label className={styles.checkboxField}><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} /><span className="type-body">노출 ON</span></label>
        </div>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}

// 6개 기술 분류와 iconUrl 기반 기술 사전 Editor
export function TechnologyEditor({
  state,
  onClose,
  onSubmit,
}: {
  state: EditorState<Technology>;
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
      title={item ? "기술 수정" : "기술 추가"}
      description="기술 사전의 이름, 분류와 공개 Icon URL을 관리합니다."
      onClose={onClose}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onClose}>취소</button>
          <SubmitButton busy={false} type="button" onClick={() => (document.getElementById("technology-form") as HTMLFormElement | null)?.requestSubmit()}>저장</SubmitButton>
        </>
      )}
    >
      <form id="technology-form" className={styles.editorForm} onSubmit={handleSubmit}>
        <label className={styles.formField}><span className="type-small">기술명</span><input className="type-body" value={name} onChange={(event) => setName(event.currentTarget.value)} required /></label>
        <div className={styles.formColumns}>
          <label className={styles.formField}>
            <span className="type-small">분류</span>
            <select className="type-body" value={category} onChange={(event) => setCategory(event.currentTarget.value as TechnologyCategory)}>
              <option value="LANGUAGE">LANGUAGE</option>
              <option value="BACKEND">BACKEND</option>
              <option value="DATABASE">DATABASE</option>
              <option value="FRONTEND">FRONTEND</option>
              <option value="INFRA">INFRA</option>
              <option value="DEVOPS">DEVOPS</option>
            </select>
          </label>
          <label className={styles.formField}><span className="type-small">Icon URL</span><input className="type-body" value={iconUrl} onChange={(event) => setIconUrl(event.currentTarget.value)} placeholder="/icons/tech/example.svg" /></label>
        </div>
        <label className={styles.checkboxField}><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} /><span className="type-body">신규 연결 가능</span></label>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}

// http/https 공개 URL만 허용하는 외부 링크 Editor
export function ExternalLinkEditor({
  state,
  onClose,
  onSubmit,
}: {
  state: EditorState<ExternalLink>;
  onClose: () => void;
  onSubmit: (input: ExternalLinkInput, item?: ExternalLink) => void;
}) {
  const item = state?.item;
  const [name, setName] = useState(item?.name || "");
  const [url, setUrl] = useState(item?.url || "");
  const [displayOrder, setDisplayOrder] = useState(item?.displayOrder || 0);
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

    onSubmit({ name: name.trim(), url: url.trim(), displayOrder, enabled }, item);
  };

  return (
    <DialogFrame
      open={state !== null}
      title={item ? "외부 링크 수정" : "외부 링크 추가"}
      description="Footer와 지정된 공개 영역에서 사용하는 외부 URL"
      onClose={onClose}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onClose}>취소</button>
          <SubmitButton busy={false} type="button" onClick={() => (document.getElementById("external-link-form") as HTMLFormElement | null)?.requestSubmit()}>저장</SubmitButton>
        </>
      )}
    >
      <form id="external-link-form" className={styles.editorForm} onSubmit={handleSubmit}>
        <label className={styles.formField}><span className="type-small">이름</span><input className="type-body" value={name} onChange={(event) => setName(event.currentTarget.value)} required /></label>
        <label className={styles.formField}><span className="type-small">URL</span><input className="type-body" type="url" value={url} onChange={(event) => setUrl(event.currentTarget.value)} placeholder="https://" required /></label>
        <label className={styles.formField}><span className="type-small">표시 순서</span><input className="type-body" type="number" min="0" value={displayOrder} onChange={(event) => setDisplayOrder(Number(event.currentTarget.value))} /></label>
        <label className={styles.checkboxField}><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} /><span className="type-body">노출 ON</span></label>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}
