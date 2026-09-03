FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /workspace

COPY gradle ./gradle
COPY gradlew build.gradle settings.gradle ./
RUN bash ./gradlew --no-daemon dependencies

COPY src/main ./src/main
RUN bash ./gradlew --no-daemon bootJar

FROM eclipse-temurin:21-jre-jammy AS runtime

WORKDIR /app
ENV TZ=Asia/Seoul \
    FILE_STORAGE_ROOT=/app/storage \
    LOG_PATH=/app/logs \
    JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Seoul -Dfile.encoding=UTF-8"

RUN groupadd --system --gid 10001 portfolio \
    && useradd --system --uid 10001 --gid portfolio --home-dir /app --shell /usr/sbin/nologin portfolio \
    && mkdir -p /app/storage /app/logs \
    && chown -R portfolio:portfolio /app

COPY --from=builder --chown=portfolio:portfolio /workspace/build/libs/*.jar /app/app.jar

USER portfolio

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
