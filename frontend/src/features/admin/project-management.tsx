"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { formatApiError } from "@/lib/api/client";
import type {
  Project,
  ProjectContent,
  ProjectCreateInput,
  ProjectDetail,
  ProjectEngineeringItem,
  ProjectMediaInput,
  ProjectSummary,
  ProjectTechnologyInput,
  ProjectUpdateInput,
  Technology,
} from "./admin-types";
import AdminActionDialog from "./admin-action-dialog";
import {
  createProject,
  deleteProject,
  getAdminProject,
  projectActionBindings,
  replaceProjectContent,
  replaceProjectMedia,
  replaceProjectTechnologies,
  updateProject,
  updateProjectStatus,
} from "./admin-project-api";
import {
  EmptyState,
  PageError,
  PageLoading,
  StateSwitch,
  StatusLabel,
  SubmitButton,
  formatDateTime,
} from "./admin-ui";
import { useAdminAction } from "./use-admin-action";
import styles from "./admin.module.css";

type Mode = { kind: "list" } | { kind: "create" } | { kind: "edit"; id: number };

const emptyProject = (): ProjectCreateInput => ({
  slug: "",
  name: "",
  year: new Date().getFullYear(),
  tagline: "",
  description: "",
  cardRole: "",
  summary: null,
  detailRole: null,
  startedAt: null,
  endedAt: null,
  teamSize: null,
  thumbnailUrl: null,
  displayOrder: 0,
  enabled: true,
});

function editableProject(project: Project): ProjectCreateInput {
  return {
    slug: project.slug,
    name: project.name,
    year: project.year,
    tagline: project.tagline,
    description: project.description,
    cardRole: project.cardRole,
    summary: project.summary,
    detailRole: project.detailRole,
    startedAt: project.startedAt,
    endedAt: project.endedAt,
    teamSize: project.teamSize,
    thumbnailUrl: project.thumbnailUrl,
    displayOrder: project.displayOrder,
    enabled: project.enabled,
  };
}

function projectPatch(project: Project, input: ProjectCreateInput): ProjectUpdateInput {
  const current = editableProject(project);
  const fields: Array<keyof ProjectUpdateInput> = [
    "slug", "name", "year", "tagline", "description", "cardRole", "summary", "detailRole",
    "startedAt", "endedAt", "teamSize", "thumbnailUrl", "displayOrder",
  ];
  return Object.fromEntries(fields.flatMap((field) => (
    current[field] === input[field] ? [] : [[field, input[field]]]
  ))) as ProjectUpdateInput;
}

