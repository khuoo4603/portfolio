"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import type {
  ProjectContentMediaReference,
  ProjectSaveContent,
  Technology,
} from "./admin-types";
import type { EditorMedia, ProjectEditorDraft } from "./project-editor-model";
import { moveProjectItem } from "./project-editor-model";
import styles from "./admin.module.css";

export type ProjectEditorSection = "basic" | "results" | "background" | "features" | "development" | "architecture" | "engineering" | "technologies" | "media";

type PanelProps = {
  section: ProjectEditorSection;
  draft: ProjectEditorDraft;
  setDraft: Dispatch<SetStateAction<ProjectEditorDraft>>;
  technologyMaster: Technology[];
  onThumbnailFile: (file: File) => void;
  onThumbnailRemove: () => void;
  onAddMedia: (file: File, mediaType: EditorMedia["mediaType"]) => EditorMedia | null;
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

function PanelHeading({ title, description, onAdd }: { title: string; description: string; onAdd?: () => void }) {
  return (
    <div className={styles.projectPanelHeading}>
      <div><h2 className="type-title">{title}</h2><p className="type-small">{description}</p></div>
      {onAdd && <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onAdd}><Plus aria-hidden="true" />항목 추가</button>}
    </div>
  );
}

// 공개 상태를 제외한 Project 기본정보 편집 패널
function BasicPanel({ draft, setDraft }: Pick<PanelProps, "draft" | "setDraft">) {
  const update = (patch: Partial<ProjectEditorDraft["project"]>) => setDraft((current) => ({ ...current, project: { ...current.project, ...patch } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="기본 정보 편집">
      <PanelHeading title="기본 정보" description="공개 상태를 제외한 카드와 상세 Hero 정보를 편집합니다." />
      <div className={styles.projectFieldsGrid}>
        <TextField label="Name" value={draft.project.name} maxLength={200} onChange={(name) => update({ name })} />
        <TextField label="Slug" value={draft.project.slug} maxLength={100} onChange={(slug) => update({ slug })} />
        <NumberField label="Year" value={draft.project.year} min={1900} max={2100} onChange={(year) => update({ year })} />
        <NumberField label="Display Order" value={draft.project.displayOrder} min={0} onChange={(displayOrder) => update({ displayOrder: displayOrder ?? 0 })} />
        <TextField label="Tagline" value={draft.project.tagline} maxLength={300} onChange={(tagline) => update({ tagline: tagline || null })} wide />
        <TextAreaField label="Description" value={draft.project.description} onChange={(description) => update({ description: description || null })} />
        <TextField label="Card Role" value={draft.project.cardRole} maxLength={150} onChange={(cardRole) => update({ cardRole: cardRole || null })} />
        <TextAreaField label="Summary" value={draft.project.summary} onChange={(summary) => update({ summary: summary || null })} />
        <TextField label="Detail Role" value={draft.project.detailRole} maxLength={200} onChange={(detailRole) => update({ detailRole: detailRole || null })} />
        <TextField label="Started At" type="date" value={draft.project.startedAt} onChange={(startedAt) => update({ startedAt: startedAt || null })} />
        <TextField label="Ended At" type="date" value={draft.project.endedAt} onChange={(endedAt) => update({ endedAt: endedAt || null })} />
        <NumberField label="Team Size" value={draft.project.teamSize} min={1} onChange={(teamSize) => update({ teamSize })} />
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
      <PanelHeading title="성과" description="Title과 Description을 순서대로 관리합니다." onAdd={() => setItems([...items, { title: "", description: "" }])} />
      <div className={styles.projectItemList}>{items.map((item, index) => (
        <article className={styles.projectItemEditor} key={`result-${index}`}>
          <div className={styles.projectItemFields}>
            <TextField label={`성과 ${index + 1} Title`} value={item.title} onChange={(title) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, title } : value))} />
            <TextAreaField label={`성과 ${index + 1} Description`} value={item.description} onChange={(description) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, description } : value))} />
          </div>
          <ItemActions index={index} length={items.length} label={`성과 ${index + 1}`} onMove={(direction) => setItems(moveProjectItem(items, index, direction))} onDelete={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} />
        </article>
      ))}</div>
    </section>
  );
}

