package com.khuoo.portfolio.tool.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

// 계정별 Quiz 문제 원본과 현재 풀이 저장 정보
@Getter
@Entity
@Table(name = "tool_quizzes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ToolQuiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(nullable = false, length = 200)
    private String title;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "quiz_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode quizJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_json", columnDefinition = "jsonb")
    private JsonNode responseJson;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    private ToolQuiz(Long accountId, String title, JsonNode quizJson, JsonNode responseJson) {
        this.accountId = accountId;
        this.title = title;
        this.quizJson = quizJson;
        this.responseJson = responseJson;
    }

    // 현재 계정 소유 Quiz 최초 생성
    public static ToolQuiz create(Long accountId, String title, JsonNode quizJson, JsonNode responseJson) {
        return new ToolQuiz(accountId, title, quizJson, responseJson);
    }

    // 전달 필드가 반영된 Quiz 최신 상태 교체
    public void update(String newTitle, JsonNode newQuizJson, JsonNode newResponseJson, OffsetDateTime changedAt) {
        title = newTitle;
        quizJson = newQuizJson;
        responseJson = newResponseJson;
        updatedAt = changedAt;
    }
}
