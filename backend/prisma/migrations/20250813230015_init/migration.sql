-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Admin', 'Secretaria', 'Cronometraje', 'Juez', 'Publico');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F', 'Mixed');

-- CreateEnum
CREATE TYPE "Wheel" AS ENUM ('20"', '24"', 'Cruiser');

-- CreateEnum
CREATE TYPE "RiderGender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RaceStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MotoType" AS ENUM ('M1', 'M2', 'M3', 'Final');

-- CreateEnum
CREATE TYPE "MotoStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HeatStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('OK', 'DQ', 'DNS', 'DNF');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Bolivia',
    "status" "EventStatus" NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_age" INTEGER NOT NULL,
    "max_age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "wheel" "Wheel" NOT NULL DEFAULT '20"',
    "max_riders" INTEGER NOT NULL DEFAULT 32,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riders" (
    "id" TEXT NOT NULL,
    "plate" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "club" TEXT,
    "date_of_birth" DATE NOT NULL,
    "gender" "RiderGender" NOT NULL,
    "license" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "rider_id" TEXT NOT NULL,
    "seed" INTEGER,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "races" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "round_count" INTEGER NOT NULL DEFAULT 4,
    "status" "RaceStatus" NOT NULL DEFAULT 'PENDING',
    "seed_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motos" (
    "id" TEXT NOT NULL,
    "race_id" TEXT NOT NULL,
    "order_no" INTEGER NOT NULL,
    "type" "MotoType" NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "status" "MotoStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "motos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heats" (
    "id" TEXT NOT NULL,
    "moto_id" TEXT NOT NULL,
    "heat_no" INTEGER NOT NULL,
    "status" "HeatStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "heats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heat_entries" (
    "id" TEXT NOT NULL,
    "heat_id" TEXT NOT NULL,
    "rider_id" TEXT NOT NULL,
    "gate_no" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "heat_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "heat_entry_id" TEXT NOT NULL,
    "finish_pos" INTEGER,
    "time_ms" INTEGER,
    "status" "ResultStatus" NOT NULL DEFAULT 'OK',
    "notes" TEXT,
    "recorded_by" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_table" (
    "id" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "riders_plate_key" ON "riders"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_event_id_category_id_rider_id_key" ON "registrations"("event_id", "category_id", "rider_id");

-- CreateIndex
CREATE UNIQUE INDEX "races_event_id_category_id_key" ON "races"("event_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "heat_entries_heat_id_gate_no_key" ON "heat_entries"("heat_id", "gate_no");

-- CreateIndex
CREATE UNIQUE INDEX "heat_entries_heat_id_rider_id_key" ON "heat_entries"("heat_id", "rider_id");

-- CreateIndex
CREATE UNIQUE INDEX "results_heat_entry_id_key" ON "results"("heat_entry_id");

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motos" ADD CONSTRAINT "motos_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heats" ADD CONSTRAINT "heats_moto_id_fkey" FOREIGN KEY ("moto_id") REFERENCES "motos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_entries" ADD CONSTRAINT "heat_entries_heat_id_fkey" FOREIGN KEY ("heat_id") REFERENCES "heats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_entries" ADD CONSTRAINT "heat_entries_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_heat_entry_id_fkey" FOREIGN KEY ("heat_entry_id") REFERENCES "heat_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit" ADD CONSTRAINT "audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