// CONTENT Media만 제공하는 Section Item 이미지 선택기
function ContentImageField({ reference, media, onChange, onAddMedia }: {
  reference: ProjectContentMediaReference;
  media: EditorMedia[];
  onChange: (reference: ProjectContentMediaReference) => void;
  onAddMedia: PanelProps["onAddMedia"];
}) {
  const options = media.filter((item) => item.mediaType === "CONTENT" && !item.deleted);
  const value = reference.clientKey ? `client:${reference.clientKey}` : reference.mediaId ? `id:${reference.mediaId}` : "";
  return (
    <div className={styles.contentImageField}>
      <label className={styles.formField}>
        <span className="type-small">Content Image</span>
        <select className="type-body" value={value} onChange={(event) => {
          const [kind, raw] = event.currentTarget.value.split(":");
          onChange(kind === "id" ? { mediaId: Number(raw), clientKey: null } : kind === "client" ? { mediaId: null, clientKey: raw } : { mediaId: null, clientKey: null });
        }}>
          <option value="">이미지 없음</option>
          {options.map((item) => <option key={item.key} value={item.id ? `id:${item.id}` : `client:${item.clientKey}`}>{item.label || item.file?.name || `CONTENT ${item.id}`}</option>)}
        </select>
      </label>
      <label className={`${styles.secondaryButton} ${styles.compactFileButton} type-body`}>
        <ImagePlus aria-hidden="true" />새 이미지
        <input className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          const added = onAddMedia(file, "CONTENT");
          if (added?.clientKey) onChange({ mediaId: null, clientKey: added.clientKey });
          event.currentTarget.value = "";
        }} />
      </label>
    </div>
  );
}

// 선택 Title·Body·Content Image 문제 배경 편집 패널
function BackgroundPanel(props: Pick<PanelProps, "draft" | "setDraft" | "onAddMedia">) {
  const { draft, setDraft, onAddMedia } = props;
  const items = draft.content.background;
  const setItems = (next: typeof items) => setDraft((current) => ({ ...current, content: { ...current.content, background: next } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="문제 배경 편집">
      <PanelHeading title="문제 배경" description="선택 Title, Body와 CONTENT 이미지를 관리합니다." onAdd={() => setItems([...items, { title: null, body: "", mediaId: null, clientKey: null }])} />
      <div className={styles.projectItemList}>{items.map((item, index) => (
        <article className={styles.projectItemEditor} key={`background-${index}`}>
          <div className={styles.projectItemFields}>
            <TextField label={`문제 배경 ${index + 1} Title`} value={item.title} onChange={(title) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, title: title || null } : value))} />
            <TextAreaField label={`문제 배경 ${index + 1} Body`} value={item.body} onChange={(body) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, body } : value))} />
            <ContentImageField reference={item} media={draft.media} onAddMedia={onAddMedia} onChange={(reference) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, ...reference } : value))} />
          </div>
          <ItemActions index={index} length={items.length} label={`문제 배경 ${index + 1}`} onMove={(direction) => setItems(moveProjectItem(items, index, direction))} onDelete={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} />
        </article>
      ))}</div>
    </section>
  );
}

// 주요 기능 Title·Description·Content Image 편집 패널
function FeaturesPanel(props: Pick<PanelProps, "draft" | "setDraft" | "onAddMedia">) {
  const { draft, setDraft, onAddMedia } = props;
  const items = draft.content.features;
  const setItems = (next: typeof items) => setDraft((current) => ({ ...current, content: { ...current.content, features: next } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="주요 기능 편집">
      <PanelHeading title="주요 기능" description="Title, Description과 CONTENT 이미지를 관리합니다." onAdd={() => setItems([...items, { title: "", description: "", mediaId: null, clientKey: null }])} />
      <div className={styles.projectItemList}>{items.map((item, index) => (
        <article className={styles.projectItemEditor} key={`feature-${index}`}>
          <div className={styles.projectItemFields}>
            <TextField label={`주요 기능 ${index + 1} Title`} value={item.title} onChange={(title) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, title } : value))} />
            <TextAreaField label={`주요 기능 ${index + 1} Description`} value={item.description} onChange={(description) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, description } : value))} />
            <ContentImageField reference={item} media={draft.media} onAddMedia={onAddMedia} onChange={(reference) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, ...reference } : value))} />
          </div>
          <ItemActions index={index} length={items.length} label={`주요 기능 ${index + 1}`} onMove={(direction) => setItems(moveProjectItem(items, index, direction))} onDelete={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} />
        </article>
      ))}</div>
    </section>
  );
}

