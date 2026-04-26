using Microsoft.Data.SqlClient;
using RewearApi.BL;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class DonationBagDAL : DBServices
    {
        private const string CON_STR_NAME = "RewearDB";

        private const string SP_CREATE_DONATION_BAG = "sp_CreateDonationBag";

        public void CreateDonationBag(DonationBag bag)
        {
            try
            {
                using (SqlConnection con = Connect(CON_STR_NAME))
                {
                    var paramDic = new Dictionary<string, object>
                    {
                        { "@user_id", bag.UserId },
                        { "@short_description", (object?)bag.ShortDescription ?? DBNull.Value },
                        { "@sizes", (object?)bag.Sizes ?? DBNull.Value },
                        { "@target_ages", (object?)bag.TargetAges ?? DBNull.Value },
                        { "@target_gender", (object?)bag.TargetGender ?? DBNull.Value },
                        { "@clothes_condition", (object?)bag.ClothesCondition ?? DBNull.Value }
                    };

                    SqlCommand cmd = CreateCommand(SP_CREATE_DONATION_BAG, con, paramDic);
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