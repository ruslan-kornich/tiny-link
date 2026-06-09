-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" BIGSERIAL NOT NULL,
    "owner_id" BIGINT NOT NULL,
    "code" TEXT NOT NULL,
    "long_url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "click_events" (
    "id" BIGSERIAL NOT NULL,
    "link_id" BIGINT NOT NULL,
    "job_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "day" DATE NOT NULL,
    "ip" INET NOT NULL,
    "country" TEXT,
    "device" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "referer_host" TEXT,

    CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rollup_daily" (
    "link_id" BIGINT NOT NULL,
    "day" DATE NOT NULL,
    "dimension" TEXT NOT NULL,
    "dimension_value" TEXT NOT NULL,
    "clicks" BIGINT NOT NULL DEFAULT 0,
    "unique_ips" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "rollup_daily_pkey" PRIMARY KEY ("link_id","day","dimension","dimension_value")
);

-- CreateTable
CREATE TABLE "rollup_cursor" (
    "id" INTEGER NOT NULL,
    "last_event_id" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rollup_cursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "links_code_key" ON "links"("code");

-- CreateIndex
CREATE INDEX "links_owner_id_idx" ON "links"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "click_events_job_id_key" ON "click_events"("job_id");

-- CreateIndex
CREATE INDEX "click_events_link_id_day_idx" ON "click_events"("link_id", "day");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollup_daily" ADD CONSTRAINT "rollup_daily_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "rollup_cursor" ("id", "last_event_id", "updated_at")
VALUES (1, 0, now())
ON CONFLICT ("id") DO NOTHING;
