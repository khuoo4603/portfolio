"use client";

import { FileText, Link as LinkIcon, MoreHorizontal, Plus, Upload } from "lucide-react";
import { useState } from "react";
import type {
  ExternalLink,
  ExternalLinkInput,
  ProfileEntry,
  ProfileEntryInput,
  SiteContent,
  SiteData,
  Technology,
  TechnologyInput,
} from "./admin-types";
import AdminActionDialog from "./admin-action-dialog";
import {
  EmptyState,
  PageHeader,
  StateSwitch,
  StatusLabel,
  SubmitButton,
  formatDateTime,
  formatFileSize,
} from "./admin-ui";
import { MOCK_SITE_DATA } from "./mock-data";
import { ExternalLinkEditor, ProfileEditor, TechnologyEditor } from "./site-editors";
import styles from "./admin.module.css";

type SiteTab = "common" | "profile" | "entries" | "technology" | "projects" | "links" | "resume";

type PendingAction = {
  label: string;
  run: () => void;
};

type ContentDefinition = {
  category: "COMMON" | "MAIN" | "PROFILE" | "CONTACT" | "EDUCATION" | "FOOTER";
  contentCode: string;
  label: string;
  multiline?: boolean;
};

const TABS: Array<{ id: SiteTab; label: string }> = [
  { id: "common", label: "메인·공통 콘텐츠" },
  { id: "profile", label: "프로필·학력·연락처" },
  { id: "entries", label: "경력·활동·수상·자격" },
  { id: "technology", label: "기술" },
  { id: "projects", label: "프로젝트" },
  { id: "links", label: "외부 링크" },
  { id: "resume", label: "이력서" },
];

const COMMON_CONTENTS: ContentDefinition[] = [
  { category: "COMMON", contentCode: "NAME", label: "이름" },
  { category: "COMMON", contentCode: "ENGLISH_NAME", label: "영문 이름" },
  { category: "COMMON", contentCode: "POSITION", label: "개발자 포지션" },
  { category: "COMMON", contentCode: "AFFILIATION", label: "현재 소속" },
  { category: "MAIN", contentCode: "HERO_TITLE", label: "Hero 핵심 문구", multiline: true },
  { category: "MAIN", contentCode: "HERO_DESCRIPTION", label: "Hero 보조 문구", multiline: true },
  { category: "FOOTER", contentCode: "FOOTER_MESSAGE", label: "Footer 문구", multiline: true },
];

const PROFILE_CONTENTS: ContentDefinition[] = [
  { category: "PROFILE", contentCode: "ABOUT", label: "상세 자기소개", multiline: true },
  { category: "PROFILE", contentCode: "DEVELOPMENT_VALUES", label: "개발 가치", multiline: true },
  { category: "PROFILE", contentCode: "INTEREST_AREAS", label: "관심 분야", multiline: true },
  { category: "PROFILE", contentCode: "PREFERRED_WORK_STYLE", label: "선호 개발 방식", multiline: true },
  { category: "PROFILE", contentCode: "CURRENT_FOCUS", label: "현재 집중 분야", multiline: true },
  { category: "PROFILE", contentCode: "FUTURE_DIRECTION", label: "향후 방향", multiline: true },
  { category: "CONTACT", contentCode: "EMAIL", label: "공개 이메일" },
  { category: "EDUCATION", contentCode: "SCHOOL_NAME", label: "학교" },
  { category: "EDUCATION", contentCode: "MAJOR", label: "전공" },
  { category: "EDUCATION", contentCode: "EDUCATION_STATUS", label: "학력 상태" },
];

function entryTypeLabel(type: ProfileEntry["entryType"]) {
  return { EXPERIENCE: "경력", ACTIVITY: "활동", AWARD: "수상", CERTIFICATE: "자격/교육" }[type];
}

function nextMockId(items: Array<{ id: number }>) {
  return items.reduce((largest, item) => Math.max(largest, item.id), 0) + 1;
}

