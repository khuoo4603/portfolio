package com.khuoo.portfolio.site.service;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.site.domain.ResumeFile;
import com.khuoo.portfolio.site.dto.ResumeUpdateResponse;
import com.khuoo.portfolio.site.repository.ProjectRepository;
import com.khuoo.portfolio.site.repository.SiteQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;

// 현재 이력서 PDF 검증·교체와 공개 조회
@Service
@RequiredArgsConstructor
public class ResumeService {

    private static final short CURRENT_RESUME_ID = 1;
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final String PDF_CONTENT_TYPE = "application/pdf";
    private static final byte[] PDF_HEADER = {'%', 'P', 'D', 'F'};
    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final ProjectRepository projectRepository;
    private final SiteQueryRepository siteQueryRepository;
    private final ResumeStorage resumeStorage;
    private final AdminActionVerifier adminActionVerifier;
    private final LogEventLogger logEventLogger;

    // PDF 전체 검증과 재인증 후 현재 이력서 안전 교체
    @Transactional(noRollbackFor = ApiException.class)
    public ResumeUpdateResponse replace(
            MultipartFile file,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        String originalName = validate(file);
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.RESUME_REPLACE,
                AdminActionTarget.RESUME,
                null
        );

        ResumeFile current = projectRepository.findResumeForUpdate().orElse(null);
        String previousStorageKey = current == null ? null : current.getStorageKey();
        ResumeStorage.StoredFile stored = resumeStorage.store(file);
        registerCleanup(stored.storageKey(), previousStorageKey);

        if (current == null) {
            current = ResumeFile.create(
                    CURRENT_RESUME_ID,
                    originalName,
                    stored.storageKey(),
                    stored.size(),
                    PDF_CONTENT_TYPE
            );
        } else {
            current.replace(
                    originalName,
                    stored.storageKey(),
                    stored.size(),
                    PDF_CONTENT_TYPE,
                    OffsetDateTime.now(SERVICE_ZONE)
            );
        }
        return ResumeUpdateResponse.from(projectRepository.saveResume(current));
    }

    // 현재 이력서 Metadata와 공개 PDF Resource 조회
    @Transactional(readOnly = true)
    public ResumeDownload findPublic() {
        ResumeFile resume = siteQueryRepository.findCurrentResume()
                .orElseThrow(() -> new ApiException(ErrorCode.RESUME_NOT_FOUND));
        if (!resumeStorage.exists(resume.getStorageKey())) {
            throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
        return new ResumeDownload(
                resume.getOriginalName(),
                resume.getSizeBytes(),
                resume.getContentType(),
                resumeStorage.open(resume.getStorageKey())
        );
    }

    private String validate(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() <= 0) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ApiException(ErrorCode.RESUME_FILE_TOO_LARGE);
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null
                || originalName.isBlank()
                || originalName.length() > 255
                || !originalName.toLowerCase().endsWith(".pdf")
                || originalName.chars().anyMatch(Character::isISOControl)) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        if (!PDF_CONTENT_TYPE.equals(file.getContentType()) || !hasPdfHeader(file)) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        return originalName;
    }

    private boolean hasPdfHeader(MultipartFile file) {
        byte[] header = new byte[PDF_HEADER.length];
        try (InputStream input = file.getInputStream()) {
            if (input.readNBytes(header, 0, header.length) != header.length) {
                return false;
            }
        } catch (IOException exception) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR, exception);
        }
        for (int index = 0; index < PDF_HEADER.length; index++) {
            if (header[index] != PDF_HEADER[index]) {
                return false;
            }
        }
        return true;
    }

    private void registerCleanup(String newStorageKey, String previousStorageKey) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                if (previousStorageKey != null) {
                    deletePrevious(previousStorageKey);
                }
            }

            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    deleteNew(newStorageKey);
                }
            }
        });
    }

    private void deletePrevious(String storageKey) {
        try {
            resumeStorage.delete(storageKey);
        } catch (ApiException exception) {
            logEventLogger.error(
                    "site.resume.previous-file-delete.failure",
                    "이력서 교체 후 기존 파일 정리 실패",
                    Map.of("storageKeySuffix", safeSuffix(storageKey)),
                    exception
            );
        }
    }

    private void deleteNew(String storageKey) {
        try {
            resumeStorage.delete(storageKey);
        } catch (ApiException exception) {
            logEventLogger.error(
                    "site.resume.new-file-cleanup.failure",
                    "이력서 Metadata 저장 실패 후 신규 파일 정리 실패",
                    Map.of("storageKeySuffix", safeSuffix(storageKey)),
                    exception
            );
        }
    }

    private String safeSuffix(String storageKey) {
        return storageKey.length() <= 8 ? storageKey : storageKey.substring(storageKey.length() - 8);
    }

    // 공개 PDF 응답 조합용 파일 정보
    public record ResumeDownload(
            String originalName,
            long size,
            String contentType,
            Resource resource
    ) {
    }
}
