"use client";

import { ExternalLink as ExternalLinkIcon, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import type {
  ToolItem,
  ToolLink,
  ToolLinkCategory,
  ToolLinkInput,
} from "./admin-types";
import AdminActionDialog from "./admin-action-dialog";
import DialogFrame from "./dialog-frame";
import {
  EmptyState,
  PageHeader,
  StateSwitch,
  StatusLabel,
  SubmitButton,
} from "./admin-ui";
import { MOCK_TOOL_LINKS, MOCK_TOOLS } from "./mock-data";
import styles from "./admin.module.css";

type PendingAction = {
  label: string;
  run: () => void;
};

type LinkEditorState = {
  item?: ToolLink;
} | null;

// Tool Link 화면 Model 기반 Editor
function LinkEditor({
  state,
  onClose,
  onSubmit,
}: {
  state: LinkEditorState;
  onClose: () => void;
  onSubmit: (input: ToolLinkInput, item?: ToolLink) => void;
}) {
  const [name, setName] = useState(state?.item?.name || "");
  const [description, setDescription] = useState(state?.item?.description || "");
  const [url, setUrl] = useState(state?.item?.url || "");
  const [category, setCategory] = useState<ToolLinkCategory>(state?.item?.category || "REFERENCE");
  const [displayOrder, setDisplayOrder] = useState(state?.item?.displayOrder || 0);
  const [enabled, setEnabled] = useState(state?.item?.enabled ?? true);
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
      setError("http 또는 https URL을 입력해 주세요.");
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      url: url.trim(),
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
          <SubmitButton busy={false} type="button" onClick={() => (document.getElementById("tool-link-form") as HTMLFormElement | null)?.requestSubmit()}>
            인증 후 저장
          </SubmitButton>
        </>
      )}
    >
      <form id="tool-link-form" className={styles.editorForm} onSubmit={handleSubmit}>
        <label className={styles.formField}>
          <span className="type-small">이름</span>
          <input className="type-body" value={name} onChange={(event) => setName(event.currentTarget.value)} />
        </label>
        <label className={styles.formField}>
          <span className="type-small">설명</span>
          <textarea className="type-body" rows={3} value={description} onChange={(event) => setDescription(event.currentTarget.value)} />
        </label>
        <label className={styles.formField}>
          <span className="type-small">URL</span>
          <input className="type-body" type="url" value={url} onChange={(event) => setUrl(event.currentTarget.value)} />
        </label>
        <div className={styles.formColumns}>
          <label className={styles.formField}>
            <span className="type-small">분류</span>
            <select className="type-body" value={category} onChange={(event) => setCategory(event.currentTarget.value as ToolLinkCategory)}>
              <option value="REFERENCE">REFERENCE</option>
              <option value="DEVELOPMENT">DEVELOPMENT</option>
              <option value="MY_SERVICES">MY_SERVICES</option>
              <option value="PERSONAL">PERSONAL</option>
            </select>
          </label>
          <label className={styles.formField}>
            <span className="type-small">표시 순서</span>
            <input className="type-body" type="number" min="0" value={displayOrder} onChange={(event) => setDisplayOrder(Number(event.currentTarget.value))} />
          </label>
        </div>
        <label className={styles.checkboxField}>
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} />
          <span className="type-body">노출 ON</span>
        </label>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}

