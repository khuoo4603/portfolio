"use client";

import NextImage from "next/image";
import { Edit3, ExternalLink as ExternalLinkIcon, Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button, { buttonClassName } from "@/components/ui/button";
import Select from "@/components/ui/select";
import { useNotification } from "@/components/ui/notification/notification-provider";
import SegmentedControl from "@/components/ui/segmented-control";
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
  reorderToolLinks,
  updateToolLink,
  updateToolLinkEnabled,
  updateToolStatus,
} from "./admin-tool-api";
import DialogFrame from "@/components/ui/dialog-frame";
import {
  EmptyState,
  PageError,
  PageHeader,
  PageLoading,
  StateSwitch,
} from "./admin-ui";
import styles from "./admin.module.css";
import OrderManagementDialog from "./order-management-dialog";
import SortableList from "./sortable-list";

type LinkEditorState = { item?: ToolLink } | null;
type LinkFilter = "ALL" | ToolLinkCategory;
type LinkEditorSubmission = ToolLinkMutation<ToolLinkCreateMetadata | ToolLinkUpdateMetadata>;

const DEFAULT_LINK_IMAGE_URL = "/images/tools/links/default-link-preview.svg";
const LINK_FILTERS: ReadonlyArray<{ value: LinkFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "REFERENCE", label: "Reference" },
  { value: "MY_SERVICES", label: "My Services" },
];

type ToolLinkOrderDrafts = Record<ToolLinkCategory, ToolLink[]>;
const TOOL_LINK_ORDER_GROUPS = LINK_FILTERS.filter((item): item is { value: ToolLinkCategory; label: string } => item.value !== "ALL");

// Tool Link Draft의 현재 배열 순서를 분류별로 보존
function groupToolLinkOrder(items: ToolLink[]): ToolLinkOrderDrafts {
  return {
    REFERENCE: items.filter((item) => item.category === "REFERENCE"),
    MY_SERVICES: items.filter((item) => item.category === "MY_SERVICES"),
  };
}

// Tool Link의 서버 순서를 분류별 Draft로 변환
function makeToolLinkOrderDrafts(items: ToolLink[]): ToolLinkOrderDrafts {
  const sorted = [...items].sort((left, right) => left.displayOrder - right.displayOrder || left.id - right.id);
  return groupToolLinkOrder(sorted);
}

// 그룹별 Draft를 기존 전역 순서의 분류 위치에 다시 주입
function mergeToolLinkOrder(baseOrder: ToolLink[], drafts: ToolLinkOrderDrafts) {
  const queues: ToolLinkOrderDrafts = {
    REFERENCE: [...drafts.REFERENCE],
    MY_SERVICES: [...drafts.MY_SERVICES],
  };
  return baseOrder.map((item) => queues[item.category].shift() ?? item);
}

function LinkEditor({ state, onClose, onSubmit }: {
  state: LinkEditorState;
  onClose: () => void;
  onSubmit: (input: LinkEditorSubmission, item?: ToolLink) => void;
}) {
  const [name, setName] = useState(state?.item?.name ?? "");
  const [description, setDescription] = useState(state?.item?.description ?? "");
  const [url, setUrl] = useState(state?.item?.url ?? "");
  const [category, setCategory] = useState<ToolLinkCategory>(state?.item?.category ?? "REFERENCE");
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
      variant="admin"
      title={state?.item ? "Link 수정" : "Link 추가"}
      onClose={closeEditor}
      footer={(
        <>
          <Button variant="secondary" type="button" onClick={closeEditor}>취소</Button>
          <Button type="button" onClick={() => (document.getElementById("tool-link-form") as HTMLFormElement | null)?.requestSubmit()}>저장</Button>
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
              <Button variant="secondary" type="button" aria-pressed={imageMode === "DEFAULT"} onClick={selectDefault}><ImageIcon aria-hidden="true" />기본 Preview</Button>
              <input id="tool-link-image" className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => selectImage(event.currentTarget.files?.[0])} />
              <label className={buttonClassName({ variant: "secondary", size: "medium", className: "type-body" })} htmlFor="tool-link-image"><Upload aria-hidden="true" />이미지 첨부</label>
            </div>
            <span className={`${styles.selectedFileName} type-small`}>{image ? image.name : imageMode === "KEEP" ? "기존 이미지 유지" : "기본 Preview 사용"}</span>
          </div>
        </div>
        <div className={styles.formColumns}>
          <label className={styles.formField}><span className="type-small">분류</span><Select aria-label="링크 분류" value={category} onValueChange={(value) => setCategory(value as ToolLinkCategory)} options={[{ value: "REFERENCE", label: "REFERENCE" }, { value: "MY_SERVICES", label: "MY_SERVICES" }]} /></label>
        </div>
        <label className={styles.checkboxField}><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} /><span className="type-body">노출 ON</span></label>
        <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
      </form>
    </DialogFrame>
  );
}