// 개발 영역과 내부 작업 목록 편집 패널
function DevelopmentPanel(props: Pick<PanelProps, "draft" | "setDraft" | "onAddMedia">) {
  const { draft, setDraft, onAddMedia } = props;
  const items = draft.content.development;
  const setItems = (next: typeof items) => setDraft((current) => ({ ...current, content: { ...current.content, development: next } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="직접 담당한 개발 영역 편집">
      <PanelHeading title="직접 담당한 개발 영역" description="영역별 작업 목록과 CONTENT 이미지를 관리합니다." onAdd={() => setItems([...items, { title: "", items: [], mediaId: null, clientKey: null }])} />
      <div className={styles.projectItemList}>{items.map((item, index) => (
        <article className={styles.projectItemEditor} key={`development-${index}`}>
          <div className={styles.projectItemFields}>
            <TextField label={`개발 영역 ${index + 1} Title`} value={item.title} onChange={(title) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, title } : value))} />
            <div className={styles.nestedStringList}>
              <span className="type-small">Items</span>
              {item.items.map((task, taskIndex) => (
                <div className={styles.stringItemRow} key={`task-${taskIndex}`}>
                  <input className="type-body" aria-label={`개발 영역 ${index + 1} Item ${taskIndex + 1}`} value={task} onChange={(event) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, items: value.items.map((text, valueIndex) => valueIndex === taskIndex ? event.currentTarget.value : text) } : value))} />
                  <ItemActions index={taskIndex} length={item.items.length} label={`개발 영역 ${index + 1} Item ${taskIndex + 1}`} onMove={(direction) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, items: moveProjectItem(value.items, taskIndex, direction) } : value))} onDelete={() => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, items: value.items.filter((_, valueIndex) => valueIndex !== taskIndex) } : value))} />
                </div>
              ))}
              <button className={`${styles.textButton} type-small`} type="button" onClick={() => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, items: [...value.items, ""] } : value))}>Item 추가</button>
            </div>
            <ContentImageField reference={item} media={draft.media} onAddMedia={onAddMedia} onChange={(reference) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, ...reference } : value))} />
          </div>
          <ItemActions index={index} length={items.length} label={`개발 영역 ${index + 1}`} onMove={(direction) => setItems(moveProjectItem(items, index, direction))} onDelete={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} />
        </article>
      ))}</div>
    </section>
  );
}

