package com.khuoo.portfolio;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

// 실제 PostgreSQL 기반 애플리케이션 Context와 초기 데이터 검증
@SpringBootTest
class PortfolioApplicationTests extends PostgresIntegrationTest {

    private static final List<String> CONTENT_SLOTS = List.of(
            "COMMON/SITE_MARK",
            "COMMON/NAME",
            "COMMON/ENGLISH_NAME",
            "COMMON/POSITION",
            "COMMON/AFFILIATION",
            "COMMON/NAV_ABOUT",
            "COMMON/NAV_TECH",
            "COMMON/NAV_PROJECTS",
            "COMMON/NAV_EDUCATION",
            "MAIN/HERO_POSITION",
            "MAIN/HERO_STATEMENT",
            "MAIN/HERO_DESCRIPTION",
            "MAIN/HERO_CUE",
            "MAIN/ABOUT_SECTION_LABEL",
            "MAIN/ABOUT_SECTION_TITLE",
            "MAIN/TECH_SECTION_LABEL",
            "MAIN/TECH_SECTION_TITLE",
            "MAIN/PROJECTS_SECTION_LABEL",
            "MAIN/PROJECTS_SECTION_TITLE",
            "MAIN/PROJECT_DETAIL_CTA",
            "MAIN/ACHIEVEMENTS_SECTION_LABEL",
            "MAIN/ACHIEVEMENTS_SECTION_TITLE",
            "MAIN/EDUCATION_GROUP_TITLE",
            "MAIN/ACTIVITY_GROUP_TITLE",
            "MAIN/AWARD_GROUP_TITLE",
            "PROFILE/ABOUT_STATEMENT",
            "PROFILE/ABOUT_POSITION",
            "PROFILE/ABOUT_DESCRIPTION_1",
            "PROFILE/ABOUT_DESCRIPTION_2",
            "PROFILE/DEVELOPMENT_VALUES_TITLE",
            "PROFILE/DEVELOPMENT_VALUE_1_TITLE",
            "PROFILE/DEVELOPMENT_VALUE_1_DESCRIPTION",
            "PROFILE/DEVELOPMENT_VALUE_2_TITLE",
            "PROFILE/DEVELOPMENT_VALUE_2_DESCRIPTION",
            "PROFILE/DEVELOPMENT_VALUE_3_TITLE",
            "PROFILE/DEVELOPMENT_VALUE_3_DESCRIPTION",
            "CONTACT/EMAIL",
            "FOOTER/FOOTER_NAME",
            "FOOTER/FOOTER_ROLE",
            "FOOTER/RESUME_LABEL",
            "FOOTER/RESUME_VIEW_LABEL",
            "FOOTER/RESUME_DOWNLOAD_LABEL",
            "FOOTER/CONTACT_LABEL",
            "FOOTER/PORTFOLIO_LABEL",
            "FOOTER/COPYRIGHT"
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
        assertThat(jdbcTemplate.queryForMap("""
                SELECT
                    COUNT(*) FILTER (WHERE category = 'COMMON') AS common_count,
                    COUNT(*) FILTER (WHERE category = 'MAIN') AS main_count,
                    COUNT(*) FILTER (WHERE category = 'PROFILE') AS profile_count,
                    COUNT(*) FILTER (WHERE category = 'CONTACT') AS contact_count,
                    COUNT(*) FILTER (WHERE category = 'FOOTER') AS footer_count
                FROM portfolio_contents
                """)).containsEntry("common_count", 9L)
                .containsEntry("main_count", 16L)
                .containsEntry("profile_count", 11L)
                .containsEntry("contact_count", 1L)
                .containsEntry("footer_count", 8L);
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
                SELECT organization, featured
                FROM profile_entries
                WHERE title = 'QED'
                """)).containsEntry("organization", "성공회대학교")
                .containsEntry("featured", true);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM profile_entries WHERE featured = TRUE", Integer.class)).isEqualTo(3);

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

    // 프로젝트 기본정보와 관계형 Seed 검증
    @Test
    void projectSeedsMatchPublicData() {
        assertThat(jdbcTemplate.queryForList(
                "SELECT slug FROM projects ORDER BY display_order", String.class))
                .containsExactly("kyvc", "shkutrack", "shkuload");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT summary FROM projects WHERE slug = 'kyvc'", String.class))
                .startsWith("법인 KYC 심사부터 Verifiable Credential 발급");
        assertThat(jdbcTemplate.queryForList("""
                SELECT project.slug || ':' || technology.name
                FROM project_technologies AS relation
                JOIN projects AS project ON project.id = relation.project_id
                JOIN technology_master AS technology ON technology.id = relation.technology_id
                ORDER BY project.display_order, relation.display_order
                """, String.class)).hasSize(26)
                .contains("kyvc:XRPL", "shkutrack:Nginx", "shkuload:Node.js");
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
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM project_media", Integer.class)).isZero();
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
