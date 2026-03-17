ALTER TABLE `companies`
  ADD COLUMN `bullhornId` varchar(50),
  ADD COLUMN `bullhornSyncedAt` timestamp;

ALTER TABLE `contacts`
  ADD COLUMN `bullhornId` varchar(50),
  ADD COLUMN `bullhornSyncedAt` timestamp;
