-- Phase A: ALTER sp_RegisterUser to return the newly created user row.
-- Run once against RewearDB on Azure.

CREATE OR ALTER PROCEDURE [dbo].[sp_RegisterUser]
    @full_name     NVARCHAR(100),
    @username      NVARCHAR(100),
    @user_password NVARCHAR(255),
    @email         NVARCHAR(100),
    @phone         NVARCHAR(20)  = NULL,
    @location      NVARCHAR(100) = NULL,
    @signup_method NVARCHAR(50),
    @user_type     NVARCHAR(30)  = 'Private'
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Users WHERE email = @email)
    BEGIN
        RAISERROR('Email already exists.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM Users WHERE username = @username)
    BEGIN
        RAISERROR('Username already exists.', 16, 1);
        RETURN;
    END

    INSERT INTO Users (
        full_name, username, user_password, email,
        phone, location, signup_method, user_type
    )
    VALUES (
        @full_name, @username, @user_password, @email,
        @phone, @location, @signup_method, @user_type
    );

    DECLARE @newUserId INT = SCOPE_IDENTITY();

    SELECT
        user_id,
        full_name,
        username,
        email,
        phone,
        location,
        signup_method,
        user_type,
        default_pickup_address
    FROM Users
    WHERE user_id = @newUserId;
END;
GO
