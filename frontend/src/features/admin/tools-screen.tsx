"use client";

import NextImage from "next/image";
import { ExternalLink as ExternalLinkIcon, Image as ImageIcon, MoreHorizontal, Plus, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatApiError } from "@/lib/api/client";
import type {
  ToolItem,
  ToolLink,
  ToolLinkCategory,
  ToolLinkCreateMetadata,
  ToolLinkMutation,
  ToolLinkUpdateImageMode,
  ToolLinkUpdateMetadata,
  ToolsData,
} from "./admin-types";
import {
  createToolLink,
  deleteToolLink,
  getAdminTools,
  updateToolLink,
  updateToolLinkEnabled,
  updateToolStatus,
} from "./admin-tool-api";
import DialogFrame from "./dialog-frame";
import {
  EmptyState,
  PageError,
  PageHeader,
  PageLoading,
  StateSwitch,
  StatusLabel,
  SubmitButton,
} from "./admin-ui";
import styles from "./admin.module.css";

type LinkEditorState = { item?: ToolLink } | null;
type LinkFilter = "ALL" | ToolLinkCategory;
type LinkEditorSubmission = ToolLinkMutation<ToolLinkCreateMetadata | ToolLinkUpdateMetadata>;

const DEFAULT_LINK_IMAGE_URL = "/images/tools/links/default-link-preview.svg";
const LINK_FILTERS: ReadonlyArray<{ value: LinkFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "REFERENCE", label: "Reference" },
  { value: "MY_SERVICES", label: "My Services" },
];

function LinkEditor({ state, onClose, onSubmit }: {
  state: LinkEditorState;
  onClose: () => void;
  onSubmit: (input: LinkEditorSubmission, item?: ToolLink) => void;
}) {
  const [name, setName] = useState(state?.item?.name ?? "");
  const [description, setDescription] = useState(state?.item?.description ?? "");
  const [url, setUrl] = useState(state?.item?.url ?? "");
  const [category, setCategory] = useState<ToolLinkCategory>(state?.item?.category ?? "REFERENCE");
  const [displayOrder, setDisplayOrder] = useState(state?.item?.displayOrder ?? 0);
  const [enabled, setEnabled] = useState(state?.item?.enabled ?? true);
  const [imageMode, setImageMode] = useState<ToolLinkUpdateImageMode>(state?.item ? "KEEP" : "DEFAULT");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(state?.item?.imageUrl ?? DEFAULT_LINK_IMAGE_URL);
  const [error, setError] = useState("");
  const objectUrl = useRef<string | null>(null);

  const validUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const releaseObjectUrl = useCallback(() => {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }, []);

  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

  const closeEditor = () => {
    releaseObjectUrl();
    onClose();
  };

  // 선택 파일의 Local Preview 생성과 이전 Object URL 정리
  const selectImage = (selected?: File) => {
    if (!selected) return;
    releaseObjectUrl();
    const nextPreview = URL.createObjectURL(selected);
    objectUrl.current = nextPreview;
    setImage(selected);
    setImageMode("UPLOAD");
    setPreviewUrl(nextPreview);
  };

  // Custom Image 제거와 기존 Default Preview 복귀
  const selectDefault = () => {
    releaseObjectUrl();
    setImage(null);
    setImageMode("DEFAULT");
    setPreviewUrl(DEFAULT_LINK_IMAGE_URL);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !url.trim()) {
      setError("이름과 URL을 입력해 주세요.");
      return;
    }
    if (!validUrl(url)) {
      setError("URL은 http/https 주소여야 합니다.");
      return;
    }
    setError("");
    const fields = {
      name: name.trim(),
      description: description.trim() || null,
      url: url.trim(),
      category,
      displayOrder,
      enabled,
    };
    const metadata = state?.item
      ? { ...fields, imageMode }
      : { ...fields, imageMode: imageMode === "UPLOAD" ? "UPLOAD" as const : "DEFAULT" as const };
    onSubmit({ metadata, image }, state?.item);
  };

  return (
    <DialogFrame
      open={state !== null}
      title={state?.item ? "Link 수정" : "Link 추가"}
      description="Links Tool에서 공통으로 사용하는 링크 정보"
      onClose={closeEditor}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={closeEditor}>취소</button>
          <SubmitButton busy={false} type="button" onClick={() => (document.getElementById("tool-link-form") as HTMLFormElement | null)?.requestSubmit()}>저장</SubmitButton>
        </>
      )}
    >
      <form id="tool-link-form" className={styles.editorForm} onSubmit={handleSubmit}>
        <label className={styles.formField}><span className="type-small">이름</span><input className="type-body" value={name} onChange={(event) => setName(event.currentTarget.value)} /></label>
        <label className={styles.formField}><span className="type-small">설명</span><textarea className="type-body" rows={3} value={description} onChange={(event) => setDescription(event.currentTarget.value)} /></label>
        <label className={styles.formField}><span className="type-small">URL</span><input className="type-body" value={url} onChange={(event) => setUrl(event.currentTarget.value)} /></label>
        <div className={styles.linkImageEditor}>
          <div className={styles.linkImagePreview}>
            <NextImage
              alt="대표 이미지 Preview"
              fill
              onError={() => setPreviewUrl(DEFAULT_LINK_IMAGE_URL)}
              sizes="320px"
              src={previewUrl}
              unoptimized
            />
          </div>
          <div className={styles.linkImageControls}>
            <span className="type-small">대표 이미지</span>
            <div className={styles.linkImageActions}>
              <button className={`${styles.secondaryButton} type-body`} type="button" aria-pressed={imageMode === "DEFAULT"} onClick={selectDefault}><ImageIcon aria-hidden="true" />기본 Preview</button>
              <input id="tool-link-image" className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => selectImage(event.currentTarget.files?.[0])} />
              <label className={`${styles.secondaryButton} type-body`} htmlFor="tool-link-image"><Upload aria-hidden="true" />이미지 첨부</label>
            </div>
            <span className={`${styles.selectedFileName} type-small`}>{image ? image.name : imageMode === "KEEP" ? "기존 이미지 유지" : "기본 Preview 사용"}</span>
          </div>
        </div>
        <div className={styles.formColumns}>
          <label className={styles.formField}><span className="type-small">분류</span><select className="type-body" value={category} onChange={(event) => setCategory(event.currentTarget.value as ToolLinkCategory)}><option value="REFERENCE">REFERENCE</option><option value="MY_SERVICES">MY_SERVICES</option></select></label>
          <label className={styles.formField}><span className="type-small">표시 순서</span><input className="type-body" type="number" min="0" value={displayOrder} onChange={(event) => setDisplayOrder(Number(event.currentTarget.value))} /></label>
        </div>
        <label className={styles.checkboxField}><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} /><span className="type-body">노출 ON</span></label>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}

