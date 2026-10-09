package com.khuoo.portfolio.tool.controller;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.tool.dto.QuizSubjectListResponse;
import com.khuoo.portfolio.tool.dto.QuizSubjectRequest;
import com.khuoo.portfolio.tool.dto.QuizSubjectResponse;
import com.khuoo.portfolio.tool.service.QuizSubjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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

// 인증 사용자 Quiz 과목 관리 API
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/tools/quiz-subjects")
public class QuizSubjectController {

    private final QuizSubjectService quizSubjectService;

    // 현재 사용자 소유 과목 생성순 목록 조회
    @Operation(summary = "Quiz 과목 목록 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quiz 과목 목록 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "404", description = "Quiz Tool 비활성 상태")
    })
    @GetMapping
    public QuizSubjectListResponse findSubjects(@AuthenticationPrincipal AccountPrincipal currentAccount) {
        return quizSubjectService.findSubjects(currentAccount);
    }

    // 현재 사용자 소유 과목 생성
    @Operation(summary = "Quiz 과목 생성")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Quiz 과목 생성 성공"),
            @ApiResponse(responseCode = "400", description = "과목명 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "CSRF 검증 실패"),
            @ApiResponse(responseCode = "409", description = "동일 과목명 존재")
    })
    @PostMapping
    public ResponseEntity<QuizSubjectResponse> create(
            @RequestBody QuizSubjectRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAccount
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizSubjectService.create(request, currentAccount));
    }

    // 현재 사용자 소유 과목명 변경
    @Operation(summary = "Quiz 과목명 변경")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quiz 과목명 변경 성공"),
            @ApiResponse(responseCode = "400", description = "과목명 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "CSRF 검증 실패"),
            @ApiResponse(responseCode = "404", description = "과목 없음"),
            @ApiResponse(responseCode = "409", description = "동일 과목명 존재")
    })
    @PatchMapping("/{subjectId}")
    public QuizSubjectResponse update(
            @PathVariable Long subjectId,
            @RequestBody QuizSubjectRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAccount
    ) {
        return quizSubjectService.update(subjectId, request, currentAccount);
    }

    // 현재 사용자 소유 과목 삭제와 Quiz 연결 해제
    @Operation(summary = "Quiz 과목 삭제")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Quiz 과목 삭제 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "CSRF 검증 실패"),
            @ApiResponse(responseCode = "404", description = "과목 없음")
    })
    @DeleteMapping("/{subjectId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long subjectId,
            @AuthenticationPrincipal AccountPrincipal currentAccount
    ) {
        quizSubjectService.delete(subjectId, currentAccount);
        return ResponseEntity.noContent().build();
    }
}
