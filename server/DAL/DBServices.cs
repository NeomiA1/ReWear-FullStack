using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;

namespace RewearApi.DAL
{
    public class DBServices
    {
        protected SqlConnection Connect(string conStrName)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            string connectionString = configuration.GetConnectionString(conStrName);

            SqlConnection con = new SqlConnection(connectionString);
            con.Open();

            return con;
        }

        protected SqlCommand CreateCommand(string spName,
                                           SqlConnection con,
                                           Dictionary<string, object>? paramDic = null)
        {
            SqlCommand cmd = new SqlCommand(spName, con);
            cmd.CommandType = CommandType.StoredProcedure;

            if (paramDic != null)
            {
                foreach (KeyValuePair<string, object> param in paramDic)
                {
                    cmd.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                }
            }

            return cmd;
        }
    }
}