function ProjectFields({ value, onChange, includeStatus }: {
  value: ProjectCreateInput;
  onChange: (value: ProjectCreateInput) => void;
  includeStatus: boolean;
}) {
  const set = <K extends keyof ProjectCreateInput>(key: K, next: ProjectCreateInput[K]) => {
    onChange({ ...value, [key]: next });
  };
  return (
    <>
      <div className={styles.formColumns}>
        <label className={styles.formField}><span className="type-small">Slug</span><input className="type-body" value={value.slug} onChange={(event) => set("slug", event.currentTarget.value)} /></label>
        <label className={styles.formField}><span className="type-small">프로젝트명</span><input className="type-body" value={value.name} onChange={(event) => set("name", event.currentTarget.value)} /></label>
      </div>
      <div className={styles.formColumns}>
        <label className={styles.formField}><span className="type-small">연도</span><input className="type-body" type="number" value={value.year} onChange={(event) => set("year", Number(event.currentTarget.value))} /></label>
        <label className={styles.formField}><span className="type-small">카드 역할</span><input className="type-body" value={value.cardRole} onChange={(event) => set("cardRole", event.currentTarget.value)} /></label>
      </div>
      <label className={styles.formField}><span className="type-small">한 줄 설명</span><input className="type-body" value={value.tagline} onChange={(event) => set("tagline", event.currentTarget.value)} /></label>
      <label className={styles.formField}><span className="type-small">카드 설명</span><textarea className="type-body" rows={3} value={value.description} onChange={(event) => set("description", event.currentTarget.value)} /></label>
      <label className={styles.formField}><span className="type-small">상세 Hero 요약</span><textarea className="type-body" rows={3} value={value.summary ?? ""} onChange={(event) => set("summary", event.currentTarget.value || null)} /></label>
      <div className={styles.formColumns}>
        <label className={styles.formField}><span className="type-small">상세 역할</span><input className="type-body" value={value.detailRole ?? ""} onChange={(event) => set("detailRole", event.currentTarget.value || null)} /></label>
        <label className={styles.formField}><span className="type-small">참여 인원</span><input className="type-body" type="number" min="1" value={value.teamSize ?? ""} onChange={(event) => set("teamSize", event.currentTarget.value ? Number(event.currentTarget.value) : null)} /></label>
      </div>
      <div className={styles.formColumns}>
        <label className={styles.formField}><span className="type-small">시작일</span><input className="type-body" type="date" value={value.startedAt ?? ""} onChange={(event) => set("startedAt", event.currentTarget.value || null)} /></label>
        <label className={styles.formField}><span className="type-small">종료일</span><input className="type-body" type="date" value={value.endedAt ?? ""} onChange={(event) => set("endedAt", event.currentTarget.value || null)} /></label>
      </div>
      <label className={styles.formField}><span className="type-small">대표 이미지 URL</span><input className="type-body" value={value.thumbnailUrl ?? ""} onChange={(event) => set("thumbnailUrl", event.currentTarget.value || null)} /></label>
      <label className={styles.formField}><span className="type-small">표시 순서</span><input className="type-body" type="number" min="0" value={value.displayOrder} onChange={(event) => set("displayOrder", Number(event.currentTarget.value))} /></label>
      {includeStatus && <label className={styles.checkboxField}><input type="checkbox" checked={value.enabled} onChange={(event) => set("enabled", event.currentTarget.checked)} /><span className="type-body">생성 후 공개</span></label>}
    </>
  );
}

function validProject(input: ProjectCreateInput) {
  return Boolean(input.slug.trim() && input.name.trim() && input.tagline.trim() && input.description.trim() && input.cardRole.trim());
}

function ProjectCreateForm({ busy, onCancel, onSubmit }: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (input: ProjectCreateInput) => void;
}) {
  const [value, setValue] = useState(emptyProject);
  const [error, setError] = useState("");
  return (
    <section className={styles.operationalSection} aria-labelledby="project-create-title">
      <div className={styles.sectionHeading}><div><h2 id="project-create-title" className="type-title">프로젝트 생성</h2><p className="type-body">DB Project와 공개 slug를 생성합니다.</p></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCancel}>목록으로</button></div>
      <form className={styles.editorForm} onSubmit={(event) => {
        event.preventDefault();
        if (!validProject(value)) {
          setError("Slug, 프로젝트명, 한 줄 설명, 카드 설명과 역할을 입력해 주세요.");
          return;
        }
        setError("");
        onSubmit(value);
      }}>
        <ProjectFields value={value} onChange={setValue} includeStatus />
        <div className={styles.formActionRow}><p className={`${styles.inlineError} type-small`} role="alert">{error}</p><SubmitButton busy={busy}>프로젝트 생성</SubmitButton></div>
      </form>
    </section>
  );
}

