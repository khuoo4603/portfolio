"use client";

import { ArrowDown, ArrowUp, ImagePlus, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import Button, { buttonClassName } from "@/components/ui/button";
import Select from "@/components/ui/select";
import AdminImagePreview from "./admin-image-preview";
import type { Technology } from "./admin-types";
import { StateSwitch } from "./admin-ui";
import type { EditorMedia, ProjectEditorDraft } from "./project-editor-model";
import { moveProjectItem } from "./project-editor-model";
import SortableList from "./sortable-list";
import styles from "./admin.module.css";

export type ProjectEditorSection = "basic" | "results" | "overview" | "development" | "architecture" | "engineering" | "technologies" | "media";

function getImageModeLabel(mode: ProjectEditorDraft["thumbnail"]["mode"]) {
  return {
    KEEP: "기존 이미지 유지",
    UPLOAD: "새 이미지 선택",
    REMOVE: "이미지 제거 예정",
  }[mode];
}

type PanelProps = {
  section: ProjectEditorSection;
  draft: ProjectEditorDraft;
  setDraft: Dispatch<SetStateAction<ProjectEditorDraft>>;
  technologyMaster: Technology[];
  onThumbnailFile: (file: File) => void;
  onThumbnailRemove: () => void;
  onArchitectureImageFile: (file: File) => void;
  onArchitectureImageRemove: () => void;
  onAddMedia: (file: File) => EditorMedia | null;
  onDeleteMedia: (key: string) => void;
  onChangeMedia: (key: string, patch: Partial<EditorMedia>) => void;
  onMoveMedia: (key: string, direction: -1 | 1) => void;
  fileError: string;
};

function ItemActions({ index, length, label, onMove, onDelete }: {
  index: number;
  length: number;
  label: string;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <div className={styles.projectItemActions}>
      <button className={styles.iconButton} type="button" disabled={index === 0} aria-label={`${label} 위로`} onClick={() => onMove(-1)}><ArrowUp aria-hidden="true" /></button>
      <button className={styles.iconButton} type="button" disabled={index === length - 1} aria-label={`${label} 아래로`} onClick={() => onMove(1)}><ArrowDown aria-hidden="true" /></button>
      <button className={styles.iconButton} type="button" aria-label={`${label} 삭제`} onClick={onDelete}><Trash2 aria-hidden="true" /></button>
    </div>
  );
}

function PanelHeading({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <div className={styles.projectPanelHeading}>
      <div><h2 className="type-title">{title}</h2></div>
      {onAdd && <Button variant="secondary" type="button" onClick={onAdd}><Plus aria-hidden="true" />항목 추가</Button>}
    </div>
  );
}

// 공개 상태를 제외한 Project 기본정보 편집 패널
function BasicPanel({ draft, setDraft }: Pick<PanelProps, "draft" | "setDraft">) {
  const update = (patch: Partial<ProjectEditorDraft["project"]>) => setDraft((current) => ({ ...current, project: { ...current.project, ...patch } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="기본 정보 편집">
      <PanelHeading title="기본 정보" />
      <div className={styles.projectFieldsGrid}>
        <TextField label="프로젝트명" value={draft.project.name} maxLength={200} onChange={(name) => update({ name })} />
        <TextField label="URL 경로" value={draft.project.slug} maxLength={100} onChange={(slug) => update({ slug })} />
        <NumberField label="연도" value={draft.project.year} min={1900} max={2100} onChange={(year) => update({ year })} />
        <TextField label="한 줄 소개" value={draft.project.tagline} maxLength={300} onChange={(tagline) => update({ tagline: tagline || null })} wide />
        <TextAreaField label="카드 설명" value={draft.project.description} onChange={(description) => update({ description: description || null })} />
        <TextField label="카드 역할" value={draft.project.cardRole} maxLength={150} onChange={(cardRole) => update({ cardRole: cardRole || null })} />
        <TextAreaField label="상세 요약" value={draft.project.summary} onChange={(summary) => update({ summary: summary || null })} />
        <TextField label="상세 역할" value={draft.project.detailRole} maxLength={200} onChange={(detailRole) => update({ detailRole: detailRole || null })} />
        <TextField label="개발 시작일" type="date" value={draft.project.startedAt} onChange={(startedAt) => update({ startedAt: startedAt || null })} />
        <TextField label="개발 종료일" type="date" value={draft.project.endedAt} onChange={(endedAt) => update({ endedAt: endedAt || null })} />
        <NumberField label="참여 인원" value={draft.project.teamSize} min={1} onChange={(teamSize) => update({ teamSize })} />
      </div>
    </section>
  );
}

// 성과 항목 추가·삭제·순서 편집 패널
function ResultsPanel({ draft, setDraft }: Pick<PanelProps, "draft" | "setDraft">) {
  const items = draft.content.results;
  const setItems = (next: typeof items) => setDraft((current) => ({ ...current, content: { ...current.content, results: next } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="성과 편집">
      <PanelHeading title="성과" onAdd={() => setItems([...items, { title: "", description: null }])} />
      <div className={styles.projectItemList}>{items.map((item, index) => (
        <article className={styles.projectItemEditor} key={`result-${index}`}>
          <div className={styles.projectItemFields}>
            <TextField label={`성과 ${index + 1} Title`} value={item.title} onChange={(title) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, title } : value))} />
            <TextAreaField label={`성과 ${index + 1} Description`} value={item.description} onChange={(description) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, description: description || null } : value))} />
          </div>
          <ItemActions index={index} length={items.length} label={`성과 ${index + 1}`} onMove={(direction) => setItems(moveProjectItem(items, index, direction))} onDelete={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} />
        </article>
      ))}</div>
    </section>
  );
}

