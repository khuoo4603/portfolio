"use client";

import {
  ChevronDown,
  ChevronUp,
  FileText,
  Link as LinkIcon,
  MoreHorizontal,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatApiError } from "@/lib/api/client";
import type {
  ExternalLink,
  ExternalLinkInput,
  PortfolioContentCategory,
  PortfolioContentCode,
  PortfolioTechnology,
  ProfileEntry,
  ProfileEntryInput,
  SiteContent,
  SiteData,
  Technology,
  TechnologyInput,
} from "./admin-types";
import AdminActionDialog from "./admin-action-dialog";
import {
  createExternalLink,
  createProfileEntry,
  createTechnology,
  deleteExternalLink,
  deleteProfileEntry,
  deleteTechnology,
  getAdminSite,
  replacePortfolioTechnologies,
  replaceResume,
  siteActionBindings,
  updateExternalLink,
  updatePortfolioContents,
  updateProfileEntry,
  updateTechnology,
  type PortfolioContentInput,
} from "./admin-site-api";
import {
  EmptyState,
  PageError,
  PageHeader,
  PageLoading,
  StateSwitch,
  StatusLabel,
  SubmitButton,
  formatDateTime,
  formatFileSize,
} from "./admin-ui";
import { ExternalLinkEditor, ProfileEditor, TechnologyEditor } from "./site-editors";
import { useAdminAction } from "./use-admin-action";
import styles from "./admin.module.css";

type SiteTab = "common" | "profile" | "entries" | "technology" | "projects" | "links" | "resume";

type ContentDefinition = {
  category: PortfolioContentCategory;
  contentCode: PortfolioContentCode;
  label: string;
  multiline?: boolean;
};

const TABS: Array<{ id: SiteTab; label: string }> = [
  { id: "common", label: "메인·공통 콘텐츠" },
  { id: "profile", label: "프로필·연락처" },
  { id: "entries", label: "학력·경력·활동·수상·자격" },
  { id: "technology", label: "기술" },
  { id: "projects", label: "프로젝트" },
  { id: "links", label: "외부 링크" },
  { id: "resume", label: "이력서" },
];

const COMMON_CONTENTS: ContentDefinition[] = [
  { category: "COMMON", contentCode: "SITE_MARK", label: "사이트 마크" },
  { category: "COMMON", contentCode: "NAME", label: "이름" },
  { category: "COMMON", contentCode: "ENGLISH_NAME", label: "영문 이름" },
  { category: "COMMON", contentCode: "POSITION", label: "개발자 포지션" },
  { category: "COMMON", contentCode: "AFFILIATION", label: "현재 소속" },
  { category: "COMMON", contentCode: "NAV_ABOUT", label: "소개 메뉴" },
  { category: "COMMON", contentCode: "NAV_TECH", label: "기술 메뉴" },
  { category: "COMMON", contentCode: "NAV_PROJECTS", label: "프로젝트 메뉴" },
  { category: "COMMON", contentCode: "NAV_EDUCATION", label: "학력 및 성과 메뉴" },
  { category: "MAIN", contentCode: "HERO_POSITION", label: "Hero 직무" },
  { category: "MAIN", contentCode: "HERO_STATEMENT", label: "Hero 핵심 문구", multiline: true },
  { category: "MAIN", contentCode: "HERO_DESCRIPTION", label: "Hero 설명", multiline: true },
  { category: "MAIN", contentCode: "HERO_CUE", label: "Hero 이동 Cue" },
  { category: "MAIN", contentCode: "ABOUT_SECTION_LABEL", label: "소개 Section Label" },
  { category: "MAIN", contentCode: "ABOUT_SECTION_TITLE", label: "소개 Section 제목" },
  { category: "MAIN", contentCode: "TECH_SECTION_LABEL", label: "기술 Section Label" },
  { category: "MAIN", contentCode: "TECH_SECTION_TITLE", label: "기술 Section 제목" },
  { category: "MAIN", contentCode: "PROJECTS_SECTION_LABEL", label: "프로젝트 Section Label" },
  { category: "MAIN", contentCode: "PROJECTS_SECTION_TITLE", label: "프로젝트 Section 제목" },
  { category: "MAIN", contentCode: "PROJECT_DETAIL_CTA", label: "프로젝트 상세 CTA" },
  { category: "MAIN", contentCode: "ACHIEVEMENTS_SECTION_LABEL", label: "학력·성과 Section Label" },
  { category: "MAIN", contentCode: "ACHIEVEMENTS_SECTION_TITLE", label: "학력·성과 Section 제목" },
  { category: "MAIN", contentCode: "EDUCATION_GROUP_TITLE", label: "학력 Group 제목" },
  { category: "MAIN", contentCode: "ACTIVITY_GROUP_TITLE", label: "활동 Group 제목" },
  { category: "MAIN", contentCode: "AWARD_GROUP_TITLE", label: "수상 Group 제목" },
  { category: "FOOTER", contentCode: "FOOTER_NAME", label: "Footer 이름" },
  { category: "FOOTER", contentCode: "FOOTER_ROLE", label: "Footer 역할" },
  { category: "FOOTER", contentCode: "RESUME_LABEL", label: "Resume Label" },
  { category: "FOOTER", contentCode: "RESUME_VIEW_LABEL", label: "Resume 보기 Label" },
  { category: "FOOTER", contentCode: "RESUME_DOWNLOAD_LABEL", label: "Resume 다운로드 Label" },
  { category: "FOOTER", contentCode: "CONTACT_LABEL", label: "Contact Label" },
  { category: "FOOTER", contentCode: "PORTFOLIO_LABEL", label: "Portfolio Label" },
  { category: "FOOTER", contentCode: "COPYRIGHT", label: "Copyright" },
];

