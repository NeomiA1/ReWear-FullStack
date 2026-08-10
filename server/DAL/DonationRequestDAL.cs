using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class DonationRequestDAL : DBServices
    {
        private const string CON_STR_NAME =
            "RewearDB";

        private const string SP_SUBMIT_DONATION_REQUEST =
            "sp_SubmitDonationRequest";

        private const string SP_RESPOND_DONATION_REQUEST =
            "sp_RespondDonationRequest";

        private const string SP_GET_BY_ASSOCIATION =
            "sp_GetDonationRequestsByAssociation";

        private const string SP_OFFER_COLLECTION_TO_STORE =
            "sp_OfferCollectionToStore";

        private const string SP_RESPOND_TO_COLLECTION_OFFER =
            "sp_RespondToCollectionOffer";

        private const string SP_GET_COLLECTION_OFFERS_BY_STORE =
            "sp_GetCollectionOffersByStore";

        private const string SP_PROPOSE_PICKUP_OPTIONS =
            "sp_ProposePickupOptions";

        private const string SP_SELECT_PICKUP_OPTION =
            "sp_SelectPickupOption";

        private const string SP_MARK_DONATION_COLLECTED =
            "sp_MarkDonationCollected";


        public List<UserDonationRequestDto> GetByUserId(
            int userId
        )
        {
            List<UserDonationRequestDto> results =
                new List<UserDonationRequestDto>();

            using (
                SqlConnection con =
                    Connect(CON_STR_NAME)
            )
            {
                const string query = @"
                    SELECT
                        dr.request_id,
                        dr.request_status,
                        dr.request_date,
                        dr.delivery_type,
                        dr.association_response,
                        a.association_name,
                        db.bag_id,
                        db.sizes,
                        db.target_gender,
                        db.clothes_condition,
                        db.short_description

                    FROM dbo.DonationRequests dr

                    INNER JOIN dbo.Associations a
                        ON dr.association_id =
                           a.association_id

                    INNER JOIN dbo.DonationRequestBags drb
                        ON dr.request_id =
                           drb.request_id

                    INNER JOIN dbo.DonationBags db
                        ON drb.bag_id =
                           db.bag_id

                    WHERE dr.user_id = @user_id

                    ORDER BY dr.request_date DESC;";

                using (
                    SqlCommand cmd =
                        new SqlCommand(query, con)
                )
                {
                    cmd.Parameters.AddWithValue(
                        "@user_id",
                        userId
                    );

                    using (
                        SqlDataReader reader =
                            cmd.ExecuteReader()
                    )
                    {
                        while (reader.Read())
                        {
                            UserDonationRequestDto dto =
                                new UserDonationRequestDto
                                {
                                    RequestId =
                                        Convert.ToInt32(
                                            reader["request_id"]
                                        ),

                                    RequestStatus =
                                        reader["request_status"]
                                            .ToString()!,

                                    RequestDate =
                                        Convert.ToDateTime(
                                            reader["request_date"]
                                        ),

                                    DeliveryType =
                                        reader["delivery_type"]
                                            .ToString()!,

                                    AssociationResponse =
                                        reader[
                                            "association_response"
                                        ] == DBNull.Value
                                            ? null
                                            : reader[
                                                "association_response"
                                              ].ToString(),

                                    AssociationName =
                                        reader["association_name"]
                                            .ToString()!,

                                    BagId =
                                        Convert.ToInt32(
                                            reader["bag_id"]
                                        ),

                                    Sizes =
                                        reader["sizes"]
                                            == DBNull.Value
                                            ? null
                                            : reader["sizes"]
                                                .ToString(),

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

                                    ShortDescription =
                                        reader[
                                            "short_description"
                                        ] == DBNull.Value
                                            ? null
                                            : reader[
                                                "short_description"
                                              ].ToString()
                                };

                            results.Add(dto);
                        }
                    }
                }
            }

            return results;
        }


        public int SubmitDonationRequest(
            DonationRequest request
        )
        {
            using (
                SqlConnection con =
                    Connect(CON_STR_NAME)
            )
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@user_id",
                            request.UserId
                        },
                        {
                            "@bag_id",
                            request.BagId
                        },
                        {
                            "@association_id",
                            request.AssociationId
                        },
                        {
                            "@delivery_type",
                            request.DeliveryMethod
                        },
                        {
                            "@contact_phone",
                            (object?)request.ContactPhone
                            ?? DBNull.Value
                        },
                        {
                            "@pickup_address",
                            (object?)request.PickupAddress
                            ?? DBNull.Value
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_SUBMIT_DONATION_REQUEST,
                    con,
                    paramDic
                );

                object? result =
                    cmd.ExecuteScalar();

                if (
                    result == null
                    || result == DBNull.Value
                )
                {
                    throw new Exception(
                        "Donation request was not submitted."
                    );
                }

                return Convert.ToInt32(result);
            }
        }


        public List<DonationRequestDto>
            GetByAssociationUserId(int userId)
        {
            List<DonationRequestDto> results =
                new List<DonationRequestDto>();

            using (
                SqlConnection con =
                    Connect(CON_STR_NAME)
            )
            {
                int associationId;

                const string associationLookup = @"
                    SELECT association_id
                    FROM dbo.Associations
                    WHERE user_id = @user_id;";

                using (
                    SqlCommand lookup =
                        new SqlCommand(
                            associationLookup,
                            con
                        )
                )
                {
                    lookup.Parameters.AddWithValue(
                        "@user_id",
                        userId
                    );

                    object? raw =
                        lookup.ExecuteScalar();

                    if (
                        raw == null
                        || raw == DBNull.Value
                    )
                    {
                        return results;
                    }

                    associationId =
                        Convert.ToInt32(raw);
                }

                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@association_id",
                            associationId
                        }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_GET_BY_ASSOCIATION,
                    con,
                    paramDic
                );

                using (
                    SqlDataReader reader =
                        cmd.ExecuteReader()
                )
                {
                    while (reader.Read())
                    {
                        DonationRequestDto dto =
                            new DonationRequestDto
                            {
                                RequestId =
                                    Convert.ToInt32(
                                        reader["request_id"]
                                    ),

                                UserId =
                                    Convert.ToInt32(
                                        reader["user_id"]
                                    ),

                                AssociationId =
                                    Convert.ToInt32(
                                        reader["association_id"]
                                    ),

                                RequestDate =
                                    Convert.ToDateTime(
                                        reader["request_date"]
                                    ),

                                DeliveryType =
                                    reader["delivery_type"]
                                        .ToString()!,

                                RequestStatus =
                                    reader["request_status"]
                                        .ToString()!,

                                AssociationResponse =
                                    reader[
                                        "association_response"
                                    ] == DBNull.Value
                                        ? null
                                        : reader[
                                            "association_response"
                                          ].ToString(),

                                ResponseDate =
                                    reader["response_date"]
                                        == DBNull.Value
                                        ? null
                                        : Convert.ToDateTime(
                                            reader[
                                                "response_date"
                                            ]
                                        ),

                                BagId =
                                    Convert.ToInt32(
                                        reader["bag_id"]
                                    ),

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

                                BagCreatedAt =
                                    Convert.ToDateTime(
                                        reader["bag_created_at"]
                                    ),

                                DonorName =
                                    reader["donor_name"]
                                        .ToString()!,

                                DonorEmail =
                                    reader["donor_email"]
                                        .ToString()!,

                                DonorPhone =
                                    reader["donor_phone"]
                                        == DBNull.Value
                                        ? null
                                        : reader["donor_phone"]
                                            .ToString(),

                                CollectionMode =
                                    reader["collection_mode"]
                                        == DBNull.Value
                                        ? null
                                        : reader["collection_mode"]
                                            .ToString(),

                                AssignedStoreId =
                                    reader["assigned_store_id"]
                                        == DBNull.Value
                                        ? null
                                        : Convert.ToInt32(
                                            reader["assigned_store_id"]
                                          ),

                                AssignedStoreName =
                                    reader["assigned_store_name"]
                                        == DBNull.Value
                                        ? null
                                        : reader["assigned_store_name"]
                                            .ToString(),

                                AssignmentStatus =
                                    reader["assignment_status"]
                                        == DBNull.Value
                                        ? null
                                        : reader["assignment_status"]
                                            .ToString(),

                                ProposedPickupDays =
                                    reader["proposed_pickup_days"]
                                        == DBNull.Value
                                        ? null
                                        : reader["proposed_pickup_days"]
                                            .ToString(),

                                ProposedPickupTimes =
                                    reader["proposed_pickup_times"]
                                        == DBNull.Value
                                        ? null
                                        : reader["proposed_pickup_times"]
                                            .ToString(),

                                SelectedPickupDay =
                                    reader["selected_pickup_day"]
                                        == DBNull.Value
                                        ? null
                                        : reader["selected_pickup_day"]
                                            .ToString(),

                                SelectedPickupTime =
                                    reader["selected_pickup_time"]
                                        == DBNull.Value
                                        ? null
                                        : reader["selected_pickup_time"]
                                            .ToString(),

                                DonationStatus =
                                    reader["donation_status"]
                                        == DBNull.Value
                                        ? null
                                        : reader["donation_status"]
                                            .ToString()
                            };

                        results.Add(dto);
                    }
                }
            }

            return results;
        }


        public void RespondToDonationRequest(
            int requestId,
            int associationUserId,
            string newStatus,
            string? associationResponse,
            string? collectionMode
        )
        {
            using (
                SqlConnection con =
                    Connect(CON_STR_NAME)
            )
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        {
                            "@request_id",
                            requestId
                        },
                        {
                            "@association_user_id",
                            associationUserId
                        },
                        {
                            "@new_status",
                            newStatus
                        },
                        {
                            "@association_response",
                            (object?)associationResponse
                            ?? DBNull.Value
                        },
                        {
                            "@collection_mode",
                            (object?)collectionMode
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


        public void OfferCollectionToStore(
            int requestId,
            int associationUserId,
            int storeId
        )
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        { "@request_id", requestId },
                        { "@association_user_id", associationUserId },
                        { "@store_id", storeId }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_OFFER_COLLECTION_TO_STORE,
                    con,
                    paramDic
                );

                cmd.ExecuteNonQuery();
            }
        }


        public void RespondToCollectionOffer(
            int requestId,
            int storeUserId,
            string newStatus
        )
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        { "@request_id", requestId },
                        { "@store_user_id", storeUserId },
                        { "@new_status", newStatus }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_RESPOND_TO_COLLECTION_OFFER,
                    con,
                    paramDic
                );

                cmd.ExecuteNonQuery();
            }
        }


        public List<StoreCollectionOfferDto> GetCollectionOffersByStoreUserId(int userId)
        {
            List<StoreCollectionOfferDto> results = new List<StoreCollectionOfferDto>();

            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                int storeId;

                const string storeLookup = @"
                    SELECT store_id
                    FROM dbo.SecondHandStores
                    WHERE user_id = @user_id;";

                using (SqlCommand lookup = new SqlCommand(storeLookup, con))
                {
                    lookup.Parameters.AddWithValue("@user_id", userId);

                    object? raw = lookup.ExecuteScalar();

                    if (raw == null || raw == DBNull.Value)
                    {
                        return results;
                    }

                    storeId = Convert.ToInt32(raw);
                }

                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        { "@store_id", storeId }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_GET_COLLECTION_OFFERS_BY_STORE,
                    con,
                    paramDic
                );

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        results.Add(new StoreCollectionOfferDto
                        {
                            RequestId = Convert.ToInt32(reader["request_id"]),

                            AssociationName = reader["association_name"].ToString()!,

                            AssociationCity = reader["association_city"] == DBNull.Value
                                ? null : reader["association_city"].ToString(),

                            AssociationType = reader["association_type"] == DBNull.Value
                                ? null : reader["association_type"].ToString(),

                            AssignmentStatus = reader["assignment_status"].ToString()!,

                            RequestDate = Convert.ToDateTime(reader["request_date"]),

                            ShortDescription = reader["short_description"] == DBNull.Value
                                ? null : reader["short_description"].ToString(),

                            Sizes = reader["sizes"] == DBNull.Value
                                ? null : reader["sizes"].ToString(),

                            TargetGender = reader["target_gender"] == DBNull.Value
                                ? null : reader["target_gender"].ToString(),

                            ClothesCondition = reader["clothes_condition"] == DBNull.Value
                                ? null : reader["clothes_condition"].ToString()
                        });
                    }
                }
            }

            return results;
        }


        public void ProposePickupOptions(
            int requestId,
            int associationUserId,
            string proposedDays,
            string proposedTimes
        )
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        { "@request_id", requestId },
                        { "@association_user_id", associationUserId },
                        { "@proposed_days", proposedDays },
                        { "@proposed_times", proposedTimes }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_PROPOSE_PICKUP_OPTIONS,
                    con,
                    paramDic
                );

                cmd.ExecuteNonQuery();
            }
        }


        public void SelectPickupOption(
            int requestId,
            int donorUserId,
            string selectedDay,
            string selectedTime
        )
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        { "@request_id", requestId },
                        { "@donor_user_id", donorUserId },
                        { "@selected_day", selectedDay },
                        { "@selected_time", selectedTime }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_SELECT_PICKUP_OPTION,
                    con,
                    paramDic
                );

                cmd.ExecuteNonQuery();
            }
        }


        public void MarkDonationCollected(
            int requestId,
            int associationUserId
        )
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic =
                    new Dictionary<string, object>
                    {
                        { "@request_id", requestId },
                        { "@association_user_id", associationUserId }
                    };

                SqlCommand cmd = CreateCommand(
                    SP_MARK_DONATION_COLLECTED,
                    con,
                    paramDic
                );

                cmd.ExecuteNonQuery();
            }
        }
    }
}