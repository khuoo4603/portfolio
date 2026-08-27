package com.khuoo.portfolio.common.util;

// API Pagination 입력 기본값 정규화
public final class PageSupport {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 50;

    private PageSupport() {
    }

    // page와 size의 API 기본값 적용
    public static PageRequest normalize(Integer page, Integer size) {
        int normalizedPage = page == null || page < 0 ? DEFAULT_PAGE : page;
        int normalizedSize = size == null || size < 1 ? DEFAULT_SIZE : size;
        return new PageRequest(normalizedPage, normalizedSize);
    }

    // 정규화된 Pagination 요청 값
    public record PageRequest(
            int page,
            int size
    ) {
    }
}