// 선택 Title과 Body 프로젝트 설명 편집 패널
function OverviewPanel({ draft, setDraft }: Pick<PanelProps, "draft" | "setDraft">) {
  const items = draft.content.overview;
  const setItems = (next: typeof items) => setDraft((current) => ({ ...current, content: { ...current.content, overview: next } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="프로젝트 설명 편집">
      <PanelHeading title="프로젝트 설명" onAdd={() => setItems([...items, { title: null, body: "" }])} />
      <div className={styles.projectItemList}>{items.map((item, index) => (
        <article className={styles.projectItemEditor} key={`overview-${index}`}>
          <div className={styles.projectItemFields}>
            <TextField label={`프로젝트 설명 ${index + 1} Title`} value={item.title} onChange={(title) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, title: title || null } : value))} />
            <TextAreaField label={`프로젝트 설명 ${index + 1} Body`} value={item.body} onChange={(body) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, body } : value))} />
          </div>
          <ItemActions index={index} length={items.length} label={`프로젝트 설명 ${index + 1}`} onMove={(direction) => setItems(moveProjectItem(items, index, direction))} onDelete={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} />
        </article>
      ))}</div>
    </section>
  );
}

// 개발 영역과 내부 작업 목록 편집 패널
function DevelopmentPanel({ draft, setDraft }: Pick<PanelProps, "draft" | "setDraft">) {
  const items = draft.content.development;
  const setItems = (next: typeof items) => setDraft((current) => ({ ...current, content: { ...current.content, development: next } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="직접 담당한 개발 영역 편집">
      <PanelHeading title="직접 담당한 개발 영역" onAdd={() => setItems([...items, { title: "", items: [] }])} />
      <div className={styles.projectItemList}>{items.map((item, index) => (
        <article className={styles.projectItemEditor} key={`development-${index}`}>
          <div className={`${styles.projectItemFields} ${styles.developmentFields}`}>
            <TextField label={`개발 영역 ${index + 1} Title`} value={item.title} onChange={(title) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, title } : value))} />
            <div className={styles.nestedStringList}>
              <span className="type-small">Items</span>
              {item.items.map((task, taskIndex) => (
                <div className={styles.stringItemRow} key={`task-${taskIndex}`}>
                  <input className="type-body" aria-label={`개발 영역 ${index + 1} Item ${taskIndex + 1}`} value={task} onChange={(event) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, items: value.items.map((text, valueIndex) => valueIndex === taskIndex ? event.currentTarget.value : text) } : value))} />
                  <ItemActions index={taskIndex} length={item.items.length} label={`개발 영역 ${index + 1} Item ${taskIndex + 1}`} onMove={(direction) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, items: moveProjectItem(value.items, taskIndex, direction) } : value))} onDelete={() => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, items: value.items.filter((_, valueIndex) => valueIndex !== taskIndex) } : value))} />
                </div>
              ))}
              <Button className={styles.nestedStringAdd} variant="secondary" size="small" type="button" onClick={() => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, items: [...value.items, ""] } : value))}><Plus aria-hidden="true" />Item 추가</Button>
            </div>
          </div>
          <ItemActions index={index} length={items.length} label={`개발 영역 ${index + 1}`} onMove={(direction) => setItems(moveProjectItem(items, index, direction))} onDelete={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} />
        </article>
      ))}</div>
    </section>
  );
}