// 고정 5개 Architecture 문자열 그룹 편집 패널
function ArchitecturePanel({ draft, setDraft }: Pick<PanelProps, "draft" | "setDraft">) {
  const definitions: Array<{ key: keyof ProjectSaveContent["architecture"]; label: string }> = [
    { key: "clients", label: "clients" }, { key: "services", label: "services" },
    { key: "dataAndExternal", label: "dataAndExternal" }, { key: "runtime", label: "runtime" }, { key: "delivery", label: "delivery" },
  ];
  const update = (key: keyof ProjectSaveContent["architecture"], values: string[]) => setDraft((current) => ({ ...current, content: { ...current.content, architecture: { ...current.content.architecture, [key]: values } } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="아키텍처 편집">
      <PanelHeading title="아키텍처" description="고정 5개 Node Group의 문자열 목록만 편집합니다." />
      <div className={styles.architectureEditors}>{definitions.map(({ key, label }) => {
        const values = draft.content.architecture[key] ?? [];
        return <section className={styles.architectureGroupEditor} key={key}><div className={styles.architectureGroupHeading}><h3 className="type-body">{label}</h3><button className={`${styles.textButton} type-small`} type="button" onClick={() => update(key, [...values, ""])}>Node 추가</button></div>{values.map((value, index) => <div className={styles.stringItemRow} key={`${key}-${index}`}><input className="type-body" aria-label={`${label} ${index + 1}`} value={value} onChange={(event) => update(key, values.map((text, itemIndex) => itemIndex === index ? event.currentTarget.value : text))} /><ItemActions index={index} length={values.length} label={`${label} ${index + 1}`} onMove={(direction) => update(key, moveProjectItem(values, index, direction))} onDelete={() => update(key, values.filter((_, itemIndex) => itemIndex !== index))} /></div>)}</section>;
      })}</div>
    </section>
  );
}

// 기술적 문제 해결 항목 편집 패널
function EngineeringPanel(props: Pick<PanelProps, "draft" | "setDraft" | "onAddMedia">) {
  const { draft, setDraft, onAddMedia } = props;
  const items = draft.content.engineering;
  const setItems = (next: typeof items) => setDraft((current) => ({ ...current, content: { ...current.content, engineering: next } }));
  return (
    <section className={styles.projectEditorPanel} aria-label="기술적 문제 해결 편집">
      <PanelHeading title="기술적 문제 해결" description="Problem·Solution·Result와 선택 Summary·CONTENT 이미지를 관리합니다." onAdd={() => setItems([...items, { title: "", summary: null, problem: "", solution: "", result: "", mediaId: null, clientKey: null }])} />
      <div className={styles.projectItemList}>{items.map((item, index) => (
        <article className={styles.projectItemEditor} key={`engineering-${index}`}>
          <div className={styles.projectItemFields}>
            <TextField label={`문제 해결 ${index + 1} Title`} value={item.title} onChange={(title) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, title } : value))} />
            <TextField label={`문제 해결 ${index + 1} Summary`} value={item.summary} onChange={(summary) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, summary: summary || null } : value))} />
            {(["problem", "solution", "result"] as const).map((field) => <TextAreaField key={field} label={`문제 해결 ${index + 1} ${field[0].toUpperCase()}${field.slice(1)}`} value={item[field]} onChange={(text) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, [field]: text } : value))} />)}
            <ContentImageField reference={item} media={draft.media} onAddMedia={onAddMedia} onChange={(reference) => setItems(items.map((value, itemIndex) => itemIndex === index ? { ...value, ...reference } : value))} />
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
      <PanelHeading title="기술" description="technology_master에서 선택하고 카드 노출·강조·순서를 관리합니다." />
      <div className={styles.technologyPicker}>
        <label className={styles.formField}><span className="type-small">프로젝트 기술 선택</span><select className="type-body" value={selectedId} onChange={(event) => setSelectedId(event.currentTarget.value)}><option value="">기술 선택</option>{technologyMaster.filter((item) => !selected.has(item.id)).map((item) => <option key={item.id} value={item.id} disabled={!item.enabled}>{item.name}{item.enabled ? "" : " · 비활성"}</option>)}</select></label>
        <button className={`${styles.secondaryButton} type-body`} type="button" disabled={!selectedId} onClick={() => { const id = Number(selectedId); setItems([...draft.technologies, { technologyId: id, showOnCard: false, highlighted: false, displayOrder: draft.technologies.length }]); setSelectedId(""); }}>추가</button>
      </div>
      <div className={styles.projectItemList}>{draft.technologies.map((item, index) => {
        const technology = technologyMaster.find((value) => value.id === item.technologyId);
        return <article className={styles.technologyDraftRow} key={item.technologyId}><div><strong className="type-body">{technology?.name ?? `Technology #${item.technologyId}`}</strong><span className="type-small">{technology?.category}{technology && !technology.enabled ? " · 기존 비활성 연결" : ""}</span></div><label className={styles.checkField}><input type="checkbox" checked={item.showOnCard} onChange={(event) => setItems(draft.technologies.map((value, itemIndex) => itemIndex === index ? { ...value, showOnCard: event.currentTarget.checked } : value))} />Card 노출</label><label className={styles.checkField}><input type="checkbox" checked={item.highlighted} onChange={(event) => setItems(draft.technologies.map((value, itemIndex) => itemIndex === index ? { ...value, highlighted: event.currentTarget.checked } : value))} />Highlighted</label><NumberField label="Display Order" value={item.displayOrder} min={0} onChange={(displayOrder) => setItems(draft.technologies.map((value, itemIndex) => itemIndex === index ? { ...value, displayOrder: displayOrder ?? 0 } : value))} /><ItemActions index={index} length={draft.technologies.length} label={`${technology?.name ?? "기술"}`} onMove={(direction) => setItems(moveProjectItem(draft.technologies, index, direction).map((value, itemIndex) => ({ ...value, displayOrder: itemIndex })))} onDelete={() => setItems(draft.technologies.filter((_, itemIndex) => itemIndex !== index))} /></article>;
      })}</div>
    </section>
  );
}

