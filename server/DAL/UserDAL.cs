using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class UserDAL : DBServices
    {
        private const string CON_STR_NAME =
            "RewearDB";

        private const string SP_REGISTER_USER =
            "sp_RegisterUser";

        private const string SP_LOGIN_USER =
            "sp_LoginUser";

        private const string SP_GET_USER_DONATION_STATS =
            "sp_GetUserDonationStats";


        public void RegisterUser(User user)
        {
            using (SqlConnection con =
                   Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@full_name",
                            user.FullName
                        },
                        {
                            "@username",
                            user.Username
                        },
                        {
                            "@user_password",
                            user.Password
                        },
                        {
                            "@email",
                            user.Email
                        },
                        {
                            "@phone",
                            (object?)user.Phone
                            ?? DBNull.Value
                        },
                        {
                            "@location",
                            (object?)user.City
                            ?? DBNull.Value
                        },
                        {
                            "@signup_method",
                            user.RegistrationMethod
                        },
                        {
                            "@user_type",
                            user.UserType
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_REGISTER_USER,
                    con,
                    paramDic
                );

                cmd.ExecuteNonQuery();
            }
        }


        public User? LoginUser(
            string email,
            string password
        )
        {
            using (SqlConnection con =
                   Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@email",
                            email
                        },
                        {
                            "@user_password",
                            password
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_LOGIN_USER,
                    con,
                    paramDic
                );

                using (SqlDataReader reader =
                       cmd.ExecuteReader())
                {
                    if (!reader.Read())
                    {
                        return null;
                    }

                    User user = new User
                    {
                        UserId =
                            Convert.ToInt32(
                                reader["user_id"]
                            ),

                        FullName =
                            reader["full_name"]
                                .ToString(),

                        Username =
                            reader["username"]
                                .ToString(),

                        Email =
                            reader["email"]
                                .ToString(),

                        Phone =
                            reader["phone"]
                                == DBNull.Value
                                ? null
                                : reader["phone"]
                                    .ToString(),

                        City =
                            reader["location"]
                                == DBNull.Value
                                ? null
                                : reader["location"]
                                    .ToString(),

                        RegistrationMethod =
                            reader["signup_method"]
                                .ToString(),

                        UserType =
                            reader["user_type"]
                                .ToString()
                    };

                    return user;
                }
            }
        }


        public UserDonationStatsDto GetUserDonationStats(
            int userId
        )
        {
            using (SqlConnection con =
                   Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@user_id",
                            userId
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_GET_USER_DONATION_STATS,
                    con,
                    paramDic
                );

                using (SqlDataReader reader =
                       cmd.ExecuteReader())
                {
                    if (!reader.Read())
                    {
                        return new UserDonationStatsDto();
                    }

                    UserDonationStatsDto stats =
                        new UserDonationStatsDto
                        {
                            TotalDonations =
                                Convert.ToInt32(
                                    reader[
                                        "total_donations"
                                    ]
                                ),

                            CompletedDonations =
                                Convert.ToInt32(
                                    reader[
                                        "completed_donations"
                                    ]
                                ),

                            InProgressDonations =
                                Convert.ToInt32(
                                    reader[
                                        "in_progress_donations"
                                    ]
                                ),

                            RejectedDonations =
                                Convert.ToInt32(
                                    reader[
                                        "rejected_donations"
                                    ]
                                )
                        };

                    return stats;
                }
            }
        }
    }
}