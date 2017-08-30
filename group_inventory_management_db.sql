-- phpMyAdmin SQL Dump
-- version 4.5.3.1
-- http://www.phpmyadmin.net
--
-- Host: group-inventory-management-db.cu8hvhstcity.us-west-2.rds.amazonaws.com:3306
-- Generation Time: Dec 30, 2016 at 07:58 AM
-- Server version: 5.6.23-log
-- PHP Version: 5.5.38

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `group_inventory_management_db`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `appendItem` (IN `itemName` VARCHAR(50), IN `itemTypeName` VARCHAR(20), IN `containerName` VARCHAR(25), IN `amount` INT UNSIGNED, IN `itemNote` TEXT)  MODIFIES SQL DATA
    COMMENT 'increases item amount if exists in items, else adds it to items'
BEGIN
	DECLARE itemExists, itemID, itemTypeID, containerID INT DEFAULT NULL;
    # validate parameters?
    # get IDs that correspond to names specified by parameters
    SELECT it.`ItemTypeID` INTO itemTypeID FROM `item_types` it WHERE it.`ItemTypeName` = itemTypeName;
    SELECT c.`ContainerID` INTO containerID FROM `containers` c WHERE c.`ContainerName` = containerName;
    # check that item specified by parameters actually exists in items
	# TODO: Find more efficient way of doing the below
   SELECT i.`ItemID` INTO itemID FROM `items` i WHERE 
    	i.`ItemName` = itemName AND
		i.`ItemTypeID` = itemTypeID AND
		i.`ContainerID` = containerID;
	SELECT (itemID IS NOT NULL) INTO itemExists;
	IF itemExists THEN
    	UPDATE `items` i SET i.`ItemAmount` = i.`ItemAmount` + amount WHERE i.`ItemID` = itemID;
	ELSE 
    	INSERT INTO `items`(`ItemName`,`ItemTypeID`,`ContainerID`,`ItemAmount`,`ItemNote`) VALUES (itemName, itemTypeID, containerID, amount, itemNote);
    END IF;
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `createContainerRecordForID` (IN `containerID` INT)  MODIFIES SQL DATA
    DETERMINISTIC
    COMMENT 'creates container record for given containerID'
BEGIN
	# declare variables
    DECLARE containerName VARCHAR(25);
    DECLARE locationName TEXT;
    # fetch ContainerName
    SELECT getContainerNameFromID(containerID) into containerName;
    # fetch LocationName
    SELECT getLocationNameFromContID(containerID) into locationName;
    # push record to container_records
    INSERT INTO container_records(ContainerID,
                                  ContainerName,
                                  LocationName,
                                  ContainerRecordInfo)
		VALUES(containerID,
               containerName,
               locationName,
               concat("Container named ",
                      containerName,
                      " added to location named ",
                      locationName)
		);
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `createItemRecordForID` (IN `itemID` INT UNSIGNED)  MODIFIES SQL DATA
    COMMENT 'adds item record for item specified by itemID'
BEGIN
	# get itemName
	DECLARE itemName VARCHAR(50);
    SELECT getItemNameFromID(itemID) INTO itemName;
	# insert record
	INSERT INTO item_records(ItemName, ItemTypeName, ContainerID, ItemRecordInfo, ItemAmount)
    	VALUES (itemName,
                getItemTypeNameFromItemID(itemID),
                getContainerIDFromItemID(itemID),
                concat("new supply of ",
                       itemName,
                       " added to container"),
                getItemAmountFromID(itemID)
		);
                
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `createTimeIntervals` (IN `startTime` TIME, IN `endTime` TIME, IN `minutes` INT UNSIGNED)  MODIFIES SQL DATA
    COMMENT 'fills availability_intervals with intervals '
BEGIN
	# initialize variable
    DECLARE intervalStart,intervalEnd TIME DEFAULT startTime;
    # enforce minutes positive, and minutes divide 60
    IF ((minutes > 0) && (60 % minutes = 0)) THEN
		SELECT intervalStart,intervalEnd;
		# while intervalEnd "is before" endTime
        WHILE time_to_sec(intervalEnd) < time_to_sec(endTime) DO
        	# set intervalEnd minutes after intervalStart
            SET intervalEnd = date_add(time(intervalStart), INTERVAL minutes MINUTE);
            # write [intervalStart, intervalEnd] to availability_intervals
            INSERT INTO `availability_intervals`(
                `AvailailityIntervalStart`, `AvailabilityIntervalEnd`)
                SELECT intervalStart, intervalEnd FROM DUAL
                	WHERE NOT EXISTS (SELECT * FROM `availability_intervals`
						WHERE `AvailailityIntervalStart` = intervalStart
						AND `AvailabilityIntervalEnd` = intervalEnd);
            # set intervalStart to intervalEnd
            SET intervalStart = intervalEnd;
		END WHILE;
	ELSE
    	SELECT "invalid minutes specified", minutes, 60 % minutes, startTime, endTime;
    END IF;
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `emptyTable` (IN `tblName` TEXT)  MODIFIES SQL DATA
    DETERMINISTIC
BEGIN
	# declare variables here
    DECLARE cleanTable, resetTblCounter TEXT;
	# prepare statements for emptying table and resetting AUTO_INCREMENT
    SET @cleanTable := concat("DELETE FROM ", tblName);
    SET @resetTblCounter := concat("ALTER TABLE ", tblName, " AUTO_INCREMENT = 1");
    PREPARE cleanTblStmt FROM @cleanTable;
    PREPARE resetCounterStmt FROM @resetTblCounter;
    # execute statements
    EXECUTE cleanTblStmt;
    EXECUTE resetCounterStmt;
	# free memory
    DEALLOCATE PREPARE cleanTblStmt;
    DEALLOCATE PREPARE resetCounterStmt;
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `initContainerRecords` ()  MODIFIES SQL DATA
    COMMENT 'fills container_records with records on current containers'
BEGIN
	# declare variables
    DECLARE containerRecordsCount, currentContainerID INT;
    DECLARE done INT DEFAULT false;
    DECLARE currentContainerName VARCHAR(25);
    # declare cursor
    DECLARE containerIDCursor CURSOR FOR SELECT ContainerID FROM containers;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    # check container_records for records
    SELECT count(*) INTO containerRecordsCount FROM container_records;
    # if container_records is empty
    IF containerRecordsCount = 0 THEN
    	# open cursor
        OPEN containerIDCursor;
    	# fill container_records with records
        write_record: LOOP
        	FETCH containerIDCursor INTO currentContainerID;
        	IF done THEN
            	LEAVE write_record;
        	END IF;
            SELECT getContainerNameFromID(currentContainerID) INTO currentContainerName;
            CALL createContainerRecordForID(currentContainerID);
        END LOOP;
        # close cursor
        CLOSE containerIDCursor;
	END IF;
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `initItemRecords` ()  MODIFIES SQL DATA
    COMMENT 'if item_records is empty, fills it with records on current items'