// 고정 Site Content Code의 값만 일괄 수정하는 Form
function ContentPanel({
  definitions,
  contents,
  title,
  description,
  onSubmit,
}: {
  definitions: ContentDefinition[];
  contents: SiteContent[];
  title: string;
  description?: string;
  onSubmit: (items: Array<Pick<SiteContent, "category" | "contentCode" | "contentValue">>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(definitions.map((definition) => {
    const item = contents.find((content) => content.category === definition.category && content.contentCode === definition.contentCode);
    return [definition.contentCode, item?.contentValue || ""];
  })));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(definitions.map((definition) => ({
      category: definition.category,
      contentCode: definition.contentCode,
      contentValue: values[definition.contentCode] || "",
    })));
  };

  return (
    <section className={styles.contentEditor} aria-labelledby={`${definitions[0].contentCode}-title`}>
      <div className={styles.sectionHeading}>
        <div>
          <h2 id={`${definitions[0].contentCode}-title`} className="type-title">{title}</h2>
          {description && <p className="type-body">{description}</p>}
        </div>
      </div>
      <form className={styles.contentForm} onSubmit={handleSubmit}>
        {definitions.map((definition) => (
          <label key={`${definition.category}-${definition.contentCode}`} className={definition.multiline ? `${styles.formField} ${styles.wideField}` : styles.formField}>
            <span className="type-small">{definition.label}</span>
            {definition.multiline ? (
              <textarea className="type-body" rows={4} value={values[definition.contentCode]} onChange={(event) => setValues({ ...values, [definition.contentCode]: event.currentTarget.value })} required />
            ) : (
              <input className="type-body" type={definition.contentCode === "EMAIL" ? "email" : "text"} value={values[definition.contentCode]} onChange={(event) => setValues({ ...values, [definition.contentCode]: event.currentTarget.value })} required />
            )}
            <code>{definition.category}/{definition.contentCode}</code>
          </label>
        ))}
        <div className={styles.formActionRow}>
          <p className="type-small">저장 시 이 묶음에 대한 새 관리자 이메일 인증을 진행합니다.</p>
          <SubmitButton busy={false}>인증 후 저장</SubmitButton>
        </div>
      </form>
    </section>
  );
}

