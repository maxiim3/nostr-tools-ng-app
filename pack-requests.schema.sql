CREATE TABLE pack_requests (
  requester_pubkey TEXT PRIMARY KEY,
  requester_npub TEXT NOT NULL,
  display_name TEXT NOT NULL,
  image_url TEXT,
  created TEXT NOT NULL,
  updated TEXT NOT NULL,
  status TEXT NOT NULL
);
