PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE pack_requests (
    requester_pubkey TEXT PRIMARY KEY,
    requester_npub TEXT NOT NULL,
    display_name TEXT NOT NULL,
    image_url TEXT,
    question_id TEXT NOT NULL,
    choice_id TEXT NOT NULL,
    created TEXT NOT NULL,
    updated TEXT NOT NULL,
    status TEXT NOT NULL
  );
INSERT INTO pack_requests VALUES('15a1989c2c483f6c6f18f2dda1033897a003669f449fc2fda4fa2fb6c9210900','npub1zkse38pvfqlkcmcc7tw6zqecj7sqxe5lgj0u9ldylghmdjfppyqqtsa4du','Maxime','https://blossom.primal.net/02310daf1aabe89205590b0b3ea2ec070a616b8eab45ed38b231bc67cdc42165.jpg','2026-04-20T19:45:09.396Z','2026-04-20T19:53:54.750Z','approved');
COMMIT;
