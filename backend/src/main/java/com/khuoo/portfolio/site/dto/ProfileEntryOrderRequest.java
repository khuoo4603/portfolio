package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

// 프로필 그룹의 일괄 순서 변경과 동시성 기준
public record ProfileEntryOrderRequest(
        @NotNull
        @Schema(description = "프로필 정렬 그룹", example = "ACTIVITIES")
        ProfileOrderGroup group,

        @NotNull @Size(max = 200)
        List<@NotNull @Positive Long> orderedIds,

        @NotNull @Size(max = 200)
        List<@NotNull @Positive Long> expectedIds
) {
    public enum ProfileOrderGroup {
        EDUCATION,
        ACTIVITIES,
        AWARD,
        CERTIFICATE
    }
}
