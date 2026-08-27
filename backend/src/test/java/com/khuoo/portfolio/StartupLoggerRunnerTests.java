package com.khuoo.portfolio;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.khuoo.portfolio.common.startup.StartupLoggerRunner;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// 애플리케이션 시작 로그와 DB 연결 확인 검증
class StartupLoggerRunnerTests {

    // 정상 DB 연결 상태의 시작 이벤트와 콘솔 메시지 검증
    @Test
    void logsStartupDetailsAfterDatabaseCheck() throws Exception {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.application.name", "portfolio-backend")
                .withProperty("server.port", "8080")
                .withProperty("logging.file.path", "build/logs");
        environment.setActiveProfiles("local");

        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject("SELECT 1", Integer.class)).thenReturn(1);

        StaticListableBeanFactory beanFactory = new StaticListableBeanFactory();
        beanFactory.addBean("jdbcTemplate", jdbcTemplate);
        StartupLoggerRunner runner = new StartupLoggerRunner(
                environment,
                beanFactory.getBeanProvider(JdbcTemplate.class)
        );

        Logger applicationLogger = (Logger) LoggerFactory.getLogger(StartupLoggerRunner.class);
        Logger consoleLogger = (Logger) LoggerFactory.getLogger("PORTFOLIO_STARTUP_CONSOLE");
        ListAppender<ILoggingEvent> applicationAppender = new ListAppender<>();
        ListAppender<ILoggingEvent> consoleAppender = new ListAppender<>();
        applicationAppender.start();
        consoleAppender.start();
        applicationLogger.addAppender(applicationAppender);
        consoleLogger.addAppender(consoleAppender);

        try {
            runner.run(new DefaultApplicationArguments(new String[0]));
        } finally {
            applicationLogger.detachAppender(applicationAppender);
            consoleLogger.detachAppender(consoleAppender);
        }

        verify(jdbcTemplate).queryForObject("SELECT 1", Integer.class);
        assertThat(applicationAppender.list)
                .extracting(ILoggingEvent::getFormattedMessage)
                .anyMatch(message -> message.contains("event=application.started")
                        && message.contains("dbStatus=정상"));
        assertThat(consoleAppender.list)
                .extracting(ILoggingEvent::getFormattedMessage)
                .contains("[Portfolio Backend Started]", "DB 연결 상태: 정상");
    }
}
