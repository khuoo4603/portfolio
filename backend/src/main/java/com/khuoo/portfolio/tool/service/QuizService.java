package com.khuoo.portfolio.tool.service;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.validation.PatchValues;
import com.khuoo.portfolio.tool.domain.ToolQuiz;
import com.khuoo.portfolio.tool.dto.QuizCreateRequest;
import com.khuoo.portfolio.tool.dto.QuizListResponse;
import com.khuoo.portfolio.tool.dto.QuizResponse;
import com.khuoo.portfolio.tool.dto.QuizSummaryResponse;
import com.khuoo.portfolio.tool.dto.QuizUpdateRequest;
import com.khuoo.portfolio.tool.repository.QuizSubjectRepository;
import com.khuoo.portfolio.tool.repository.ToolQueryRepository;
import com.khuoo.portfolio.tool.repository.ToolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

// 현재 Session 계정의 저장 Quiz CRUD와 소유권 검증
@Service
@RequiredArgsConstructor
public class QuizService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");
    private static final ZoneOffset KST = ZoneOffset.ofHours(9);
    private static final com.fasterxml.jackson.databind.ObjectMapper STORAGE_MAPPER =
            new com.fasterxml.jackson.databind.ObjectMapper();

    private final ToolService toolService;
    private final ToolRepository toolRepository;
    private final ToolQueryRepository toolQueryRepository;
    private final QuizSubjectRepository quizSubjectRepository;
    private final QuizJsonValidator quizJsonValidator;
    private final ObjectMapper objectMapper;

    // QUIZ 활성 확인 후 현재 사용자 Quiz 최근 수정순 목록 조회
    public QuizListResponse findQuizzes(AccountPrincipal currentAccount) {
        toolService.requireEnabled(PortfolioConstants.ToolKey.QUIZ);
        return new QuizListResponse(
                toolQueryRepository.findQuizSummaries(currentAccount.id()).stream()
                        .map(QuizSummaryResponse::from)
                        .toList()
        );
    }

    // QUIZ 활성과 원본 구조 확인 후 현재 사용자 Quiz 저장
    @Transactional
    public QuizResponse create(QuizCreateRequest request, AccountPrincipal currentAccount) {
        toolService.requireEnabled(PortfolioConstants.ToolKey.QUIZ);
        quizJsonValidator.validate(request.quizJson());

        ToolQuiz quiz = ToolQuiz.create(
                currentAccount.id(),
                request.title(),
                storedJson(request.quizJson()),
                storedNullableJson(request.responseJson()),
                subjectId(request.subjectId(), currentAccount.id())
        );
        return response(toolRepository.saveQuiz(quiz));
    }

    // QUIZ 활성과 현재 사용자 소유권 확인 후 Quiz 상세 조회
    public QuizResponse findQuiz(Long quizId, AccountPrincipal currentAccount) {
        toolService.requireEnabled(PortfolioConstants.ToolKey.QUIZ);
        return response(requireOwnedQuiz(quizId, currentAccount.id()));
    }

    // 전달 필드와 Quiz 구조 확인 후 현재 사용자 소유 Quiz 수정
    @Transactional
    public QuizResponse update(Long quizId, QuizUpdateRequest request, AccountPrincipal currentAccount) {
        toolService.requireEnabled(PortfolioConstants.ToolKey.QUIZ);
        ToolQuiz quiz = requireOwnedQuiz(quizId, currentAccount.id());
        PatchValues.requireAny(request.title(), request.quizJson(), request.responseJson(), request.subjectId());

        String title = PatchValues.present(request.title())
                ? PatchValues.requiredString(request.title(), 200)
                : quiz.getTitle();
        com.fasterxml.jackson.databind.JsonNode quizJson = quiz.getQuizJson();
        if (PatchValues.present(request.quizJson())) {
            quizJsonValidator.validate(request.quizJson());
            quizJson = storedJson(request.quizJson());
        }
        com.fasterxml.jackson.databind.JsonNode responseJson = PatchValues.present(request.responseJson())
                ? storedNullableJson(request.responseJson())
                : quiz.getResponseJson();
        Long subjectId = PatchValues.present(request.subjectId())
                ? subjectId(request.subjectId(), currentAccount.id())
                : quiz.getSubjectId();

        quiz.update(title, quizJson, responseJson, subjectId, now());
        toolRepository.flush();
        return response(quiz);
    }

    // QUIZ 활성과 현재 사용자 소유권 확인 후 Quiz 삭제
    @Transactional
    public void delete(Long quizId, AccountPrincipal currentAccount) {
        toolService.requireEnabled(PortfolioConstants.ToolKey.QUIZ);
        toolRepository.deleteQuiz(requireOwnedQuiz(quizId, currentAccount.id()));
    }

    private ToolQuiz requireOwnedQuiz(Long quizId, Long accountId) {
        return toolRepository.findOwnedQuiz(quizId, accountId)
                .orElseThrow(() -> new ApiException(ErrorCode.QUIZ_NOT_FOUND));
    }

    // API Jackson 값의 Hibernate JSONB 타입 변환
    private com.fasterxml.jackson.databind.JsonNode storedJson(JsonNode value) {
        try {
            return STORAGE_MAPPER.readTree(value.toString());
        } catch (Exception exception) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR, exception);
        }
    }

    private com.fasterxml.jackson.databind.JsonNode storedNullableJson(JsonNode value) {
        return value == null || value.isNull() ? null : storedJson(value);
    }

    // Hibernate JSONB 값의 API Jackson 타입 변환
    private JsonNode apiJson(com.fasterxml.jackson.databind.JsonNode value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.readTree(value.toString());
        } catch (Exception exception) {
            throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR, exception);
        }
    }

    private QuizResponse response(ToolQuiz quiz) {
        return new QuizResponse(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getSubjectId(),
                apiJson(quiz.getQuizJson()),
                apiJson(quiz.getResponseJson()),
                kst(quiz.getCreatedAt()),
                kst(quiz.getUpdatedAt())
        );
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }

    private Long subjectId(Long subjectId, Long accountId) {
        if (subjectId == null) {
            return null;
        }
        return quizSubjectRepository.findOwned(subjectId, accountId)
                .map(subject -> subject.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.QUIZ_SUBJECT_NOT_FOUND));
    }

    private Long subjectId(JsonNode value, Long accountId) {
        if (value.isNull()) {
            return null;
        }
        if (!value.isIntegralNumber() || !value.canConvertToLong() || value.longValue() <= 0) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        return subjectId(value.longValue(), accountId);
    }

    private OffsetDateTime kst(OffsetDateTime value) {
        return value == null ? null : value.withOffsetSameInstant(KST);
    }
}
