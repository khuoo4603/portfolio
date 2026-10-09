package com.khuoo.portfolio.tool.repository;

import com.khuoo.portfolio.tool.domain.ToolQuizSubject;

import java.time.OffsetDateTime;
import java.util.Optional;

// Quiz 과목 단건 저장과 소유자 범위 변경 Repository 경계
public interface QuizSubjectRepository {

    // 현재 계정 소유 과목 단건 조회
    Optional<ToolQuizSubject> findOwned(Long subjectId, Long accountId);

    // 동일 계정 과목명 중복 여부 조회
    boolean existsName(Long accountId, String name, Long excludedSubjectId);

    // 신규 과목 저장과 생성 시각 조회
    ToolQuizSubject save(ToolQuizSubject subject);

    // 과목 소속 Quiz 연결 해제와 수정 시각 갱신
    void clearQuizSubject(Long subjectId, Long accountId, OffsetDateTime changedAt);

    // 과목 삭제
    void delete(ToolQuizSubject subject);

    // 변경 SQL 즉시 반영
    void flush();
}
