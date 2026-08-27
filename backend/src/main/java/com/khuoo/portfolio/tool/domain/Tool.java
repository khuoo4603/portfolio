package com.khuoo.portfolio.tool.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

// 코드 Tool의 표시명과 사용자 접근 활성 상태
@Getter
@Entity
@Table(name = "tools")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tool {

    @Id
    @Column(name = "tool_key", nullable = false, length = 100)
    private String toolKey;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    // 활성 상태 변경 후 실제 변경 여부 반환
    public boolean changeEnabled(boolean newEnabled, OffsetDateTime changedAt) {
        if (enabled == newEnabled) {
            return false;
        }
        enabled = newEnabled;
        updatedAt = changedAt;
        return true;
    }
}