function ProjectBasicEditor({ project, busy, onSave, onDelete }: {
  project: Project;
  busy: boolean;
  onSave: (input: ProjectUpdateInput) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState(() => editableProject(project));
  const [error, setError] = useState("");
  const patch = projectPatch(project, value);
  return (
    <section className={styles.operationalSection} aria-labelledby="project-basic-title">
      <div className={styles.sectionHeading}><div><h3 id="project-basic-title" className="type-title">기본정보</h3><p className="type-body">공개 상태는 목록의 별도 상태 API에서 변경합니다.</p></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={onDelete}><Trash2 aria-hidden="true" />삭제</button></div>
      <form className={styles.editorForm} onSubmit={(event) => {
        event.preventDefault();
        if (!validProject(value)) {
          setError("필수 기본정보를 입력해 주세요.");
          return;
        }
        if (Object.keys(patch).length === 0) {
          setError("변경된 기본정보가 없습니다.");
          return;
        }
        setError("");
        onSave(patch);
      }}>
        <ProjectFields value={value} onChange={setValue} includeStatus={false} />
        <div className={styles.formActionRow}><p className={`${styles.inlineError} type-small`} role="alert">{error}</p><SubmitButton busy={busy} disabled={Object.keys(patch).length === 0}>기본정보 저장</SubmitButton></div>
      </form>
    </section>
  );
}

function LineList({ label, values, onChange, multiline = false }: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  multiline?: boolean;
}) {
  return (
    <div className={styles.editorForm}>
      <div className={styles.sectionHeading}><div><h4 className="type-body">{label}</h4></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => onChange([...values, ""])}><Plus aria-hidden="true" />추가</button></div>
      {values.length === 0 ? <EmptyState title={`${label} 없음`} description="필요한 항목을 추가해 주세요." /> : <div className={styles.registryRows}>{values.map((value, index) => (
        <div className={styles.registryRow} key={`${label}-${index}`}>
          <label className={styles.formField}><span className="type-small">{label} {index + 1}</span>{multiline ? <textarea className="type-body" rows={3} value={value} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.currentTarget.value : item))} /> : <input className="type-body" value={value} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.currentTarget.value : item))} />}</label>
          <button className={styles.iconButton} type="button" aria-label={`${label} ${index + 1} 삭제`} onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 aria-hidden="true" /></button>
        </div>
      ))}</div>}
    </div>
  );
}

