CREATE TABLE "in_app_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "in_app_notifications"
    ADD CONSTRAINT "in_app_notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "in_app_notifications_userId_idx" ON "in_app_notifications"("userId");
CREATE INDEX "in_app_notifications_userId_read_idx" ON "in_app_notifications"("userId", "read");
