using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class DonationRequestDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_CREATE_DONATION_REQUEST = "sp_CreateDonationRequest";
        private const string SP_LINK_BAG_TO_DONATION_REQUEST = "sp_LinkBagToDonationRequest";
        private const string SP_RESPOND_DONATION_REQUEST = "sp_RespondDonationRequest";
        private const string SP_GET_BY_ASSOCIATION = "sp_GetDonationRequestsByAssociation";

        public List<UserDonationRequestDto> GetByUserId(int userId)
        {
            var results = new List<UserDonationRequestDto>();

            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT dr.request_id, dr.request_status, dr.request_date,
                           dr.delivery_type, dr.association_response,
                           a.association_name,
                           db.bag_id, db.sizes, db.target_gender,
                           db.clothes_condition, db.short_description
                    FROM DonationRequests dr
                    INNER JOIN Associations a
                        ON dr.association_id = a.association_id
                    INNER JOIN DonationRequestBags drb
                        ON dr.request_id = drb.request_id
                    INNER JOIN DonationBags db
                        ON drb.bag_id = db.bag_id
                    WHERE dr.user_id = @user_id
                    ORDER BY dr.request_date DESC", con))
                {
                    cmd.Parameters.AddWithValue("@user_id", userId);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            results.Add(new UserDonationRequestDto
                            {
                                RequestId           = Convert.ToInt32(reader["request_id"]),
                                RequestStatus       = reader["request_status"].ToString()!,
                                RequestDate         = Convert.ToDateTime(reader["request_date"]),
                                DeliveryType        = reader["delivery_type"].ToString()!,
                                AssociationResponse = reader["association_response"] == DBNull.Value
                                                          ? null : reader["association_response"].ToString(),
                                AssociationName     = reader["association_name"].ToString()!,
                                BagId               = Convert.ToInt32(reader["bag_id"]),
                                Sizes               = reader["sizes"] == DBNull.Value
                                                          ? null : reader["sizes"].ToString(),
                                TargetGender        = reader["target_gender"] == DBNull.Value
                                                          ? null : reader["target_gender"].ToString(),
                                ClothesCondition    = reader["clothes_condition"] == DBNull.Value
                                                          ? null : reader["clothes_condition"].ToString(),
                                ShortDescription    = reader["short_description"] == DBNull.Value
                                                          ? null : reader["short_description"].ToString(),
                            });
                        }
                    }
                }
            }

            return results;
        }

        public int CreateDonationRequest(DonationRequest request)
        {
            try
            {
            
              using (SqlConnection con = Connect(CON_STR_NAME))
              {
                  var paramDic = new Dictionary<string, object>
                    {
                         { "@user_id", request.UserId },
                         { "@association_id", request.AssociationId },
                         { "@delivery_type", request.DeliveryMethod },
                         { "@contact_phone", (object?)request.ContactPhone ?? DBNull.Value },
                         { "@pickup_address", (object?)request.PickupAddress ?? DBNull.Value }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_CREATE_DONATION_REQUEST,
                    con,
                    paramDic
                );

                object? result = cmd.ExecuteScalar();

                if (result == null || result == DBNull.Value)
                {
                    throw new Exception(
                        "Donation request was not created."
                    );
                }

                return Convert.ToInt32(result);
            }
        }


        public void LinkBagToDonationRequest(
            int requestId,
            int bagId
        )
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@request_id",
                            requestId
                        },
                        {
                            "@bag_id",
                            bagId
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_LINK_BAG_TO_DONATION_REQUEST,
                    con,
                    paramDic
                );

                cmd.ExecuteNonQuery();
            }
        }

        public List<DonationRequestDto> GetByAssociationUserId(int userId)
        {
            var results = new List<DonationRequestDto>();

            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                // resolve user_id → association_id
                int associationId;
                using (SqlCommand lookup = new SqlCommand(
                    "SELECT association_id FROM Associations WHERE user_id = @uid", con))
                {
                    lookup.Parameters.AddWithValue("@uid", userId);
                    object? raw = lookup.ExecuteScalar();
                    if (raw == null || raw == DBNull.Value)
                        return results;
                    associationId = Convert.ToInt32(raw);
                }

                var paramDic = new Dictionary<string, object>
                {
                    { "@association_id", associationId }
                };

                SqlCommand cmd = CreateCommand(SP_GET_BY_ASSOCIATION, con, paramDic);

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        results.Add(new DonationRequestDto
                        {
                            RequestId           = Convert.ToInt32(reader["request_id"]),
                            UserId              = Convert.ToInt32(reader["user_id"]),
                            AssociationId       = Convert.ToInt32(reader["association_id"]),
                            RequestDate         = Convert.ToDateTime(reader["request_date"]),
                            DeliveryType        = reader["delivery_type"].ToString()!,
                            RequestStatus       = reader["request_status"].ToString()!,
                            AssociationResponse = reader["association_response"] == DBNull.Value
                                                      ? null : reader["association_response"].ToString(),
                            ResponseDate        = reader["response_date"] == DBNull.Value
                                                      ? null : Convert.ToDateTime(reader["response_date"]),
                            BagId               = Convert.ToInt32(reader["bag_id"]),
                            ShortDescription    = reader["short_description"] == DBNull.Value
                                                      ? null : reader["short_description"].ToString(),
                            Sizes               = reader["sizes"] == DBNull.Value
                                                      ? null : reader["sizes"].ToString(),
                            TargetAges          = reader["target_ages"] == DBNull.Value
                                                      ? null : reader["target_ages"].ToString(),
                            TargetGender        = reader["target_gender"] == DBNull.Value
                                                      ? null : reader["target_gender"].ToString(),
                            ClothesCondition    = reader["clothes_condition"] == DBNull.Value
                                                      ? null : reader["clothes_condition"].ToString(),
                            BagCreatedAt        = Convert.ToDateTime(reader["bag_created_at"]),
                            DonorName           = reader["donor_name"].ToString()!,
                            DonorEmail          = reader["donor_email"].ToString()!,
                            DonorPhone          = reader["donor_phone"] == DBNull.Value
                                                      ? null : reader["donor_phone"].ToString(),
                        });
                    }
                }
            }

            return results;
        }


        public void RespondToDonationRequest(
            int requestId,
            string newStatus,
            string? associationResponse
        )
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@request_id",
                            requestId
                        },
                        {
                            "@new_status",
                            newStatus
                        },
                        {
                            "@association_response",
                            (object?)associationResponse
                            ?? DBNull.Value
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_RESPOND_DONATION_REQUEST,
                    con,
                    paramDic
                );

                cmd.ExecuteNonQuery();
            }
        }
    }
}