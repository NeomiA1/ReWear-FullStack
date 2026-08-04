using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class DonationBagDAL : DBServices
    {
        private const string CON_STR_NAME =
            "RewearDB";

        private const string SP_CREATE_DONATION_BAG =
            "sp_CreateDonationBag";

        private const string SP_GET_DONATION_BAGS_BY_USER_ID =
            "sp_GetDonationBagsByUserId";

        private const string SP_UPDATE_DONATION_BAG_STATUS =
            "sp_UpdateDonationBagStatus";

        private const string SP_DELETE_DONATION_BAG =
            "sp_DeleteDonationBag";


        public void CreateDonationBag(DonationBag bag)
        {
            using (SqlConnection con =
                   Connect(CON_STR_NAME))
            {
                var paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@user_id",
                            bag.UserId
                        },
                        {
                            "@short_description",
                            (object?)bag.ShortDescription
                            ?? DBNull.Value
                        },
                        {
    "@item_count",
    bag.ItemCount
},
                        {
                            "@sizes",
                            (object?)bag.Sizes
                            ?? DBNull.Value
                        },
                        {
                            "@target_ages",
                            (object?)bag.TargetAges
                            ?? DBNull.Value
                        },
                        {
                            "@target_gender",
                            (object?)bag.TargetGender
                            ?? DBNull.Value
                        },
                        {
                            "@clothes_condition",
                            (object?)bag.ClothesCondition
                            ?? DBNull.Value
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


        public List<DonationBag> GetDonationBagsByUserId(
    int userId,
    string? size = null,
    string? status = null
)
        {
            List<DonationBag> bags =
                new List<DonationBag>();

            using (SqlConnection con =
                   Connect(CON_STR_NAME))
            {
                var paramDic =
    new Dictionary<string, object>
    {
        {
            "@user_id",
            userId
        },
        {
            "@size",
            string.IsNullOrWhiteSpace(size)
                ? DBNull.Value
                : size.Trim()
        },
        {
            "@status",
            string.IsNullOrWhiteSpace(status)
                ? DBNull.Value
                : status.Trim()
        }
    };

                SqlCommand cmd = CreateCommand(
                    SP_GET_DONATION_BAGS_BY_USER_ID,
                    con,
                    paramDic
                );

                using (SqlDataReader reader =
                       cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        DonationBag bag =
                            new DonationBag
                            {
                                BagId =
                                    Convert.ToInt32(
                                        reader["bag_id"]
                                    ),

                                UserId =
                                    Convert.ToInt32(
                                        reader["user_id"]
                                    ),

                                CreatorName =
                                    reader["creator_name"]
                                        == DBNull.Value
                                        ? null
                                        : reader["creator_name"]
                                            .ToString(),

                                ShortDescription =
                                    reader[
                                        "short_description"
                                    ] == DBNull.Value
                                        ? null
                                        : reader[
                                            "short_description"
                                          ].ToString(),

                                Sizes =
                                    reader["sizes"]
                                        == DBNull.Value
                                        ? null
                                        : reader["sizes"]
                                            .ToString(),
                                            ItemCount =
    Convert.ToInt32(
        reader["item_count"]
    ),

                                TargetAges =
                                    reader["target_ages"]
                                        == DBNull.Value
                                        ? null
                                        : reader[
                                            "target_ages"
                                          ].ToString(),

                                TargetGender =
                                    reader["target_gender"]
                                        == DBNull.Value
                                        ? null
                                        : reader[
                                            "target_gender"
                                          ].ToString(),

                                ClothesCondition =
                                    reader[
                                        "clothes_condition"
                                    ] == DBNull.Value
                                        ? null
                                        : reader[
                                            "clothes_condition"
                                          ].ToString(),

                                AssignedAssociationId =
                                    reader[
                                        "assigned_association_id"
                                    ] == DBNull.Value
                                        ? null
                                        : Convert.ToInt32(
                                            reader[
                                                "assigned_association_id"
                                            ]
                                        ),

                                DonationStatus =
                                    reader[
                                        "donation_status"
                                    ] == DBNull.Value
                                        ? "Draft"
                                        : reader[
                                            "donation_status"
                                          ].ToString()!,

                                CreatedAt =
                                    Convert.ToDateTime(
                                        reader["created_at"]
                                    ),

                                UpdatedAt =
                                    Convert.ToDateTime(
                                        reader["updated_at"]
                                    )
                            };

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
            using (SqlConnection con =
                   Connect(CON_STR_NAME))
            {
                var paramDic =
                    new Dictionary<string, object>
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


        public void DeleteDonationBag(
            int bagId,
            int userId
        )
        {
            using (SqlConnection con =
                   Connect(CON_STR_NAME))
            {
                var paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@bag_id",
                            bagId
                        },
                        {
                            "@user_id",
                            userId
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_DELETE_DONATION_BAG,
                    con,
                    paramDic
                );

                cmd.ExecuteNonQuery();
            }
        }
    }
}