// Architecture Image와 Notes 편집 패널
function ArchitecturePanel({
  draft,
  setDraft,
  onArchitectureImageFile,
  onArchitectureImageRemove,
  fileError,
}: Pick<PanelProps, "draft" | "setDraft" | "onArchitectureImageFile" | "onArchitectureImageRemove" | "fileError">) {
  const notes = draft.content.architecture.notes;
  const imageSource = draft.architectureImage.previewUrl
    || (draft.architectureImage.mode === "KEEP" ? draft.architectureImage.imageUrl : null);
  const setNotes = (next: typeof notes) => setDraft((current) => ({
    ...current,
    content: { ...current.content, architecture: { notes: next } },
  }));
  return (
    <section className={styles.projectEditorPanel} aria-label="아키텍처 편집">
      <PanelHeading title="아키텍처" onAdd={() => setNotes([...notes, { title: "", body: "" }])} />
      <section className={styles.mediaGroup}>
        <div className={styles.mediaGroupHeading}>
          <div><h3 className="type-body">Architecture Image</h3><p className="type-small">{getImageModeLabel(draft.architectureImage.mode)}</p></div>
          <div className={styles.mediaGroupActions}>
            <label className={buttonClassName({ variant: "secondary", className: "type-body" })}><ImagePlus aria-hidden="true" />파일 선택<input className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onArchitectureImageFile(file); event.currentTarget.value = ""; }} /></label>
            <Button variant="secondary" type="button" onClick={onArchitectureImageRemove}>이미지 제거</Button>
          </div>
        </div>
        <div className={styles.architectureDraftPreview}>
          <AdminImagePreview
            alt="Architecture Preview"
            fallback={<span className="type-small">Architecture Image 없음</span>}
            sizes="720px"
            src={imageSource}
          />
        </div>
      </section>
      <div className={styles.projectItemList}>{notes.map((note, index) => (
        <article className={styles.projectItemEditor} key={`architecture-note-${index}`}>
          <div className={styles.projectItemFields}>
            <TextField label={`Note ${index + 1} Title`} value={note.title} onChange={(title) => setNotes(notes.map((value, itemIndex) => itemIndex === index ? { ...value, title } : value))} />
            <TextAreaField label={`Note ${index + 1} Body`} value={note.body} onChange={(body) => setNotes(notes.map((value, itemIndex) => itemIndex === index ? { ...value, body } : value))} />
          </div>
          <ItemActions index={index} length={notes.length} label={`Architecture Note ${index + 1}`} onMove={(direction) => setNotes(moveProjectItem(notes, index, direction))} onDelete={() => setNotes(notes.filter((_, itemIndex) => itemIndex !== index))} />
        </article>
      ))}</div>
      {fileError ? <p className={`${styles.inlineError} type-small`} role="alert">{fileError}</p> : null}
    </section>
  );
}

// 기술적 문제 해결 항목 편집 패널
function EngineeringPanel({ draft, setDraft }: Pick<PanelProps, "draft" | "setDraft">) {
  const items = draft.content.engineering;
  const setItems = (next: typeof items) => setDraft((current) => ({ ...current, content: { ...current.content, engineering: next } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="기술적 문제 해결 편집">
      <PanelHeading title="기술적 문제 해결" onAdd={() => setItems([...items, { title: "", summary: null, problem: "", solution: "", result: "" }])} />
      <div className={styles.projectItemList}>{items.map((item, index) => (
        <article className={styles.projectItemEditor} key={`engineering-${index}`}>
          <div className={styles.projectItemFields}>
            <TextField label={`문제 해결 ${index + 1} Title`} value={item.title} onChange={(title) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, title } : value))} />
            <TextField label={`문제 해결 ${index + 1} Summary`} value={item.summary} onChange={(summary) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, summary: summary || null } : value))} />
            {(["problem", "solution", "result"] as const).map((field) => <TextAreaField key={field} label={`문제 해결 ${index + 1} ${field[0].toUpperCase()}${field.slice(1)}`} value={item[field]} onChange={(text) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, [field]: text } : value))} />)}
          </div>
          <ItemActions index={index} length={items.length} label={`문제 해결 ${index + 1}`} onMove={(direction) => setItems(moveProjectItem(items, index, direction))} onDelete={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} />
        </article>
      ))}</div>
    </section>
  );
}

