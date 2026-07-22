using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;

namespace RewearApi.DAL
{
    public class DonationRequestExpirationDAL : DBServices
    {
        private const string CON_STR_NAME =
            "RewearDB";

        private const string SP_EXPIRE_DONATION_REQUESTS =
            "sp_ExpireDonationRequests";


        public int ExpireOldDonationRequests()
        {
            using (
                SqlConnection con =
                    Connect(CON_STR_NAME)
            )
            {
                Dictionary<string, object> parameters =
                    new Dictionary<string, object>();

                SqlCommand cmd = CreateCommand(
                    SP_EXPIRE_DONATION_REQUESTS,
                    con,
                    parameters
                );

                object? result = cmd.ExecuteScalar();

                if (
                    result == null
                    || result == DBNull.Value
                )
                {
                    return 0;
                }

                return Convert.ToInt32(result);
            }
        }
    }
}