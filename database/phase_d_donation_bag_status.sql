USE [REWEAR_DB];
GO

/*
Phase D - Donation bag lifecycle status
Adds a controlled status field to DonationBags
and updates the related stored procedures.
*/

IF COL_LENGTH('dbo.DonationBags', 'status') IS NULL
BEGIN
    ALTER TABLE dbo.DonationBags
    ADD [status] NVARCHAR(50) NOT NULL
        CONSTRAINT DF_DonationBags_Status DEFAULT N'Draft';
END
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE [name] = 'CK_DonationBags_Status'
)
BEGIN
    ALTER TABLE dbo.DonationBags
    ADD CONSTRAINT CK_DonationBags_Status CHECK
    (
        [status] IN
        (
            N'Draft',
            N'Published',
            N'WaitingForAssociation',
            N'Accepted',
            N'Rejected',
            N'PickupScheduled',
            N'Completed'
        )
    );
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_CreateDonationBag
    @user_id INT,
    @short_description NVARCHAR(500) = NULL,
    @sizes NVARCHAR(100) = NULL,
    @target_ages NVARCHAR(100) = NULL,
    @target_gender NVARCHAR(50) = NULL,
    @clothes_condition NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.Users
        WHERE user_id = @user_id
    )
    BEGIN
        THROW 50001, 'User does not exist.', 1;
    END

    INSERT INTO dbo.DonationBags
    (
        user_id,
        short_description,
        sizes,
        target_ages,
        target_gender,
        clothes_condition,
        [status]
    )
    VALUES
    (
        @user_id,
        @short_description,
        @sizes,
        @target_ages,
        @target_gender,
        @clothes_condition,
        N'Draft'
    );
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_GetDonationBagsByUserId
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        bag_id,
        user_id,
        short_description,
        sizes,
        target_ages,
        target_gender,
        clothes_condition,
        [status],
        created_at
    FROM dbo.DonationBags
    WHERE user_id = @user_id
    ORDER BY created_at DESC;
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_UpdateDonationBagStatus
    @bag_id INT,
    @status NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF @status NOT IN
    (
        N'Draft',
        N'Published',
        N'WaitingForAssociation',
        N'Accepted',
        N'Rejected',
        N'PickupScheduled',
        N'Completed'
    )
    BEGIN
        THROW 50002, 'Invalid donation bag status.', 1;
    END

    UPDATE dbo.DonationBags
    SET [status] = @status
    WHERE bag_id = @bag_id;

    IF @@ROWCOUNT = 0
    BEGIN
        THROW 50003, 'Donation bag does not exist.', 1;
    END
END
GO