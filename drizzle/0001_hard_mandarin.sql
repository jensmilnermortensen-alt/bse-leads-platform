CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`website` varchar(255),
	`location` varchar(255) NOT NULL,
	`country` varchar(100) NOT NULL,
	`region` enum('Denmark','Germany','Sweden','Norway','EMEA','Other') NOT NULL,
	`companySize` enum('1-10','11-50','51-120','121-500','500+','Unknown') DEFAULT 'Unknown',
	`fundingStage` enum('Pre-Seed','Seed','Series A','Series B','Series C+','Growth','Public','Unknown') NOT NULL,
	`industry` enum('Academia','Agro/Foodtech','Bio-industrial','Biotech','Health Tech','Healthcare','Medical Devices','Pharmaceuticals','VC/PE/Fund','Other') NOT NULL,
	`category` enum('Biotech','MedTech','HealthTech','Pharma','Other') NOT NULL,
	`totalFundingAmount` decimal(12,2),
	`fundingCurrency` varchar(10) DEFAULT 'EUR',
	`latestFundingDate` timestamp,
	`latestFundingRound` varchar(100),
	`latestFundingAmount` decimal(12,2),
	`leadStatus` enum('New','Contacted','Qualified','Disqualified') DEFAULT 'New',
	`leadNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`position` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`linkedinUrl` varchar(255),
	`decisionMaker` boolean DEFAULT false,
	`hiringResponsible` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qualifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`status` enum('New','Contacted','Qualified','Disqualified') NOT NULL,
	`notes` text,
	`contactedDate` timestamp,
	`qualifiedDate` timestamp,
	`disqualifiedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qualifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`jobTitle` varchar(255) NOT NULL,
	`description` text,
	`department` varchar(100),
	`industry` enum('Academia','Agro/Foodtech','Bio-industrial','Biotech','Health Tech','Healthcare','Medical Devices','Pharmaceuticals','VC/PE/Fund','Other') NOT NULL,
	`category` enum('Biotech','MedTech','HealthTech','Pharma','Other') NOT NULL,
	`requiredSkills` text,
	`experienceLevel` enum('Entry','Mid','Senior','Lead','Executive','Unknown') DEFAULT 'Unknown',
	`hiringManagerId` int,
	`hiringManagerName` varchar(255),
	`hiringManagerEmail` varchar(320),
	`status` enum('Open','In Progress','Filled','On Hold','Unknown') DEFAULT 'Open',
	`postedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
);
