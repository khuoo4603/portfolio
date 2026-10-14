package com.khuoo.portfolio.tool.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

// 계정별 저장 Quiz 분류 과목 정보
@Getter
@Entity
@Table(name = "tool_quiz_subjects")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ToolQuizSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    private ToolQuizSubject(Long accountId, String name) {
        this.accountId = accountId;
        this.name = name;
    }

    // 현재 계정 소유 Quiz 과목 최초 생성
    public static ToolQuizSubject create(Long accountId, String name) {
        return new ToolQuizSubject(accountId, name);
    }

    // 과목 표시명과 최종 수정 시각 변경
    public void rename(String newName, OffsetDateTime changedAt) {
        name = newName;
        updatedAt = changedAt;
    }
}