export default function ToolsScreen() {
  const [data, setData] = useState<ToolsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<LinkEditorState>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("ALL");
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [feedback, setFeedback] = useState("");
  const requestSequence = useRef(0);

  const loadTools = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError("");
    try {
      const response = await getAdminTools();
      if (requestSequence.current === requestId) setData(response);
    } catch (caught) {
      if (requestSequence.current === requestId) {
        setData(null);
        setError(formatApiError(caught));
      }
    } finally {
      if (requestSequence.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void loadTools(); });
    return () => {
      active = false;
      requestSequence.current += 1;
    };
  }, [loadTools]);

  const complete = (message: string) => {
    setFeedback(message);
    setMenuId(null);
    void loadTools();
  };

  const runMutation = async (mutation: () => Promise<unknown>, successMessage: string) => {
    if (mutating) return;
    setMutating(true);
    setMutationError("");
    try {
      await mutation();
      complete(successMessage);
    } catch (caught) {
      setMutationError(formatApiError(caught));
    } finally {
      setMutating(false);
    }
  };

  // Tool Registry 상태 JSON 변경
  const changeToolStatus = (tool: ToolItem) => {
    void runMutation(
      () => updateToolStatus(tool.toolKey, { enabled: !tool.enabled }),
      "Tool 상태를 변경했습니다.",
    );
  };

  // Tool Link Metadata와 선택 이미지 저장
  const saveLink = (input: LinkEditorSubmission, item?: ToolLink) => {
    setEditor(null);
    void runMutation(
      () => item
        ? updateToolLink(item.id, input as ToolLinkMutation<ToolLinkUpdateMetadata>)
        : createToolLink(input as ToolLinkMutation<ToolLinkCreateMetadata>),
      item ? "Tool Link를 수정했습니다." : "Tool Link를 추가했습니다.",
    );
  };

  // Tool Link 삭제
  const deleteLink = (item: ToolLink) => {
    setMenuId(null);
    void runMutation(() => deleteToolLink(item.id), "Tool Link를 삭제했습니다.");
  };

  // Tool Link enabled 전용 Multipart KEEP 변경
  const changeLinkStatus = (item: ToolLink) => {
    void runMutation(
      () => updateToolLinkEnabled(item.id, !item.enabled),
      "Tool Link 상태를 변경했습니다.",
    );
  };

  const filteredLinks = data?.links.filter((link) => linkFilter === "ALL" || link.category === linkFilter) ?? [];

  return (
    <>
      <PageHeader title="Tools" description="코드에 등록된 Tool의 공개 상태와 Links 공통 데이터를 관리합니다." />
      {feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}
      {mutationError && <p className={`${styles.inlineError} type-small`} role="alert">{mutationError}</p>}
      {loading ? <PageLoading rows={6} /> : error ? <PageError message={error} onRetry={() => void loadTools()} /> : data ? (
        <div className={styles.pageSections}>
          <section className={styles.operationalSection} aria-labelledby="tool-status-title">
            <div className={styles.sectionHeading}><div><h2 id="tool-status-title" className="type-title">Tool 상태</h2></div></div>
            {data.tools.length === 0 ? <EmptyState title="등록 Tool 없음" description="Backend Tool Registry 항목이 없습니다." /> : (
              <div className={styles.toolRows}>{data.tools.map((tool) => (
                <div key={tool.toolKey} className={styles.toolRow}>
                  <div className={styles.toolIdentity}><span className={styles.toolMark}>{tool.name.slice(0, 1).toUpperCase()}</span><div><strong className="type-body">{tool.name}</strong><code>{tool.toolKey}</code></div></div>
                  <StatusLabel tone={tool.enabled ? "success" : "neutral"}>{tool.enabled ? "활성" : "비활성"}</StatusLabel>
                  <StateSwitch enabled={tool.enabled} disabled={mutating} onClick={() => changeToolStatus(tool)} label={`${tool.name} Tool ${tool.enabled ? "비활성화" : "활성화"}`} />
                </div>
              ))}</div>
            )}
          </section>
          <section className={styles.operationalSection} aria-labelledby="tool-links-title">
            <div className={styles.sectionHeading}><div><h2 id="tool-links-title" className="type-title">Links 데이터</h2></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => setEditor({})}><Plus aria-hidden="true" />Link 추가</button></div>
            <div className={styles.linkFilters} role="group" aria-label="Link 분류">
              {LINK_FILTERS.map((filter) => (
                <button key={filter.value} className="type-body" type="button" aria-pressed={linkFilter === filter.value} onClick={() => setLinkFilter(filter.value)}>{filter.label}</button>
              ))}
            </div>
            {data.links.length === 0 ? <EmptyState title="등록 Link 없음" description="Links Tool에 표시할 링크가 없습니다." /> : (
              <div className={styles.dataTableWrap}><table className={styles.dataTable}><thead><tr><th>Link</th><th>분류</th><th>대표 이미지</th><th>순서</th><th>상태</th><th><span className={styles.srOnly}>작업</span></th></tr></thead><tbody>
                {filteredLinks.map((link) => <tr key={link.id}>
                  <td data-label="Link"><div className={styles.linkIdentity}><ExternalLinkIcon aria-hidden="true" /><div><strong>{link.name}</strong><span>{link.description || "설명 없음"}</span><code>{link.url}</code></div></div></td>
                  <td data-label="분류"><code>{link.category}</code></td><td data-label="대표 이미지"><code>{link.imageUrl || "기본 Preview"}</code></td><td data-label="순서">{link.displayOrder}</td>
                  <td data-label="상태"><StateSwitch enabled={link.enabled} disabled={mutating} onClick={() => changeLinkStatus(link)} label={`${link.name} Link ${link.enabled ? "비노출" : "노출"} 전환`} /></td>
                  <td className={styles.actionCell}><button className={styles.iconButton} type="button" onClick={() => setMenuId((current) => current === link.id ? null : link.id)} aria-label={`${link.name} Link 작업`} aria-expanded={menuId === link.id}><MoreHorizontal aria-hidden="true" /></button>{menuId === link.id && <div className={styles.rowMenu}><button type="button" onClick={() => { setMenuId(null); setEditor({ item: link }); }}>수정</button><button type="button" onClick={() => deleteLink(link)}>삭제</button></div>}</td>
                </tr>)}
              </tbody></table></div>
            )}
          </section>
        </div>
      ) : null}
      {editor && <LinkEditor key={editor.item?.id ?? "new"} state={editor} onClose={() => setEditor(null)} onSubmit={saveLink} />}
    </>
  );
}
