package com.khuoo.portfolio;

import com.khuoo.portfolio.file.service.FileStorageService;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

// 실제 PostgreSQL 기반 애플리케이션 Context와 초기 데이터 검증
@SpringBootTest
class PortfolioApplicationTests extends PostgresIntegrationTest {

    private static final List<String> CONTENT_SLOTS = List.of(
            "COMMON/NAME",
            "COMMON/ENGLISH_NAME",
            "COMMON/POSITION",
            "COMMON/AFFILIATION",
            "MAIN/HERO_STATEMENT",
            "MAIN/HERO_DESCRIPTION",
            "PROFILE/ABOUT_STATEMENT",
            "PROFILE/ABOUT_DESCRIPTION_1",
            "PROFILE/ABOUT_DESCRIPTION_2",
            "PROFILE/DEVELOPMENT_VALUE_1_TITLE",
            "PROFILE/DEVELOPMENT_VALUE_1_DESCRIPTION",
            "PROFILE/DEVELOPMENT_VALUE_2_TITLE",
            "PROFILE/DEVELOPMENT_VALUE_2_DESCRIPTION",
            "PROFILE/DEVELOPMENT_VALUE_3_TITLE",
            "PROFILE/DEVELOPMENT_VALUE_3_DESCRIPTION",
            "CONTACT/EMAIL"
    );

    private static final List<String> MAIN_TECHNOLOGIES = List.of(
            "Java",
            "SQL",
            "Spring Boot",
            "PostgreSQL",
            "MySQL",
            "Docker",
            "Docker Compose",
            "Linux",
            "Kubernetes",
            "GitHub Actions",
            "GHCR",
            "Git"
    );

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Environment environment;

    @Autowired
    private FileStorageService fileStorageService;

    // Flyway Schema와 PostgreSQL 실행 정책 검증
    @Test
    void contextLoads() {
        Integer tableCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_type = 'BASE TABLE'
                  AND table_name <> 'flyway_schema_history'
                """, Integer.class);

        assertThat(flyway.info().applied()).hasSize(2);
        assertThat(flyway.info().current().getDescription()).isEqualTo("seed initial data");
        assertThat(tableCount).isEqualTo(21);
        assertThat(jdbcTemplate.queryForObject("SHOW TIME ZONE", String.class)).isEqualTo("Asia/Seoul");
        assertThat(jdbcTemplate.queryForObject("SHOW server_encoding", String.class)).isEqualTo("UTF8");
        assertThat(environment.getProperty("management.endpoints.web.exposure.include")).isEqualTo("health");
        assertThat(environment.getProperty("management.endpoint.health.probes.enabled", Boolean.class)).isTrue();
    }

    // 고정 콘텐츠 Slot과 Public 핵심 문구 검증
    @Test
    void portfolioContentsMatchPublicData() {
        List<String> slots = jdbcTemplate.queryForList("""
                SELECT category || '/' || content_code
                FROM portfolio_contents
                """, String.class);
        Integer duplicateCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM (
                    SELECT category, content_code
                    FROM portfolio_contents
                    GROUP BY category, content_code
                    HAVING COUNT(*) > 1
                ) AS duplicates
                """, Integer.class);