function ContentEditor({ content, busy, onSave }: {
  content: ProjectContent;
  busy: boolean;
  onSave: (content: ProjectContent) => void;
}) {
  const normalizedContent: ProjectContent = {
    ...content,
    architecture: {
      clients: content.architecture?.clients ?? [],
      services: content.architecture?.services ?? [],
      dataAndExternal: content.architecture?.dataAndExternal ?? [],
      runtime: content.architecture?.runtime ?? [],
      delivery: content.architecture?.delivery ?? [],
    },
  };
  const [value, setValue] = useState<ProjectContent>(() => JSON.parse(JSON.stringify(normalizedContent)) as ProjectContent);
  const changed = JSON.stringify(value) !== JSON.stringify(normalizedContent);
  const setTitles = (key: "results" | "features", titles: string[]) => setValue({ ...value, [key]: titles.map((title) => ({ title })) });
  const architectureKeys: Array<keyof ProjectContent["architecture"]> = ["clients", "services", "dataAndExternal", "runtime", "delivery"];
  return (
    <section className={styles.operationalSection} aria-labelledby="project-content-title">
      <div className={styles.sectionHeading}><div><h3 id="project-content-title" className="type-title">고정 6개 Content</h3><p className="type-body">구조화된 고정 Section만 전체 교체합니다.</p></div></div>
      <div className={styles.editorForm}>
        <LineList label="성과" values={value.results.map((item) => item.title)} onChange={(items) => setTitles("results", items)} />
        <LineList label="배경" values={value.background} multiline onChange={(background) => setValue({ ...value, background })} />
        <LineList label="주요 기능" values={value.features.map((item) => item.title)} onChange={(items) => setTitles("features", items)} />
        <div className={styles.editorForm}>
          <div className={styles.sectionHeading}><div><h4 className="type-body">직접 담당 개발 영역</h4></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => setValue({ ...value, development: [...value.development, { title: "", items: [] }] })}><Plus aria-hidden="true" />추가</button></div>
          {value.development.map((item, index) => <div className={styles.registryRow} key={`development-${index}`}><div className={styles.editorForm}><label className={styles.formField}><span className="type-small">개발 영역 제목</span><input className="type-body" value={item.title} onChange={(event) => setValue({ ...value, development: value.development.map((current, itemIndex) => itemIndex === index ? { ...current, title: event.currentTarget.value } : current) })} /></label><label className={styles.formField}><span className="type-small">담당 작업 — 한 줄에 하나</span><textarea className="type-body" rows={4} value={item.items.join("\n")} onChange={(event) => setValue({ ...value, development: value.development.map((current, itemIndex) => itemIndex === index ? { ...current, items: event.currentTarget.value.split("\n") } : current) })} /></label></div><button className={styles.iconButton} type="button" aria-label={`개발 영역 ${index + 1} 삭제`} onClick={() => setValue({ ...value, development: value.development.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 aria-hidden="true" /></button></div>)}
        </div>
        <div className={styles.editorForm}><h4 className="type-body">Architecture</h4><div className={styles.formColumns}>{architectureKeys.map((key) => <label className={styles.formField} key={key}><span className="type-small">{key} — 한 줄에 하나</span><textarea className="type-body" rows={4} value={value.architecture[key].join("\n")} onChange={(event) => setValue({ ...value, architecture: { ...value.architecture, [key]: event.currentTarget.value.split("\n") } })} /></label>)}</div></div>
        <div className={styles.editorForm}>
          <div className={styles.sectionHeading}><div><h4 className="type-body">Engineering</h4></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => setValue({ ...value, engineering: [...value.engineering, { title: "", summary: "", problem: "", solution: "", result: "" }] })}><Plus aria-hidden="true" />추가</button></div>
          {value.engineering.map((item, index) => <EngineeringFields key={`engineering-${index}`} item={item} index={index} onChange={(next) => setValue({ ...value, engineering: value.engineering.map((current, itemIndex) => itemIndex === index ? next : current) })} onDelete={() => setValue({ ...value, engineering: value.engineering.filter((_, itemIndex) => itemIndex !== index) })} />)}
        </div>
        <div className={styles.formActionRow}><p className="type-small">results · background · features · development · architecture · engineering</p><SubmitButton busy={busy} type="button" disabled={!changed} onClick={() => onSave(value)}>Content 저장</SubmitButton></div>
      </div>
    </section>
  );
}

function EngineeringFields({ item, index, onChange, onDelete }: {
  item: ProjectEngineeringItem;
  index: number;
  onChange: (item: ProjectEngineeringItem) => void;
  onDelete: () => void;
}) {
  const field = (key: keyof ProjectEngineeringItem, label: string) => <label className={styles.formField}><span className="type-small">{label}</span><textarea className="type-body" rows={key === "title" ? 1 : 3} value={item[key]} onChange={(event) => onChange({ ...item, [key]: event.currentTarget.value })} /></label>;
  return <div className={styles.registryRow}><div className={styles.editorForm}>{field("title", `Engineering ${index + 1} 제목`)}{field("summary", "요약")}{field("problem", "문제")}{field("solution", "해결")}{field("result", "결과")}</div><button className={styles.iconButton} type="button" aria-label={`Engineering ${index + 1} 삭제`} onClick={onDelete}><Trash2 aria-hidden="true" /></button></div>;
}

function TechnologyEditor({ technologies, master, busy, onSave }: {
  technologies: ProjectDetail["technologies"];
  master: Technology[];
  busy: boolean;
  onSave: (items: ProjectTechnologyInput[]) => void;
}) {
  const initial = technologies.map(({ technologyId, showOnCard, highlighted, displayOrder }) => ({ technologyId, showOnCard, highlighted, displayOrder }));
  const [items, setItems] = useState<ProjectTechnologyInput[]>(initial);
  const [selected, setSelected] = useState("");
  const normalize = (values: ProjectTechnologyInput[]) => values.map((item, index) => ({ ...item, displayOrder: index + 1 }));
  const available = master.filter((item) => item.enabled && !items.some((mapping) => mapping.technologyId === item.id));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(normalize(next));
  };
  return (
    <section className={styles.operationalSection} aria-labelledby="project-technologies-title">
      <div className={styles.sectionHeading}><div><h3 id="project-technologies-title" className="type-title">Project Technologies</h3><p className="type-body">활성 Technology Master ID만 연결합니다.</p></div></div>
      <div className={styles.formActionRow}><select className="type-body" aria-label="프로젝트 기술 선택" value={selected} onChange={(event) => setSelected(event.currentTarget.value)}><option value="">기술 선택</option>{available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className={`${styles.secondaryButton} type-body`} type="button" disabled={!selected} onClick={() => { const technologyId = Number(selected); setItems(normalize([...items, { technologyId, showOnCard: false, highlighted: false, displayOrder: items.length + 1 }])); setSelected(""); }}><Plus aria-hidden="true" />추가</button></div>
      {items.length === 0 ? <EmptyState title="연결 기술 없음" description="빈 목록으로 저장하면 전체 연결이 해제됩니다." /> : <div className={styles.registryRows}>{items.map((item, index) => { const technology = master.find((candidate) => candidate.id === item.technologyId); return <div className={styles.registryRow} key={item.technologyId}><div><strong className="type-body">{technology?.name ?? `기술 #${item.technologyId}`}</strong><span className="type-small">표시 순서 {item.displayOrder}</span><label className={styles.checkboxField}><input type="checkbox" checked={item.showOnCard} onChange={(event) => setItems(items.map((current) => current.technologyId === item.technologyId ? { ...current, showOnCard: event.currentTarget.checked } : current))} /><span className="type-small">카드 노출</span></label><label className={styles.checkboxField}><input type="checkbox" checked={item.highlighted} onChange={(event) => setItems(items.map((current) => current.technologyId === item.technologyId ? { ...current, highlighted: event.currentTarget.checked } : current))} /><span className="type-small">직접 개발 강조</span></label></div><div><button className={styles.iconButton} type="button" aria-label={`${technology?.name ?? item.technologyId} 위로`} disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp aria-hidden="true" /></button><button className={styles.iconButton} type="button" aria-label={`${technology?.name ?? item.technologyId} 아래로`} disabled={index === items.length - 1} onClick={() => move(index, 1)}><ChevronDown aria-hidden="true" /></button><button className={styles.iconButton} type="button" aria-label={`${technology?.name ?? item.technologyId} 제거`} onClick={() => setItems(normalize(items.filter((current) => current.technologyId !== item.technologyId)))}><Trash2 aria-hidden="true" /></button></div></div>; })}</div>}
      <div className={styles.formActionRow}><p className="type-small">전체 구성을 items 배열 Wrapper로 저장합니다.</p><SubmitButton busy={busy} type="button" disabled={JSON.stringify(items) === JSON.stringify(initial)} onClick={() => onSave(items)}>기술 구성 저장</SubmitButton></div>
    </section>
  );
}

function MediaEditor({ media, busy, onSave }: {
  media: ProjectDetail["media"];
  busy: boolean;
  onSave: (items: ProjectMediaInput[]) => void;
}) {
  const initial = media.map(({ imageUrl, label, altText, displayOrder }) => ({ imageUrl, label, altText, displayOrder }));
  const [items, setItems] = useState<ProjectMediaInput[]>(initial);
  const [error, setError] = useState("");
  const setItem = (index: number, next: ProjectMediaInput) => setItems(items.map((item, itemIndex) => itemIndex === index ? next : item));
  return (
    <section className={styles.operationalSection} aria-labelledby="project-media-title">
      <div className={styles.sectionHeading}><div><h3 id="project-media-title" className="type-title">Project Media</h3><p className="type-body">파일 업로드 없이 이미지 URL Reference만 관리합니다.</p></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => setItems([...items, { imageUrl: "", label: null, altText: null, displayOrder: items.length + 1 }])}><Plus aria-hidden="true" />이미지 추가</button></div>
      {items.length === 0 ? <EmptyState title="등록 Media 없음" description="빈 목록으로 저장하면 전체 Media가 제거됩니다." /> : <div className={styles.registryRows}>{items.map((item, index) => <div className={styles.registryRow} key={`media-${index}`}><div className={styles.editorForm}><label className={styles.formField}><span className="type-small">이미지 URL</span><input className="type-body" value={item.imageUrl} onChange={(event) => setItem(index, { ...item, imageUrl: event.currentTarget.value })} /></label><div className={styles.formColumns}><label className={styles.formField}><span className="type-small">Label</span><input className="type-body" value={item.label ?? ""} onChange={(event) => setItem(index, { ...item, label: event.currentTarget.value || null })} /></label><label className={styles.formField}><span className="type-small">대체 텍스트</span><input className="type-body" value={item.altText ?? ""} onChange={(event) => setItem(index, { ...item, altText: event.currentTarget.value || null })} /></label></div><label className={styles.formField}><span className="type-small">표시 순서</span><input className="type-body" type="number" min="0" value={item.displayOrder} onChange={(event) => setItem(index, { ...item, displayOrder: Number(event.currentTarget.value) })} /></label></div><button className={styles.iconButton} type="button" aria-label={`Media ${index + 1} 삭제`} onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 aria-hidden="true" /></button></div>)}</div>}
      <div className={styles.formActionRow}><p className={`${styles.inlineError} type-small`} role="alert">{error}</p><SubmitButton busy={busy} type="button" disabled={JSON.stringify(items) === JSON.stringify(initial)} onClick={() => { if (items.some((item) => !item.imageUrl.trim())) { setError("모든 Media의 이미지 URL을 입력해 주세요."); return; } setError(""); onSave(items); }}>Media 저장</SubmitButton></div>
    </section>
  );
}

