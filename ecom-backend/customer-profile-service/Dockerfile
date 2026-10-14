FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8088
USER 10001
ENTRYPOINT ["java", "-jar", "app.jar"]
