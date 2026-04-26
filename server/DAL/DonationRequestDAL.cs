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

        public void CreateDonationRequest(DonationRequest request)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@user_id", request.UserId },
                        { "@association_id", request.AssociationId },
                        { "@delivery_type", request.DeliveryMethod }
                    };

                    SqlCommand cmd = CreateCommand(SP_CREATE_DONATION_REQUEST, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void LinkBagToDonationRequest(int requestId, int bagId)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@request_id", requestId },
                        { "@bag_id", bagId }
                    };

                    SqlCommand cmd = CreateCommand(SP_LINK_BAG_TO_DONATION_REQUEST, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void RespondToDonationRequest(int requestId, string newStatus, string? associationResponse)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@request_id", requestId },
                        { "@new_status", newStatus },
                        { "@association_response", (object?)associationResponse ?? DBNull.Value }
                    };

                    SqlCommand cmd = CreateCommand(SP_RESPOND_DONATION_REQUEST, con, paramDic);
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