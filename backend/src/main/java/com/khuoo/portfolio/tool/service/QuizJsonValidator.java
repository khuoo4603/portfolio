package com.khuoo.portfolio.tool.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.Set;

// Frontend QuizPage 계약과 동일한 Quiz JSON 구조 검증
@Component
public class QuizJsonValidator {

    private static final Set<String> QUESTION_TYPES = Set.of("single", "multiple", "short", "essay");

    // 최상위 Quiz와 문항별 필수 구조 검증
    public void validate(JsonNode quizJson) {
        if (quizJson == null || !quizJson.isObject()) {
            throw invalid();
        }

        JsonNode questions = quizJson.get("questions");
        if (questions == null || !questions.isArray() || questions.size() == 0) {
            throw invalid();
        }

        for (JsonNode question : questions) {
            validateQuestion(question);
        }
    }

    private void validateQuestion(JsonNode question) {
        if (question == null || !question.isObject()) {
            throw invalid();
        }

        JsonNode typeValue = question.get("type");
        JsonNode questionValue = question.get("question");
        if (typeValue == null
                || !typeValue.isString()
                || !QUESTION_TYPES.contains(typeValue.stringValue())
                || questionValue == null
                || !questionValue.isString()
                || questionValue.stringValue().isEmpty()) {
            throw invalid();
        }

        String type = typeValue.stringValue();
        if ("single".equals(type) || "multiple".equals(type)) {
            validateChoices(question.get("choices"));
        } else if (question.get("choices") != null) {
            throw invalid();
        }

        JsonNode codeBlocks = question.get("codeBlocks");
        if (codeBlocks != null) {
            validateCodeBlocks(codeBlocks);
        }
    }

    private void validateChoices(JsonNode choices) {
        if (choices == null || !choices.isArray() || choices.size() == 0) {
            throw invalid();
        }
        for (JsonNode choice : choices) {
            if (!choice.isString()) {
                throw invalid();
            }
        }
    }

    // 문자열 하위 호환과 code 필수 객체 형식 검증
    private void validateCodeBlocks(JsonNode codeBlocks) {
        if (!codeBlocks.isArray()) {
            throw invalid();
        }
        for (JsonNode block : codeBlocks) {
            if (block.isString()) {
                continue;
            }
            JsonNode code = block.isObject() ? block.get("code") : null;
            if (code == null || !code.isString()) {
                throw invalid();
            }
        }
    }

    private ApiException invalid() {
        return new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
    }
}
