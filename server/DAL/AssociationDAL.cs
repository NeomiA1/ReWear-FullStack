using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class AssociationDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_CHECK_ASSOCIATION_EXISTS = "sp_CheckAssociationExists";
        private const string SP_CREATE_ASSOCIATION = "sp_CreateAssociation";
        private const string SP_UPDATE_ASSOCIATION_SETTINGS = "sp_UpdateAssociationSettings";
        private const string SP_UPDATE_ASSOCIATION_AVAILABILITY = "sp_UpdateAssociationAvailability";

        public Association? CheckAssociationExists(string name, string email)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@association_name", name },
                        { "@email", email }
                    };

                    SqlCommand cmd = CreateCommand(SP_CHECK_ASSOCIATION_EXISTS, con, paramDic);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return MapAssociation(reader);
                        }
                    }
                }

                return null;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void CreateAssociation(Association association)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@association_name", association.AssociationName },
                        { "@association_type", (object?)association.AssociationType ?? DBNull.Value },
                        { "@address", association.Address },
                        { "@city", (object?)association.City ?? DBNull.Value },
                        { "@area", (object?)association.Area ?? DBNull.Value },
                        { "@email", association.Email },
                        { "@phone", (object?)association.Phone ?? DBNull.Value },
                        { "@description", (object?)association.Description ?? DBNull.Value },
                        { "@donation_destination", (object?)association.DonationDestination ?? DBNull.Value },
                        { "@receiving_hours", (object?)association.ReceivingHours ?? DBNull.Value },
                        { "@work_mode", association.WorkMode },
                        { "@delivery_mode", association.DeliveryMode },
                        { "@is_available", association.IsAvailable }

                    };

                    SqlCommand cmd = CreateCommand(SP_CREATE_ASSOCIATION, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }
        

        public void UpdateAssociationSettings(Association association)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@association_id", association.AssociationId },
                        { "@association_name", association.AssociationName },
                        { "@association_type", (object?)association.AssociationType ?? DBNull.Value },
                        { "@address", association.Address },
                        { "@city", (object?)association.City ?? DBNull.Value },
                        { "@area", (object?)association.Area ?? DBNull.Value },
                        { "@email", association.Email },
                        { "@phone", (object?)association.Phone ?? DBNull.Value },
                        { "@description", (object?)association.Description ?? DBNull.Value },
                        { "@donation_destination", (object?)association.DonationDestination ?? DBNull.Value },
                        { "@receiving_hours", (object?)association.ReceivingHours ?? DBNull.Value },
                        { "@work_mode", association.WorkMode },
                        { "@delivery_mode", association.DeliveryMode },
                        { "@is_available", association.IsAvailable }

                    };

                    SqlCommand cmd = CreateCommand(SP_UPDATE_ASSOCIATION_SETTINGS, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void UpdateAssociationAvailability(int associationId, bool isAvailable)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@association_id", associationId },
                        { "@is_available", isAvailable }
                    };

                    SqlCommand cmd = CreateCommand(SP_UPDATE_ASSOCIATION_AVAILABILITY, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        private Association MapAssociation(SqlDataReader reader)
        {
            Association a = new Association();

            a.AssociationId = Convert.ToInt32(reader["association_id"]);
            a.AssociationName = reader["association_name"].ToString()!;
            a.AssociationType = reader["association_type"] == DBNull.Value ? null : reader["association_type"].ToString();
            a.Address = reader["address"].ToString()!;
            a.City = reader["city"] == DBNull.Value ? null : reader["city"].ToString();
            a.Area = reader["area"] == DBNull.Value ? null : reader["area"].ToString();
            a.Email = reader["email"].ToString()!;
            a.Phone = reader["phone"] == DBNull.Value ? null : reader["phone"].ToString();
            a.Description = reader["description"] == DBNull.Value ? null : reader["description"].ToString();
            a.DonationDestination = reader["donation_destination"] == DBNull.Value ? null : reader["donation_destination"].ToString();
            a.ReceivingHours = reader["receiving_hours"] == DBNull.Value ? null : reader["receiving_hours"].ToString();
            a.WorkMode = reader["work_mode"].ToString()!;
            a.DeliveryMode = reader["delivery_mode"].ToString()!;
            a.IsAvailable = Convert.ToBoolean(reader["is_available"]);
            a.CreatedAt = Convert.ToDateTime(reader["created_at"]);

            return a;
        }
    }
}