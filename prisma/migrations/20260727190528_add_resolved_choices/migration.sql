-- AlterTable
ALTER TABLE "SaveState" ADD COLUMN     "resolvedChoices" JSONB NOT NULL DEFAULT '{}';
