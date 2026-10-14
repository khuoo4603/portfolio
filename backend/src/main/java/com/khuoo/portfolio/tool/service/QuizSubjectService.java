package com.khuoo.portfolio.tool.service;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.tool.domain.ToolQuizSubject;
import com.khuoo.portfolio.tool.dto.QuizSubjectListResponse;
import com.khuoo.portfolio.tool.dto.QuizSubjectRequest;
import com.khuoo.portfolio.tool.dto.QuizSubjectResponse;
import com.khuoo.portfolio.tool.repository.QuizSubjectQueryRepository;
import com.khuoo.portfolio.tool.repository.QuizSubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;

// 현재 Session 계정의 Quiz 과목 CRUD와 소유권 검증
@Service
@RequiredArgsConstructor
public class QuizSubjectService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final ToolService toolService;
    private final QuizSubjectRepository quizSubjectRepository;
    private final QuizSubjectQueryRepository quizSubjectQueryRepository;

    // QUIZ 활성 상태 확인 후 현재 계정 과목 목록 조회
    public QuizSubjectListResponse findSubjects(AccountPrincipal currentAccount) {
        toolService.requireEnabled(PortfolioConstants.ToolKey.QUIZ);
        return new QuizSubjectListResponse(
                quizSubjectQueryRepository.findSubjects(currentAccount.id()).stream()
                        .map(QuizSubjectResponse::from)
                        .toList()
        );
    }

    // QUIZ 활성 상태 확인 후 현재 계정 과목 생성
    @Transactional
    public QuizSubjectResponse create(QuizSubjectRequest request, AccountPrincipal currentAccount) {
        toolService.requireEnabled(PortfolioConstants.ToolKey.QUIZ);
        String name = name(request == null ? null : request.name());
        ensureAvailableName(currentAccount.id(), name, null);
        return QuizSubjectResponse.from(
                quizSubjectRepository.save(ToolQuizSubject.create(currentAccount.id(), name))
        );
    }

    // QUIZ 활성 상태 확인 후 현재 계정 과목명 변경
    @Transactional
    public QuizSubjectResponse update(Long subjectId, QuizSubjectRequest request, AccountPrincipal currentAccount) {
        toolService.requireEnabled(PortfolioConstants.ToolKey.QUIZ);
        ToolQuizSubject subject = requireOwned(subjectId, currentAccount.id());
        String name = name(request == null ? null : request.name());
        ensureAvailableName(currentAccount.id(), name, subjectId);
        subject.rename(name, now());
        quizSubjectRepository.flush();
        return QuizSubjectResponse.from(subject);
    }

    // QUIZ 활성 상태 확인 후 소속 Quiz 보존 과목 삭제
    @Transactional
    public void delete(Long subjectId, AccountPrincipal currentAccount) {
        toolService.requireEnabled(PortfolioConstants.ToolKey.QUIZ);
        ToolQuizSubject subject = requireOwned(subjectId, currentAccount.id());
        quizSubjectRepository.clearQuizSubject(subjectId, currentAccount.id(), now());
        quizSubjectRepository.delete(subject);
    }

    private ToolQuizSubject requireOwned(Long subjectId, Long accountId) {
        return quizSubjectRepository.findOwned(subjectId, accountId)
                .orElseThrow(() -> new ApiException(ErrorCode.QUIZ_SUBJECT_NOT_FOUND));
    }

    private void ensureAvailableName(Long accountId, String name, Long excludedSubjectId) {
        if (quizSubjectRepository.existsName(accountId, name, excludedSubjectId)) {
            throw new ApiException(ErrorCode.QUIZ_SUBJECT_NAME_CONFLICT);
        }
    }

    private String name(String value) {
        if (value == null) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        String normalized = value.strip();
        if (normalized.isBlank() || normalized.length() > 100) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        return normalized;
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