const PROFILE_CONTENTS: ContentDefinition[] = [
  { category: "PROFILE", contentCode: "ABOUT_STATEMENT", label: "소개 Statement", multiline: true },
  { category: "PROFILE", contentCode: "ABOUT_POSITION", label: "소개 Position" },
  { category: "PROFILE", contentCode: "ABOUT_DESCRIPTION_1", label: "소개 설명 1", multiline: true },
  { category: "PROFILE", contentCode: "ABOUT_DESCRIPTION_2", label: "소개 설명 2", multiline: true },
  { category: "PROFILE", contentCode: "DEVELOPMENT_VALUES_TITLE", label: "개발 철학 제목" },
  { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_1_TITLE", label: "개발 철학 1 제목" },
  { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_1_DESCRIPTION", label: "개발 철학 1 설명", multiline: true },
  { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_2_TITLE", label: "개발 철학 2 제목" },
  { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_2_DESCRIPTION", label: "개발 철학 2 설명", multiline: true },
  { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_3_TITLE", label: "개발 철학 3 제목" },
  { category: "PROFILE", contentCode: "DEVELOPMENT_VALUE_3_DESCRIPTION", label: "개발 철학 3 설명", multiline: true },
  { category: "CONTACT", contentCode: "EMAIL", label: "공개 이메일" },
];

function entryTypeLabel(type: ProfileEntry["entryType"]) {
  return {
    EDUCATION: "학력",
    EXPERIENCE: "경력",
    ACTIVITY: "활동",
    AWARD: "수상",
    CERTIFICATE: "자격/교육",
  }[type];
}

function profileInput(item: ProfileEntry, override: Partial<ProfileEntryInput> = {}): ProfileEntryInput {
  return {
    entryType: item.entryType,
    periodText: item.periodText,
    title: item.title,
    organization: item.organization,
    role: item.role,
    description: item.description,
    achievement: item.achievement,
    featured: item.featured,
    displayOrder: item.displayOrder,
    enabled: item.enabled,
    ...override,
  };
}

function technologyInput(item: Technology, override: Partial<TechnologyInput> = {}): TechnologyInput {
  return {
    name: item.name,
    category: item.category,
    iconUrl: item.iconUrl,
    enabled: item.enabled,
    ...override,
  };
}

function externalLinkInput(item: ExternalLink, override: Partial<ExternalLinkInput> = {}): ExternalLinkInput {
  return {
    name: item.name,
    url: item.url,
    displayOrder: item.displayOrder,
    enabled: item.enabled,
    ...override,
  };
}

function ContentPanel({
  definitions,
  contents,
  title,
  description,
  busy,
  onSubmit,
}: {
  definitions: ContentDefinition[];
  contents: SiteContent[];
  title: string;
  description?: string;
  busy: boolean;
  onSubmit: (items: PortfolioContentInput[]) => void;
}) {
  const initialValues = Object.fromEntries(definitions.map((definition) => {
    const item = contents.find((content) => content.category === definition.category && content.contentCode === definition.contentCode);
    return [definition.contentCode, item?.contentValue ?? ""];
  }));
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [error, setError] = useState("");

  const changedItems = definitions.flatMap((definition) => {
    const current = contents.find((content) => content.category === definition.category && content.contentCode === definition.contentCode);
    const contentValue = values[definition.contentCode] ?? "";
    return current && current.contentValue !== contentValue
      ? [{ category: definition.category, contentCode: definition.contentCode, contentValue }]
      : [];
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (changedItems.length === 0) {
      setError("변경된 콘텐츠가 없습니다.");
      return;
    }
    setError("");
    onSubmit(changedItems);
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
              <textarea className="type-body" rows={4} value={values[definition.contentCode]} onChange={(event) => setValues({ ...values, [definition.contentCode]: event.currentTarget.value })} />
            ) : (
              <input className="type-body" type={definition.contentCode === "EMAIL" ? "email" : "text"} value={values[definition.contentCode]} onChange={(event) => setValues({ ...values, [definition.contentCode]: event.currentTarget.value })} />
            )}
            <code>{definition.category}/{definition.contentCode}</code>
          </label>
        ))}
        <div className={styles.formActionRow}>
          <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
          <SubmitButton busy={busy} disabled={changedItems.length === 0}>저장</SubmitButton>
        </div>
      </form>
    </section>
  );
}

// 실제 Site DTO와 작업별 ADMIN_ACTION을 연결한 관리 화면
export default function SiteScreen() {
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<SiteTab>("common");
  const [profileEditor, setProfileEditor] = useState<{ item?: ProfileEntry } | null>(null);
  const [technologyEditor, setTechnologyEditor] = useState<{ item?: Technology } | null>(null);
  const [linkEditor, setLinkEditor] = useState<{ item?: ExternalLink } | null>(null);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [portfolioDraft, setPortfolioDraft] = useState<PortfolioTechnology[]>([]);
  const [feedback, setFeedback] = useState("");
  const requestSequence = useRef(0);
  const adminAction = useAdminAction();

  const loadSite = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError("");
    try {
      const response = await getAdminSite();
      if (requestSequence.current === requestId) {
        setData(response);
        setPortfolioDraft([...response.portfolioTechnologies].sort((left, right) => left.displayOrder - right.displayOrder));
      }
    } catch (caught) {
      if (requestSequence.current === requestId) {
        setData(null);
        setError(formatApiError(caught));
      }
    } finally {
      if (requestSequence.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadSite();
      }
    });
    return () => {
      active = false;
      requestSequence.current += 1;
    };
  }, [loadSite]);

  const completeMutation = (message: string) => {
    setFeedback(message);
    setMenuKey(null);
    void loadSite();
  };

  const saveContents = (items: PortfolioContentInput[]) => {
    void adminAction.start({
      ...siteActionBindings.portfolioContentUpdate(),
      actionLabel: "포트폴리오 콘텐츠 저장",
      mutation: (verification) => updatePortfolioContents(items, verification),
      onSuccess: () => completeMutation("포트폴리오 콘텐츠를 저장했습니다."),
    });
  };

  const saveProfile = (input: ProfileEntryInput, item?: ProfileEntry) => {
    setProfileEditor(null);
    void adminAction.start({
      ...(item ? siteActionBindings.profileEntryUpdate(item.id) : siteActionBindings.profileEntryCreate()),
      actionLabel: item ? `${item.title} 항목 수정` : `${input.title} 항목 추가`,
      mutation: (verification) => item
        ? updateProfileEntry(item.id, input, verification)
        : createProfileEntry(input, verification),
      onSuccess: () => completeMutation(item ? "프로필 항목을 수정했습니다." : "프로필 항목을 추가했습니다."),
    });
  };

  const deleteProfile = (item: ProfileEntry) => {
    setMenuKey(null);
    void adminAction.start({
      ...siteActionBindings.profileEntryDelete(item.id),
      actionLabel: `${item.title} 항목 삭제`,
      mutation: (verification) => deleteProfileEntry(item.id, verification),
      onSuccess: () => completeMutation("프로필 항목을 삭제했습니다."),
    });
  };

  const toggleProfile = (item: ProfileEntry) => {
    void adminAction.start({
      ...siteActionBindings.profileEntryUpdate(item.id),
      actionLabel: `${item.title} 항목 ${item.enabled ? "비노출" : "노출"} 전환`,
      mutation: (verification) => updateProfileEntry(item.id, profileInput(item, { enabled: !item.enabled }), verification),
      onSuccess: () => completeMutation("프로필 항목 상태를 변경했습니다."),
    });
  };

  const saveTechnology = (input: TechnologyInput, item?: Technology) => {
    setTechnologyEditor(null);
    void adminAction.start({
      ...(item ? siteActionBindings.technologyUpdate(item.id) : siteActionBindings.technologyCreate()),
      actionLabel: item ? `${item.name} 기술 수정` : `${input.name} 기술 추가`,
      mutation: (verification) => item
        ? updateTechnology(item.id, input, verification)
        : createTechnology(input, verification),
      onSuccess: () => completeMutation(item ? "기술을 수정했습니다." : "기술을 추가했습니다."),
    });
  };

  const deleteTechnologyItem = (item: Technology) => {
    setMenuKey(null);
    void adminAction.start({
      ...siteActionBindings.technologyDelete(item.id),
      actionLabel: `${item.name} 기술 삭제`,
      mutation: (verification) => deleteTechnology(item.id, verification),
      onSuccess: () => completeMutation("기술을 삭제했습니다."),
    });
  };

  const toggleTechnology = (item: Technology) => {
    void adminAction.start({
      ...siteActionBindings.technologyUpdate(item.id),
      actionLabel: `${item.name} 기술 ${item.enabled ? "비활성" : "활성"} 전환`,
      mutation: (verification) => updateTechnology(item.id, technologyInput(item, { enabled: !item.enabled }), verification),
      onSuccess: () => completeMutation("기술 활성 상태를 변경했습니다."),
    });
  };

  const savePortfolioTechnologies = (items: PortfolioTechnology[]) => {
    void adminAction.start({
      ...siteActionBindings.portfolioTechnologyUpdate(),
      actionLabel: "포트폴리오 메인 기술 구성 저장",
      mutation: (verification) => replacePortfolioTechnologies(items, verification),
      onSuccess: () => completeMutation("메인 기술 구성을 저장했습니다."),
    });
  };

  const saveLink = (input: ExternalLinkInput, item?: ExternalLink) => {
    setLinkEditor(null);
    void adminAction.start({
      ...(item ? siteActionBindings.externalLinkUpdate(item.id) : siteActionBindings.externalLinkCreate()),
      actionLabel: item ? `${item.name} 외부 링크 수정` : `${input.name} 외부 링크 추가`,
      mutation: (verification) => item
        ? updateExternalLink(item.id, input, verification)
        : createExternalLink(input, verification),
      onSuccess: () => completeMutation(item ? "외부 링크를 수정했습니다." : "외부 링크를 추가했습니다."),
    });
  };

  const deleteLink = (item: ExternalLink) => {
    setMenuKey(null);
    void adminAction.start({
      ...siteActionBindings.externalLinkDelete(item.id),
      actionLabel: `${item.name} 외부 링크 삭제`,
      mutation: (verification) => deleteExternalLink(item.id, verification),
      onSuccess: () => completeMutation("외부 링크를 삭제했습니다."),
    });
  };

  const toggleLink = (item: ExternalLink) => {
    void adminAction.start({
      ...siteActionBindings.externalLinkUpdate(item.id),
      actionLabel: `${item.name} 외부 링크 ${item.enabled ? "비노출" : "노출"} 전환`,
      mutation: (verification) => updateExternalLink(item.id, externalLinkInput(item, { enabled: !item.enabled }), verification),
      onSuccess: () => completeMutation("외부 링크 상태를 변경했습니다."),
    });
  };

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

  const saveResume = () => {
    if (!resumeFile) {
      return;
    }
    const file = resumeFile;
    void adminAction.start({
      ...siteActionBindings.resumeReplace(),
      actionLabel: `${file.name} 이력서 ${data?.resume ? "교체" : "등록"}`,
      mutation: (verification) => replaceResume(file, verification),
      onSuccess: () => {
        setResumeFile(null);
        completeMutation("이력서 PDF를 저장했습니다.");
      },
    });
  };

  return (
    <>
      <PageHeader title="Site" description="포트폴리오에 노출되는 콘텐츠와 공개 상태를 관리합니다." />
      {feedback && <p className={`${styles.feedbackBanner} type-body`} role="status">{feedback}</p>}
      {adminAction.startError && <p className={`${styles.inlineError} type-small`} role="alert">{adminAction.startError}</p>}

      {loading ? (
        <PageLoading rows={7} />
      ) : error ? (
        <PageError message={error} onRetry={() => void loadSite()} />
      ) : data ? (
        <>
          <div className={`${styles.lineTabs} ${styles.siteTabs}`} role="tablist" aria-label="사이트 관리 영역">
            {TABS.map((item) => (
              <button key={item.id} className={tab === item.id ? styles.lineTabActive : undefined} type="button" role="tab" aria-selected={tab === item.id} onClick={() => { setTab(item.id); setMenuKey(null); }}>
                {item.label}
              </button>
            ))}
          </div>

          <div className={styles.siteTabPanel} role="tabpanel">
            {tab === "common" && <ContentPanel definitions={COMMON_CONTENTS} contents={data.portfolioContents} title="메인·공통 콘텐츠" busy={adminAction.issuing} onSubmit={saveContents} />}
            {tab === "profile" && <ContentPanel definitions={PROFILE_CONTENTS} contents={data.portfolioContents} title="프로필·연락처" description="소개, 개발 철학과 공개 이메일에 연결된 고정 Slot" busy={adminAction.issuing} onSubmit={saveContents} />}
            {tab === "entries" && <ProfileEntriesPanel items={data.profileEntries} menuKey={menuKey} setMenuKey={setMenuKey} onCreate={() => setProfileEditor({})} onEdit={(item) => setProfileEditor({ item })} onDelete={deleteProfile} onToggle={toggleProfile} />}
            {tab === "technology" && <TechnologiesPanel items={data.technologyMaster} portfolioItems={data.portfolioTechnologies} draft={portfolioDraft} setDraft={setPortfolioDraft} menuKey={menuKey} setMenuKey={setMenuKey} onCreate={() => setTechnologyEditor({})} onEdit={(item) => setTechnologyEditor({ item })} onDelete={deleteTechnologyItem} onToggle={toggleTechnology} onSavePortfolio={savePortfolioTechnologies} />}
            {tab === "projects" && <ProjectsPanel projects={data.projects} />}
            {tab === "links" && <ExternalLinksPanel items={data.externalLinks} menuKey={menuKey} setMenuKey={setMenuKey} onCreate={() => setLinkEditor({})} onEdit={(item) => setLinkEditor({ item })} onDelete={deleteLink} onToggle={toggleLink} />}
            {tab === "resume" && <ResumePanel data={data} file={resumeFile} error={fileError} onSelect={selectResume} onSubmit={saveResume} />}
          </div>
        </>
      ) : null}

      {profileEditor && <ProfileEditor key={profileEditor.item?.id ?? "new"} state={profileEditor} onClose={() => setProfileEditor(null)} onSubmit={saveProfile} />}
      {technologyEditor && <TechnologyEditor key={technologyEditor.item?.id ?? "new"} state={technologyEditor} onClose={() => setTechnologyEditor(null)} onSubmit={saveTechnology} />}
      {linkEditor && <ExternalLinkEditor key={linkEditor.item?.id ?? "new"} state={linkEditor} onClose={() => setLinkEditor(null)} onSubmit={saveLink} />}
      {adminAction.dialog && <AdminActionDialog {...adminAction.dialog} />}
    </>
  );
}

