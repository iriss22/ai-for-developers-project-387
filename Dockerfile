# Один образ на всё приложение: Spring Boot отдаёт API (/api/*) и собранный фронтенд
# как статику, поэтому в проде не нужны ни прокси, ни CORS.
# Сборка: docker build -t calendar .
# Запуск: docker run --rm -p 8080:8080 calendar   (порт меняется переменной PORT)

# ---------- фронтенд ----------
# версия Node та же, что в mise.toml
FROM node:24.22.2-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY frontend/ ./
RUN npm run build

# ---------- бэкенд ----------
# версия Java та же, что в mise.toml
FROM eclipse-temurin:25-jdk AS backend
WORKDIR /app/backend
COPY backend/ ./
# openapi-generator в pom.xml читает ../contract/openapi.yaml
COPY contract/openapi.yaml /app/contract/openapi.yaml
# собранный фронтенд попадает в jar как статика Spring Boot (classpath:/static)
COPY --from=frontend /app/frontend/dist src/main/resources/static
# тесты, Checkstyle и форматирование проверяет `mise run check` в CI, не сборка образа
# кеш ~/.m2 (BuildKit) переживает пересборки: зависимости не скачиваются заново
RUN --mount=type=cache,target=/root/.m2 \
  ./mvnw -B -q package -DskipTests -Dcheckstyle.skip \
  && cp target/calendar-*.jar /app/app.jar

# ---------- запуск ----------
FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system --no-create-home app
USER app
COPY --from=backend /app/app.jar app.jar
# порт берётся из PORT (server.port в application.properties), по умолчанию 8080
EXPOSE 8080
# heap в процентах от лимита контейнера: на маленьких планах хостинга памяти мало
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