function ProjectEditor({ detail, technologyMaster, busy, onBack, onSaveBasic, onDelete, onSaveContent, onSaveTechnologies, onSaveMedia }: {
  detail: ProjectDetail;
  technologyMaster: Technology[];
  busy: boolean;
  onBack: () => void;
  onSaveBasic: (input: ProjectUpdateInput) => void;
  onDelete: () => void;
  onSaveContent: (content: ProjectContent) => void;
  onSaveTechnologies: (items: ProjectTechnologyInput[]) => void;
  onSaveMedia: (items: ProjectMediaInput[]) => void;
}) {
  return <div className={styles.dashboardFlow}><div className={styles.sectionHeading}><div><h2 className="type-title">{detail.project.name} 편집</h2><p className="type-body">Project ID {detail.project.id} · /projects/{detail.project.slug}</p></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={onBack}>목록으로</button></div><ProjectBasicEditor project={detail.project} busy={busy} onSave={onSaveBasic} onDelete={onDelete} /><ContentEditor content={detail.content} busy={busy} onSave={onSaveContent} /><TechnologyEditor technologies={detail.technologies} master={technologyMaster} busy={busy} onSave={onSaveTechnologies} /><MediaEditor media={detail.media} busy={busy} onSave={onSaveMedia} /></div>;
}

