"use client";

import { ArrowLeft, Eye, Save, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { formatApiError } from "@/lib/api/client";
import type { ProjectContentMediaReference, ProjectDetail, Technology } from "./admin-types";
import AdminActionDialog from "./admin-action-dialog";
import { getAdminProject, projectActionBindings, saveProject } from "./admin-project-api";
import { getAdminSite } from "./admin-site-api";
import {
  buildProjectSaveInput,
  createProjectDraft,
  projectDraftSignature,
  validateProjectImage,
  type EditorMedia,
  type ProjectEditorDraft,
} from "./project-editor-model";
import ProjectEditorPanel, { type ProjectEditorSection } from "./project-editor-panels";
import ProjectPreview from "./project-preview";
import { PageError, PageLoading } from "./admin-ui";
import { useAdminAction } from "./use-admin-action";
import styles from "./admin.module.css";

const SECTIONS: Array<{ id: ProjectEditorSection; label: string }> = [
  { id: "basic", label: "기본 정보" },
  { id: "results", label: "성과" },
  { id: "background", label: "문제 배경" },
  { id: "features", label: "주요 기능" },
  { id: "development", label: "직접 담당한 개발 영역" },
  { id: "architecture", label: "아키텍처" },
  { id: "engineering", label: "기술적 문제 해결" },
  { id: "technologies", label: "기술" },
  { id: "media", label: "미디어" },
];

function clearReference(reference: ProjectContentMediaReference, item: EditorMedia) {
  const matches = item.id !== null ? reference.mediaId === item.id : item.clientKey !== null && reference.clientKey === item.clientKey;
  return matches ? { ...reference, mediaId: null, clientKey: null } : reference;
}

// Project Editor GET·Local Draft·Object URL·단일 Save 흐름 조정
export default function ProjectEditorScreen({ projectId }: { projectId: number }) {
  const router = useRouter();
  const adminAction = useAdminAction();
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [draft, setDraft] = useState<ProjectEditorDraft | null>(null);
  const [technologyMaster, setTechnologyMaster] = useState<Technology[]>([]);
  const [initialSignature, setInitialSignature] = useState("");
  const [section, setSection] = useState<ProjectEditorSection>("basic");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [fileError, setFileError] = useState("");
  const requestSequence = useRef(0);
  const objectUrls = useRef(new Set<string>());
  const clientKeySequence = useRef(0);

  const revokeUrl = useCallback((url: string | null) => {
    if (!url || !objectUrls.current.has(url)) return;
    URL.revokeObjectURL(url);
    objectUrls.current.delete(url);
  }, []);

  const revokeAll = useCallback(() => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current.clear();
  }, []);

  const loadEditor = useCallback(async (silent = false) => {
    const requestId = ++requestSequence.current;
    if (!silent) setLoading(true);
    setError("");
    try {
      const [project, site] = await Promise.all([getAdminProject(projectId), getAdminSite()]);
      if (requestSequence.current !== requestId) return;
      const nextDraft = createProjectDraft(project);
      revokeAll();
      setDetail(project);
      setDraft(nextDraft);
      setTechnologyMaster(site.technologyMaster);
      setInitialSignature(projectDraftSignature(nextDraft));
      setFileError("");
      if (silent) setFeedback("프로젝트를 저장하고 Server 최신 상태로 동기화했습니다.");
    } catch (caught) {
      if (requestSequence.current !== requestId) return;
      if (silent) {
        setFeedback(`저장은 완료됐지만 최신 상태 재조회에 실패했습니다: ${formatApiError(caught)}`);
      } else {
        setError(formatApiError(caught));
      }
    } finally {
      if (requestSequence.current === requestId && !silent) setLoading(false);
    }
  }, [projectId, revokeAll]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadEditor();
    });
    return () => {
      active = false;
      requestSequence.current += 1;
      revokeAll();
    };
  }, [loadEditor, revokeAll]);

  const dirty = draft ? projectDraftSignature(draft) !== initialSignature : false;

  const setEditorDraft: Dispatch<SetStateAction<ProjectEditorDraft>> = useCallback((next) => {
    setDraft((current) => {
      if (!current) return current;
      return typeof next === "function" ? next(current) : next;
    });
  }, []);

  // Dirty 상태의 Editor 이탈 최소 확인
  const back = () => {
    if (dirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 목록으로 이동할까요?")) return;
    router.push("/admin/projects");
  };

  // Thumbnail File 검증·Local Preview 교체
  const selectThumbnail = (file: File) => {
    const validation = validateProjectImage(file);
    if (validation) {
      setFileError(validation);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.add(previewUrl);
    setFileError("");
    setDraft((current) => {
      if (!current) return current;
      revokeUrl(current.thumbnail.previewUrl);
      return { ...current, thumbnail: { ...current.thumbnail, mode: "UPLOAD", file, previewUrl } };
    });
  };

  const removeThumbnail = () => setDraft((current) => {
    if (!current) return current;
    revokeUrl(current.thumbnail.previewUrl);
    return { ...current, thumbnail: { ...current.thumbnail, mode: "REMOVE", file: null, previewUrl: null } };
  });

  // Carousel·Content 신규 File의 Client Key·Object URL 등록
  const addMedia = (file: File, mediaType: EditorMedia["mediaType"]) => {
    const validation = validateProjectImage(file);
    if (validation) {
      setFileError(validation);
      return null;
    }
    const clientKey = `new-${Date.now()}-${++clientKeySequence.current}`;
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.add(previewUrl);
    const item: EditorMedia = {
      key: `client-${clientKey}`,
      id: null,
      clientKey,
      mediaType,
      imageUrl: "",
      file,
      previewUrl,
      label: file.name,
      altText: "",
      displayOrder: draft?.media.filter((value) => value.mediaType === mediaType && !value.deleted).length ?? 0,
      deleted: false,
    };
    setDraft((current) => current ? { ...current, media: [...current.media, item] } : current);
    setFileError("");
    return item;
  };

  const clearMediaReferences = (current: ProjectEditorDraft, item: EditorMedia) => ({
    ...current.content,
    background: current.content.background.map((value) => ({ ...value, ...clearReference(value, item) })),
    features: current.content.features.map((value) => ({ ...value, ...clearReference(value, item) })),
    development: current.content.development.map((value) => ({ ...value, ...clearReference(value, item) })),
    engineering: current.content.engineering.map((value) => ({ ...value, ...clearReference(value, item) })),
  });

  // Media 삭제와 연결된 Content Item 참조 해제
  const deleteMedia = (key: string) => setDraft((current) => {
    if (!current) return current;
    const item = current.media.find((value) => value.key === key);
    if (!item) return current;
    const content = clearMediaReferences(current, item);
    if (item.id === null) {
      revokeUrl(item.previewUrl);
      return { ...current, content, media: current.media.filter((value) => value.key !== key) };
    }
    return { ...current, content, media: current.media.map((value) => value.key === key ? { ...value, deleted: true } : value) };
  });

  const changeMedia = (key: string, patch: Partial<EditorMedia>) => setDraft((current) => current ? {
    ...current,
    media: current.media.map((item) => item.key === key ? { ...item, ...patch } : item),
  } : current);

  // 동일 Media Type 내부 표시 순서 이동
  const moveMedia = (key: string, direction: -1 | 1) => setDraft((current) => {
    if (!current) return current;
    const source = current.media.find((item) => item.key === key);
    if (!source) return current;
    const group = current.media.filter((item) => item.mediaType === source.mediaType);
    const index = group.findIndex((item) => item.key === key);
    const target = index + direction;
    if (target < 0 || target >= group.length) return current;
    [group[index], group[target]] = [group[target], group[index]];
    const order = new Map(group.map((item, itemIndex) => [item.key, itemIndex]));
    return { ...current, media: current.media.map((item) => item.mediaType === source.mediaType ? { ...item, displayOrder: order.get(item.key) ?? item.displayOrder } : item) };
  });

  // Local Draft 전체를 PROJECT_UPDATE 1회 Multipart로 저장
  const save = () => {
    if (!draft || !dirty) return;
    if (!draft.project.name.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.project.slug)) {
      setFeedback("Name과 URL-safe Slug를 확인해 주세요.");
      setSection("basic");
      return;
    }
    const input = buildProjectSaveInput(draft);
    void adminAction.start({
      ...projectActionBindings.update(projectId),
      actionLabel: `${draft.project.name} 프로젝트 전체 저장`,
      mutation: (verification) => saveProject(projectId, input, verification),
      onSuccess: () => void loadEditor(true),
    });
  };

  if (loading) return <PageLoading rows={8} />;
  if (error || !draft || !detail) return <PageError message={error || "프로젝트를 불러오지 못했습니다."} onRetry={() => void loadEditor()} />;

  return (
    <div className={styles.projectEditorPage}>
      <header className={styles.projectEditorHeader}>
        <button className={`${styles.secondaryButton} type-body`} type="button" onClick={back}><ArrowLeft aria-hidden="true" />목록</button>
        <div><span className="type-small">Project #{detail.project.id}</span><h1 className="type-title">{draft.project.name || "Untitled Project"}</h1></div>
        <button className={`${styles.primaryButton} type-body`} type="button" disabled={!dirty || adminAction.issuing} onClick={save}><Save aria-hidden="true" />저장</button>
      </header>
      {feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}
      {adminAction.startError && <p className={`${styles.inlineError} type-small`} role="alert">{adminAction.startError}</p>}

      <div className={styles.projectMobileViewSwitch} role="group" aria-label="Editor 표시 영역">
        <button type="button" aria-pressed={mobileView === "editor"} onClick={() => setMobileView("editor")}><SlidersHorizontal aria-hidden="true" />Editor</button>
        <button type="button" aria-pressed={mobileView === "preview"} onClick={() => setMobileView("preview")}><Eye aria-hidden="true" />Preview</button>
      </div>

      <div className={styles.projectEditorLayout}>
        <aside className={styles.projectSectionNav} data-mobile-visible={mobileView === "editor" ? "true" : "false"}>
          <nav aria-label="Project Editor Section">{SECTIONS.map((item, index) => <button key={item.id} type="button" aria-current={section === item.id ? "step" : undefined} onClick={() => { setSection(item.id); setMobileView("editor"); }}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</button>)}</nav>
        </aside>
        <div className={styles.projectEditorWorkspace} data-mobile-visible={mobileView === "editor" ? "true" : "false"}>
          <ProjectEditorPanel
            section={section}
            draft={draft}
            setDraft={setEditorDraft}
            technologyMaster={technologyMaster}
            onThumbnailFile={selectThumbnail}
            onThumbnailRemove={removeThumbnail}
            onAddMedia={addMedia}
            onDeleteMedia={deleteMedia}
            onChangeMedia={changeMedia}
            onMoveMedia={moveMedia}
            fileError={fileError}
          />
        </div>
        <div className={styles.projectPreviewWorkspace} data-mobile-visible={mobileView === "preview" ? "true" : "false"}>
          <ProjectPreview draft={draft} technologyMaster={technologyMaster} />
        </div>
      </div>
      {adminAction.dialog && <AdminActionDialog {...adminAction.dialog} />}
    </div>
  );
}
