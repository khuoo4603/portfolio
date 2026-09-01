"use client";

import { ExternalLink as ExternalLinkIcon, MoreHorizontal, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatApiError } from "@/lib/api/client";
import type { ToolItem, ToolLink, ToolLinkCategory, ToolLinkInput, ToolsData } from "./admin-types";
import AdminActionDialog from "./admin-action-dialog";
import {
  createToolLink,
  deleteToolLink,
  getAdminTools,
  toolActionBindings,
  updateToolLink,
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
import { useAdminAction } from "./use-admin-action";
import styles from "./admin.module.css";

type LinkEditorState = { item?: ToolLink } | null;

function toolLinkInput(item: ToolLink, override: Partial<ToolLinkInput> = {}): ToolLinkInput {
  return {
    name: item.name,
    description: item.description,
    url: item.url,
    imageUrl: item.imageUrl,
    category: item.category,
    displayOrder: item.displayOrder,
    enabled: item.enabled,
    ...override,
  };
}

function LinkEditor({ state, onClose, onSubmit }: {
  state: LinkEditorState;
  onClose: () => void;
  onSubmit: (input: ToolLinkInput, item?: ToolLink) => void;
}) {
  const [name, setName] = useState(state?.item?.name ?? "");
  const [description, setDescription] = useState(state?.item?.description ?? "");
  const [url, setUrl] = useState(state?.item?.url ?? "");
  const [imageUrl, setImageUrl] = useState(state?.item?.imageUrl ?? "");
  const [category, setCategory] = useState<ToolLinkCategory>(state?.item?.category ?? "REFERENCE");
  const [displayOrder, setDisplayOrder] = useState(state?.item?.displayOrder ?? 0);
  const [enabled, setEnabled] = useState(state?.item?.enabled ?? true);
  const [error, setError] = useState("");

  const validUrl = (value: string, optional = false) => {
    if (optional && !value.trim()) return true;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return value.startsWith("/");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !url.trim()) {
      setError("이름과 URL을 입력해 주세요.");
      return;
    }
    if (!validUrl(url) || !validUrl(imageUrl, true)) {
      setError("URL은 http/https 주소 또는 /로 시작하는 경로여야 합니다.");
      return;
    }
    setError("");
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      url: url.trim(),
      imageUrl: imageUrl.trim() || null,
      category,
      displayOrder,
      enabled,
    }, state?.item);
  };

  return (
    <DialogFrame
      open={state !== null}
      title={state?.item ? "Link 수정" : "Link 추가"}
      description="Links Tool에서 공통으로 사용하는 링크 정보"
      onClose={onClose}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onClose}>취소</button>
          <SubmitButton busy={false} type="button" onClick={() => (document.getElementById("tool-link-form") as HTMLFormElement | null)?.requestSubmit()}>저장</SubmitButton>
        </>
      )}
    >
      <form id="tool-link-form" className={styles.editorForm} onSubmit={handleSubmit}>
        <label className={styles.formField}><span className="type-small">이름</span><input className="type-body" value={name} onChange={(event) => setName(event.currentTarget.value)} /></label>
        <label className={styles.formField}><span className="type-small">설명</span><textarea className="type-body" rows={3} value={description} onChange={(event) => setDescription(event.currentTarget.value)} /></label>
        <label className={styles.formField}><span className="type-small">URL</span><input className="type-body" value={url} onChange={(event) => setUrl(event.currentTarget.value)} /></label>
        <label className={styles.formField}><span className="type-small">대표 이미지 URL</span><input className="type-body" value={imageUrl} onChange={(event) => setImageUrl(event.currentTarget.value)} /><code>imageUrl</code></label>
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
  const [feedback, setFeedback] = useState("");
  const requestSequence = useRef(0);
  const adminAction = useAdminAction();

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

  const changeToolStatus = (tool: ToolItem) => {
    void adminAction.start({
      ...toolActionBindings.status(tool.toolKey),
      actionLabel: `${tool.name} Tool ${tool.enabled ? "비활성화" : "활성화"}`,
      mutation: (verification) => updateToolStatus(tool.toolKey, !tool.enabled, verification),
      onSuccess: () => complete("Tool 상태를 변경했습니다."),
    });
  };

  const saveLink = (input: ToolLinkInput, item?: ToolLink) => {
    setEditor(null);
    void adminAction.start({
      ...(item ? toolActionBindings.linkUpdate(item.id) : toolActionBindings.linkCreate()),
      actionLabel: item ? `${item.name} Link 수정` : `${input.name} Link 추가`,
      mutation: (verification) => item ? updateToolLink(item.id, input, verification) : createToolLink(input, verification),
      onSuccess: () => complete(item ? "Tool Link를 수정했습니다." : "Tool Link를 추가했습니다."),
    });
  };

  const deleteLink = (item: ToolLink) => {
    setMenuId(null);
    void adminAction.start({
      ...toolActionBindings.linkDelete(item.id),
      actionLabel: `${item.name} Link 삭제`,
      mutation: (verification) => deleteToolLink(item.id, verification),
      onSuccess: () => complete("Tool Link를 삭제했습니다."),
    });
  };

  const changeLinkStatus = (item: ToolLink) => {
    void adminAction.start({
      ...toolActionBindings.linkUpdate(item.id),
      actionLabel: `${item.name} Link ${item.enabled ? "비노출" : "노출"} 전환`,
      mutation: (verification) => updateToolLink(item.id, toolLinkInput(item, { enabled: !item.enabled }), verification),
      onSuccess: () => complete("Tool Link 상태를 변경했습니다."),
    });
  };

  return (
    <>
      <PageHeader title="Tools" description="코드에 등록된 Tool의 공개 상태와 Links 공통 데이터를 관리합니다." />
      {feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}
      {adminAction.startError && <p className={`${styles.inlineError} type-small`} role="alert">{adminAction.startError}</p>}
      {loading ? <PageLoading rows={6} /> : error ? <PageError message={error} onRetry={() => void loadTools()} /> : data ? (
        <div className={styles.pageSections}>
          <section className={styles.operationalSection} aria-labelledby="tool-status-title">
            <div className={styles.sectionHeading}><div><h2 id="tool-status-title" className="type-title">Tool 상태</h2></div></div>
            {data.tools.length === 0 ? <EmptyState title="등록 Tool 없음" description="Backend Tool Registry 항목이 없습니다." /> : (
              <div className={styles.toolRows}>{data.tools.map((tool) => (
                <div key={tool.toolKey} className={styles.toolRow}>
                  <div className={styles.toolIdentity}><span className={styles.toolMark}>{tool.name.slice(0, 1).toUpperCase()}</span><div><strong className="type-body">{tool.name}</strong><code>{tool.toolKey}</code></div></div>
                  <StatusLabel tone={tool.enabled ? "success" : "neutral"}>{tool.enabled ? "활성" : "비활성"}</StatusLabel>
                  <StateSwitch enabled={tool.enabled} disabled={adminAction.issuing} onClick={() => changeToolStatus(tool)} label={`${tool.name} Tool ${tool.enabled ? "비활성화" : "활성화"}`} />
                </div>
              ))}</div>
            )}
          </section>
          <section className={styles.operationalSection} aria-labelledby="tool-links-title">
            <div className={styles.sectionHeading}><div><h2 id="tool-links-title" className="type-title">Links 데이터</h2></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => setEditor({})}><Plus aria-hidden="true" />Link 추가</button></div>
            {data.links.length === 0 ? <EmptyState title="등록 Link 없음" description="Links Tool에 표시할 링크가 없습니다." /> : (
              <div className={styles.dataTableWrap}><table className={styles.dataTable}><thead><tr><th>Link</th><th>분류</th><th>대표 이미지</th><th>순서</th><th>상태</th><th><span className={styles.srOnly}>작업</span></th></tr></thead><tbody>
                {data.links.map((link) => <tr key={link.id}>
                  <td data-label="Link"><div className={styles.linkIdentity}><ExternalLinkIcon aria-hidden="true" /><div><strong>{link.name}</strong><span>{link.description || "설명 없음"}</span><code>{link.url}</code></div></div></td>
                  <td data-label="분류"><code>{link.category}</code></td><td data-label="대표 이미지"><code>{link.imageUrl || "기본 Preview"}</code></td><td data-label="순서">{link.displayOrder}</td>
                  <td data-label="상태"><StateSwitch enabled={link.enabled} disabled={adminAction.issuing} onClick={() => changeLinkStatus(link)} label={`${link.name} Link ${link.enabled ? "비노출" : "노출"} 전환`} /></td>
                  <td className={styles.actionCell}><button className={styles.iconButton} type="button" onClick={() => setMenuId((current) => current === link.id ? null : link.id)} aria-label={`${link.name} Link 작업`} aria-expanded={menuId === link.id}><MoreHorizontal aria-hidden="true" /></button>{menuId === link.id && <div className={styles.rowMenu}><button type="button" onClick={() => { setMenuId(null); setEditor({ item: link }); }}>수정</button><button type="button" onClick={() => deleteLink(link)}>삭제</button></div>}</td>
                </tr>)}
              </tbody></table></div>
            )}
          </section>
        </div>
      ) : null}
      {editor && <LinkEditor key={editor.item?.id ?? "new"} state={editor} onClose={() => setEditor(null)} onSubmit={saveLink} />}
      {adminAction.dialog && <AdminActionDialog {...adminAction.dialog} />}
    </>
  );
}
