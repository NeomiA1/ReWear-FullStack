using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class UserDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_REGISTER_USER = "sp_RegisterUser";

        public void RegisterUser(User user)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@full_name", user.FullName },
                        { "@username", user.Username },
                        { "@user_password", user.Password },
                        { "@email", user.Email },
                        { "@phone", (object?)user.Phone ?? DBNull.Value },
                        { "@location", (object?)user.City ?? DBNull.Value },
                        { "@signup_method", user.RegistrationMethod },
                        { "@user_type", user.UserType }

                    };

                    SqlCommand cmd = CreateCommand(SP_REGISTER_USER, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public User? LoginUser(string email, string password)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
            {
                { "@email", email },
                { "@user_password", password }
            };

                    SqlCommand cmd = CreateCommand("sp_LoginUser", con, paramDic);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            User user = new User();

                            user.UserId = Convert.ToInt32(reader["user_id"]);
                            user.FullName = reader["full_name"].ToString();
                            user.Username = reader["username"].ToString();
                            user.Email = reader["email"].ToString();
                            user.Phone = reader["phone"] == DBNull.Value ? null : reader["phone"].ToString();
                            user.City = reader["location"] == DBNull.Value ? null : reader["location"].ToString();
                            user.RegistrationMethod = reader["signup_method"].ToString();
                            user.UserType = reader["user_type"].ToString();
                            user.DefaultPickupAddress = reader["default_pickup_address"] == DBNull.Value
                                                            ? null : reader["default_pickup_address"].ToString();

                            return user;
                        }
                    }

                    return null;
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        private const string SP_UPDATE_DEFAULT_PICKUP_ADDRESS = "sp_UpdateUserDefaultPickupAddress";

        public void UpdateDefaultPickupAddress(int userId, string? defaultPickupAddress)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@user_id", userId },
                        { "@default_pickup_address", (object?)defaultPickupAddress ?? DBNull.Value }
                    };

                    SqlCommand cmd = CreateCommand(SP_UPDATE_DEFAULT_PICKUP_ADDRESS, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}