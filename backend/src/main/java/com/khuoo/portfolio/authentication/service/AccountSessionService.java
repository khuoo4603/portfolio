package com.khuoo.portfolio.authentication.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.stereotype.Service;

// 계정 상태·Credential 변경 후 전체 Spring Session 폐기
@Service
@RequiredArgsConstructor
public class AccountSessionService {

    private final ObjectProvider<FindByIndexNameSessionRepository<? extends Session>> sessionRepositoryProvider;

    /**
     * 계정 Principal Name에 연결된 전체 Session 폐기
     *
     * @param accountId Session 폐기 대상 계정 식별자
     */
    public void expireAll(Long accountId) {
        FindByIndexNameSessionRepository<? extends Session> sessionRepository =
                sessionRepositoryProvider.getObject();
        sessionRepository.findByPrincipalName(accountId.toString())
                .keySet()
                .forEach(sessionRepository::deleteById);
    }
}