BEGIN
	# declare variables
    DECLARE itemRecordsCount, currentItemID INT;
    DECLARE done INT DEFAULT 0;
    DECLARE currentItemName VARCHAR(50);
    # declare cursor
	DECLARE itemIDCursor CURSOR FOR SELECT ItemID FROM items;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    # check item_records for rows
    SELECT count(*) INTO itemRecordsCount FROM item_records;
    # if item_records is not empty
	IF itemRecordsCount = 0 THEN
        # open cursor
        OPEN itemIDCursor;
		write_record : LOOP
        	FETCH itemIDCursor INTO currentItemID;
            IF done THEN
            	LEAVE write_record;
			END IF;
            # get currentItemName (so that we're not wasting overhead)
            SELECT getItemNameFromID(currentItemID) INTO currentItemName;
            # write record using that ID
            CALL createItemRecordForID(currentItemID);
        END LOOP;
        # close cursor
        CLOSE itemIDCursor;
	END IF;

END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `markRoutine` (IN `routineName` VARCHAR(64), IN `routineType` ENUM('PROCEDURE','FUNCTION'), IN `attributesToMark` SET('IS_EMPTY','HAS_MOCKS','MISSING_LOGIC','NEEDS_TESTING','NEEDS_REFACTORING'), IN `yesOrNo` ENUM('Yes','No'))  MODIFIES SQL DATA
    DETERMINISTIC
    COMMENT 'marks multiple attributes of a routine'
BEGIN
	# declare any variables here
    DECLARE routineID INT;
    # search for routine in routine_todo_list with specified routineName,routineType
    SELECT r.RoutineID INTO routineID FROM routine_todo_list r WHERE
    	r.RoutineName = routineName AND r.RoutineType = routineType;
    # if it doesn't exist
    	# create it
	# for every attribute to select
    	# mark it yesOrNo in routine_todo_list

END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `markRoutineDone` (IN `routineName` VARCHAR(64), IN `routineType` ENUM('PROCEDURE','FUNCTION'))  MODIFIES SQL DATA
    DETERMINISTIC
    COMMENT 'marks routine done in routine_todo_list'
BEGIN
	# declare variables
    DECLARE routineID INT;
    # search for routine named routineName in routine_todo_list
    SELECT r.RoutineID INTO routineID FROM routine_todo_list r WHERE
    	r.RoutineName = routineName AND r.RoutineType = routineType;
     # routine has no mocks
	CALL markRoutineNoMocks(routineName, routineType);
	# routine is not empty
    CALL markRoutineNotEmpty(routineName, routineType);
   	# routine is not missing logic
	CALL markRoutineNotMissingLogic(routineName, routineType);
	# routine needs no testing
	CALL markRoutineTestingDone(routineName, routineType);
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `markRoutineNoMocks` (IN `routineName` VARCHAR(64), IN `routineType` ENUM('PROCEDURE','FUNCTION'))  MODIFIES SQL DATA
    DETERMINISTIC
BEGIN
	# declare any variables
    DECLARE routineID INT;
    # attempt to find routine in table 
    SELECT r.RoutineID INTO routineID FROM routine_todo_list r WHERE
    	r.RoutineName = routineName AND r.RoutineType = routineType;
    # if not found, create it
    IF routineID IS NULL THEN
    	INSERT INTO routine_todo_list(RoutineName, RoutineType, RoutineHasMocks) VALUES
        	(routineName, routineType, 'No');
    # otherwise
    ELSE
    	# modify column
        UPDATE routine_todo_list r SET r.RoutineHasMocks = 'No' WHERE
        	r.RoutineName = routineName AND r.RoutineType = routineType;
	END IF;
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `markRoutineNotEmpty` (IN `routineName` VARCHAR(64), IN `routineType` ENUM('PROCEDURE','FUNCTION'))  MODIFIES SQL DATA
    DETERMINISTIC
    COMMENT 'pushes routine to table, if not there already, marks not empty'
BEGIN
	# declare any variables
    DECLARE routineID INT;
    # attempt to find routine in table 
    SELECT r.RoutineID INTO routineID FROM routine_todo_list r WHERE
    	r.RoutineName = routineName AND r.RoutineType = routineType;
    # if not found, create it
    IF routineID IS NULL THEN
    	#SELECT "routine not found";
    	INSERT INTO routine_todo_list(RoutineName, RoutineType, RoutineIsEmpty)
        		VALUES (routineName,
                        routineType,
                        'No');
    # otherwise
    ELSE 
    	#SELECT concat(routineName, " found") AS "routine found";
    	# modify column
        UPDATE routine_todo_list r SET r.RoutineIsEmpty = 'No'
        	WHERE r.RoutineName = routineName AND 
            	r.RoutineType = routineType;
	END IF;
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `markRoutineNotMissingLogic` (IN `routineName` VARCHAR(64), IN `routineType` ENUM('PROCEDURE','FUNCTION'))  MODIFIES SQL DATA
    DETERMINISTIC
BEGIN
	# declare any variables
    DECLARE routineID INT;
    # attempt to find routine in table 
    SELECT r.RoutineID INTO routineID FROM routine_todo_list r WHERE
    	r.RoutineName = routineName AND r.RoutineType = routineType;
    # if not found, create it
    IF routineID IS NULL THEN
    	INSERT INTO routine_todo_list(RoutineName,
                                      RoutineType,
                                      RoutineIsEmpty,
                                      RoutineIsMissingLogic)
        	VALUES(routineName, 
                   routineType, 
                   'No',
                   'No');
    # otherwise
    ELSE
    	# modify column
        UPDATE routine_todo_list r SET r.RoutineIsMissingLogic = 'No', r.RoutineIsEmpty = 'No' WHERE
        	r.RoutineName = routineName AND r.RoutineType = routineType;
	END IF;
    CALL markRoutineNotEmpty(routineName, routineType);
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `markRoutineTestingDone` (IN `routineName` VARCHAR(64), IN `routineType` ENUM('PROCEDURE','FUNCTION'))  MODIFIES SQL DATA
    DETERMINISTIC
