FROM rust:1.77-alpine AS builder
WORKDIR /app
RUN apk add --no-cache musl-dev
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM alpine:latest AS runner
WORKDIR /app
COPY --from=builder /app/target/release/gamification .
EXPOSE 8081
CMD ["./gamification"]