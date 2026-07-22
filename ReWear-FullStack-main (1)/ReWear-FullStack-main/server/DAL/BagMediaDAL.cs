using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class BagMediaDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_ADD_BAG_MEDIA = "sp_AddBagMedia";

        public void AddBagMedia(BagMedia media)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@bag_id", media.BagId },
                        { "@media_type", media.MediaType },
                        { "@media_url", media.MediaUrl },
                        { "@media_description", (object?)media.MediaDescription ?? DBNull.Value }
                    };

                    SqlCommand cmd = CreateCommand(SP_ADD_BAG_MEDIA, con, paramDic);
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