BEGIN
	# declare any variables
    DECLARE routineID INT;
    # attempt to find routine in table 
    SELECT r.RoutineID INTO routineID FROM routine_todo_list r WHERE
    	r.RoutineName = routineName AND r.RoutineType = routineType;
    # if not found, create it
    IF routineID IS NULL THEN
    	INSERT INTO routine_todo_list(RoutineName, RoutineType, RoutineNeedsTesting)
        		VALUES (routineName,
                        routineType,
                        'No');
    # otherwise
    ELSE 
    	# modify column
        UPDATE routine_todo_list r SET r.RoutineNeedsTesting = 'No'
        	WHERE r.RoutineName = routineName AND 
            	r.RoutineType = routineType;
	END IF;
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `populateRoutineTODOList` ()  MODIFIES SQL DATA
    COMMENT 'assumes all routines empty and populates routine_todo_list '
BEGIN
	# declare all variables here
    DECLARE currentRoutineName varchar(64);
	DECLARE currentRoutineType enum('PROCEDURE', 'FUNCTION');
    DECLARE currentRoutineID INT;
    DECLARE namesDone INT DEFAULT 0;
    # get all routines for this database
    DECLARE routineNames CURSOR FOR 
    	SELECT routine_name FROM information_schema.routines WHERE
        	routine_schema = "group_inventory_management_db" AND
            routine_name != "populateRoutineTODOList";
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET namesDone = TRUE;
    # open cursor
    OPEN routineNames;
    # for each routineName
	a_loop : LOOP
		FETCH routineNames INTO currentRoutineName;
		IF namesDone THEN LEAVE a_loop; END IF;
        # fetch routine_type
        SELECT routine_type INTO currentRoutineType FROM information_schema.routines
        	WHERE routine_schema = "group_inventory_management_db" AND
            	routine_name = currentRoutineName;
		# check routine_todo_list for currentRoutineName
        # TODO: Side-step the handler by dumping this into stored function
        SELECT getRoutineIDForName(currentRoutineName) INTO currentRoutineID;
		# if it isn't found
        IF currentRoutineID IS NULL THEN
        	# test line
            SELECT currentRoutineName;
            # write entry to routine_todo_list
            INSERT INTO routine_todo_list(RoutineName, RoutineType) VALUES
                (currentRoutineName,
                 currentRoutineType);
		END IF;
	END LOOP;
	# close cursor
    CLOSE routineNames;
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `smartRemove` (IN `itemName` VARCHAR(50), IN `amount` INT)  MODIFIES SQL DATA
    COMMENT 'checks items for an item, and decreases amount or removes it'
BEGIN
	DECLARE itemExists,availableAmount INT;
    # make sure amount specified is nonnegative
	IF amount >= 0 THEN
	# make sure item specified by itemName actually exists in items
		SELECT count(`ItemID`) INTO itemExists FROM `items` WHERE `ItemName` = itemName;
        IF itemExists THEN
        	# fetch availableAmount from `items`
            SELECT `ItemAmount` INTO availableAmount FROM `items` WHERE `itemName` = itemName;
            # if amount is greater than, or equal to, availableAmount
            IF (amount >= availableAmount) THEN
            	# remove item
             	DELETE FROM `items` WHERE `ItemName` = itemName;
            # else decrease item amount
            ELSE
            	UPDATE `items` SET `ItemAmount` = availableAmount - amount WHERE `ItemName` = itemName;
            END IF;
        END IF;
		
	END IF;
END$$

CREATE DEFINER=`HeadAdmin`@`%` PROCEDURE `testProcedure` ()  READS SQL DATA
BEGIN
	# declare variables
    DECLARE tableName,tableColumn TEXT;
	#...aaaannndddd action!
    # try pulling referenced column data from item.ItemID
    SELECT referenced_table_name, referenced_column_name FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE table_name = 'items' AND column_name = 'ItemTypeID';
	#SELECT tableName, tableColumn;
END$$

--
-- Functions
--
CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `condAttachNewLineTo` (`txt` TEXT, `attachMode` ENUM('PREPEND','APPEND')) RETURNS TEXT CHARSET utf8 COLLATE utf8_bin NO SQL
    DETERMINISTIC
    COMMENT 'attaches  ''\\n'' to specified text if it is not empty'
BEGIN
	IF txt = "" OR txt IS NULL THEN RETURN ""; END IF;
	IF attachMode = 'PREPEND' THEN
    	RETURN concat('\n', txt);
		#RETURN "prepending";
        END IF;
    RETURN concat(txt, '\n');
	#return "appending";
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `containerChangeToString` (`oldContainerName` VARCHAR(25), `oldContainerDescription` TEXT, `oldContainerLocationID` INT, `newContainerName` VARCHAR(25), `newContainerDescription` TEXT, `newContainerLocation` INT) RETURNS TEXT CHARSET utf8 COLLATE utf8_bin READS SQL DATA
    DETERMINISTIC
    COMMENT 'returns text outlining any and all changes to container'
BEGIN
	# declare variables
	DECLARE message TEXT;
    SELECT condAttachNewLineTo(nameChangeToString(
        oldContainerName, newContainerName), 'APPEND') INTO message;
	return message;
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `containerNameChangeToString` (`oldContainerName` VARCHAR(25), `newContainerName` VARCHAR(25)) RETURNS TEXT CHARSET utf8 COLLATE utf8_bin NO SQL
    DETERMINISTIC
    COMMENT 'compares two containerNames, returns string about change'
BEGIN
	# if the two containerNames are the same
    IF (strcmp(oldContainerName, newContainerName) = 0) THEN
    	# there is no change made here. return empty string
		return "";
	END IF;
	return concat("Container name changed from ",
                  oldContainerName,
                  " to ", 
                  newContainerName);
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `getContainerIDFromItemID` (`itemID` INT UNSIGNED) RETURNS INT(11) READS SQL DATA
    COMMENT 'returns ID of container that contains item specified by itemID'
BEGIN
	# declare variable
    DECLARE contID INT;
    # do SELECTion INTO it
    SELECT i.ContainerID INTO contID FROM items i WHERE i.ItemID = itemID;
	# return it
    RETURN contID;
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `getContainerNameFromID` (`containerID` INT) RETURNS VARCHAR(25) CHARSET utf8 COLLATE utf8_bin READS SQL DATA
    DETERMINISTIC
    COMMENT 'gets ContainerName given ContainerID'
BEGIN
	# declare variable to return
    DECLARE contName VARCHAR(25);
    # get container name
    SELECT c.ContainerName INTO contName FROM containers c WHERE c.ContainerID = containerID;
    # return it
    RETURN contName;
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `getItemAmountFromID` (`itemID` INT UNSIGNED) RETURNS INT(11) READS SQL DATA
    DETERMINISTIC
    COMMENT 'gets amount of item specified by itemID'
