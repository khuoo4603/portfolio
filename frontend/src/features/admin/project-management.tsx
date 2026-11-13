"use client";

import { useRouter } from "next/navigation";
import { Edit3, ImageIcon, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button";
import { useNotification } from "@/components/ui/notification/notification-provider";
import { formatApiError } from "@/lib/api/client";
import type { ProjectCreateInput, ProjectSummary } from "./admin-types";
import AdminImagePreview from "./admin-image-preview";
import AdminActionDialog from "./admin-action-dialog";
import {
  createProject,
  deleteProject,
  getAdminProjects,
  projectActionBindings,
  reorderProjects,
  updateProjectStatus,
} from "./admin-project-api";
import { EmptyState, PageError, PageHeader, PageLoading, StateSwitch, formatDateTime } from "./admin-ui";
import DialogFrame from "@/components/ui/dialog-frame";
import { useAdminAction } from "./use-admin-action";
import styles from "./admin.module.css";
import OrderManagementDialog from "./order-management-dialog";
import SortableList from "./sortable-list";

const EMPTY_CREATE: ProjectCreateInput = { name: "", slug: "" };

// Name·Slug 전용 최소 Project 생성 Dialog
function CreateProjectDialog({
  open,
  busy,
  input,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  input: ProjectCreateInput;
  onChange: (input: ProjectCreateInput) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const valid = input.name.trim().length > 0 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug);
  return (
    <DialogFrame
      open={open}
      variant="admin"
      title="새 프로젝트"
      onClose={busy ? () => undefined : onClose}
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
      footer={(
        <>
          <Button variant="secondary" type="button" disabled={busy} onClick={onClose}>취소</Button>
          <Button type="button" disabled={!valid || busy} onClick={onSubmit}>프로젝트 생성</Button>
        </>
      )}
    >
      <div className={styles.projectCreateFields}>
        <label className={styles.formField}>
          <span className="type-small">Name</span>
          <input className="type-body" value={input.name} maxLength={200} disabled={busy} onChange={(event) => onChange({ ...input, name: event.currentTarget.value })} />
        </label>
        <label className={styles.formField}>
          <span className="type-small">Slug</span>
          <input className="type-body" value={input.slug} maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" disabled={busy} onChange={(event) => onChange({ ...input, slug: event.currentTarget.value })} />
          <small className="type-small">영문 소문자·숫자·하이픈</small>
        </label>
      </div>
    </DialogFrame>
  );
}

// 삭제 대상 Project Name 확인 Dialog
function DeleteProjectDialog({ project, onClose, onConfirm }: {
  project: ProjectSummary | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogFrame
      open={project !== null}
      variant="admin"
      title="프로젝트 삭제"
      description={project ? `${project.name} 프로젝트와 연결된 본문·기술·미디어를 삭제하며 복구할 수 없습니다.` : undefined}
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" type="button" onClick={onClose}>취소</Button>
          <Button variant="danger" type="button" onClick={onConfirm}>삭제 계속</Button>
        </>
      )}
    >
      <p className={`${styles.deleteWarning} type-body`}>
        삭제 대상: <strong>{project?.name}</strong>
      </p>
    </DialogFrame>
  );
}