// 기존·신규 Project Media 단일 행 편집기
function MediaRow({ item, index, length, onDelete, onRestore, onChange, onMove }: {
  item: EditorMedia; index: number; length: number;
  onDelete: () => void; onRestore: () => void; onChange: (patch: Partial<EditorMedia>) => void; onMove: (direction: -1 | 1) => void;
}) {
  const source = item.previewUrl || item.imageUrl;
  return (
    <article className={styles.mediaDraftRow} data-deleted={item.deleted ? "true" : "false"}>
      <div className={styles.mediaDraftPreview}>{source ? <Image src={source} alt="" fill sizes="120px" unoptimized /> : null}</div>
      <div className={styles.mediaDraftFields}>
        <TextField label="Label" value={item.label} onChange={(label) => onChange({ label: label || null })} />
        <TextField label="Alt Text" value={item.altText} onChange={(altText) => onChange({ altText: altText || null })} />
        <NumberField label="Display Order" value={item.displayOrder} min={0} onChange={(displayOrder) => onChange({ displayOrder: displayOrder ?? 0 })} />
      </div>
      {item.deleted ? <button className={`${styles.secondaryButton} type-body`} type="button" onClick={onRestore}><RotateCcw aria-hidden="true" />삭제 취소</button> : <ItemActions index={index} length={length} label={`${item.mediaType} ${index + 1}`} onMove={onMove} onDelete={onDelete} />}
    </article>
  );
}

// Thumbnail·Carousel·Content Image 통합 Local Draft 패널
function MediaPanel(props: Pick<PanelProps, "draft" | "onThumbnailFile" | "onThumbnailRemove" | "onAddMedia" | "onDeleteMedia" | "onChangeMedia" | "onMoveMedia" | "fileError">) {
  const { draft, onThumbnailFile, onThumbnailRemove, onAddMedia, onDeleteMedia, onChangeMedia, onMoveMedia, fileError } = props;
  const thumbnailSource = draft.thumbnail.previewUrl || (draft.thumbnail.mode === "KEEP" ? draft.thumbnail.imageUrl : null);
  return (
    <section className={styles.projectEditorPanel} aria-label="미디어 편집">
      <PanelHeading title="미디어" description="Thumbnail·Carousel·Content Image를 Local Draft에서 함께 관리합니다." />
      <section className={styles.mediaGroup}><div className={styles.mediaGroupHeading}><div><h3 className="type-body">Thumbnail</h3><p className="type-small">현재 상태: {draft.thumbnail.mode}</p></div><div className={styles.mediaGroupActions}><label className={`${styles.secondaryButton} type-body`}><ImagePlus aria-hidden="true" />파일 선택<input className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onThumbnailFile(file); event.currentTarget.value = ""; }} /></label><button className={`${styles.secondaryButton} type-body`} type="button" onClick={onThumbnailRemove}>Remove</button></div></div><div className={styles.thumbnailDraftPreview}>{thumbnailSource ? <Image src={thumbnailSource} alt="Thumbnail Preview" fill sizes="420px" unoptimized /> : <span className="type-small">Thumbnail 없음</span>}</div></section>
      {(["CAROUSEL", "CONTENT"] as const).map((mediaType) => {
        const items = draft.media.filter((item) => item.mediaType === mediaType);
        return <section className={styles.mediaGroup} key={mediaType}><div className={styles.mediaGroupHeading}><div><h3 className="type-body">{mediaType === "CAROUSEL" ? "Carousel" : "Content Image"}</h3><p className="type-small">{items.filter((item) => !item.deleted).length}개 사용</p></div><label className={`${styles.secondaryButton} type-body`}><ImagePlus aria-hidden="true" />이미지 추가<input className={styles.srOnly} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onAddMedia(file, mediaType); event.currentTarget.value = ""; }} /></label></div><div className={styles.projectItemList}>{items.map((item, index) => <MediaRow key={item.key} item={item} index={index} length={items.length} onDelete={() => onDeleteMedia(item.key)} onRestore={() => onChangeMedia(item.key, { deleted: false })} onChange={(patch) => onChangeMedia(item.key, patch)} onMove={(direction) => onMoveMedia(item.key, direction)} />)}</div></section>;
      })}
      <p className={`${styles.inlineError} type-small`} role="alert">{fileError}</p>
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

// 고정 9개 Editor Section 중 현재 선택 Panel 렌더링
export default function ProjectEditorPanel(props: PanelProps) {
  switch (props.section) {
    case "basic": return <BasicPanel {...props} />;
    case "results": return <ResultsPanel {...props} />;
    case "background": return <BackgroundPanel {...props} />;
    case "features": return <FeaturesPanel {...props} />;
    case "development": return <DevelopmentPanel {...props} />;
    case "architecture": return <ArchitecturePanel {...props} />;
    case "engineering": return <EngineeringPanel {...props} />;
    case "technologies": return <TechnologyPanel {...props} />;
    case "media": return <MediaPanel {...props} />;
  }
}
