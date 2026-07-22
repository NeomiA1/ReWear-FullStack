using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class DonationBagDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_CREATE_DONATION_BAG =
            "sp_CreateDonationBag";

        private const string SP_GET_DONATION_BAGS_BY_USER_ID =
            "sp_GetDonationBagsByUserId";

        private const string SP_UPDATE_DONATION_BAG_STATUS =
            "sp_UpdateDonationBagStatus";


        public void CreateDonationBag(DonationBag bag)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        {
                            "@user_id",
                            bag.UserId
                        },
                        {
                            "@short_description",
                            (object?)bag.ShortDescription ?? DBNull.Value
                        },
                        {
                            "@sizes",
                            (object?)bag.Sizes ?? DBNull.Value
                        },
                        {
                            "@target_ages",
                            (object?)bag.TargetAges ?? DBNull.Value
                        },
                        {
                            "@target_gender",
                            (object?)bag.TargetGender ?? DBNull.Value
                        },
                        {
                            "@clothes_condition",
                            (object?)bag.ClothesCondition ?? DBNull.Value
                        }
                    };

                    SqlCommand cmd = CreateCommand(
                        SP_CREATE_DONATION_BAG,
                        con,
                        paramDic
                    );

                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }


        public List<DonationBag> GetDonationBagsByUserId(int userId)
        {
            List<DonationBag> bags = new List<DonationBag>();

            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                var paramDic = new Dictionary<string, object>
                {
                    {
                        "@user_id",
                        userId
                    }
                };

                SqlCommand cmd = CreateCommand(
                    SP_GET_DONATION_BAGS_BY_USER_ID,
                    con,
                    paramDic
                );

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        DonationBag bag = new DonationBag();

                        bag.BagId =
                            Convert.ToInt32(reader["bag_id"]);

                        bag.UserId =
                            Convert.ToInt32(reader["user_id"]);

                        bag.ShortDescription =
                            reader["short_description"] == DBNull.Value
                                ? null
                                : reader["short_description"].ToString();

                        bag.Sizes =
                            reader["sizes"] == DBNull.Value
                                ? null
                                : reader["sizes"].ToString();

                        bag.TargetAges =
                            reader["target_ages"] == DBNull.Value
                                ? null
                                : reader["target_ages"].ToString();

                        bag.TargetGender =
                            reader["target_gender"] == DBNull.Value
                                ? null
                                : reader["target_gender"].ToString();

                        bag.ClothesCondition =
                            reader["clothes_condition"] == DBNull.Value
                                ? null
                                : reader["clothes_condition"].ToString();

                        bag.AssignedAssociationId =
                            reader["assigned_association_id"] == DBNull.Value
                                ? null
                                : Convert.ToInt32(
                                    reader["assigned_association_id"]
                                );

                        bag.DonationStatus =
                            reader["donation_status"] == DBNull.Value
                                ? "Draft"
                                : reader["donation_status"].ToString()!;

                        bag.CreatedAt =
                            Convert.ToDateTime(reader["created_at"]);

                        bags.Add(bag);
                    }
                }
            }

            return bags;
        }


        public void UpdateDonationBagStatus(
            int bagId,
            string donationStatus
        )
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        {
                            "@bag_id",
                            bagId
                        },
                        {
                            "@donation_status",
                            donationStatus
                        }
                    };

                    SqlCommand cmd = CreateCommand(
                        SP_UPDATE_DONATION_BAG_STATUS,
                        con,
                        paramDic
                    );

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