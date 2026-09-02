package com.khuoo.portfolio.tool.controller;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.tool.dto.QuizCreateRequest;
import com.khuoo.portfolio.tool.dto.QuizListResponse;
import com.khuoo.portfolio.tool.dto.QuizResponse;
import com.khuoo.portfolio.tool.dto.QuizUpdateRequest;
import com.khuoo.portfolio.tool.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 인증 사용자의 개인 저장 Quiz 관리 API
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/tools/quizzes")
public class QuizController {

    private final QuizService quizService;

    // 현재 사용자 소유 Quiz 최근 수정순 목록 조회
    @Operation(summary = "내 저장 Quiz 목록 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "저장 Quiz 목록 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "404", description = "Quiz Tool 비활성 상태")
    })
    @GetMapping
    public QuizListResponse findQuizzes(@AuthenticationPrincipal AccountPrincipal currentAccount) {
        return quizService.findQuizzes(currentAccount);
    }

    // 현재 사용자 소유 Quiz 저장
    @Operation(summary = "Quiz 저장")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Quiz 저장 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 또는 Quiz JSON 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "CSRF 검증 실패"),
            @ApiResponse(responseCode = "404", description = "Quiz Tool 비활성 상태")
    })
    @PostMapping
    public ResponseEntity<QuizResponse> create(
            @Valid @RequestBody QuizCreateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAccount
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.create(request, currentAccount));
    }

    // 현재 사용자 소유 Quiz 상세 조회
    @Operation(summary = "저장 Quiz 상세 불러오기")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "저장 Quiz 상세 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "404", description = "Quiz 또는 활성 Tool 없음")
    })
    @GetMapping("/{quizId}")
    public QuizResponse findQuiz(
            @PathVariable Long quizId,
            @AuthenticationPrincipal AccountPrincipal currentAccount
    ) {
        return quizService.findQuiz(quizId, currentAccount);
    }

    // 현재 사용자 소유 Quiz 전달 필드 수정
    @Operation(summary = "저장 Quiz 수정")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "저장 Quiz 수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 또는 Quiz JSON 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "CSRF 검증 실패"),
            @ApiResponse(responseCode = "404", description = "Quiz 또는 활성 Tool 없음")
    })
    @PatchMapping("/{quizId}")
    public QuizResponse update(
            @PathVariable Long quizId,
            @RequestBody QuizUpdateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAccount
    ) {
        return quizService.update(quizId, request, currentAccount);
    }

    // 현재 사용자 소유 Quiz 삭제
    @Operation(summary = "저장 Quiz 삭제")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "저장 Quiz 삭제 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "CSRF 검증 실패"),
            @ApiResponse(responseCode = "404", description = "Quiz 또는 활성 Tool 없음")
    })
    @DeleteMapping("/{quizId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long quizId,
            @AuthenticationPrincipal AccountPrincipal currentAccount
    ) {
        quizService.delete(quizId, currentAccount);
        return ResponseEntity.noContent().build();
    }
}