// Site Content와 Registry 관리 Domain을 탭으로 구분한 운영 화면
export default function SiteScreen() {
  const [data, setData] = useState<SiteData>(MOCK_SITE_DATA);
  const [tab, setTab] = useState<SiteTab>("common");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [profileEditor, setProfileEditor] = useState<{ item?: ProfileEntry } | null>(null);
  const [technologyEditor, setTechnologyEditor] = useState<{ item?: Technology } | null>(null);
  const [linkEditor, setLinkEditor] = useState<{ item?: ExternalLink } | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [feedback, setFeedback] = useState("");

  // 고정 콘텐츠 묶음의 로컬 상태 수정용 재인증 대기열
  const queueContentSave = (items: Array<Pick<SiteContent, "category" | "contentCode" | "contentValue">>) => {
    setPending({
      label: `${tab === "common" ? "메인·공통" : "프로필·학력·연락처"} 콘텐츠 저장`,
      run: () => {
        const updatedAt = new Date().toISOString();
        setData((current) => ({
          ...current,
          siteContents: current.siteContents.map((content) => {
            const update = items.find((item) => (
              item.category === content.category && item.contentCode === content.contentCode
            ));
            return update ? { ...content, ...update, updatedAt } : content;
          }),
        }));
      },
    });
  };

  // 프로필 반복 항목의 로컬 추가·수정용 재인증 대기열
  const queueProfileSave = (input: ProfileEntryInput, item?: ProfileEntry) => {
    setProfileEditor(null);
    setPending(item ? {
      label: `${item.title} 항목 수정`,
      run: () => setData((current) => ({
        ...current,
        profileEntries: current.profileEntries.map((entry) => (
          entry.id === item.id ? { ...entry, ...input, updatedAt: new Date().toISOString() } : entry
        )),
      })),
    } : {
      label: `${input.title} 항목 추가`,
      run: () => setData((current) => {
        const createdAt = new Date().toISOString();
        return {
          ...current,
          profileEntries: [
            ...current.profileEntries,
            { ...input, id: nextMockId(current.profileEntries), createdAt, updatedAt: createdAt },
          ],
        };
      }),
    });
  };

  // 프로필 반복 항목의 로컬 삭제용 재인증 대기열
  const queueProfileDelete = (item: ProfileEntry) => {
    setMenuKey(null);
    setPending({
      label: `${item.title} 항목 삭제`,
      run: () => setData((current) => ({
        ...current,
        profileEntries: current.profileEntries.filter((entry) => entry.id !== item.id),
      })),
    });
  };

  // 프로필 노출 상태의 로컬 변경용 재인증 대기열
  const queueProfileStatus = (item: ProfileEntry) => {
    setPending({
      label: `${item.title} 항목 ${item.enabled ? "비노출" : "노출"} 전환`,
      run: () => setData((current) => ({
        ...current,
        profileEntries: current.profileEntries.map((entry) => (
          entry.id === item.id
            ? { ...entry, enabled: !entry.enabled, updatedAt: new Date().toISOString() }
            : entry
        )),
      })),
    });
  };

  // 기술 항목의 로컬 추가·수정용 재인증 대기열
  const queueTechnologySave = (input: TechnologyInput, item?: Technology) => {
    setTechnologyEditor(null);
    setPending(item ? {
      label: `${item.name} 기술 수정`,
      run: () => setData((current) => ({
        ...current,
        technologies: current.technologies.map((technology) => (
          technology.id === item.id ? { ...technology, ...input } : technology
        )),
      })),
    } : {
      label: `${input.name} 기술 추가`,
      run: () => setData((current) => ({
        ...current,
        technologies: [...current.technologies, { ...input, id: nextMockId(current.technologies) }],
      })),
    });
  };

  // 기술 항목의 로컬 삭제용 재인증 대기열
  const queueTechnologyDelete = (item: Technology) => {
    setMenuKey(null);
    setPending({
      label: `${item.name} 기술 삭제`,
      run: () => setData((current) => ({
        ...current,
        technologies: current.technologies.filter((technology) => technology.id !== item.id),
      })),
    });
  };

  // 기술 노출 상태의 로컬 변경용 재인증 대기열
  const queueTechnologyStatus = (item: Technology) => {
    setPending({
      label: `${item.name} 기술 ${item.enabled ? "비노출" : "노출"} 전환`,
      run: () => setData((current) => ({
        ...current,
        technologies: current.technologies.map((technology) => (
          technology.id === item.id ? { ...technology, enabled: !technology.enabled } : technology
        )),
      })),
    });
  };

  // 고정 프로젝트 공개 상태의 로컬 변경용 재인증 대기열
  const queueProjectStatus = (projectKey: string, enabled: boolean) => {
    setPending({
      label: `${projectKey} 프로젝트 ${enabled ? "비공개" : "공개"} 전환`,
      run: () => setData((current) => ({
        ...current,
        projects: current.projects.map((project) => (
          project.projectKey === projectKey
            ? { ...project, enabled: !project.enabled, updatedAt: new Date().toISOString() }
            : project
        )),
      })),
    });
  };

  // 외부 링크의 로컬 추가·수정용 재인증 대기열
  const queueLinkSave = (input: ExternalLinkInput, item?: ExternalLink) => {
    setLinkEditor(null);
    setPending(item ? {
      label: `${item.name} 외부 링크 수정`,
      run: () => setData((current) => ({
        ...current,
        externalLinks: current.externalLinks.map((link) => (
          link.id === item.id ? { ...link, ...input } : link
        )),
      })),
    } : {
      label: `${input.name} 외부 링크 추가`,
      run: () => setData((current) => ({
        ...current,
        externalLinks: [...current.externalLinks, { ...input, id: nextMockId(current.externalLinks) }],
      })),
    });
  };

  // 외부 링크의 로컬 삭제용 재인증 대기열
  const queueLinkDelete = (item: ExternalLink) => {
    setMenuKey(null);
    setPending({
      label: `${item.name} 외부 링크 삭제`,
      run: () => setData((current) => ({
        ...current,
        externalLinks: current.externalLinks.filter((link) => link.id !== item.id),
      })),
    });
  };

  // 외부 링크 노출 상태의 로컬 변경용 재인증 대기열
  const queueLinkStatus = (item: ExternalLink) => {
    setPending({
      label: `${item.name} 외부 링크 ${item.enabled ? "비노출" : "노출"} 전환`,
      run: () => setData((current) => ({
        ...current,
        externalLinks: current.externalLinks.map((link) => (
          link.id === item.id ? { ...link, enabled: !link.enabled } : link
        )),
      })),
    });
  };

  // PDF 확장자·MIME·10MB 기준의 Client 1차 검증
  const selectResume = (file?: File) => {
    if (!file) {
      setResumeFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
      setResumeFile(null);
      setFileError("PDF 파일만 선택할 수 있습니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeFile(null);
      setFileError("이력서 파일은 10MB 이하여야 합니다.");
      return;
    }
    setResumeFile(file);
    setFileError("");
  };

  // 선택 PDF 메타데이터의 로컬 등록·교체용 재인증 대기열
  const queueResume = () => {
    if (!resumeFile) {
      return;
    }
    const file = resumeFile;
    setPending({
      label: `${file.name} 이력서 ${data.resume ? "교체" : "등록"}`,
      run: () => setData((current) => ({
        ...current,
        resume: { fileName: file.name, size: file.size, updatedAt: new Date().toISOString() },
      })),
    });
  };

  return (
    <>
      <PageHeader title="Site" description="포트폴리오에 노출되는 콘텐츠와 공개 상태를 관리합니다." />
      {feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}

      <div className={`${styles.lineTabs} ${styles.siteTabs}`} role="tablist" aria-label="사이트 관리 영역">
        {TABS.map((item) => (
          <button key={item.id} className={tab === item.id ? styles.lineTabActive : undefined} type="button" role="tab" aria-selected={tab === item.id} onClick={() => { setTab(item.id); setMenuKey(null); }}>
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.siteTabPanel} role="tabpanel">
        {tab === "common" && <ContentPanel definitions={COMMON_CONTENTS} contents={data.siteContents} title="메인·공통 콘텐츠" onSubmit={queueContentSave} />}
        {tab === "profile" && <ContentPanel definitions={PROFILE_CONTENTS} contents={data.siteContents} title="프로필·학력·연락처" description="About, 공개 이메일, 학력에 연결된 고정값" onSubmit={queueContentSave} />}
        {tab === "entries" && <ProfileEntriesPanel items={data.profileEntries} menuKey={menuKey} setMenuKey={setMenuKey} onCreate={() => setProfileEditor({})} onEdit={(item) => setProfileEditor({ item })} onDelete={queueProfileDelete} onToggle={queueProfileStatus} />}
        {tab === "technology" && <TechnologiesPanel items={data.technologies} menuKey={menuKey} setMenuKey={setMenuKey} onCreate={() => setTechnologyEditor({})} onEdit={(item) => setTechnologyEditor({ item })} onDelete={queueTechnologyDelete} onToggle={queueTechnologyStatus} />}
        {tab === "projects" && <ProjectsPanel projects={data.projects} onToggle={queueProjectStatus} />}
        {tab === "links" && <ExternalLinksPanel items={data.externalLinks} menuKey={menuKey} setMenuKey={setMenuKey} onCreate={() => setLinkEditor({})} onEdit={(item) => setLinkEditor({ item })} onDelete={queueLinkDelete} onToggle={queueLinkStatus} />}
        {tab === "resume" && <ResumePanel data={data} file={resumeFile} error={fileError} onSelect={selectResume} onSubmit={queueResume} />}
      </div>

      {profileEditor && <ProfileEditor key={profileEditor.item?.id || "new"} state={profileEditor} onClose={() => setProfileEditor(null)} onSubmit={queueProfileSave} />}
      {technologyEditor && <TechnologyEditor key={technologyEditor.item?.id || "new"} state={technologyEditor} onClose={() => setTechnologyEditor(null)} onSubmit={queueTechnologySave} />}
      {linkEditor && <ExternalLinkEditor key={linkEditor.item?.id || "new"} state={linkEditor} onClose={() => setLinkEditor(null)} onSubmit={queueLinkSave} />}
      {pending && (
        <AdminActionDialog
          key={pending.label}
          open
          actionLabel={pending.label}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            pending.run();
            setPending(null);
            setResumeFile(null);
            setFeedback("사이트 관리 변경을 반영했습니다.");
          }}
        />
      )}
    </>
  );
}

// 프로필 반복 항목의 정보 밀도형 목록
function ProfileEntriesPanel({ items, menuKey, setMenuKey, onCreate, onEdit, onDelete, onToggle }: { items: ProfileEntry[]; menuKey: string | null; setMenuKey: (key: string | null) => void; onCreate: () => void; onEdit: (item: ProfileEntry) => void; onDelete: (item: ProfileEntry) => void; onToggle: (item: ProfileEntry) => void }) {
  return (
    <section className={styles.operationalSection} aria-labelledby="profile-entries-title">
      <div className={styles.sectionHeading}><div><h2 id="profile-entries-title" className="type-title">경력·활동·수상·자격</h2></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCreate}><Plus aria-hidden="true" />항목 추가</button></div>
      {items.length === 0 ? <EmptyState title="등록 항목 없음" description="경력·활동·수상·자격 항목이 없습니다." /> : (
        <div className={styles.dataTableWrap}><table className={styles.dataTable}><thead><tr><th>항목</th><th>유형 / 기간</th><th>순서</th><th>대표</th><th>상태</th><th><span className={styles.srOnly}>작업</span></th></tr></thead><tbody>
          {items.map((item) => { const key = `profile-${item.id}`; return (
            <tr key={item.id}>
              <td data-label="항목"><div className={styles.tableIdentity}><strong>{item.title}</strong><span>{item.organization || item.role || item.description || "보조 정보 없음"}</span></div></td>
              <td data-label="유형 / 기간"><strong>{entryTypeLabel(item.entryType)}</strong><span>{item.periodText || "-"}</span></td>
              <td data-label="순서">{item.displayOrder}</td>
              <td data-label="대표">{item.featured ? "강조" : "일반"}</td>
              <td data-label="상태"><StateSwitch enabled={item.enabled} onClick={() => onToggle(item)} label={`${item.title} ${item.enabled ? "비노출" : "노출"} 전환`} /></td>
              <td className={styles.actionCell}><button className={styles.iconButton} type="button" onClick={() => setMenuKey(menuKey === key ? null : key)} aria-label={`${item.title} 작업`} aria-expanded={menuKey === key}><MoreHorizontal aria-hidden="true" /></button>{menuKey === key && <div className={styles.rowMenu}><button type="button" onClick={() => { setMenuKey(null); onEdit(item); }}>수정</button><button type="button" onClick={() => onDelete(item)}>삭제</button></div>}</td>
            </tr>
          ); })}
        </tbody></table></div>
      )}
    </section>
  );
}

