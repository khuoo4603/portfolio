package com.khuoo.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.endsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 계정별 저장 Quiz CRUD·소유권·활성 상태·JSON 계약 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
class QuizIntegrationTests extends SiteIntegrationTestSupport {

    private static final String QUIZZES_PATH = "/api/v1/tools/quizzes";
    private static final String SUBJECTS_PATH = "/api/v1/tools/quiz-subjects";
    private static final String VALID_QUIZ_JSON = """
            {
              "title":"Java 기본","description":"테스트",
              "questions":[{
                "id":1,"type":"single","question":"정답을 고르시오.",
                "choices":["A","B","C","D"]
              }]
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    // Session 소유자 저장·JSONB Round-trip·NULL·CSRF와 USER·ADMIN CRUD 검증
    @Test
    void quizCreateUsesSessionOwnerAndSupportsNullableResponseForBothRoles() throws Exception {
        String body = createBody("Java Quiz", VALID_QUIZ_JSON, "{\"1\":\"2\"}");
        mockMvc.perform(post(QUIZZES_PATH).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        createQuiz(body, user(), false)
                .andExpect(status().isForbidden());

        MvcResult created = createQuiz(body, user(), true)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Java Quiz"))
                .andExpect(jsonPath("$.subjectId").value((Object) null))
                .andExpect(jsonPath("$.quizJson.title").value("Java 기본"))
                .andExpect(jsonPath("$.responseJson.1").value("2"))
                .andExpect(jsonPath("$.createdAt", endsWith("+09:00")))
                .andExpect(jsonPath("$.updatedAt", endsWith("+09:00")))
                .andReturn();
        Long quizId = responseId(created);
        assertThat(quizAccountId(quizId)).isEqualTo(userPrincipal.id());
        assertThat(jdbcTemplate.queryForObject(
                "SELECT quiz_json->>'title' FROM tool_quizzes WHERE id = ?", String.class, quizId
        )).isEqualTo("Java 기본");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT response_json->>'1' FROM tool_quizzes WHERE id = ?", String.class, quizId
        )).isEqualTo("2");

        Long explicitNullId = responseId(createQuiz(
                createBody("Explicit Null", VALID_QUIZ_JSON, "null"), user(), true
        ).andExpect(status().isCreated()).andReturn());
        Long omittedId = responseId(createQuiz(
                createBody("Omitted", VALID_QUIZ_JSON, null), user(), true
        ).andExpect(status().isCreated()).andReturn());
        assertThat(responseIsNull(explicitNullId)).isTrue();
        assertThat(responseIsNull(omittedId)).isTrue();

        MvcResult adminCreated = createQuiz(
                createBody("Admin Quiz", VALID_QUIZ_JSON, "{\"1\":\"A\"}"), admin(), true
        ).andExpect(status().isCreated()).andReturn();
        Long adminQuizId = responseId(adminCreated);
        assertThat(quizAccountId(adminQuizId)).isEqualTo(adminPrincipal.id());
        mockMvc.perform(get(QUIZZES_PATH + "/" + adminQuizId).with(admin()))
                .andExpect(status().isOk());
        mockMvc.perform(patch(QUIZZES_PATH + "/" + adminQuizId).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Admin Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Admin Updated"));
        mockMvc.perform(delete(QUIZZES_PATH + "/" + adminQuizId).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
    }

    // 계정별 목록 분리·JSONB 제외와 DB 지정 수정시각 내림차순 검증
    @Test
    void quizListSeparatesOwnersOmitsJsonAndSortsByUpdatedAt() throws Exception {
        Long older = insertQuiz(
                userPrincipal.id(), "Older", VALID_QUIZ_JSON, "{\"1\":\"A\"}",
                OffsetDateTime.of(2026, 8, 27, 1, 0, 0, 0, ZoneOffset.ofHours(9))
        );
        Long newer = insertQuiz(
                userPrincipal.id(), "Newer", VALID_QUIZ_JSON, "{\"1\":\"B\"}",
                OffsetDateTime.of(2026, 8, 27, 3, 0, 0, 0, ZoneOffset.ofHours(9))
        );
        Long adminQuiz = insertQuiz(
                adminPrincipal.id(), "Admin Only", VALID_QUIZ_JSON, null,
                OffsetDateTime.of(2026, 8, 27, 4, 0, 0, 0, ZoneOffset.ofHours(9))
        );

        mockMvc.perform(get(QUIZZES_PATH))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get(QUIZZES_PATH).with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", contains(newer.intValue(), older.intValue())))
                .andExpect(jsonPath("$.items[0].quizJson").doesNotExist())
                .andExpect(jsonPath("$.items[0].responseJson").doesNotExist())
                .andExpect(jsonPath("$.items[0].accountId").doesNotExist());
        mockMvc.perform(get(QUIZZES_PATH).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(adminQuiz));
    }

    // Quiz 상세의 본인 200과 미존재·타 계정 동일 404 검증
    @Test
    void quizDetailUsesOwnerScopedNotFoundForOtherAccounts() throws Exception {
        Long userQuiz = insertQuiz(userPrincipal.id(), "User", VALID_QUIZ_JSON, "{\"1\":\"B\"}",
                OffsetDateTime.now());
        Long adminQuiz = insertQuiz(adminPrincipal.id(), "Admin", VALID_QUIZ_JSON, null,
                OffsetDateTime.now());

        mockMvc.perform(get(QUIZZES_PATH + "/" + userQuiz).with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("User"))
                .andExpect(jsonPath("$.quizJson.questions[0].type").value("single"))
                .andExpect(jsonPath("$.responseJson.1").value("B"));
        mockMvc.perform(get(QUIZZES_PATH + "/999999").with(user()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get(QUIZZES_PATH + "/" + adminQuiz).with(user()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get(QUIZZES_PATH + "/" + userQuiz).with(admin()))
                .andExpect(status().isNotFound());
    }

    // Quiz PATCH 필드 독립성·명시적 null·미전달 유지·빈 요청·소유권 검증
    @Test
    void quizPatchPreservesOmittedFieldsAndClearsExplicitNull() throws Exception {
        OffsetDateTime originalTime = OffsetDateTime.of(
                2026, 8, 20, 10, 0, 0, 0, ZoneOffset.ofHours(9)
        );
        Long quizId = insertQuiz(
                userPrincipal.id(), "Original", VALID_QUIZ_JSON, "{\"1\":\"2\"}", originalTime
        );
        OffsetDateTime createdAt = quizTime(quizId, "created_at");

        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Updated Title\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.quizJson.title").value("Java 기본"))
                .andExpect(jsonPath("$.responseJson.1").value("2"));

        String replacement = """
                {"title":"교체","questions":[{"type":"essay","question":"설명하시오."}]}
                """;
        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quizJson\":" + replacement + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.quizJson.title").value("교체"))
                .andExpect(jsonPath("$.responseJson.1").value("2"));

        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"responseJson\":{\"1\":\"3\"}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseJson.1").value("3"));
        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Response Preserved\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseJson.1").value("3"));

        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"responseJson\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseJson").value((Object) null));
        assertThat(responseIsNull(quizId)).isTrue();
        assertThat(quizTime(quizId, "created_at").toInstant()).isEqualTo(createdAt.toInstant());
        assertThat(quizTime(quizId, "updated_at").toInstant()).isAfter(originalTime.toInstant());

        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quizJson\":{\"questions\":[]}}"))
                .andExpect(status().isBadRequest());
        assertThat(jdbcTemplate.queryForObject(
                "SELECT quiz_json->>'title' FROM tool_quizzes WHERE id = ?", String.class, quizId
        )).isEqualTo("교체");
        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Forbidden\"}"))
                .andExpect(status().isNotFound());
    }

    // Quiz 삭제의 본인 204와 타 계정·미존재 404 및 데이터 보존 검증
    @Test
    void quizDeleteAllowsOnlyOwnerAndReturnsNotFoundAfterRemoval() throws Exception {
        Long quizId = insertQuiz(userPrincipal.id(), "Delete", VALID_QUIZ_JSON, null,
                OffsetDateTime.now());

        mockMvc.perform(delete(QUIZZES_PATH + "/" + quizId).with(admin()).with(csrf()))
                .andExpect(status().isNotFound());
        assertThat(quizCount(quizId)).isOne();
        mockMvc.perform(delete(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf()))
                .andExpect(status().isNoContent())
                .andExpect(result -> assertThat(result.getResponse().getContentAsString()).isEmpty());
        assertThat(quizCount(quizId)).isZero();
        mockMvc.perform(delete(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf()))
                .andExpect(status().isNotFound());
    }

    // QUIZ 비활성 상태의 목록·생성·상세·수정·삭제 전체 404 검증
    @Test
    void disabledQuizToolBlocksEveryQuizEndpoint() throws Exception {
        Long quizId = insertQuiz(userPrincipal.id(), "Blocked", VALID_QUIZ_JSON, null,
                OffsetDateTime.now());
        jdbcTemplate.update("UPDATE tools SET enabled = FALSE WHERE tool_key = 'QUIZ'");

        mockMvc.perform(get(QUIZZES_PATH).with(user()))
                .andExpect(status().isNotFound());
        createQuiz(createBody("Blocked", VALID_QUIZ_JSON, null), user(), true)
                .andExpect(status().isNotFound());
        mockMvc.perform(get(QUIZZES_PATH + "/" + quizId).with(user()))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Blocked\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf()))
                .andExpect(status().isNotFound());
        assertThat(quizCount(quizId)).isOne();
    }

    // Quiz JSON 허용 유형·codeBlocks 하위 호환과 대표 구조 오류 경계 검증
    @Test
    void quizJsonValidationAcceptsCurrentContractAndRejectsInvalidBoundaries() throws Exception {
        String validCodeBlocks = """
                {
                  "questions":[
                    {"type":"single","question":"단일","choices":["A","B"]},
                    {"type":"multiple","question":"복수","choices":["A","B"]},
                    {"type":"short","question":"단답","codeBlocks":["const a = 1;"]},
                    {"type":"essay","question":"서술","codeBlocks":[{"label":"Main.java","code":"class Main {}"}]}
                  ]
                }
                """;
        createQuiz(createBody("Valid Types", validCodeBlocks, null), user(), true)
                .andExpect(status().isCreated());

        String[] invalidQuizJson = new String[]{
                "{}",
                "{\"questions\":{}}",
                "{\"questions\":[]}",
                "{\"questions\":[{\"type\":\"unknown\",\"question\":\"Q\"}]}",
                "{\"questions\":[{\"type\":\"short\"}]}",
                "{\"questions\":[{\"type\":\"single\",\"question\":\"Q\"}]}",
                "{\"questions\":[{\"type\":\"multiple\",\"question\":\"Q\",\"choices\":{}}]}",
                "{\"questions\":[{\"type\":\"single\",\"question\":\"Q\",\"choices\":[\"A\",1]}]}",
                "{\"questions\":[{\"type\":\"short\",\"question\":\"Q\",\"choices\":[]}]}",
                "{\"questions\":[{\"type\":\"essay\",\"question\":\"Q\",\"codeBlocks\":{}}]}",
                "{\"questions\":[{\"type\":\"essay\",\"question\":\"Q\",\"codeBlocks\":[{\"code\":1}]}]}"
        };
        for (String quizJson : invalidQuizJson) {
            createQuiz(createBody("Invalid", quizJson, null), user(), true)
                    .andExpect(status().isBadRequest());
        }
        createQuiz(createBody(" ", VALID_QUIZ_JSON, null), user(), true)
                .andExpect(status().isBadRequest());
        createQuiz(createBody("T".repeat(201), VALID_QUIZ_JSON, null), user(), true)
                .andExpect(status().isBadRequest());
    }

    // 세션 소유 과목 CRUD와 이름 정규화, Quiz 보존 검증
    @Test
    void quizSubjectsSupportOwnerScopedCrudAndPreserveQuizzesOnDelete() throws Exception {
        MvcResult created = mockMvc.perform(post(SUBJECTS_PATH).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"  자료구조  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("자료구조"))
                .andExpect(jsonPath("$.createdAt", endsWith("+09:00")))
                .andReturn();
        Long subjectId = responseId(created);

        mockMvc.perform(post(SUBJECTS_PATH).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"자료구조\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post(SUBJECTS_PATH).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"   \"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post(SUBJECTS_PATH).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"%s\"}".formatted("A".repeat(101))))
                .andExpect(status().isBadRequest());

        Long secondSubjectId = insertSubject(userPrincipal.id(), "알고리즘");
        mockMvc.perform(get(SUBJECTS_PATH).with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(subjectId))
                .andExpect(jsonPath("$.items[1].id").value(secondSubjectId));
        mockMvc.perform(patch(SUBJECTS_PATH + "/" + subjectId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"자료구조 및 알고리즘\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("자료구조 및 알고리즘"));
        mockMvc.perform(patch(SUBJECTS_PATH + "/" + subjectId).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"다른 계정 변경\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch(SUBJECTS_PATH + "/" + secondSubjectId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"자료구조 및 알고리즘\"}"))
                .andExpect(status().isConflict());

        Long quizId = insertQuiz(userPrincipal.id(), "Subject Quiz", VALID_QUIZ_JSON, "{\"1\":\"A\"}",
                OffsetDateTime.now(), subjectId);
        OffsetDateTime quizUpdatedAt = quizTime(quizId, "updated_at");
        OffsetDateTime foreignQuizUpdatedAt = OffsetDateTime.of(
                2026, 10, 1, 12, 0, 0, 0, ZoneOffset.ofHours(9)
        );
        Long foreignQuizId = insertQuiz(
                adminPrincipal.id(), "Foreign Subject Quiz", VALID_QUIZ_JSON, "{\"1\":\"B\"}",
                foreignQuizUpdatedAt, subjectId
        );
        mockMvc.perform(delete(SUBJECTS_PATH + "/" + subjectId).with(admin()).with(csrf()))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete(SUBJECTS_PATH + "/" + subjectId).with(user()).with(csrf()))
                .andExpect(status().isNoContent());
        assertThat(subjectCount(subjectId)).isZero();
        assertThat(quizCount(quizId)).isOne();
        assertThat(quizSubjectId(quizId)).isNull();
        assertThat(quizTime(quizId, "updated_at").toInstant()).isAfterOrEqualTo(quizUpdatedAt.toInstant());
        assertThat(quizJsonTitle(quizId)).isEqualTo("Java 기본");
        assertThat(responseValue(quizId)).isEqualTo("A");
        assertThat(quizSubjectId(foreignQuizId)).isNull();
        assertThat(quizTime(foreignQuizId, "updated_at").toInstant())
                .isEqualTo(foreignQuizUpdatedAt.toInstant());
    }

    // Quiz 과목 연결과 PATCH 누락, 명시적 null, 소유권 경계 검증
    @Test
    void quizzesSupportOptionalOwnerSubjectWithoutChangingQuizData() throws Exception {
        Long subjectId = insertSubject(userPrincipal.id(), "자료구조");
        Long otherSubjectId = insertSubject(adminPrincipal.id(), "관리자 과목");
        MvcResult created = createQuiz(
                createBody("Subject Quiz", VALID_QUIZ_JSON, "{\"1\":\"B\"}", String.valueOf(subjectId)),
                user(),
                true
        ).andExpect(status().isCreated())
                .andExpect(jsonPath("$.subjectId").value(subjectId))
                .andReturn();
        Long quizId = responseId(created);

        mockMvc.perform(get(QUIZZES_PATH).with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].subjectId").value(subjectId));
        mockMvc.perform(get(QUIZZES_PATH + "/" + quizId).with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjectId").value(subjectId));

        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Renamed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjectId").value(subjectId));
        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"subjectId\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjectId").value((Object) null))
                .andExpect(jsonPath("$.quizJson.title").value("Java 기본"))
                .andExpect(jsonPath("$.responseJson.1").value("B"));
        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"subjectId\":" + subjectId + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjectId").value(subjectId));
        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"subjectId\":" + otherSubjectId + "}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch(QUIZZES_PATH + "/" + quizId).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"subjectId\":999999}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post(QUIZZES_PATH).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("Rejected", VALID_QUIZ_JSON, null, String.valueOf(otherSubjectId))))
                .andExpect(status().isNotFound());
    }

    private ResultActions createQuiz(String body, RequestPostProcessor principal, boolean withCsrf)
            throws Exception {
        var request = post(QUIZZES_PATH).with(principal)
                .contentType(MediaType.APPLICATION_JSON).content(body);
        if (withCsrf) {
            request.with(csrf());
        }
        return mockMvc.perform(request);
    }

    private String createBody(String title, String quizJson, String responseJson) {
        return createBody(title, quizJson, responseJson, null);
    }

    private String createBody(String title, String quizJson, String responseJson, String subjectId) {
        String response = responseJson == null ? "" : ",\"responseJson\":" + responseJson;
        String subject = subjectId == null ? "" : ",\"subjectId\":" + subjectId;
        return "{\"title\":\"%s\",\"quizJson\":%s%s%s}".formatted(title, quizJson, response, subject);
    }

    // 명시 시각과 JSONB를 가진 Quiz Fixture 추가
    private Long insertQuiz(
            Long accountId,
            String title,
            String quizJson,
            String responseJson,
            OffsetDateTime updatedAt
    ) {
        return insertQuiz(accountId, title, quizJson, responseJson, updatedAt, null);
    }

    private Long insertQuiz(
            Long accountId,
            String title,
            String quizJson,
            String responseJson,
            OffsetDateTime updatedAt,
            Long subjectId
    ) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO tool_quizzes (
                    account_id, title, quiz_json, response_json, created_at, updated_at, subject_id
                )
                VALUES (?, ?, CAST(? AS JSONB), CAST(? AS JSONB), ?, ?, ?)
                RETURNING id
                """, Long.class, accountId, title, quizJson, responseJson, updatedAt, updatedAt, subjectId);
    }

    private Long responseId(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private Long quizAccountId(Long quizId) {
        return jdbcTemplate.queryForObject(
                "SELECT account_id FROM tool_quizzes WHERE id = ?", Long.class, quizId
        );
    }

    private boolean responseIsNull(Long quizId) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT response_json IS NULL FROM tool_quizzes WHERE id = ?", Boolean.class, quizId
        ));
    }

    private OffsetDateTime quizTime(Long quizId, String column) {
        return jdbcTemplate.queryForObject(
                "SELECT " + column + " FROM tool_quizzes WHERE id = ?", OffsetDateTime.class, quizId
        );
    }

    private int quizCount(Long quizId) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tool_quizzes WHERE id = ?", Integer.class, quizId
        );
    }

    private Long insertSubject(Long accountId, String name) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO tool_quiz_subjects (account_id, name)
                VALUES (?, ?)
                RETURNING id
                """, Long.class, accountId, name);
    }

    private Long quizSubjectId(Long quizId) {
        return jdbcTemplate.queryForObject(
                "SELECT subject_id FROM tool_quizzes WHERE id = ?", Long.class, quizId
        );
    }

    private int subjectCount(Long subjectId) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tool_quiz_subjects WHERE id = ?", Integer.class, subjectId
        );
    }

    private String quizJsonTitle(Long quizId) {
        return jdbcTemplate.queryForObject(
                "SELECT quiz_json->>'title' FROM tool_quizzes WHERE id = ?", String.class, quizId
        );
    }

    private String responseValue(Long quizId) {
        return jdbcTemplate.queryForObject(
                "SELECT response_json->>'1' FROM tool_quizzes WHERE id = ?", String.class, quizId
        );
    }
}