        assertThat(slots).containsExactlyInAnyOrderElementsOf(CONTENT_SLOTS);
        assertThat(duplicateCount).isZero();
        assertThat(jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM portfolio_contents
                WHERE content_code IN ('SITE_MARK', 'NAV_ABOUT', 'HERO_POSITION', 'FOOTER_NAME', 'COPYRIGHT')
                """, Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) FILTER (WHERE category = 'COMMON') AS common_count,
                    COUNT(*) FILTER (WHERE category = 'MAIN') AS main_count,
                    COUNT(*) FILTER (WHERE category = 'PROFILE') AS profile_count,
                    COUNT(*) FILTER (WHERE category = 'CONTACT') AS contact_count
                FROM portfolio_contents
                """)).containsEntry("common_count", 4L)
                .containsEntry("main_count", 2L)
                .containsEntry("profile_count", 9L)
                .containsEntry("contact_count", 1L);
        assertThat(contentValue("COMMON", "NAME")).isEqualTo("김현우");
        assertThat(contentValue("COMMON", "POSITION")).isEqualTo("BACKEND / INFRA DEVELOPER");
        assertThat(contentValue("COMMON", "AFFILIATION")).isEqualTo("성공회대학교 소프트웨어융합전공");
        assertThat(contentValue("PROFILE", "DEVELOPMENT_VALUE_3_TITLE")).isEqualTo("운영까지");
        assertThat(contentValue("CONTACT", "EMAIL")).isEqualTo("khuoo4603@gmail.com");
    }

    // 프로필 이력과 기술 스택 초기값 검증
    @Test
    void profileAndTechnologySeedsMatchPublicData() {
        assertThat(jdbcTemplate.queryForList("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'profile_entries'
                ORDER BY ordinal_position
                """, String.class)).containsExactly(
                "id",
                "entry_type",
                "period_text",
                "title",
                "organization",
                "role",
                "description",
                "achievement",
                "display_order",
                "enabled",
                "created_at",
                "updated_at"
        );
        assertThat(jdbcTemplate.queryForList("""
                SELECT title
                FROM profile_entries
                WHERE enabled = TRUE
                """, String.class)).containsExactlyInAnyOrder(
                "소프트웨어융합전공",
                "스마트콘텐츠과",
                "QED",
                "One Think IT's",
                "성공회대학교 소프트웨어경진대회",
                "KFIP 2026",
                "성공회대학교 IT경진대회",
                "현대오토에버 특성화 고교생 화이트해커 양성교육",
                "SW·AI 교육 수기 공모전",
                "Hello New() World"
        );
        assertThat(jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) FILTER (WHERE entry_type = 'EDUCATION') AS education_count,
                    COUNT(*) FILTER (WHERE entry_type = 'ACTIVITY') AS activity_count,
                    COUNT(*) FILTER (WHERE entry_type = 'AWARD') AS award_count,
                    COUNT(*) FILTER (WHERE entry_type = 'CERTIFICATE') AS certificate_count
                FROM profile_entries
                """)).containsEntry("education_count", 2L)
                .containsEntry("activity_count", 2L)
                .containsEntry("award_count", 5L)
                .containsEntry("certificate_count", 1L);
        assertThat(jdbcTemplate.queryForMap("""
                SELECT organization, entry_type
                FROM profile_entries
                WHERE title = '현대오토에버 특성화 고교생 화이트해커 양성교육'
                """)).containsEntry("organization", "현대오토에버")
                .containsEntry("entry_type", "CERTIFICATE");

        assertThat(jdbcTemplate.queryForList(
                "SELECT name FROM technology_master", String.class))
                .hasSize(23)
                .containsAll(MAIN_TECHNOLOGIES)
                .contains("Next.js", "React", "TypeScript", "Python", "FastAPI", "Nginx", "XRPL",
                        "JavaScript", "Node.js", "Express", "EJS");
        assertThat(jdbcTemplate.queryForList("""
                SELECT technology.name
                FROM portfolio_technologies AS portfolio
                JOIN technology_master AS technology ON technology.id = portfolio.technology_id
                ORDER BY portfolio.display_order
                """, String.class)).containsExactlyElementsOf(MAIN_TECHNOLOGIES);
    }

    // Project Draft Nullable과 Storage Key 최종 Schema 검증
    @Test
    void projectSchemaMatchesDraftAndStorageContract() {
        assertThat(jdbcTemplate.queryForList("""
                SELECT column_name || ':' || is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'projects'
                ORDER BY ordinal_position
                """, String.class)).containsExactly(
                "id:NO",
                "slug:NO",
                "name:NO",
                "year:YES",
                "tagline:YES",
                "description:YES",
                "card_role:YES",
                "summary:YES",
                "detail_role:YES",
                "started_at:YES",
                "ended_at:YES",
                "team_size:YES",
                "thumbnail_storage_key:YES",
                "display_order:NO",
                "enabled:NO",
                "created_at:NO",
                "updated_at:NO"
        );
        assertThat(jdbcTemplate.queryForObject("""
                SELECT column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'projects'
                  AND column_name = 'enabled'
                """, String.class)).isEqualTo("false");
        assertThat(jdbcTemplate.queryForList("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'project_media'
                ORDER BY ordinal_position
                """, String.class)).containsExactly(
                "id",
                "project_id",
                "storage_key",
                "media_type",
                "label",
                "alt_text",
                "display_order",
                "created_at",
                "updated_at"
        );
        assertThat(jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND tablename = 'project_media'
                  AND indexname = 'idx_project_media_project_type_order'
                """, Integer.class)).isOne();
        assertThat(jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND ((table_name = 'projects' AND column_name = 'thumbnail_url')
                    OR (table_name = 'project_media' AND column_name = 'image_url'))
                """, Integer.class)).isZero();
    }

    // 프로젝트 기본정보·관계·Content·Thumbnail Seed 보존 검증
    @Test
    void projectSeedsMatchPublicData() throws Exception {
        assertThat(jdbcTemplate.queryForList(
                "SELECT slug FROM projects ORDER BY display_order", String.class))
                .containsExactly("kyvc", "shkutrack", "shkuload");
        assertThat(jdbcTemplate.queryForMap("""
                SELECT name, year, tagline, description, card_role, summary, detail_role,
                       started_at::text, ended_at::text, team_size, display_order, enabled
                FROM projects
                WHERE slug = 'kyvc'
                """))
                .containsEntry("name", "KYvC")
                .containsEntry("year", 2026)
                .containsEntry("tagline", "법인 KYC 자동 심사 서비스")
                .containsEntry("description", "법인 서류를 기반으로 KYC 심사를 자동화하고 검증 결과를 전자 증명 형태로 연결하는 서비스")
                .containsEntry("card_role", "백엔드 · 인프라")
                .containsEntry("summary", "법인 KYC 심사부터 Verifiable Credential 발급과 Verifiable Presentation 검증까지 하나의 흐름으로 연결한 기업 인증 플랫폼")
                .containsEntry("detail_role", "PL · Backend · Infra")
                .containsEntry("started_at", "2026-04-27")
                .containsEntry("ended_at", "2026-08-18")
                .containsEntry("team_size", 9)
                .containsEntry("display_order", 1)
                .containsEntry("enabled", true);
        assertThat(jdbcTemplate.queryForMap("""
                SELECT name, year, tagline, description, card_role, summary, detail_role,
                       started_at, ended_at, team_size, display_order, enabled
                FROM projects
                WHERE slug = 'shkutrack'
                """))
                .containsEntry("name", "SHKUTrack")
                .containsEntry("year", 2026)
                .containsEntry("tagline", "성공회대학교 졸업 관리 서비스")
                .containsEntry("description", "졸업요건 확인과 졸업 자료, 마이크로전공, 수강 전략을 하나의 흐름으로 관리하는 서비스")
                .containsEntry("card_role", "풀스택 · 인프라")
                .containsEntry("summary", null)
                .containsEntry("detail_role", null)
                .containsEntry("started_at", null)
                .containsEntry("ended_at", null)
                .containsEntry("team_size", null)
                .containsEntry("display_order", 2)
                .containsEntry("enabled", false);
        assertThat(jdbcTemplate.queryForMap("""
                SELECT name, year, tagline, description, card_role, summary, detail_role,
                       started_at, ended_at, team_size, display_order, enabled, thumbnail_storage_key
                FROM projects
                WHERE slug = 'shkuload'
                """))
                .containsEntry("name", "SHKULoad")
                .containsEntry("year", 2023)
                .containsEntry("tagline", "길찾기·중간지점·지하철 정보 서비스")
                .containsEntry("description", "목적지 길찾기와 여러 위치의 중간지점 계산, 지하철 위치·지연정보를 제공하는 서비스")
                .containsEntry("card_role", "백엔드")
                .containsEntry("summary", null)
                .containsEntry("detail_role", null)
                .containsEntry("started_at", null)
                .containsEntry("ended_at", null)
                .containsEntry("team_size", null)
                .containsEntry("display_order", 3)
                .containsEntry("enabled", false)
                .containsEntry("thumbnail_storage_key", null);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT summary FROM projects WHERE slug = 'kyvc'", String.class))
                .startsWith("법인 KYC 심사부터 Verifiable Credential 발급");
        assertThat(jdbcTemplate.queryForList("""
                SELECT project.slug || ':' || technology.name
                FROM project_technologies AS relation
                JOIN projects AS project ON project.id = relation.project_id
                JOIN technology_master AS technology ON technology.id = relation.technology_id
                ORDER BY project.display_order, relation.display_order
                """, String.class)).containsExactly(
                "kyvc:Next.js", "kyvc:React", "kyvc:TypeScript", "kyvc:Java",
                "kyvc:Spring Boot", "kyvc:Python", "kyvc:FastAPI", "kyvc:PostgreSQL",
                "kyvc:MySQL", "kyvc:Docker", "kyvc:Docker Compose", "kyvc:Nginx",
                "kyvc:Linux", "kyvc:GitHub Actions", "kyvc:GHCR", "kyvc:XRPL",
                "shkutrack:Java", "shkutrack:Spring Boot", "shkutrack:PostgreSQL",
                "shkutrack:Docker", "shkutrack:Kubernetes", "shkutrack:Nginx",
                "shkuload:JavaScript", "shkuload:Node.js", "shkuload:Express", "shkuload:EJS"
        );
        assertThat(jdbcTemplate.queryForList("""
                SELECT project.slug || ':' || technology.name || ':'
                       || CASE WHEN relation.show_on_card THEN '1' ELSE '0' END || ':'
                       || CASE WHEN relation.highlighted THEN '1' ELSE '0' END || ':'
                       || relation.display_order
                FROM project_technologies AS relation
                JOIN projects AS project ON project.id = relation.project_id
                JOIN technology_master AS technology ON technology.id = relation.technology_id
                ORDER BY project.display_order, relation.display_order
                """, String.class)).containsExactly(
                "kyvc:Next.js:0:0:1", "kyvc:React:0:0:2", "kyvc:TypeScript:0:0:3",
                "kyvc:Java:1:1:4", "kyvc:Spring Boot:1:1:5", "kyvc:Python:0:0:6",
                "kyvc:FastAPI:0:0:7", "kyvc:PostgreSQL:1:1:8", "kyvc:MySQL:0:1:9",
                "kyvc:Docker:1:1:10", "kyvc:Docker Compose:0:1:11", "kyvc:Nginx:0:1:12",
                "kyvc:Linux:0:1:13", "kyvc:GitHub Actions:0:1:14", "kyvc:GHCR:0:1:15",
                "kyvc:XRPL:0:0:16", "shkutrack:Java:1:0:1", "shkutrack:Spring Boot:1:0:2",
                "shkutrack:PostgreSQL:1:0:3", "shkutrack:Docker:1:0:4",
                "shkutrack:Kubernetes:1:0:5", "shkutrack:Nginx:1:0:6",
                "shkuload:JavaScript:1:0:1", "shkuload:Node.js:1:0:2",
                "shkuload:Express:1:0:3", "shkuload:EJS:1:0:4"
        );
        assertThat(jdbcTemplate.queryForList("""
                SELECT technology.name
                FROM project_technologies AS relation
                JOIN projects AS project ON project.id = relation.project_id
                JOIN technology_master AS technology ON technology.id = relation.technology_id
                WHERE project.slug = 'kyvc'
                  AND relation.show_on_card = TRUE
                ORDER BY relation.display_order
                """, String.class)).containsExactly("Java", "Spring Boot", "PostgreSQL", "Docker");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM project_contents", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("""
                SELECT content.results_json -> 0 ->> 'title'
                FROM project_contents AS content
                JOIN projects AS project ON project.id = content.project_id
                WHERE project.slug = 'kyvc'
                """, String.class)).isEqualTo("KFIP Toss 특별상 수상");
        assertThat(jdbcTemplate.queryForMap("""
                SELECT
                    jsonb_typeof(content.results_json) AS results_type,
                    content.results_json -> 0 ->> 'description' AS result_description,
                    jsonb_typeof(content.background_json -> 0) AS background_type,
                    content.background_json -> 0 ->> 'body' AS background_body,
                    content.features_json -> 0 ->> 'description' AS feature_description,
                    jsonb_array_length(content.development_json) AS development_count,
                    content.architecture_json -> 'services' ->> 0 AS first_service,
                    jsonb_array_length(content.engineering_json) AS engineering_count
                FROM project_contents AS content
                JOIN projects AS project ON project.id = content.project_id
                WHERE project.slug = 'kyvc'
                """))
                .containsEntry("results_type", "array")
                .containsEntry("result_description", "Toss 특별상")
                .containsEntry("background_type", "object")
                .containsEntry("background_body", "기존 법인 KYC는 법인 정보와 각종 증빙서류를 제출하고 심사기관이 이를 반복적으로 검토하는 과정이 필요하다.")
                .containsEntry("feature_description", "법인 KYC 신청·서류 제출")
                .containsEntry("development_count", 3)
                .containsEntry("first_service", "Backend")
                .containsEntry("engineering_count", 4);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM project_media", Integer.class)).isZero();
        String kyvcKey = jdbcTemplate.queryForObject(
                "SELECT thumbnail_storage_key FROM projects WHERE slug = 'kyvc'", String.class);
        String trackKey = jdbcTemplate.queryForObject(
                "SELECT thumbnail_storage_key FROM projects WHERE slug = 'shkutrack'", String.class);
        assertThat(kyvcKey).matches("projects/\\d+/thumbnail/2a22886f-378c-45cd-8548-4f93b9036594\\.webp");
        assertThat(trackKey).matches("projects/\\d+/thumbnail/383297dd-5394-5945-2c56-050f58034417\\.webp");
        assertThat(fileStorageService.open(kyvcKey).getContentAsByteArray())
                .isEqualTo(new ClassPathResource("seed/projects/kyvc-thumbnail.webp").getContentAsByteArray());
        assertThat(fileStorageService.open(trackKey).getContentAsByteArray())
                .isEqualTo(new ClassPathResource("seed/projects/shkutrack-thumbnail.webp").getContentAsByteArray());
        assertThat(jdbcTemplate.queryForList(
                "SELECT name FROM external_links ORDER BY display_order", String.class))
                .containsExactly("Instagram", "GitHub", "LinkedIn");
    }

    // Tool Registry와 Links 초기값 검증
    @Test
    void toolSeedsMatchFrontendData() {
        assertThat(jdbcTemplate.queryForList(
                "SELECT tool_key FROM tools ORDER BY tool_key", String.class))
                .containsExactly("LINKS", "QUIZ");
        assertThat(jdbcTemplate.queryForList("""
                SELECT name
                FROM tool_links
                ORDER BY CASE category WHEN 'REFERENCE' THEN 1 ELSE 2 END, display_order
                """, String.class)).containsExactly(
                "React Bits",
                "Aceternity UI",
                "Magic UI",
                "Color Hunt",
                "Adobe Color",
                "Happy Hues",
                "Realtime Colors",
                "KYvC",
                "KYvC Intro",
                "SKHUTrack",
                "khuoo.synology.me"
        );
        assertThat(jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) FILTER (WHERE category = 'REFERENCE') AS reference_count,
                    COUNT(*) FILTER (WHERE category = 'MY_SERVICES') AS service_count,
                    COUNT(*) FILTER (WHERE image_storage_key IS NULL) AS default_image_count
                FROM tool_links
                """)).containsEntry("reference_count", 7L)
                .containsEntry("service_count", 4L)
                .containsEntry("default_image_count", 11L);
    }

    // Runtime 테이블의 초기 데이터 미생성 검증
    @Test
    void runtimeTablesRemainEmpty() {
        Map<String, Object> counts = jdbcTemplate.queryForMap("""
                SELECT
                    (SELECT COUNT(*) FROM accounts) AS accounts,
                    (SELECT COUNT(*) FROM verification_challenges) AS challenges,
                    (SELECT COUNT(*) FROM login_logs) AS login_logs,
                    (SELECT COUNT(*) FROM resume_files) AS resume_files,
                    (SELECT COUNT(*) FROM tool_quizzes) AS tool_quizzes,
                    (SELECT COUNT(*) FROM daily_visits) AS daily_visits,
                    (SELECT COUNT(*) FROM service_status) AS service_status,
                    (SELECT COUNT(*) FROM error_logs) AS error_logs,
                    (SELECT COUNT(*) FROM spring_session) AS sessions,
                    (SELECT COUNT(*) FROM spring_session_attributes) AS session_attributes
                """);

        assertThat(counts.values()).containsOnly(0L);
    }

    private String contentValue(String category, String contentCode) {
        return jdbcTemplate.queryForObject("""
                SELECT content_value
                FROM portfolio_contents
                WHERE category = ?
                  AND content_code = ?
                """, String.class, category, contentCode);
    }

}
