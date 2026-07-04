-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "needsPrivacy" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdById" TEXT NOT NULL,
    "seriesId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_series" (
    "id" TEXT NOT NULL,
    "rrule" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservations_startsAt_idx" ON "reservations"("startsAt");

-- CreateIndex
CREATE INDEX "reservations_endsAt_idx" ON "reservations"("endsAt");

-- CreateIndex
CREATE INDEX "reservations_createdById_idx" ON "reservations"("createdById");

-- CreateIndex
CREATE INDEX "reservations_seriesId_idx" ON "reservations"("seriesId");

-- CreateIndex
CREATE INDEX "notification_logs_reservationId_idx" ON "notification_logs"("reservationId");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "reservation_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