export default function ProjectManagement({ projects, technologyMaster, onRefresh }: {
  projects: ProjectSummary[];
  technologyMaster: Technology[];
  onRefresh: () => void | Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const adminAction = useAdminAction();

  const loadDetail = useCallback(async (id: number) => {
    setLoading(true);
    setError("");
    try {
      setDetail(await getAdminProject(id));
      setDetailVersion((current) => current + 1);
    } catch (caught) {
      setDetail(null);
      setError(formatApiError(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  const open = (id: number) => {
    setMode({ kind: "edit", id });
    void loadDetail(id);
  };
  const completeDetail = (message: string, id: number, summary = false) => {
    setFeedback(message);
    void loadDetail(id);
    if (summary) void onRefresh();
  };

  const create = (input: ProjectCreateInput) => void adminAction.start({
    ...projectActionBindings.create(),
    actionLabel: `${input.name} 프로젝트 생성`,
    mutation: (verification) => createProject(input, verification),
    onSuccess: (created) => {
      setFeedback("프로젝트를 생성했습니다.");
      setMode({ kind: "edit", id: created.id });
      void onRefresh();
      void loadDetail(created.id);
    },
  });

  const changeStatus = (project: ProjectSummary) => void adminAction.start({
    ...projectActionBindings.status(project.id),
    actionLabel: `${project.name} 프로젝트 ${project.enabled ? "비공개" : "공개"} 전환`,
    mutation: (verification) => updateProjectStatus(project.id, !project.enabled, verification),
    onSuccess: () => { setFeedback("프로젝트 공개 상태를 변경했습니다."); void onRefresh(); },
  });

  if (mode.kind === "create") {
    return <><ProjectCreateForm busy={adminAction.issuing} onCancel={() => setMode({ kind: "list" })} onSubmit={create} />{adminAction.startError && <p className={`${styles.inlineError} type-small`} role="alert">{adminAction.startError}</p>}{adminAction.dialog && <AdminActionDialog {...adminAction.dialog} />}</>;
  }

  if (mode.kind === "edit") {
    const id = mode.id;
    return <>{feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}{adminAction.startError && <p className={`${styles.inlineError} type-small`} role="alert">{adminAction.startError}</p>}{loading ? <PageLoading rows={7} /> : error ? <PageError message={error} onRetry={() => void loadDetail(id)} /> : detail ? <ProjectEditor key={detailVersion} detail={detail} technologyMaster={technologyMaster} busy={adminAction.issuing} onBack={() => { setMode({ kind: "list" }); setDetail(null); }} onSaveBasic={(input) => void adminAction.start({ ...projectActionBindings.update(id), actionLabel: `${detail.project.name} 기본정보 수정`, mutation: (verification) => updateProject(id, input, verification), onSuccess: () => completeDetail("프로젝트 기본정보를 저장했습니다.", id, true) })} onDelete={() => void adminAction.start({ ...projectActionBindings.delete(id), actionLabel: `${detail.project.name} 프로젝트 삭제`, mutation: (verification) => deleteProject(id, verification), onSuccess: () => { setFeedback("프로젝트를 삭제했습니다."); setMode({ kind: "list" }); setDetail(null); void onRefresh(); } })} onSaveContent={(content) => void adminAction.start({ ...projectActionBindings.update(id), actionLabel: `${detail.project.name} Content 저장`, mutation: (verification) => replaceProjectContent(id, content, verification), onSuccess: () => completeDetail("프로젝트 Content를 저장했습니다.", id) })} onSaveTechnologies={(items) => void adminAction.start({ ...projectActionBindings.update(id), actionLabel: `${detail.project.name} 기술 구성 저장`, mutation: (verification) => replaceProjectTechnologies(id, items, verification), onSuccess: () => completeDetail("프로젝트 기술 구성을 저장했습니다.", id, true) })} onSaveMedia={(items) => void adminAction.start({ ...projectActionBindings.update(id), actionLabel: `${detail.project.name} Media 저장`, mutation: (verification) => replaceProjectMedia(id, items, verification), onSuccess: () => completeDetail("프로젝트 Media를 저장했습니다.", id) })} /> : null}{adminAction.dialog && <AdminActionDialog {...adminAction.dialog} />}</>;
  }

  return (
    <>
      <section className={styles.operationalSection} aria-labelledby="projects-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="projects-title" className="type-title">프로젝트 관리</h2>
            <p className="type-body">Summary 목록에서 실제 Project Detail 편집기로 진입합니다.</p>
          </div>
          <button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => setMode({ kind: "create" })}>
            <Plus aria-hidden="true" />프로젝트 추가
          </button>
        </div>
        {feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}
        {adminAction.startError && <p className={`${styles.inlineError} type-small`} role="alert">{adminAction.startError}</p>}
        {projects.length === 0 ? (
          <EmptyState title="프로젝트 없음" description="등록된 프로젝트가 없습니다." />
        ) : (
          <div className={styles.registryRows}>
            {projects.map((project) => (
              <article
                key={project.id}
                className={`${styles.registryRow} ${styles.projectRegistryRow}`}
                aria-label={`${project.name} 프로젝트`}
              >
                <div className={styles.projectRegistryInfo}>
                  <strong className="type-body">{project.name}</strong>
                  <span className={`${styles.projectRegistryMeta} type-small`}>#{project.id} · {project.year} · {project.slug} · {formatDateTime(project.updatedAt)}</span>
                  <span className={`${styles.projectRegistryTagline} type-small`}>{project.tagline}</span>
                </div>
                <div className={styles.projectRegistryControls} role="group" aria-label={`${project.name} 프로젝트 작업`}>
                  <StatusLabel tone={project.enabled ? "success" : "neutral"}>{project.enabled ? "공개" : "비공개"}</StatusLabel>
                  <StateSwitch enabled={project.enabled} disabled={adminAction.issuing} onClick={() => changeStatus(project)} label={`${project.name} 프로젝트 ${project.enabled ? "비공개" : "공개"} 전환`} />
                  <button className={`${styles.secondaryButton} type-body`} type="button" onClick={() => open(project.id)}>상세 편집</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {adminAction.dialog && <AdminActionDialog {...adminAction.dialog} />}
    </>
  );
}