// Project 독립 목록·최소 생성·공개 상태·삭제 관리 화면
export default function ProjectManagement() {
  const { notify } = useNotification();
  const router = useRouter();
  const adminAction = useAdminAction();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createInput, setCreateInput] = useState<ProjectCreateInput>(EMPTY_CREATE);
  const [deleteCandidate, setDeleteCandidate] = useState<ProjectSummary | null>(null);
  const [orderDraft, setOrderDraft] = useState<ProjectSummary[]>([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const orderOpenRef = useRef(false);
  const requestSequence = useRef(0);

  const loadProjects = useCallback(async (silent = false) => {
    const requestId = ++requestSequence.current;
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await getAdminProjects();
      if (requestSequence.current === requestId) {
        setProjects(response.items);
        if (!orderOpenRef.current) {
          setOrderDraft([...response.items].sort((left, right) => left.displayOrder - right.displayOrder || left.id - right.id));
        }
      }
    } catch (caught) {
      if (requestSequence.current === requestId) {
        if (silent) {
          notify({ type: "error", title: "프로젝트 목록 새로고침 실패", message: formatApiError(caught) });
        } else {
          setError(formatApiError(caught));
        }
      }
    } finally {
      if (requestSequence.current === requestId && !silent) setLoading(false);
    }
  }, [notify]);

  // 프로젝트 목록 정렬 Draft와 서버 기준 순서 비교
  const currentOrder = [...projects].sort((left, right) => left.displayOrder - right.displayOrder || left.id - right.id);
  const orderChanged = JSON.stringify(orderDraft.map((project) => project.id)) !== JSON.stringify(currentOrder.map((project) => project.id));

  const openOrder = () => {
    setOrderDraft([...currentOrder]);
    orderOpenRef.current = true;
    setOrderOpen(true);
  };

  const closeOrder = () => {
    orderOpenRef.current = false;
    setOrderOpen(false);
  };

  // PROJECTS_REORDER 1회 인증 기반 목록 순서 저장
  const saveOrder = () => {
    void adminAction.start({
      ...projectActionBindings.reorder(),
      actionLabel: "프로젝트 표시 순서 저장",
      mutation: (verification) => reorderProjects({ orderedIds: orderDraft.map((project) => project.id), expectedIds: currentOrder.map((project) => project.id) }, verification),
      onSuccess: () => {
        notify({ type: "success", title: "프로젝트 순서 저장 완료", message: "프로젝트 표시 순서를 저장했습니다." });
        void loadProjects(true);
      },
    });
  };

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadProjects();
    });
    return () => {
      active = false;
      requestSequence.current += 1;
    };
  }, [loadProjects]);

  // 최소 생성 입력 확정 후 공통 PROJECT_CREATE 재인증 시작
  const create = () => {
    const input = { name: createInput.name.trim(), slug: createInput.slug.trim() };
    void adminAction.start({
      ...projectActionBindings.create(),
      actionLabel: `${input.name} 프로젝트 생성`,
      mutation: (verification) => createProject(input, verification),
      onSuccess: (created) => {
        setCreateOpen(false);
        setCreateInput(EMPTY_CREATE);
        notify({ type: "success", title: "프로젝트 생성 완료", message: "프로젝트를 생성했습니다." });
        router.push(`/admin/projects/${created.id}/edit`);
      },
    });
  };

  // 목록 Row의 공개 상태 별도 변경
  const changeStatus = (project: ProjectSummary) => {
    void adminAction.start({
      ...projectActionBindings.status(project.id),
      actionLabel: `${project.name} 프로젝트 ${project.enabled ? "비공개" : "공개"} 전환`,
      mutation: (verification) => updateProjectStatus(project.id, !project.enabled, verification),
      onSuccess: () => {
        notify({ type: "success", title: "프로젝트 상태 변경 완료", message: `${project.name} 공개 상태를 변경했습니다.` });
        void loadProjects(true);
      },
    });
  };

  // 삭제 대상 확인 후 PROJECT_DELETE 재인증 시작
  const remove = () => {
    const project = deleteCandidate;
    if (!project) return;
    setDeleteCandidate(null);
    void adminAction.start({
      ...projectActionBindings.delete(project.id),
      actionLabel: `${project.name} 프로젝트 삭제`,
      mutation: (verification) => deleteProject(project.id, verification),
      onSuccess: () => {
        notify({ type: "success", title: "프로젝트 삭제 완료", message: `${project.name} 프로젝트를 삭제했습니다.` });
        void loadProjects(true);
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="프로젝트 Draft, 공개 상태와 표시 순서를 관리합니다."
        action={<div className={styles.pageActionGroup}><Button variant="secondary" type="button" disabled={projects.length === 0} onClick={openOrder}>순서 관리</Button><Button type="button" onClick={() => setCreateOpen(true)}><Plus aria-hidden="true" />새 프로젝트</Button></div>}
      />
      {adminAction.startError && <p className={`${styles.inlineError} type-small`} role="alert">{adminAction.startError}</p>}

      <section className={`${styles.managementSurface} ${styles.projectTableSection}`} aria-label="프로젝트 관리">
        {loading ? <PageLoading rows={5} /> : error ? (
          <PageError message={error} onRetry={() => void loadProjects()} />
        ) : projects.length === 0 ? (
          <EmptyState title="프로젝트 없음" description="Name과 Slug로 첫 Draft를 생성할 수 있습니다." />
        ) : (
          <div className={styles.dataTableWrap}>
            <table className={`${styles.dataTable} ${styles.projectTable}`}>
              <thead>
                <tr>
                  <th>프로젝트</th><th>연도</th><th>상태</th><th>수정일</th><th>작업</th>
                </tr>
              </thead>
              <tbody>
                {currentOrder.map((project) => (
                  <tr key={project.id}>
                    <td className={styles.projectIdentitySummary} data-label="프로젝트">
                      <div className={styles.projectIdentityCell}>
                        <div className={styles.projectThumbnail}>
                          <AdminImagePreview alt="" fallback={<ImageIcon aria-label="Thumbnail 없음" />} sizes="72px" src={project.thumbnailUrl} />
                        </div>
                      <div className={styles.projectIdentity}>
                        <strong>{project.name}</strong>
                        <code>/projects/{project.slug}</code>
                      </div>
                      </div>
                    </td>
                    <td className={styles.projectYearSummary} data-label="연도">{project.year ?? "—"}</td>
                    <td className={styles.projectStatusSummary} data-label="상태">
                      <div className={styles.projectStatusCell}>
                        <StateSwitch
                          enabled={project.enabled}
                          disabled={adminAction.issuing}
                          onClick={() => changeStatus(project)}
                          label={`${project.name} 프로젝트 ${project.enabled ? "비공개" : "공개"} 전환`}
                        />
                      </div>
                    </td>
                    <td className={styles.projectUpdatedSummary} data-label="수정일"><time dateTime={project.updatedAt}>{formatDateTime(project.updatedAt)}</time></td>
                    <td className={styles.projectActionsSummary} data-label="작업">
                      <div className={styles.tableRowActions}>
                        <button className={styles.iconButton} type="button" aria-label={`${project.name} 편집`} onClick={() => router.push(`/admin/projects/${project.id}/edit`)}><Edit3 aria-hidden="true" /></button>
                        <button className={styles.iconButton} type="button" aria-label={`${project.name} 삭제`} onClick={() => setDeleteCandidate(project)}><Trash2 aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {orderOpen && <OrderManagementDialog open dirty={orderChanged} busy={adminAction.busy} onClose={closeOrder} onReset={() => setOrderDraft([...currentOrder])} onSave={saveOrder}>
        <SortableList items={orderDraft} getKey={(project) => project.id} getTitle={(project) => project.name} onChange={setOrderDraft} emptyMessage="정렬할 프로젝트가 없습니다." />
      </OrderManagementDialog>}
      <CreateProjectDialog open={createOpen} busy={adminAction.busy} input={createInput} onChange={setCreateInput} onClose={() => setCreateOpen(false)} onSubmit={create} />
      <DeleteProjectDialog project={deleteCandidate} onClose={() => setDeleteCandidate(null)} onConfirm={remove} />
      {adminAction.dialog && <AdminActionDialog {...adminAction.dialog} />}
    </>
  );
}