// 기술 Registry의 이름·분류·Icon Key 목록
function TechnologiesPanel({ items, menuKey, setMenuKey, onCreate, onEdit, onDelete, onToggle }: { items: Technology[]; menuKey: string | null; setMenuKey: (key: string | null) => void; onCreate: () => void; onEdit: (item: Technology) => void; onDelete: (item: Technology) => void; onToggle: (item: Technology) => void }) {
  return (
    <section className={styles.operationalSection} aria-labelledby="technologies-title">
      <div className={styles.sectionHeading}><div><h2 id="technologies-title" className="type-title">기술</h2></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCreate}><Plus aria-hidden="true" />기술 추가</button></div>
      {items.length === 0 ? <EmptyState title="등록 기술 없음" description="Mock 기술 Registry 항목이 없습니다." /> : (
        <div className={styles.dataTableWrap}><table className={styles.dataTable}><thead><tr><th>기술명</th><th>분류</th><th>Icon Key</th><th>순서</th><th>상태</th><th><span className={styles.srOnly}>작업</span></th></tr></thead><tbody>
          {items.map((item) => { const key = `technology-${item.id}`; return (
            <tr key={item.id}><td data-label="기술명"><strong>{item.name}</strong></td><td data-label="분류"><code>{item.category}</code></td><td data-label="Icon Key"><code>{item.iconKey || "-"}</code></td><td data-label="순서">{item.displayOrder}</td><td data-label="상태"><StateSwitch enabled={item.enabled} onClick={() => onToggle(item)} label={`${item.name} 기술 ${item.enabled ? "비노출" : "노출"} 전환`} /></td><td className={styles.actionCell}><button className={styles.iconButton} type="button" onClick={() => setMenuKey(menuKey === key ? null : key)} aria-label={`${item.name} 기술 작업`} aria-expanded={menuKey === key}><MoreHorizontal aria-hidden="true" /></button>{menuKey === key && <div className={styles.rowMenu}><button type="button" onClick={() => { setMenuKey(null); onEdit(item); }}>수정</button><button type="button" onClick={() => onDelete(item)}>삭제</button></div>}</td></tr>
          ); })}
        </tbody></table></div>
      )}
    </section>
  );
}

