"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Edit3, ImageIcon, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatApiError } from "@/lib/api/client";
import type { ProjectCreateInput, ProjectSummary } from "./admin-types";
import AdminActionDialog from "./admin-action-dialog";
import {
  createProject,
  deleteProject,
  getAdminProjects,
  projectActionBindings,
  updateProjectStatus,
} from "./admin-project-api";
import { EmptyState, PageError, PageHeader, PageLoading, StateSwitch, formatDateTime } from "./admin-ui";
import DialogFrame from "./dialog-frame";
import { useAdminAction } from "./use-admin-action";
import styles from "./admin.module.css";

const EMPTY_CREATE: ProjectCreateInput = { name: "", slug: "" };

// Name·Slug 전용 최소 Project 생성 Dialog
function CreateProjectDialog({
  open,
  input,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  input: ProjectCreateInput;
  onChange: (input: ProjectCreateInput) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const valid = input.name.trim().length > 0 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug);
  return (
    <DialogFrame
      open={open}
      title="새 프로젝트"
      description="Name과 Slug만으로 비공개 Draft를 생성합니다."
      onClose={onClose}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onClose}>취소</button>
          <button className={`${styles.primaryButton} type-body`} type="button" disabled={!valid} onClick={onSubmit}>프로젝트 생성</button>
        </>
      )}
    >
      <div className={styles.projectCreateFields}>
        <label className={styles.formField}>
          <span className="type-small">Name</span>
          <input className="type-body" value={input.name} maxLength={200} onChange={(event) => onChange({ ...input, name: event.currentTarget.value })} />
        </label>
        <label className={styles.formField}>
          <span className="type-small">Slug</span>
          <input className="type-body" value={input.slug} maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" onChange={(event) => onChange({ ...input, slug: event.currentTarget.value })} />
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
      title="프로젝트 삭제"
      description={project ? `${project.name} 프로젝트와 연결된 본문·기술·미디어를 삭제합니다.` : undefined}
      onClose={onClose}
      footer={(
        <>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onClose}>취소</button>
          <button className={`${styles.dangerButton} type-body`} type="button" onClick={onConfirm}>삭제 계속</button>
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
  const router = useRouter();
  const adminAction = useAdminAction();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createInput, setCreateInput] = useState<ProjectCreateInput>(EMPTY_CREATE);
  const [deleteCandidate, setDeleteCandidate] = useState<ProjectSummary | null>(null);
  const requestSequence = useRef(0);

  const loadProjects = useCallback(async (silent = false) => {
    const requestId = ++requestSequence.current;
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await getAdminProjects();
      if (requestSequence.current === requestId) {
        setProjects(response.items);
      }
    } catch (caught) {
      if (requestSequence.current === requestId) {
        if (silent) {
          setFeedback(`최신 프로젝트 목록 재조회 실패: ${formatApiError(caught)}`);
        } else {
          setError(formatApiError(caught));
        }
      }
    } finally {
      if (requestSequence.current === requestId && !silent) setLoading(false);
    }
  }, []);

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
    setCreateOpen(false);
    void adminAction.start({
      ...projectActionBindings.create(),
      actionLabel: `${input.name} 프로젝트 생성`,
      mutation: (verification) => createProject(input, verification),
      onSuccess: (created) => {
        setCreateInput(EMPTY_CREATE);
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
        setFeedback(`${project.name} 공개 상태를 변경했습니다.`);
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
        setFeedback(`${project.name} 프로젝트를 삭제했습니다.`);
        void loadProjects(true);
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="프로젝트 Draft, 공개 상태와 표시 순서를 관리합니다."
        action={(
          <button className={`${styles.primaryButton} type-body`} type="button" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />새 프로젝트
          </button>
        )}
      />
      {feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}
      {adminAction.startError && <p className={`${styles.inlineError} type-small`} role="alert">{adminAction.startError}</p>}

      {loading ? <PageLoading rows={5} /> : error ? (
        <PageError message={error} onRetry={() => void loadProjects()} />
      ) : projects.length === 0 ? (
        <EmptyState title="프로젝트 없음" description="Name과 Slug로 첫 Draft를 생성할 수 있습니다." />
      ) : (
        <section className={styles.projectTableSection} aria-label="Project 목록">
          <div className={styles.dataTableWrap}>
            <table className={`${styles.dataTable} ${styles.projectTable}`}>
              <thead>
                <tr>
                  <th>Thumbnail</th><th>Name / Slug</th><th>Year</th><th>Order</th><th>Status</th><th>Updated At</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td data-label="Thumbnail">
                      <div className={styles.projectThumbnail}>
                        {project.thumbnailUrl ? (
                          <Image src={project.thumbnailUrl} alt="" fill sizes="72px" unoptimized />
                        ) : <ImageIcon aria-label="Thumbnail 없음" />}
                      </div>
                    </td>
                    <td data-label="Name / Slug">
                      <div className={styles.projectIdentity}>
                        <strong>{project.name}</strong>
                        <code>/projects/{project.slug}</code>
                      </div>
                    </td>
                    <td data-label="Year">{project.year ?? "—"}</td>
                    <td data-label="Order">{project.displayOrder}</td>
                    <td data-label="Status">
                      <div className={styles.projectStatusCell}>
                        <span>{project.enabled ? "공개" : "비공개"}</span>
                        <StateSwitch
                          enabled={project.enabled}
                          disabled={adminAction.issuing}
                          onClick={() => changeStatus(project)}
                          label={`${project.name} 프로젝트 ${project.enabled ? "비공개" : "공개"} 전환`}
                        />
                      </div>
                    </td>
                    <td data-label="Updated At"><time dateTime={project.updatedAt}>{formatDateTime(project.updatedAt)}</time></td>
                    <td data-label="Actions">
                      <div className={styles.projectRowActions}>
                        <button className={styles.iconButton} type="button" aria-label={`${project.name} 편집`} onClick={() => router.push(`/admin/projects/${project.id}/edit`)}><Edit3 aria-hidden="true" /></button>
                        <button className={styles.iconButton} type="button" aria-label={`${project.name} 삭제`} onClick={() => setDeleteCandidate(project)}><Trash2 aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <CreateProjectDialog open={createOpen} input={createInput} onChange={setCreateInput} onClose={() => setCreateOpen(false)} onSubmit={create} />
      <DeleteProjectDialog project={deleteCandidate} onClose={() => setDeleteCandidate(null)} onConfirm={remove} />
      {adminAction.dialog && <AdminActionDialog {...adminAction.dialog} />}
    </>
  );
}
