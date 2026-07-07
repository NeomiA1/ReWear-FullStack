using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class CauseDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_GET_ALL_CAUSES  = "sp_GetAllCauses";
        private const string SP_SAVE_USER_CAUSES = "sp_SaveUserCauses";
        private const string SP_GET_USER_CAUSES  = "sp_GetUserCauses";

        public List<Cause> GetAllCauses()
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    SqlCommand cmd = CreateCommand(SP_GET_ALL_CAUSES, con);

                    List<Cause> causes = new List<Cause>();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            causes.Add(new Cause
                            {
                                CauseId = reader["cause_id"].ToString(),
                                LabelHe = reader["label_he"].ToString(),
                            });
                        }
                    }

                    return causes;
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void SaveUserCauses(int userId, List<string> causeIds)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    string csv = causeIds != null ? string.Join(",", causeIds) : "";

                    var paramDic = new Dictionary<string, object>
                    {
                        { "@user_id", userId },
                        { "@cause_ids_csv", csv }
                    };

                    SqlCommand cmd = CreateCommand(SP_SAVE_USER_CAUSES, con, paramDic);
                    cmd.ExecuteNonQuery();
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public List<string> GetUserCauses(int userId)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@user_id", userId }
                    };

                    SqlCommand cmd = CreateCommand(SP_GET_USER_CAUSES, con, paramDic);

                    List<string> causeIds = new List<string>();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            causeIds.Add(reader["cause_id"].ToString());
                        }
                    }

                    return causeIds;
                }
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