BEGIN
	# declare variable
    DECLARE amount INT;
    # do SELECTion INTO it
    SELECT i.ItemAmount INTO amount FROM items i WHERE i.ItemID = itemID;
	# return it
    RETURN amount;
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `getItemNameFromID` (`itemID` INT UNSIGNED) RETURNS VARCHAR(50) CHARSET utf8 COLLATE utf8_bin READS SQL DATA
    DETERMINISTIC
    COMMENT 'gets itemName, given itemID'
BEGIN
	# declare variable
    DECLARE name VARCHAR(50);
    SELECT i.ItemName INTO name FROM items i WHERE i.ItemID = itemID;
    RETURN name;
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `getItemTypeNameFromID` (`itemTypeID` INT) RETURNS VARCHAR(20) CHARSET utf8 COLLATE utf8_bin READS SQL DATA
    DETERMINISTIC
    COMMENT 'for a specified ItemTypeID, returns ItemTypeName'
BEGIN
	#declare variable
    DECLARE itemType VARCHAR(20);
	SELECT it.ItemTypeName INTO itemType FROM item_types it WHERE it.ItemTypeID = itemTypeID;
	RETURN itemType;
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `getItemTypeNameFromItemID` (`itemID` INT) RETURNS VARCHAR(20) CHARSET utf8 COLLATE utf8_bin READS SQL DATA
    DETERMINISTIC
    COMMENT 'gets ItemTypeName for an item specified by ItemID'
BEGIN
	# declare variable
	DECLARE itemTypeName VARCHAR(20);
	# peform selection
	SELECT it.ItemTypeName INTO itemTypeName FROM item_types it WHERE
    	it.ItemTypeID = (SELECT i.ItemTypeID FROM items i WHERE i.ItemID = itemID);
	# return result
	return itemTypeName;
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `getLocationAddressFromContID` (`containerID` INT) RETURNS TEXT CHARSET utf8 COLLATE utf8_bin READS SQL DATA
    DETERMINISTIC
    COMMENT 'returns LocationAddress for specified containerID'
BEGIN
	# declare variables
    DECLARE locAddress TEXT;
    # do the selection
    SELECT l.LocationAddress INTO locAddress FROM locations l WHERE 
    	l.LocationID = (SELECT c.ContainerLocation FROM containers c WHERE c.ContainerID  = containerID);
	RETURN locAddress;
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `getLocationNameFromContID` (`containerID` INT) RETURNS TEXT CHARSET utf8 COLLATE utf8_bin READS SQL DATA
    DETERMINISTIC
    COMMENT 'returns LocationName for a given ContainerID'
BEGIN
	# declare variables
    DECLARE locName TEXT;
    # do the selection
    SELECT l.LocationName INTO locName FROM locations l WHERE 
    	l.LocationID = (SELECT c.ContainerLocation FROM containers c WHERE c.ContainerID  = containerID);
	RETURN locName;
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `getRoutineIDForName` (`routineName` VARCHAR(64)) RETURNS INT(11) READS SQL DATA
    DETERMINISTIC
    COMMENT 'this exists simply to attempt sidestepping the handler'
BEGIN
	DECLARE routineID INT;
	SELECT r.RoutineID INTO routineID FROM routine_todo_list r
        	WHERE r.RoutineName = routineName;
	return routineID;
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `itemAmountChangeToString` (`oldItemAmount` INT, `newItemAmount` INT) RETURNS TEXT CHARSET utf8 COLLATE utf8_bin NO SQL
    DETERMINISTIC
    COMMENT 'forms string explaining any change in item amounts'
BEGIN
	# declare variable
    DECLARE itemChange INT;
    # determine change in item amount
    SET itemChange = newItemAmount - oldItemAmount;
    # if there was no change, we're done
    IF !itemChange THEN return ""; END IF;
    # return string explaining whether there was loss, or gain, and by how much
    return concat(
    	if(itemChange > 0, "added ", "removed "),
    	abs(itemChange),
    	" items ",
        if(itemChange > 0, "to", "from"),
        " container");
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `itemContainerChangeToString` (`oldContainerID` INT, `newContainerID` INT) RETURNS TEXT CHARSET utf8 COLLATE utf8_bin NO SQL
    DETERMINISTIC
    COMMENT 'returns text outlining any and all changes to item''s container'
BEGIN
	return "blank mock";
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `itemNameChangeToString` (`oldItemName` VARCHAR(50), `newItemName` VARCHAR(50)) RETURNS TEXT CHARSET utf8 COLLATE utf8_bin NO SQL
    DETERMINISTIC
    COMMENT 'forms string for if an item''s name changed'
BEGIN
	# declare variables
    DECLARE stringCompare INT;
    # compare strings
    SELECT strcmp(oldItemName, newItemName) INTO stringCompare;
    # if they are the same, we're done here
    IF stringCompare = 0 THEN return ""; END IF;
    # return text explaining the change
   	return concat("Item name changed from ", oldItemName, " to ", 	
                  newItemName, "");
END$$

CREATE DEFINER=`HeadAdmin`@`%` FUNCTION `nameChangeToString` (`nameType` TEXT, `oldName` VARCHAR(50), `newName` VARCHAR(50)) RETURNS TEXT CHARSET utf8 COLLATE utf8_bin NO SQL
    DETERMINISTIC
    COMMENT 'returns text outlining change to name'
BEGIN
	# define variables here
    DECLARE message TEXT;
    # if oldName,newName identical
    if strcmp(oldName, newName) = 0 THEN
    	# return empty string b/c no change happened
        return "";
	end if;
    # form message
	SELECT concat(concat(
        			left(nameType,1), 
        			lower(substring(nameType,2))),
                  " name changed from ",
                  oldName,
                  " to ",
                  newName) INTO message;
	# test line
	IF message IS NULL THEN RETURN "null message"; end if;
    # return message
	return message;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `availability_intervals`
--