export default function ToolsScreen() {
  const { notify } = useNotification();
  const [data, setData] = useState<ToolsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<LinkEditorState>(null);
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("ALL");
  const [orderDraft, setOrderDraft] = useState<ToolLink[]>([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const orderOpenRef = useRef(false);
  const [mutating, setMutating] = useState(false);
  const requestSequence = useRef(0);

  const loadTools = useCallback(async (silent = false) => {
    const requestId = ++requestSequence.current;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const response = await getAdminTools();
      if (requestSequence.current === requestId) {
        setData(response);
        if (!orderOpenRef.current) {
          setOrderDraft([...response.links].sort((left, right) => left.displayOrder - right.displayOrder || left.id - right.id));
        }
      }
    } catch (caught) {
      if (requestSequence.current === requestId) {
        if (silent) {
          notify({
            type: "error",
            title: "최신 데이터 조회 실패",
            message: "변경은 완료되었지만 최신 Tools 데이터를 불러오지 못했습니다.",
          });
        } else {
          setData(null);
          setError(formatApiError(caught));
        }
      }
    } finally {
      if (!silent && requestSequence.current === requestId) setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void loadTools(); });
    return () => {
      active = false;
      requestSequence.current += 1;
    };
  }, [loadTools]);

  const complete = (message: string) => {
    notify({ type: "success", title: "Tools 변경 완료", message });
    void loadTools(true);
  };

  const runMutation = async (mutation: () => Promise<unknown>, successMessage: string) => {
    if (mutating) return;
    setMutating(true);
    try {
      await mutation();
      complete(successMessage);
    } catch (caught) {
      notify({ type: "error", title: "Tools 변경 실패", message: formatApiError(caught) });
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
    void runMutation(() => deleteToolLink(item.id), "Tool Link를 삭제했습니다.");
  };

  // Tool Link enabled 전용 Multipart KEEP 변경
  const changeLinkStatus = (item: ToolLink) => {
    void runMutation(
      () => updateToolLinkEnabled(item.id, !item.enabled),
      "Tool Link 상태를 변경했습니다.",
    );
  };

  const currentOrder = [...(data?.links ?? [])].sort((left, right) => left.displayOrder - right.displayOrder || left.id - right.id);
  const orderDraftGroups = groupToolLinkOrder(orderDraft);
  const currentOrderGroups = makeToolLinkOrderDrafts(currentOrder);
  const orderChanged = TOOL_LINK_ORDER_GROUPS.some((group) => JSON.stringify(orderDraftGroups[group.value].map((link) => link.id)) !== JSON.stringify(currentOrderGroups[group.value].map((link) => link.id)));

  const openOrder = () => {
    setOrderDraft([...currentOrder]);
    orderOpenRef.current = true;
    setOrderOpen(true);
  };

  const closeOrder = () => {
    orderOpenRef.current = false;
    setOrderOpen(false);
  };

  const updateOrderGroup = (category: ToolLinkCategory, items: ToolLink[]) => {
    setOrderDraft((current) => mergeToolLinkOrder(currentOrder, { ...groupToolLinkOrder(current), [category]: items }));
  };

  // CSRF 보호 세션 기반 Tool Link 순서 저장
  const saveOrder = () => {
    void runMutation(
      () => reorderToolLinks({ orderedIds: orderDraft.map((link) => link.id), expectedIds: currentOrder.map((link) => link.id) }),
      "Tool Link 표시 순서를 저장했습니다.",
    );
  };

  const filteredLinks = currentOrder.filter((link) => linkFilter === "ALL" || link.category === linkFilter);

  return (
    <>
      <PageHeader title="Tools" description="코드에 등록된 Tool의 공개 상태와 Links 공통 데이터를 관리합니다." />
      {loading ? <PageLoading rows={6} /> : error ? <PageError message={error} onRetry={() => void loadTools()} /> : data ? (
        <div className={styles.pageSections}>
          <section className={`${styles.managementSurface} ${styles.operationalSection}`} aria-label="Tool 상태 관리">
            <div className={styles.managementSurfaceHeader}><div><h2 id="tool-status-title" className="type-title">Tool 상태</h2></div></div>
            {data.tools.length === 0 ? <EmptyState title="등록 Tool 없음" description="Backend Tool Registry 항목이 없습니다." /> : (
              <div className={styles.toolRows}>{data.tools.map((tool) => (
                <div key={tool.toolKey} className={styles.toolRow}>
                  <div className={styles.toolIdentity}><span className={styles.toolMark}>{tool.name.slice(0, 1).toUpperCase()}</span><div><strong className="type-body">{tool.name}</strong><code>{tool.toolKey}</code></div></div>
                  <StateSwitch enabled={tool.enabled} disabled={mutating} onClick={() => changeToolStatus(tool)} label={`${tool.name} Tool ${tool.enabled ? "비활성화" : "활성화"}`} />
                </div>
              ))}</div>
            )}
          </section>
          <section className={`${styles.managementSurface} ${styles.operationalSection}`} aria-label="Links 데이터 관리">
            <div className={styles.managementSurfaceHeader}><div><h2 id="tool-links-title" className="type-title">Links 데이터</h2></div><div className={styles.sectionActions}><Button variant="secondary" type="button" disabled={data.links.length === 0} onClick={openOrder}>순서 관리</Button><Button variant="secondary" type="button" onClick={() => setEditor({})}><Plus aria-hidden="true" />Link 추가</Button></div></div>
            <SegmentedControl className={`${styles.linkFilters} ${styles.toolLinksFilter}`} label="Link 분류" options={LINK_FILTERS} value={linkFilter} onChange={setLinkFilter} />
            {data.links.length === 0 ? <EmptyState title="등록 Link 없음" description="Links Tool에 표시할 링크가 없습니다." /> : (
              <div className={styles.dataTableWrap}><table className={`${styles.dataTable} ${styles.toolLinksTable}`}><thead><tr><th>Link</th><th>분류</th><th>대표 이미지</th><th>상태</th><th>작업</th></tr></thead><tbody>
                {filteredLinks.map((link) => <tr key={link.id}>
                  <td data-label="Link"><div className={styles.linkIdentity}><ExternalLinkIcon aria-hidden="true" /><div><strong>{link.name}</strong><span>{link.description || "설명 없음"}</span><code>{link.url}</code></div></div></td>
                  <td data-label="분류"><code>{link.category}</code></td><td data-label="대표 이미지"><code>{link.imageUrl || "기본 Preview"}</code></td>
                  <td data-label="상태"><StateSwitch enabled={link.enabled} disabled={mutating} onClick={() => changeLinkStatus(link)} label={`${link.name} Link ${link.enabled ? "비노출" : "노출"} 전환`} /></td>
                  <td data-label="작업"><div className={styles.tableRowActions}><button className={styles.iconButton} type="button" onClick={() => setEditor({ item: link })} aria-label={`${link.name} Link 수정`}><Edit3 aria-hidden="true" /></button><button className={styles.iconButton} type="button" onClick={() => deleteLink(link)} aria-label={`${link.name} Link 삭제`}><Trash2 aria-hidden="true" /></button></div></td>
                </tr>)}
              </tbody></table></div>
            )}
          </section>
        </div>
      ) : null}
      {orderOpen && <OrderManagementDialog open dirty={orderChanged} busy={mutating} onClose={closeOrder} onReset={() => setOrderDraft([...currentOrder])} onSave={saveOrder}>
        <div className={styles.orderManager} aria-label="Links 표시 순서 관리">
          {TOOL_LINK_ORDER_GROUPS.map((group) => (
            <section className={styles.orderManagerGroup} key={group.value} aria-labelledby={`tool-link-order-${group.value}`}>
              <div className={styles.orderManagerHeading}><h4 id={`tool-link-order-${group.value}`} className="type-body">{group.label}</h4></div>
              <SortableList
                items={orderDraftGroups[group.value]}
                getKey={(link) => link.id}
                getTitle={(link) => link.name}
                onChange={(items) => updateOrderGroup(group.value, items)}
                emptyMessage="이 분류에 등록된 Link가 없습니다."
              />
            </section>
          ))}
        </div>
      </OrderManagementDialog>}
      {editor && <LinkEditor key={editor.item?.id ?? "new"} state={editor} onClose={() => setEditor(null)} onSubmit={saveLink} />}
    </>
  );
}