// 고정 Mock 프로젝트 Registry의 공개 상태 목록
function ProjectsPanel({ projects, onToggle }: { projects: SiteData["projects"]; onToggle: (key: string, enabled: boolean) => void }) {
  return (
    <section className={styles.operationalSection} aria-labelledby="projects-title">
      <div className={styles.sectionHeading}><div><h2 id="projects-title" className="type-title">프로젝트 공개 상태</h2><p className="type-body">프로젝트 생성·삭제·상세 콘텐츠 수정 없이 Registry 공개 상태만 변경합니다.</p></div></div>
      {projects.length === 0 ? <EmptyState title="Registry 항목 없음" description="Mock 프로젝트 Registry 항목이 없습니다." /> : <div className={styles.registryRows}>{projects.map((project) => <div key={project.projectKey} className={styles.registryRow}><div><strong className="type-title">{project.projectKey}</strong><span className="type-small">마지막 변경 {formatDateTime(project.updatedAt)}</span></div><StatusLabel tone={project.enabled ? "success" : "neutral"}>{project.enabled ? "공개" : "비공개"}</StatusLabel><StateSwitch enabled={project.enabled} onClick={() => onToggle(project.projectKey, project.enabled)} label={`${project.projectKey} 프로젝트 ${project.enabled ? "비공개" : "공개"} 전환`} /></div>)}</div>}
    </section>
  );
}