function ProfileEntriesPanel({ items, menuKey, setMenuKey, onCreate, onEdit, onDelete, onToggle }: { items: ProfileEntry[]; menuKey: string | null; setMenuKey: (key: string | null) => void; onCreate: () => void; onEdit: (item: ProfileEntry) => void; onDelete: (item: ProfileEntry) => void; onToggle: (item: ProfileEntry) => void }) {
  return (
    <section className={styles.operationalSection} aria-labelledby="profile-entries-title">
      <div className={styles.sectionHeading}><div><h2 id="profile-entries-title" className="type-title">학력·경력·활동·수상·자격</h2></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCreate}><Plus aria-hidden="true" />항목 추가</button></div>
      {items.length === 0 ? <EmptyState title="등록 항목 없음" description="등록된 프로필 반복 항목이 없습니다." /> : (
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

function TechnologiesPanel({ items, portfolioItems, draft, setDraft, menuKey, setMenuKey, onCreate, onEdit, onDelete, onToggle, onSavePortfolio }: { items: Technology[]; portfolioItems: PortfolioTechnology[]; draft: PortfolioTechnology[]; setDraft: React.Dispatch<React.SetStateAction<PortfolioTechnology[]>>; menuKey: string | null; setMenuKey: (key: string | null) => void; onCreate: () => void; onEdit: (item: Technology) => void; onDelete: (item: Technology) => void; onToggle: (item: Technology) => void; onSavePortfolio: (items: PortfolioTechnology[]) => void }) {
  const [selectedTechnologyId, setSelectedTechnologyId] = useState("");
  const available = items.filter((item) => item.enabled && !draft.some((mapping) => mapping.technologyId === item.id));
  const normalizedCurrent = [...portfolioItems].sort((left, right) => left.displayOrder - right.displayOrder);
  const portfolioChanged = JSON.stringify(draft) !== JSON.stringify(normalizedCurrent);

  const normalizeOrder = (next: PortfolioTechnology[]) => next.map((item, index) => ({ ...item, displayOrder: index + 1 }));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) {
      return;
    }
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(normalizeOrder(next));
  };

  const add = () => {
    const technologyId = Number(selectedTechnologyId);
    if (!technologyId) {
      return;
    }
    setDraft((current) => normalizeOrder([...current, { technologyId, displayOrder: current.length + 1 }]));
    setSelectedTechnologyId("");
  };

  return (
    <div className={styles.dashboardFlow}>
      <section className={styles.operationalSection} aria-labelledby="technologies-title">
        <div className={styles.sectionHeading}><div><h2 id="technologies-title" className="type-title">기술 사전</h2></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCreate}><Plus aria-hidden="true" />기술 추가</button></div>
        {items.length === 0 ? <EmptyState title="등록 기술 없음" description="기술 사전 항목이 없습니다." /> : (
          <div className={styles.dataTableWrap}><table className={styles.dataTable}><thead><tr><th>기술명</th><th>분류</th><th>Icon URL</th><th>상태</th><th><span className={styles.srOnly}>작업</span></th></tr></thead><tbody>
            {items.map((item) => { const key = `technology-${item.id}`; return (
              <tr key={item.id}><td data-label="기술명"><strong>{item.name}</strong></td><td data-label="분류"><code>{item.category}</code></td><td data-label="Icon URL"><code>{item.iconUrl || "-"}</code></td><td data-label="상태"><StateSwitch enabled={item.enabled} onClick={() => onToggle(item)} label={`${item.name} 기술 ${item.enabled ? "비활성" : "활성"} 전환`} /></td><td className={styles.actionCell}><button className={styles.iconButton} type="button" onClick={() => setMenuKey(menuKey === key ? null : key)} aria-label={`${item.name} 기술 작업`} aria-expanded={menuKey === key}><MoreHorizontal aria-hidden="true" /></button>{menuKey === key && <div className={styles.rowMenu}><button type="button" onClick={() => { setMenuKey(null); onEdit(item); }}>수정</button><button type="button" onClick={() => onDelete(item)}>삭제</button></div>}</td></tr>
            ); })}
          </tbody></table></div>
        )}
      </section>

      <section className={styles.operationalSection} aria-labelledby="portfolio-technologies-title">
        <div className={styles.sectionHeading}><div><h2 id="portfolio-technologies-title" className="type-title">메인 기술 구성</h2><p className="type-body">기술 사전과 별도로 메인 노출 항목과 순서를 저장합니다.</p></div></div>
        <div className={styles.formActionRow}>
          <select className="type-body" aria-label="메인 노출 기술" value={selectedTechnologyId} onChange={(event) => setSelectedTechnologyId(event.currentTarget.value)}>
            <option value="">기술 선택</option>
            {available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button className={`${styles.secondaryButton} type-body`} type="button" disabled={!selectedTechnologyId} onClick={add}><Plus aria-hidden="true" />추가</button>
        </div>
        {draft.length === 0 ? <EmptyState title="메인 기술 없음" description="메인에 노출할 기술을 추가해 주세요." /> : (
          <div className={styles.registryRows}>{draft.map((mapping, index) => {
            const technology = items.find((item) => item.id === mapping.technologyId);
            return <div key={mapping.technologyId} className={styles.registryRow}><div><strong className="type-body">{technology?.name ?? `기술 #${mapping.technologyId}`}</strong><span className="type-small">표시 순서 {mapping.displayOrder}</span></div><div><button className={styles.iconButton} type="button" aria-label={`${technology?.name ?? mapping.technologyId} 위로`} disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp aria-hidden="true" /></button><button className={styles.iconButton} type="button" aria-label={`${technology?.name ?? mapping.technologyId} 아래로`} disabled={index === draft.length - 1} onClick={() => move(index, 1)}><ChevronDown aria-hidden="true" /></button><button className={styles.iconButton} type="button" aria-label={`${technology?.name ?? mapping.technologyId} 메인에서 제거`} onClick={() => setDraft((current) => normalizeOrder(current.filter((item) => item.technologyId !== mapping.technologyId)))}><X aria-hidden="true" /></button></div></div>;
          })}</div>
        )}
        <div className={styles.formActionRow}><p className="type-small">변경된 전체 구성을 한 번에 저장합니다.</p><SubmitButton busy={false} type="button" disabled={!portfolioChanged} onClick={() => onSavePortfolio(draft)}>메인 구성 저장</SubmitButton></div>
      </section>
    </div>
  );
}

function ProjectsPanel({ projects }: { projects: SiteData["projects"] }) {
  return (
    <section className={styles.operationalSection} aria-labelledby="projects-title">
      <div className={styles.sectionHeading}><div><h2 id="projects-title" className="type-title">프로젝트 요약</h2><p className="type-body">프로젝트 변경은 다음 연동 범위에서 처리하며 현재는 실제 요약 데이터만 표시합니다.</p></div></div>
      {projects.length === 0 ? <EmptyState title="프로젝트 없음" description="등록된 프로젝트가 없습니다." /> : <div className={styles.registryRows}>{projects.map((project) => <div key={project.id} className={styles.registryRow}><div><strong className="type-body">{project.name}</strong><span className="type-small">{project.year} · {project.tagline} · {formatDateTime(project.updatedAt)}</span></div><StatusLabel tone={project.enabled ? "success" : "neutral"}>{project.enabled ? "공개" : "비공개"}</StatusLabel></div>)}</div>}
    </section>
  );
}

function ExternalLinksPanel({ items, menuKey, setMenuKey, onCreate, onEdit, onDelete, onToggle }: { items: ExternalLink[]; menuKey: string | null; setMenuKey: (key: string | null) => void; onCreate: () => void; onEdit: (item: ExternalLink) => void; onDelete: (item: ExternalLink) => void; onToggle: (item: ExternalLink) => void }) {
  return (
    <section className={styles.operationalSection} aria-labelledby="external-links-title">
      <div className={styles.sectionHeading}><div><h2 id="external-links-title" className="type-title">외부 링크</h2></div><button className={`${styles.secondaryButton} type-body`} type="button" onClick={onCreate}><Plus aria-hidden="true" />링크 추가</button></div>
      {items.length === 0 ? <EmptyState title="외부 링크 없음" description="공개 영역에 연결할 외부 링크가 없습니다." /> : (
        <div className={styles.dataTableWrap}><table className={styles.dataTable}><thead><tr><th>이름 / URL</th><th>순서</th><th>상태</th><th><span className={styles.srOnly}>작업</span></th></tr></thead><tbody>
          {items.map((item) => { const key = `link-${item.id}`; return (
            <tr key={item.id}><td data-label="이름 / URL"><div className={styles.linkIdentity}><LinkIcon aria-hidden="true" /><div><strong>{item.name}</strong><code>{item.url}</code></div></div></td><td data-label="순서">{item.displayOrder}</td><td data-label="상태"><StateSwitch enabled={item.enabled} onClick={() => onToggle(item)} label={`${item.name} 링크 ${item.enabled ? "비노출" : "노출"} 전환`} /></td><td className={styles.actionCell}><button className={styles.iconButton} type="button" onClick={() => setMenuKey(menuKey === key ? null : key)} aria-label={`${item.name} 링크 작업`} aria-expanded={menuKey === key}><MoreHorizontal aria-hidden="true" /></button>{menuKey === key && <div className={styles.rowMenu}><button type="button" onClick={() => { setMenuKey(null); onEdit(item); }}>수정</button><button type="button" onClick={() => onDelete(item)}>삭제</button></div>}</td></tr>
          ); })}
        </tbody></table></div>
      )}
    </section>
  );
}

function ResumePanel({ data, file, error, onSelect, onSubmit }: { data: SiteData; file: File | null; error: string; onSelect: (file?: File) => void; onSubmit: () => void }) {
  return (
    <section className={styles.resumeSection} aria-labelledby="resume-title">
      <div className={styles.sectionHeading}><div><h2 id="resume-title" className="type-title">이력서</h2><p className="type-body">현재 파일 1개만 유지하며 등록 또는 교체합니다.</p></div></div>
      <div className={styles.resumeCurrent}>
        <FileText aria-hidden="true" />
        {data.resume ? <div><span className="type-small">현재 등록 파일</span><strong className="type-body">{data.resume.fileName}</strong><p className="type-small">마지막 변경 {formatDateTime(data.resume.updatedAt)}</p></div> : <div><span className="type-small">현재 등록 파일</span><strong className="type-body">미등록</strong><p className="type-small">공개 화면에는 Resume Action이 표시되지 않습니다.</p></div>}
      </div>
      <div className={styles.filePicker}>
        <input id="resume-pdf" className={styles.srOnly} type="file" accept="application/pdf,.pdf" onChange={(event) => onSelect(event.currentTarget.files?.[0])} />
        <label htmlFor="resume-pdf"><Upload aria-hidden="true" /><span><strong className="type-body">PDF 파일 선택</strong><small>최대 10MB</small></span></label>
        <div className={styles.selectedFile}><span className="type-small">선택 파일</span><strong className="type-body">{file ? `${file.name} · ${formatFileSize(file.size)}` : "선택되지 않음"}</strong></div>
        <button className={`${styles.primaryButton} type-body`} type="button" disabled={!file} onClick={onSubmit}>{data.resume ? "PDF 교체" : "PDF 등록"}</button>
      </div>
      <p className={`${styles.inlineError} type-small`} role="alert">{error}</p>
    </section>
  );
}