CREATE TABLE `availability_intervals` (
  `AvailabilityIntervalID` int(11) NOT NULL,
  `AvailailityIntervalStart` time NOT NULL DEFAULT '12:00:00',
  `AvailabilityIntervalEnd` time NOT NULL DEFAULT '12:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `availability_intervals`
--

INSERT INTO `availability_intervals` (`AvailabilityIntervalID`, `AvailailityIntervalStart`, `AvailabilityIntervalEnd`) VALUES
(1, '09:00:00', '09:15:00'),
(2, '09:15:00', '09:30:00'),
(3, '09:30:00', '09:45:00'),
(4, '09:45:00', '10:00:00'),
(5, '10:00:00', '10:15:00'),
(6, '10:15:00', '10:30:00'),
(7, '10:30:00', '10:45:00'),
(8, '10:45:00', '11:00:00'),
(9, '11:00:00', '11:15:00'),
(10, '11:15:00', '11:30:00'),
(11, '11:30:00', '11:45:00'),
(12, '11:45:00', '12:00:00'),
(13, '12:00:00', '12:15:00'),
(14, '12:15:00', '12:30:00'),
(15, '12:30:00', '12:45:00'),
(16, '12:45:00', '13:00:00'),
(17, '13:00:00', '13:15:00'),
(18, '13:15:00', '13:30:00'),
(19, '13:30:00', '13:45:00'),
(20, '13:45:00', '14:00:00'),
(21, '14:00:00', '14:15:00'),
(22, '14:15:00', '14:30:00'),
(23, '14:30:00', '14:45:00'),
(24, '14:45:00', '15:00:00'),
(25, '15:00:00', '15:15:00'),
(26, '15:15:00', '15:30:00'),
(27, '15:30:00', '15:45:00'),
(28, '15:45:00', '16:00:00'),
(29, '16:00:00', '16:15:00'),
(30, '16:15:00', '16:30:00'),
(31, '16:30:00', '16:45:00'),
(32, '16:45:00', '17:00:00'),
(33, '17:00:00', '17:15:00'),
(34, '17:15:00', '17:30:00'),
(35, '17:30:00', '17:45:00'),
(36, '17:45:00', '18:00:00'),
(37, '18:00:00', '18:15:00'),
(38, '18:15:00', '18:30:00'),
(39, '18:30:00', '18:45:00'),
(40, '18:45:00', '19:00:00'),
(41, '19:00:00', '19:15:00'),
(42, '19:15:00', '19:30:00'),
(43, '19:30:00', '19:45:00'),
(44, '19:45:00', '20:00:00'),
(45, '20:00:00', '20:15:00'),
(46, '20:15:00', '20:30:00'),
(47, '20:30:00', '20:45:00'),
(48, '20:45:00', '21:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `containers`
--

CREATE TABLE `containers` (
  `ContainerID` int(11) NOT NULL,
  `ContainerName` varchar(25) COLLATE utf8_bin NOT NULL,
  `ContainerDescription` text COLLATE utf8_bin NOT NULL,
  `ContainerLocation` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `containers`
--

INSERT INTO `containers` (`ContainerID`, `ContainerName`, `ContainerDescription`, `ContainerLocation`) VALUES
(1, 'Skid 1', 'First Skid', 1),
(2, 'Skid 2', 'Second skid', 1),
(3, 'Skid 3', 'Third skid', 2),
(4, 'Gaylord 1', 'after_container_insert test', 2);

--
-- Triggers `containers`
--
DELIMITER $$
CREATE TRIGGER `after_container_insert` AFTER INSERT ON `containers` FOR EACH ROW BEGIN
	# declare variable (for optimization's sake)
	DECLARE locationName text;
    # select the name of the location of that container into variable
    SELECT getLocationNameFromContID(new.ContainerID) INTO locationName;
    # insert record into container_records
	INSERT INTO container_records(ContainerID, ContainerName, LocationName, ContainerRecordInfo) VALUES
        (new.ContainerID,
         new.ContainerName,
         locationName,
         concat("Container named ",
                new.ContainerName,
                " added to location named ",
                locationName)
        );
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_container_update` AFTER UPDATE ON `containers` FOR EACH ROW BEGIN
	# declare any variables
    DECLARE containerLog TEXT;
    # create containerLog
	SELECT containerChangeToString(old.ContainerName,
                                  old.ContainerDescription,
                                  old.ContainerLocation,
                                  new.ContainerName,
                                  new.ContainerDescription,
                                  new.ContainerLocation) INTO containerLog;
	# push record to container_records
    INSERT INTO container_records(ContainerID, 
                                  ContainerName,
                                  LocationName, 
                                  ContainerRecordInfo)
		VALUES (new.ContainerID,
                new.ContainerName,
                getLocationNameFromContID(new.ContainerID),
                containerLog);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `container_records`
--

CREATE TABLE `container_records` (
  `ContainerRecordID` int(11) NOT NULL,
  `ContainerID` int(10) UNSIGNED NOT NULL,
  `ContainerName` varchar(25) COLLATE utf8_bin NOT NULL,
  `LocationName` text COLLATE utf8_bin NOT NULL,
  `ContainerRecordInfo` text COLLATE utf8_bin NOT NULL,
  `ContainerRecordTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `container_records`
--

INSERT INTO `container_records` (`ContainerRecordID`, `ContainerID`, `ContainerName`, `LocationName`, `ContainerRecordInfo`, `ContainerRecordTime`) VALUES
(1, 1, 'Skid 1', 'Inventory', 'Container named Skid 1 added to location named Inventory', '2016-05-21 18:33:34'),
(2, 2, 'Skid 2', 'Inventory', 'Container named Skid 2 added to location named Inventory', '2016-05-21 18:33:34'),
(3, 3, 'Skid 3', 'Inbound 1', 'Container named Skid 3 added to location named Inbound 1', '2016-05-21 18:33:34'),
(4, 4, 'Gaylord 1', 'Inbound 1', 'Container named Gaylord 1 added to location named Inbound 1', '2016-05-21 18:33:34');

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `GroupID` int(11) NOT NULL,
  `GroupName` text COLLATE utf8_bin NOT NULL,
  `GroupDescription` text COLLATE utf8_bin
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Table structure for table `group_availability`
--

CREATE TABLE `group_availability` (
  `GroupAvailabilityID` int(11) NOT NULL,
  `GroupMemberRecordID` int(11) NOT NULL,
  `AvailabilityIntervalID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Table structure for table `group_members`
--

CREATE TABLE `group_members` (
  `GroupMemberID` int(11) NOT NULL,
  `GroupMemberFirstName` varchar(25) COLLATE utf8_bin NOT NULL,
  `GroupMemberLastName` varchar(25) COLLATE utf8_bin NOT NULL,
  `GroupMemberEMail` varchar(60) COLLATE utf8_bin NOT NULL,
  `GroupMemberPassword` text COLLATE utf8_bin NOT NULL,
  `GroupMemberSalt` text COLLATE utf8_bin NOT NULL,
  `GroupMemberRoleID` int(11) NOT NULL,
  `GroupMemberGradYear` int(4) NOT NULL DEFAULT '2020',
  `GroupMemberJoinDate` date DEFAULT NULL,
  `GroupMemberPhoneNumber` varchar(35) COLLATE utf8_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `group_members`
--

INSERT INTO `group_members` (`GroupMemberID`, `GroupMemberFirstName`, `GroupMemberLastName`, `GroupMemberEMail`, `GroupMemberPassword`, `GroupMemberSalt`, `GroupMemberRoleID`, `GroupMemberGradYear`, `GroupMemberJoinDate`, `GroupMemberPhoneNumber`) VALUES
(7, 'Joe', 'Smith', 'jsmith@mail.com', 'SomeRandomPassword', 'something', 8, 2020, '2016-01-14', NULL),
(8, 'Sam', 'Hill', 'shill@gmail.com', 'AnotherPassword', 'SomeRoadSalt', 7, 2020, '2016-01-14', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `group_member_records`
--

CREATE TABLE `group_member_records` (
  `GroupMemberRecordID` int(11) NOT NULL,
  `GroupID` int(11) NOT NULL,
  `GroupMemberID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Table structure for table `group_member_roles`
--

CREATE TABLE `group_member_roles` (
  `GroupMemberRoleID` int(11) NOT NULL,
  `GroupMemberRoleName` varchar(25) COLLATE utf8_bin NOT NULL,
  `GroupMemberRoleInventoryAccess` tinyint(1) NOT NULL DEFAULT '0',
  `GroupMemberRoleIsAdmin` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `group_member_roles`
--

INSERT INTO `group_member_roles` (`GroupMemberRoleID`, `GroupMemberRoleName`, `GroupMemberRoleInventoryAccess`, `GroupMemberRoleIsAdmin`) VALUES
(1, 'President', 1, 1),
(2, 'Vice President', 1, 1),
(3, 'Treasurer', 1, 0),
(4, 'Outreach Director', 0, 0),
(5, 'Resource Provider', 1, 0),
(7, 'AnotherDummyRole', 0, 0),
(8, 'Default', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `ItemID` int(11) NOT NULL,
  `ItemName` varchar(50) COLLATE utf8_bin NOT NULL,
  `ItemTypeID` int(11) NOT NULL,
  `ContainerID` int(11) NOT NULL,
  `ItemAmount` int(11) NOT NULL,
  `ItemNote` text COLLATE utf8_bin,
  `ItemTallier` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`ItemID`, `ItemName`, `ItemTypeID`, `ContainerID`, `ItemAmount`, `ItemNote`, `ItemTallier`) VALUES
(1, 'Books', 1, 1, 601, 'a', NULL),
(2, 'Books', 1, 2, 360, 'b', NULL),
(3, 'Books ', 1, 3, 3500, NULL, NULL),
(4, 'Cards', 2, 3, 300, NULL, NULL),
(7, 'DELETE FROM container_records', 1, 1, 501, 'fuck you, admin', NULL);

--
-- Triggers `items`
--
DELIMITER $$
CREATE TRIGGER `after_item_delete` AFTER DELETE ON `items` FOR EACH ROW INSERT INTO item_records(ItemName, ItemTypeName, ContainerID, ContainerName, LocationName, ItemRecordInfo, ItemAmount) 
    VALUES (old.ItemName, 
            getItemTypeNameFromID(old.ItemTypeID), 
            old.ContainerID,
            getContainerNameFromID(old.ContainerID),
            getLocationNameFromContID(old.ContainerID),
            'item removed', 
            0)
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_item_insert` AFTER INSERT ON `items` FOR EACH ROW INSERT INTO item_records(ItemName, ItemTypeName, ContainerID, ContainerName, LocationName, ItemRecordInfo, ItemAmount) 
    VALUES (new.ItemName, 
            getItemTypeNameFromID(new.ItemTypeID), 
            new.ContainerID,
            getContainerNameFromID(new.ContainerID),
            getLocationNameFromContID(new.ContainerID),
            concat("new supply of ", new.ItemName, " added to container"),
            new.ItemAmount)
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_item_update` AFTER UPDATE ON `items` FOR EACH ROW BEGIN
	/*DECLARE net INT DEFAULT (new.ItemAmount - old.ItemAmount);
	IF net != 0 THEN
    	INSERT INTO item_records(ItemName) VALUES('Mok');
    END IF;
	INSERT INTO item_records(ItemName) VALUES('Mock');
    */
    # declare necessary variables here
    DECLARE itemLog TEXT;
    # form message underlining any changes made to item being UPDATEd
	SELECT concat(condAttachNewLineTo(
			itemNameChangeToString(old.ItemName, new.ItemName), 
        	'APPEND'),
		condAttachNewLineTo(
            itemAmountChangeToString(old.ItemAmount, new.ItemAmount),
            'APPEND'))
		INTO itemLog;
	# insert record of that item, along with message, in item_records table
    INSERT INTO item_records(ItemName, ItemTypeName, ContainerID, ContainerName, LocationName, ItemAmount, ItemRecordInfo) VALUES 
    	(new.ItemName,
         getItemTypeNameFromID(new.ItemTypeID),
         new.ContainerID,
         getContainerNameFromID(new.ContainerID),
         getLocationNameFromContID(new.ContainerID),
         new.ItemAmount,
         itemLog);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `item_container_history_view`
--
CREATE TABLE `item_container_history_view` (
`ItemName` varchar(50)
,`ItemTypeName` varchar(20)
,`ContainerName` varchar(25)
,`LocationName` text
,`ContainerRecordInfo` text
,`ItemAmount` int(11)
,`ItemRecordInfo` text
);

-- --------------------------------------------------------

--
-- Table structure for table `item_records`
--

CREATE TABLE `item_records` (
  `ItemRecordID` int(11) NOT NULL,
  `ItemName` varchar(50) COLLATE utf8_bin NOT NULL,
  `ItemTypeName` varchar(20) COLLATE utf8_bin NOT NULL,
  `ContainerID` int(10) UNSIGNED NOT NULL,
  `ContainerName` varchar(25) COLLATE utf8_bin NOT NULL,
  `LocationName` text COLLATE utf8_bin NOT NULL,
  `ItemAmount` int(11) NOT NULL,
  `ItemRecordInfo` text COLLATE utf8_bin NOT NULL,
  `ItemRecordTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `item_records`
--

INSERT INTO `item_records` (`ItemRecordID`, `ItemName`, `ItemTypeName`, `ContainerID`, `ContainerName`, `LocationName`, `ItemAmount`, `ItemRecordInfo`, `ItemRecordTime`) VALUES
(1, 'Books', 'Book', 1, '', '', 601, 'new supply of Books added to container', '2016-05-23 03:16:56'),
(2, 'Books', 'Book', 2, '', '', 360, 'new supply of Books added to container', '2016-05-23 03:16:56'),
(3, 'Books ', 'Book', 3, '', '', 3500, 'new supply of Books  added to container', '2016-05-23 03:16:56'),
(4, 'DELETE FROM container_records', 'Book', 1, '', '', 501, 'new supply of DELETE FROM container_records added to container', '2016-05-23 03:16:56'),
(5, 'Cards', 'Card deck', 3, '', '', 300, 'new supply of Cards added to container', '2016-05-23 03:16:56');

-- --------------------------------------------------------

--
-- Table structure for table `item_types`
--

CREATE TABLE `item_types` (
  `ItemTypeID` int(11) NOT NULL,
  `ItemTypeName` varchar(20) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `item_types`
--

INSERT INTO `item_types` (`ItemTypeID`, `ItemTypeName`) VALUES
(1, 'Book'),
(2, 'Card deck');

-- --------------------------------------------------------

--
-- Stand-in structure for view `item_view`
--
CREATE TABLE `item_view` (
`ItemName` varchar(50)
,`ItemTypeName` varchar(20)
,`ContainerName` varchar(25)
,`ItemAmount` int(11)
,`LocationName` text
);

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `LocationID` int(11) NOT NULL,
  `LocationName` text COLLATE utf8_bin NOT NULL,
  `LocationAddress` text COLLATE utf8_bin
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='to be used primarily with containers, not group_members';

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`LocationID`, `LocationName`, `LocationAddress`) VALUES
(1, 'Inventory', '2522 East Sample Street'),
(2, 'Inbound 1', '2522 East Sample Street');

-- --------------------------------------------------------

--
-- Table structure for table `routine_todo_list`
--

CREATE TABLE `routine_todo_list` (
  `RoutineID` int(11) NOT NULL,
  `RoutineName` varchar(64) COLLATE utf8_bin NOT NULL,
  `RoutineType` enum('PROCEDURE','FUNCTION') COLLATE utf8_bin NOT NULL,
  `RoutineHasMocks` enum('Yes','No') COLLATE utf8_bin NOT NULL DEFAULT 'Yes',
  `RoutineIsEmpty` enum('Yes','No') COLLATE utf8_bin NOT NULL DEFAULT 'Yes',
  `RoutineIsMissingLogic` enum('Yes','No') COLLATE utf8_bin NOT NULL DEFAULT 'Yes',
  `RoutineNeedsTesting` enum('Yes','No') COLLATE utf8_bin NOT NULL DEFAULT 'Yes',
  `RoutineNeedsRefactoring` enum('Yes','No') COLLATE utf8_bin NOT NULL DEFAULT 'No',
  `RoutineNotes` text COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `routine_todo_list`
--

INSERT INTO `routine_todo_list` (`RoutineID`, `RoutineName`, `RoutineType`, `RoutineHasMocks`, `RoutineIsEmpty`, `RoutineIsMissingLogic`, `RoutineNeedsTesting`, `RoutineNeedsRefactoring`, `RoutineNotes`) VALUES
(1, 'appendItem', 'PROCEDURE', 'No', 'No', 'Yes', 'No', 'Yes', 'TODO stubs on line 7: "Find more efficient way of doing the below"'),
(2, 'condAttachNewLineTo', 'FUNCTION', 'No', 'No', 'No', 'No', 'No', ''),
(3, 'containerChangeToString', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(4, 'containerNameChangeToString', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(5, 'createContainerRecordForID', 'PROCEDURE', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(6, 'createItemRecordForID', 'PROCEDURE', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(7, 'createTimeIntervals', 'PROCEDURE', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(8, 'emptyTable', 'PROCEDURE', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(9, 'getContainerIDFromItemID', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(10, 'getContainerNameFromID', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(11, 'getItemAmountFromID', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(12, 'getItemNameFromID', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(13, 'getItemTypeNameFromID', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(14, 'getItemTypeNameFromItemID', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(15, 'getLocationAddressFromContID', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(16, 'getLocationNameFromContID', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(17, 'initContainerRecords', 'PROCEDURE', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(18, 'initItemRecords', 'PROCEDURE', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(19, 'itemAmountChangeToString', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(20, 'itemContainerChangeToString', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(21, 'itemNameChangeToString', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(22, 'nameChangeToString', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(23, 'smartRemove', 'PROCEDURE', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(24, 'testProcedure', 'PROCEDURE', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(25, 'getRoutineIDForName', 'FUNCTION', 'Yes', 'Yes', 'Yes', 'Yes', 'No', ''),
(26, 'markRoutineDone', 'PROCEDURE', 'No', 'No', 'Yes', 'Yes', 'Yes', 'once you figure out operations on sets, make this function work on a set, so as to reduce overhead and repetition of logic.\n\nAlso, this routine\'s last helper routine, markRoutineTestingDone(), doesn\'t seem to be getting called.\n\n\nEnsure routine specified by routineName,routineType actually exists as routine in information_schema.routines'),
(27, 'markRoutineNotEmpty', 'PROCEDURE', 'No', 'No', 'Yes', 'Yes', 'Yes', '\nEnsure routine specified by routineName,routineType actually exists as routine in information_schema.routines'),
(28, 'markRoutineNoMocks', 'PROCEDURE', 'No', 'No', 'No', 'No', 'Yes', '\nEnsure routine specified by routineName,routineType actually exists as routine in information_schema.routines'),
(29, 'markRoutineNotMissingLogic', 'PROCEDURE', 'No', 'No', 'No', 'Yes', 'Yes', '\nEnsure routine specified by routineName,routineType actually exists as routine in information_schema.routines'),
(30, 'markRoutine', 'PROCEDURE', 'Yes', 'No', 'Yes', 'Yes', 'Yes', '\nEnsure routine specified by routineName,routineType actually exists as routine in information_schema.routines'),
(31, 'markRoutineTestingDone', 'PROCEDURE', 'No', 'No', 'No', 'No', 'Yes', '\nEnsure routine specified by routineName,routineType actually exists as routine in information_schema.routines');

-- --------------------------------------------------------

--
-- Structure for view `item_container_history_view`
--
DROP TABLE IF EXISTS `item_container_history_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`HeadAdmin`@`%` SQL SECURITY DEFINER VIEW `item_container_history_view`  AS  select `ir`.`ItemName` AS `ItemName`,`ir`.`ItemTypeName` AS `ItemTypeName`,`cr`.`ContainerName` AS `ContainerName`,`cr`.`LocationName` AS `LocationName`,`cr`.`ContainerRecordInfo` AS `ContainerRecordInfo`,`ir`.`ItemAmount` AS `ItemAmount`,`ir`.`ItemRecordInfo` AS `ItemRecordInfo` from (`item_records` `ir` join `container_records` `cr` on((`ir`.`ContainerID` = `cr`.`ContainerID`))) ;

-- --------------------------------------------------------

--
-- Structure for view `item_view`
--
DROP TABLE IF EXISTS `item_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`HeadAdmin`@`%` SQL SECURITY DEFINER VIEW `item_view`  AS  select `i`.`ItemName` AS `ItemName`,`it`.`ItemTypeName` AS `ItemTypeName`,`c`.`ContainerName` AS `ContainerName`,`i`.`ItemAmount` AS `ItemAmount`,`l`.`LocationName` AS `LocationName` from (((`items` `i` join `containers` `c` on((`i`.`ContainerID` = `c`.`ContainerID`))) join `locations` `l` on((`c`.`ContainerLocation` = `l`.`LocationID`))) join `item_types` `it` on((`i`.`ItemTypeID` = `it`.`ItemTypeID`))) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `availability_intervals`
--
ALTER TABLE `availability_intervals`
  ADD PRIMARY KEY (`AvailabilityIntervalID`);

--
-- Indexes for table `containers`
--
ALTER TABLE `containers`
  ADD PRIMARY KEY (`ContainerID`),
  ADD UNIQUE KEY `unique_container_info` (`ContainerName`,`ContainerLocation`),
  ADD KEY `LocationIndex` (`ContainerLocation`);

--
-- Indexes for table `container_records`
--
ALTER TABLE `container_records`
  ADD PRIMARY KEY (`ContainerRecordID`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`GroupID`);

--
-- Indexes for table `group_availability`
--
ALTER TABLE `group_availability`
  ADD PRIMARY KEY (`GroupAvailabilityID`),
  ADD KEY `GroupMemberID` (`GroupMemberRecordID`),
  ADD KEY `AvailabilityIntervalID` (`AvailabilityIntervalID`);

--
-- Indexes for table `group_members`
--
ALTER TABLE `group_members`
  ADD PRIMARY KEY (`GroupMemberID`),
  ADD KEY `GroupMemberRoleIDIndex` (`GroupMemberRoleID`);

--
-- Indexes for table `group_member_records`
--
ALTER TABLE `group_member_records`
  ADD PRIMARY KEY (`GroupMemberRecordID`),
  ADD KEY `GroupID` (`GroupID`),
  ADD KEY `GroupMemberID` (`GroupMemberID`);

--
-- Indexes for table `group_member_roles`
--
ALTER TABLE `group_member_roles`
  ADD PRIMARY KEY (`GroupMemberRoleID`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`ItemID`),
  ADD KEY `ItemTypeIndex` (`ItemTypeID`),
  ADD KEY `ContainerIndex` (`ContainerID`),
  ADD KEY `ItemTallierIndex` (`ItemTallier`);

--
-- Indexes for table `item_records`
--
ALTER TABLE `item_records`
  ADD PRIMARY KEY (`ItemRecordID`);

--
-- Indexes for table `item_types`
--
ALTER TABLE `item_types`
  ADD PRIMARY KEY (`ItemTypeID`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`LocationID`);

--
-- Indexes for table `routine_todo_list`
--
ALTER TABLE `routine_todo_list`
  ADD PRIMARY KEY (`RoutineID`),
  ADD UNIQUE KEY `unique_routine` (`RoutineName`,`RoutineType`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `availability_intervals`
--
ALTER TABLE `availability_intervals`
  MODIFY `AvailabilityIntervalID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;
--
-- AUTO_INCREMENT for table `containers`
--
ALTER TABLE `containers`
  MODIFY `ContainerID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `container_records`
--
ALTER TABLE `container_records`
  MODIFY `ContainerRecordID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `GroupID` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `group_availability`
--
ALTER TABLE `group_availability`
  MODIFY `GroupAvailabilityID` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `group_members`
--
ALTER TABLE `group_members`
  MODIFY `GroupMemberID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `group_member_records`
--
ALTER TABLE `group_member_records`
  MODIFY `GroupMemberRecordID` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `group_member_roles`
--
ALTER TABLE `group_member_roles`
  MODIFY `GroupMemberRoleID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `ItemID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `item_records`
--
ALTER TABLE `item_records`
  MODIFY `ItemRecordID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT for table `item_types`
--
ALTER TABLE `item_types`
  MODIFY `ItemTypeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `LocationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `routine_todo_list`
--
ALTER TABLE `routine_todo_list`
  MODIFY `RoutineID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `containers`
--
ALTER TABLE `containers`
  ADD CONSTRAINT `containers_ibfk_1` FOREIGN KEY (`ContainerLocation`) REFERENCES `locations` (`LocationID`) ON UPDATE CASCADE;

--
-- Constraints for table `group_availability`
--
ALTER TABLE `group_availability`
  ADD CONSTRAINT `group_availability_ibfk_1` FOREIGN KEY (`GroupMemberRecordID`) REFERENCES `group_member_records` (`GroupMemberRecordID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `group_availability_ibfk_2` FOREIGN KEY (`AvailabilityIntervalID`) REFERENCES `availability_intervals` (`AvailabilityIntervalID`) ON UPDATE CASCADE;

--
-- Constraints for table `group_members`
--
ALTER TABLE `group_members`
  ADD CONSTRAINT `GroupMemberRoleIDFK` FOREIGN KEY (`GroupMemberRoleID`) REFERENCES `group_member_roles` (`GroupMemberRoleID`) ON UPDATE CASCADE;

--
-- Constraints for table `group_member_records`
--
ALTER TABLE `group_member_records`
  ADD CONSTRAINT `group_member_records_ibfk_1` FOREIGN KEY (`GroupID`) REFERENCES `groups` (`GroupID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `group_member_records_ibfk_2` FOREIGN KEY (`GroupMemberID`) REFERENCES `group_members` (`GroupMemberID`) ON UPDATE CASCADE;

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `items_ibfk_1` FOREIGN KEY (`ItemTypeID`) REFERENCES `item_types` (`ItemTypeID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `items_ibfk_2` FOREIGN KEY (`ContainerID`) REFERENCES `containers` (`ContainerID`) ON UPDATE CASCADE,
  ADD CONSTRAINT `items_ibfk_3` FOREIGN KEY (`ItemTallier`) REFERENCES `group_members` (`GroupMemberID`) ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