// 이메일과 분리한 외부 http/https 링크 목록
function ExternalLinksPanel({ items, menuKey, setMenuKey, onCreate, onEdit, onDelete, onToggle }: { items: ExternalLink[]; menuKey: string | null; setMenuKey: (key: string | null) => void; onCreate: () => void; onEdit: (item: ExternalLink) => void; onDelete: (item: ExternalLink) => void; onToggle: (item: ExternalLink) => void }) {
  return (
    <section className={styles.operationalSection} aria-labelledby="external-links-title">
      <div className={styles.sectionHeading}><div><h2 id="external-links-title" className="type-title">외부 링크</h2></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCreate}><Plus aria-hidden="true" />링크 추가</button></div>
      {items.length === 0 ? <EmptyState title="외부 링크 없음" description="공개 영역에 연결할 외부 링크가 없습니다." /> : (
        <div className={styles.dataTableWrap}><table className={styles.dataTable}><thead><tr><th>이름 / URL</th><th>순서</th><th>상태</th><th><span className={styles.srOnly}>작업</span></th></tr></thead><tbody>
          {items.map((item) => { const key = `link-${item.id}`; return (
            <tr key={item.id}><td data-label="이름 / URL"><div className={styles.linkIdentity}><LinkIcon aria-hidden="true" /><div><strong>{item.name}</strong><span>{item.url}</span></div></div></td><td data-label="순서">{item.displayOrder}</td><td data-label="상태"><StateSwitch enabled={item.enabled} onClick={() => onToggle(item)} label={`${item.name} 링크 ${item.enabled ? "비노출" : "노출"} 전환`} /></td><td className={styles.actionCell}><button className={styles.iconButton} type="button" onClick={() => setMenuKey(menuKey === key ? null : key)} aria-label={`${item.name} 링크 작업`} aria-expanded={menuKey === key}><MoreHorizontal aria-hidden="true" /></button>{menuKey === key && <div className={styles.rowMenu}><button type="button" onClick={() => { setMenuKey(null); onEdit(item); }}>수정</button><button type="button" onClick={() => onDelete(item)}>삭제</button></div>}</td></tr>
          ); })}
        </tbody></table></div>
      )}
    </section>
  );
}

// 현재 단일 이력서 메타데이터와 절제된 PDF 선택 Surface
function ResumePanel({ data, file, error, onSelect, onSubmit }: { data: SiteData; file: File | null; error: string; onSelect: (file?: File) => void; onSubmit: () => void }) {
  return (
    <section className={styles.resumeSection} aria-labelledby="resume-title">
      <div className={styles.sectionHeading}><div><h2 id="resume-title" className="type-title">이력서</h2><p className="type-body">현재 파일 1개만 유지하며 등록 또는 교체합니다.</p></div></div>
      <div className={styles.resumeCurrent}>
        <FileText aria-hidden="true" />
        {data.resume ? <div><span className="type-small">현재 등록 파일</span><strong className="type-title">{data.resume.fileName}</strong><p className="type-small">{formatFileSize(data.resume.size)} · {formatDateTime(data.resume.updatedAt)}</p></div> : <div><span className="type-small">현재 등록 파일</span><strong className="type-title">미등록</strong><p className="type-small">공개 화면에는 Resume Action이 표시되지 않습니다.</p></div>}
      </div>
      <div className={styles.filePicker}>
        <input id="resume-pdf" className={styles.srOnly} type="file" accept="application/pdf,.pdf" onChange={(event) => onSelect(event.currentTarget.files?.[0])} />
        <label htmlFor="resume-pdf"><Upload aria-hidden="true" /><span><strong className="type-body">PDF 파일 선택</strong><small>최대 10MB</small></span></label>
        <div className={styles.selectedFile}><span className="type-small">선택 파일</span><strong className="type-body">{file ? `${file.name} · ${formatFileSize(file.size)}` : "선택되지 않음"}</strong></div>
        <button className={`${styles.primaryButton} type-body`} type="button" disabled={!file} onClick={onSubmit}>{data.resume ? "인증 후 교체" : "인증 후 등록"}</button>
      </div>
      <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
    </section>
  );
}
