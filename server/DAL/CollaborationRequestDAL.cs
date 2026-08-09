using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class CollaborationRequestDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_CREATE_COLLABORATION_REQUEST =
            "sp_CreateCollaborationRequest";

        private const string SP_GET_BY_ASSOCIATION =
            "sp_GetCollaborationRequestsByAssociation";

        private const string SP_GET_BY_STORE =
            "sp_GetCollaborationRequestsByStore";

        private const string SP_RESPOND_COLLABORATION_REQUEST =
            "sp_RespondToCollaborationRequest";


        public int CreateCollaborationRequest(int associationUserId, int storeId)
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@association_user_id", associationUserId },
                    { "@store_id", storeId }
                };

                SqlCommand cmd = CreateCommand(SP_CREATE_COLLABORATION_REQUEST, con, paramDic);

                object? result = cmd.ExecuteScalar();

                if (result == null || result == DBNull.Value)
                {
                    throw new Exception("Collaboration request was not created.");
                }

                return Convert.ToInt32(result);
            }
        }


        public List<AssociationCollaborationRequestDto> GetByAssociationUserId(int userId)
        {
            List<AssociationCollaborationRequestDto> results =
                new List<AssociationCollaborationRequestDto>();

            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                int associationId;

                const string associationLookup = @"
                    SELECT association_id
                    FROM dbo.Associations
                    WHERE user_id = @user_id;";

                using (SqlCommand lookup = new SqlCommand(associationLookup, con))
                {
                    lookup.Parameters.AddWithValue("@user_id", userId);

                    object? raw = lookup.ExecuteScalar();

                    if (raw == null || raw == DBNull.Value)
                    {
                        return results;
                    }

                    associationId = Convert.ToInt32(raw);
                }

                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@association_id", associationId }
                };

                SqlCommand cmd = CreateCommand(SP_GET_BY_ASSOCIATION, con, paramDic);

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        results.Add(new AssociationCollaborationRequestDto
                        {
                            CollaborationRequestId =
                                Convert.ToInt32(reader["collaboration_request_id"]),

                            StoreId = Convert.ToInt32(reader["store_id"]),

                            StoreName = reader["store_name"].ToString()!,

                            StoreCity = reader["store_city"] == DBNull.Value
                                ? null : reader["store_city"].ToString(),

                            StoreArea = reader["store_area"] == DBNull.Value
                                ? null : reader["store_area"].ToString(),

                            RequestStatus = reader["request_status"].ToString()!,

                            RequestDate = Convert.ToDateTime(reader["request_date"])
                        });
                    }
                }
            }

            return results;
        }


        public List<StoreCollaborationRequestDto> GetByStoreUserId(int userId)
        {
            List<StoreCollaborationRequestDto> results =
                new List<StoreCollaborationRequestDto>();

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

                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@store_id", storeId }
                };

                SqlCommand cmd = CreateCommand(SP_GET_BY_STORE, con, paramDic);

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        results.Add(new StoreCollaborationRequestDto
                        {
                            CollaborationRequestId =
                                Convert.ToInt32(reader["collaboration_request_id"]),

                            AssociationId = Convert.ToInt32(reader["association_id"]),

                            AssociationName = reader["association_name"].ToString()!,

                            AssociationCity = reader["association_city"] == DBNull.Value
                                ? null : reader["association_city"].ToString(),

                            AssociationType = reader["association_type"] == DBNull.Value
                                ? null : reader["association_type"].ToString(),

                            RequestStatus = reader["request_status"].ToString()!,

                            RequestDate = Convert.ToDateTime(reader["request_date"])
                        });
                    }
                }
            }

            return results;
        }


        public void RespondToCollaborationRequest(
            int collaborationRequestId,
            int storeUserId,
            string newStatus)
        {
            using (SqlConnection con = Connect(CON_STR_NAME))
            {
                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@collaboration_request_id", collaborationRequestId },
                    { "@store_user_id", storeUserId },
                    { "@new_status", newStatus }
                };

                SqlCommand cmd = CreateCommand(SP_RESPOND_COLLABORATION_REQUEST, con, paramDic);

                cmd.ExecuteNonQuery();
            }
        }
    }
}