// 코드 Registry Tool 상태와 Links 데이터를 분리한 운영 화면
export default function ToolsScreen() {
  const [tools, setTools] = useState<ToolItem[]>(MOCK_TOOLS);
  const [links, setLinks] = useState<ToolLink[]>(MOCK_TOOL_LINKS);
  const [editor, setEditor] = useState<LinkEditorState>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState("");

  // Tool 활성 상태의 로컬 변경용 재인증 대기열
  const queueTool = (tool: ToolItem) => {
    setPending({
      label: `${tool.name} Tool ${tool.enabled ? "비활성화" : "활성화"}`,
      run: () => setTools((current) => current.map((item) => (
        item.toolKey === tool.toolKey
          ? { ...item, enabled: !item.enabled, updatedAt: new Date().toISOString() }
          : item
      ))),
    });
  };

  // Link의 로컬 추가·수정용 재인증 대기열
  const queueLinkSave = (input: ToolLinkInput, item?: ToolLink) => {
    setEditor(null);
    setPending(item ? {
      label: `${item.name} Link 수정`,
      run: () => setLinks((current) => current.map((link) => (
        link.id === item.id ? { ...link, ...input } : link
      ))),
    } : {
      label: `${input.name} Link 추가`,
      run: () => setLinks((current) => [
        ...current,
        { ...input, id: current.reduce((largest, link) => Math.max(largest, link.id), 0) + 1 },
      ]),
    });
  };

  // Link의 로컬 삭제용 재인증 대기열
  const queueLinkDelete = (item: ToolLink) => {
    setMenuId(null);
    setPending({
      label: `${item.name} Link 삭제`,
      run: () => setLinks((current) => current.filter((link) => link.id !== item.id)),
    });
  };

  // Link 노출 상태의 로컬 변경용 재인증 대기열
  const queueLinkStatus = (item: ToolLink) => {
    setPending({
      label: `${item.name} Link ${item.enabled ? "비노출" : "노출"} 전환`,
      run: () => setLinks((current) => current.map((link) => (
        link.id === item.id ? { ...link, enabled: !link.enabled } : link
      ))),
    });
  };

  return (
    <>
      <PageHeader
        title="Tools"
        description="코드에 등록된 Tool의 공개 상태와 Links 공통 데이터를 관리합니다."
      />

      {feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}

      <div className={styles.pageSections}>
          <section className={styles.operationalSection} aria-labelledby="tool-status-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="tool-status-title" className="type-title">Tool 상태</h2>
              </div>
            </div>
            {tools.length === 0 ? (
              <EmptyState title="등록 Tool 없음" description="Mock Tool Registry 항목이 없습니다." />
            ) : (
              <div className={styles.toolRows}>
                {tools.map((tool) => (
                  <div key={tool.toolKey} className={styles.toolRow}>
                    <div className={styles.toolIdentity}>
                      <span className={styles.toolMark}>{tool.name.slice(0, 1).toUpperCase()}</span>
                      <div>
                        <strong className="type-body">{tool.name}</strong>
                        <code>{tool.toolKey}</code>
                      </div>
                    </div>
                    <StatusLabel tone={tool.enabled ? "success" : "neutral"}>{tool.enabled ? "활성" : "비활성"}</StatusLabel>
                    <StateSwitch
                      enabled={tool.enabled}
                      onClick={() => queueTool(tool)}
                      label={`${tool.name} Tool ${tool.enabled ? "비활성화" : "활성화"}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.operationalSection} aria-labelledby="tool-links-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="tool-links-title" className="type-title">Links 데이터</h2>
              </div>
              <button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => setEditor({})}>
                <Plus aria-hidden="true" />
                Link 추가
              </button>
            </div>
            {links.length === 0 ? (
              <EmptyState title="등록 Link 없음" description="Links Tool에 표시할 공통 링크가 없습니다." />
            ) : (
              <div className={styles.dataTableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Link</th>
                      <th>분류</th>
                      <th>순서</th>
                      <th>상태</th>
                      <th><span className={styles.srOnly}>작업</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => (
                      <tr key={link.id}>
                        <td data-label="Link">
                          <div className={styles.linkIdentity}>
                            <ExternalLinkIcon aria-hidden="true" />
                            <div>
                              <strong>{link.name}</strong>
                              <span>{link.description || "설명 없음"}</span>
                              <code>{link.url}</code>
                            </div>
                          </div>
                        </td>
                        <td data-label="분류"><code>{link.category}</code></td>
                        <td data-label="순서">{link.displayOrder}</td>
                        <td data-label="상태">
                          <StateSwitch
                            enabled={link.enabled}
                            onClick={() => queueLinkStatus(link)}
                            label={`${link.name} Link ${link.enabled ? "비노출" : "노출"} 전환`}
                          />
                        </td>
                        <td className={styles.actionCell}>
                          <button
                            className={styles.iconButton}
                            type="button"
                            onClick={() => setMenuId((current) => current === link.id ? null : link.id)}
                            aria-label={`${link.name} Link 작업`}
                            aria-expanded={menuId === link.id}
                          >
                            <MoreHorizontal aria-hidden="true" />
                          </button>
                          {menuId === link.id && (
                            <div className={styles.rowMenu}>
                              <button type="button" onClick={() => { setMenuId(null); setEditor({ item: link }); }}>수정</button>
                              <button type="button" onClick={() => queueLinkDelete(link)}>삭제</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
      </div>

      {editor && <LinkEditor key={editor.item?.id || "new"} state={editor} onClose={() => setEditor(null)} onSubmit={queueLinkSave} />}
      {pending && (
        <AdminActionDialog
          key={pending.label}
          open
          actionLabel={pending.label}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            pending.run();
            setPending(null);
            setFeedback("Tool 관리 변경을 반영했습니다.");
          }}
        />
      )}
    </>
  );
}