// technology_master 기반 Project 기술 구성 패널
function TechnologyPanel({ draft, setDraft, technologyMaster }: Pick<PanelProps, "draft" | "setDraft" | "technologyMaster">) {
  const [selectedId, setSelectedId] = useState("");
  const selected = new Set(draft.technologies.map((item) => item.technologyId));
  const setItems = (technologies: ProjectEditorDraft["technologies"]) => setDraft((current) => ({ ...current, technologies }));
  return (
    <section className={styles.projectEditorPanel} aria-label="기술 편집">
      <PanelHeading title="기술" />
      <div className={styles.technologyPicker}>
        <label className={styles.formField}><span className="type-small">프로젝트 기술 선택</span><Select aria-label="프로젝트 기술 선택" value={selectedId} onValueChange={setSelectedId} options={[{ value: "", label: "기술 선택" }, ...technologyMaster.filter((item) => !selected.has(item.id)).map((item) => ({ value: String(item.id), label: `${item.name}${item.enabled ? "" : " · 비활성"}`, disabled: !item.enabled }))]} /></label>
        <Button variant="secondary" type="button" disabled={!selectedId} onClick={() => { const id = Number(selectedId); setItems([...draft.technologies, { technologyId: id, showOnCard: false, highlighted: false, displayOrder: draft.technologies.length }]); setSelectedId(""); }}><Plus aria-hidden="true" />추가</Button>
      </div>
      <SortableList
        items={draft.technologies}
        getKey={(item) => item.technologyId}
        getTitle={(item) => technologyMaster.find((value) => value.id === item.technologyId)?.name ?? `Technology #${item.technologyId}`}
        onChange={(items) => setItems(items.map((item, index) => ({ ...item, displayOrder: index })))}
        renderActions={(item, index, controls) => {
          const technologyName = technologyMaster.find((value) => value.id === item.technologyId)?.name ?? `Technology #${item.technologyId}`;
          return <><StateSwitch enabled={item.highlighted} label={`${technologyName} ${item.highlighted ? "강조 해제" : "강조 설정"}`} onClick={() => setItems(draft.technologies.map((value) => value.technologyId === item.technologyId ? { ...value, highlighted: !value.highlighted } : value))} />{controls.moveUp}{controls.moveDown}<button className={styles.iconButton} type="button" aria-label={`${technologyName} 기술에서 제거`} onClick={() => setItems(draft.technologies.filter((_, itemIndex) => itemIndex !== index).map((value, itemIndex) => ({ ...value, displayOrder: itemIndex })))}><X aria-hidden="true" /></button></>;
        }}
      />
    </section>
  );
}

