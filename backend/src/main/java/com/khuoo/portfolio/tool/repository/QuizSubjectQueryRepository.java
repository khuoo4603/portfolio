package com.khuoo.portfolio.tool.repository;

import com.khuoo.portfolio.tool.domain.ToolQuizSubject;

import java.util.List;

// Quiz 과목 목록 조회 Repository 경계
public interface QuizSubjectQueryRepository {

    // 계정별 과목 생성순 목록 조회
    List<ToolQuizSubject> findSubjects(Long accountId);
}
