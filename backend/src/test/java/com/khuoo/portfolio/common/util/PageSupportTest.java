package com.khuoo.portfolio.common.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// Pagination 입력 정규화 정책 검증
class PageSupportTest {

    // null page와 size의 기본값 검증
    @Test
    void usesDefaultsForNullValues() {
        assertThat(PageSupport.normalize(null, null))
                .isEqualTo(new PageSupport.PageRequest(0, 50));
    }

    // 음수 page와 1 미만 size의 기본값 검증
    @Test
    void usesDefaultsForInvalidValues() {
        assertThat(PageSupport.normalize(-1, 0))
                .isEqualTo(new PageSupport.PageRequest(0, 50));
        assertThat(PageSupport.normalize(-10, -5))
                .isEqualTo(new PageSupport.PageRequest(0, 50));
    }

    // 정상 page와 size 유지 검증
    @Test
    void preservesValidValuesWithoutMaximumLimit() {
        assertThat(PageSupport.normalize(3, 500))
                .isEqualTo(new PageSupport.PageRequest(3, 500));
    }
}