// Thumbnail과 Carousel 통합 Local Draft 패널
function MediaPanel(props: Pick<PanelProps, "draft" | "setDraft" | "onThumbnailFile" | "onThumbnailRemove" | "onAddMedia" | "onDeleteMedia" | "onChangeMedia" | "fileError">) {
  const { draft, setDraft, onThumbnailFile, onThumbnailRemove, onAddMedia, onDeleteMedia, onChangeMedia, fileError } = props;
  const thumbnailSource = draft.thumbnail.previewUrl || (draft.thumbnail.mode === "KEEP" ? draft.thumbnail.imageUrl : null);
  return (
    <section className={styles.projectEditorPanel} aria-label="미디어 편집">
      <PanelHeading title="미디어" />
      <section className={styles.mediaGroup}><div className={styles.mediaGroupHeading}><div><h3 className="type-body">Thumbnail</h3><p className="type-small">{getImageModeLabel(draft.thumbnail.mode)}</p></div><div className={styles.mediaGroupActions}><label className={buttonClassName({ variant: "secondary", className: "type-body" })}><ImagePlus aria-hidden="true" />파일 선택<input className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onThumbnailFile(file); event.currentTarget.value = ""; }} /></label><Button variant="secondary" type="button" onClick={onThumbnailRemove}>이미지 제거</Button></div></div><div className={styles.thumbnailDraftPreview}><AdminImagePreview alt="Thumbnail Preview" fallback={<span className="type-small">Thumbnail 없음</span>} sizes="420px" src={thumbnailSource} /></div></section>
      <section className={styles.mediaGroup}><div className={styles.mediaGroupHeading}><div><h3 className="type-body">Carousel</h3><p className="type-small">{draft.media.filter((item) => !item.deleted).length}개 사용</p></div><label className={buttonClassName({ variant: "secondary", className: "type-body" })}><Plus aria-hidden="true" />이미지 추가<input className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onAddMedia(file); event.currentTarget.value = ""; }} /></label></div><SortableList layout="expanded" items={draft.media.filter((item) => !item.deleted)} getKey={(item) => item.key} getTitle={(item) => item.label || `Carousel ${draft.media.filter((value) => !value.deleted).indexOf(item) + 1}`} onChange={(items) => { const deleted = draft.media.filter((item) => item.deleted); setDraft((current) => ({ ...current, media: [...items.map((item, index) => ({ ...item, displayOrder: index })), ...deleted] })); }} renderExtra={(item) => <><div className={styles.mediaDraftPreview}><AdminImagePreview alt="" fallback={<span className={`${styles.previewUnavailable} type-small`}>미리보기 없음</span>} sizes="120px" src={item.previewUrl || item.imageUrl || null} /></div><div className={styles.mediaDraftFields}><TextField label="Label" value={item.label} onChange={(label) => onChangeMedia(item.key, { label: label || null })} /><TextField label="Alt Text" value={item.altText} onChange={(altText) => onChangeMedia(item.key, { altText: altText || null })} /></div><button className={styles.iconButton} type="button" aria-label={`${item.label || "Carousel"} 삭제`} onClick={() => onDeleteMedia(item.key)}><Trash2 aria-hidden="true" /></button></>} />{draft.media.filter((item) => item.deleted).map((item) => <div className={styles.deletedMediaRow} key={item.key}><span className="type-small">{item.label || "삭제 예정 이미지"}</span><Button variant="secondary" type="button" onClick={() => setDraft((current) => { const activeCount = current.media.filter((value) => !value.deleted).length; return { ...current, media: current.media.map((value) => value.key === item.key ? { ...value, deleted: false, displayOrder: activeCount } : value) }; })}><RotateCcw aria-hidden="true" />삭제 취소</Button></div>)}</section>
      {fileError ? <p className={`${styles.inlineError} type-small`} role="alert">{fileError}</p> : null}
    </section>
  );
}

function TextField({ label, value, onChange, maxLength, type = "text", wide = false }: { label: string; value: string | null; onChange: (value: string) => void; maxLength?: number; type?: string; wide?: boolean }) {
  return <label className={`${styles.formField} ${wide ? styles.wideField : ""}`}><span className="type-small">{label}</span><input className="type-body" aria-label={label} type={type} value={value ?? ""} maxLength={maxLength} onChange={(event) => onChange(event.currentTarget.value)} /></label>;
}

function TextAreaField({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string) => void }) {
  return <label className={`${styles.formField} ${styles.wideField}`}><span className="type-small">{label}</span><textarea className="type-body" aria-label={label} rows={4} value={value ?? ""} onChange={(event) => onChange(event.currentTarget.value)} /></label>;
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number | null; min?: number; max?: number; onChange: (value: number | null) => void }) {
  return <label className={styles.formField}><span className="type-small">{label}</span><input className="type-body" aria-label={label} type="number" min={min} max={max} value={value ?? ""} onChange={(event) => onChange(event.currentTarget.value === "" ? null : Number(event.currentTarget.value))} /></label>;
}

// 고정 8개 Editor Section 중 현재 선택 Panel 렌더링
export default function ProjectEditorPanel(props: PanelProps) {
  switch (props.section) {
    case "basic": return <BasicPanel {...props} />;
    case "results": return <ResultsPanel {...props} />;
    case "overview": return <OverviewPanel {...props} />;
    case "development": return <DevelopmentPanel {...props} />;
    case "architecture": return <ArchitecturePanel {...props} />;
    case "engineering": return <EngineeringPanel {...props} />;
    case "technologies": return <TechnologyPanel {...props} />;
    case "media": return <MediaPanel {...props} />;
  }
}
